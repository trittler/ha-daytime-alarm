"""Alarm storage, scheduling and the wake-up runs.

A wake-up run has two phases:

1. sunrise: from (alarm - duration) to the alarm time the lights ramp up.
2. awake: at the alarm time everything is on; the lights turn off again
   `lights_off_after` minutes later unless someone stops the alarm first.

Stopping asks what to do with the lights: restore them to how they were before
the sunrise, go to full brightness, or switch them all off.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from datetime import datetime, time, timedelta
from enum import StrEnum
import asyncio
import logging
from typing import Any
import uuid

from homeassistant.components.light import (
    ATTR_BRIGHTNESS,
    ATTR_SUPPORTED_COLOR_MODES,
    ATTR_TRANSITION,
    DOMAIN as LIGHT_DOMAIN,
    LightEntityFeature,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import (
    ATTR_ENTITY_ID,
    ATTR_SUPPORTED_FEATURES,
    SERVICE_TURN_OFF,
    SERVICE_TURN_ON,
    STATE_OFF,
    STATE_ON,
    STATE_UNAVAILABLE,
    STATE_UNKNOWN,
)
from homeassistant.core import CALLBACK_TYPE, Context, HomeAssistant, State, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.event import (
    async_track_point_in_time,
    async_track_time_interval,
)
from homeassistant.helpers.state import async_reproduce_state
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util
import voluptuous as vol

from .const import (
    CONF_DURATION,
    CONF_LIGHTS,
    CONF_LIGHTS_OFF_AFTER,
    CONF_SUNRISE_COLORS,
    CONF_SWITCHES,
    DEFAULT_DURATION,
    DEFAULT_LIGHTS_OFF_AFTER,
    DOMAIN,
    EVENT_ALARM,
    EVENT_STOPPED,
    EVENT_SUNRISE_STARTED,
    STATUS_AWAKE,
    STATUS_IDLE,
    STATUS_SUNRISE,
    STOP_FULL,
    STOP_OFF,
    STOP_RESTORE,
    STORAGE_VERSION,
    TEST_DURATION_SECONDS,
    TEST_HOLD_SECONDS,
    WEEKDAYS,
)
from .sunrise import brightness_for, is_dimmable, sunrise_params

_LOGGER = logging.getLogger(__name__)

# The ramp is split into ~200 steps, but never faster than MIN_STEP seconds
# (to keep Zigbee/Wi-Fi traffic sane) and never slower than MAX_STEP seconds.
STEPS = 200
MIN_STEP = 5.0
MIN_STEP_TEST = 1.0
MAX_STEP = 30.0
# Many Zigbee bulbs (IKEA, for one) can fade only one thing at a time: a command that
# fades brightness and color together loses one of them. So on color lights the steps
# take turns (color, then brightness), and a brightness fade ends this share of a step
# early, so the next color change never arrives in the middle of it.
FADE_SHARE = 0.8
# A light whose brightness someone else moved this far from ours is theirs now.
MANUAL_MARGIN = 25
# Zigbee lights can take several seconds to carry out a command, and their late or
# in-between reports no longer carry our context. So a light is only judged on states it
# reported after our last command (or after this long, if it never reports back) ...
PENDING_TIMEOUT = timedelta(seconds=30)
# ... and a change that comes from the device itself (a remote paired straight to the
# bulb, or just a late report) must last this long before the light counts as taken
# over. A change made in Home Assistant (a person, an automation) counts at once.
SETTLE_TIME = timedelta(seconds=20)
# Before restoring or switching off, wait at most this long for commands on their way.
INFLIGHT_WAIT = 15
# A run restored after a restart still switches the lights off this long after
# its planned moment; older runs are dropped.
LATE_OFF_GRACE = timedelta(hours=1)

_GONE = (STATE_UNAVAILABLE, STATE_UNKNOWN)


class _Verdict(StrEnum):
    OURS = "ours"
    WAIT = "wait"
    THEIRS = "theirs"


class Phase(StrEnum):
    """Phase of a wake-up run."""

    SUNRISE = "sunrise"
    AWAKE = "awake"


@dataclass(slots=True)
class Alarm:
    """One alarm. An alarm without days rings once and then switches itself off."""

    id: str
    number: int
    time: time
    days: tuple[int, ...] = ()
    label: str = ""
    enabled: bool = True
    # For one-time alarms: the moment it rings (set when it is switched on).
    once_at: datetime | None = None

    @property
    def time_str(self) -> str:
        """Alarm time as HH:MM."""
        return self.time.strftime("%H:%M")

    @property
    def day_keys(self) -> list[str]:
        """Days as mon..sun keys."""
        return [WEEKDAYS[day] for day in self.days]

    def as_dict(self) -> dict[str, Any]:
        """Serialize for storage."""
        return {
            "id": self.id,
            "number": self.number,
            "time": self.time_str,
            "days": list(self.days),
            "label": self.label,
            "enabled": self.enabled,
            "once_at": self.once_at.isoformat() if self.once_at else None,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Alarm:
        """Load from storage."""
        once_at = data.get("once_at")
        return cls(
            id=data["id"],
            number=int(data["number"]),
            time=time.fromisoformat(data["time"]),
            days=normalize_days(data.get("days", [])),
            label=data.get("label", ""),
            enabled=bool(data.get("enabled", True)),
            once_at=dt_util.parse_datetime(once_at) if once_at else None,
        )


def normalize_days(days: Any) -> tuple[int, ...]:
    """Accept weekday ints (0=Mon) or keys (mon..sun); return sorted unique ints."""
    result: set[int] = set()
    for day in days or ():
        if isinstance(day, str):
            result.add(WEEKDAYS.index(day.lower()[:3]))
        else:
            result.add(int(day) % 7)
    return tuple(sorted(result))


def next_time_of_day(at: time, after: datetime) -> datetime:
    """The next moment (local time) the clock shows `at`, strictly after `after`."""
    tz = dt_util.get_default_time_zone()
    day = after.astimezone(tz).date()
    candidate = datetime.combine(day, at, tzinfo=tz)
    if candidate <= after:
        candidate = datetime.combine(day + timedelta(days=1), at, tzinfo=tz)
    return candidate


def next_occurrence(alarm: Alarm, after: datetime) -> datetime | None:
    """Next time the alarm rings, strictly after `after`; None if it won't."""
    if not alarm.enabled:
        return None
    if not alarm.days:
        if alarm.once_at is not None and alarm.once_at > after:
            return alarm.once_at
        return None
    tz = dt_util.get_default_time_zone()
    start_day = after.astimezone(tz).date()
    for offset in range(8):
        day = start_day + timedelta(days=offset)
        if day.weekday() in alarm.days:
            candidate = datetime.combine(day, alarm.time, tzinfo=tz)
            if candidate > after:
                return candidate
    return None


class AlarmClock:
    """All alarms of one config entry, their schedule and the running wake-ups."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        """Set up the clock."""
        self.hass = hass
        self.entry = entry
        self._store: Store[dict[str, Any]] = Store(
            hass, STORAGE_VERSION, f"{DOMAIN}.{entry.entry_id}"
        )
        self.alarms: dict[str, Alarm] = {}
        self.runs: dict[str, WakeRun] = {}
        self._saved_runs: list[dict[str, Any]] = []
        self._timers: dict[str, CALLBACK_TYPE] = {}
        # Alarm moment that was already handled (rang or was stopped) per alarm.
        self._handled: dict[str, datetime] = {}
        self._listeners: list[Callable[[], None]] = []
        self._progress_listeners: list[Callable[[], None]] = []
        self._added_listeners: list[Callable[[Alarm], None]] = []

    # --- settings ---------------------------------------------------------

    @property
    def lights(self) -> list[str]:
        """Lights that take part in the sunrise."""
        return list(self.entry.options.get(CONF_LIGHTS, []))

    @property
    def switches(self) -> list[str]:
        """Switches turned on at alarm time."""
        return list(self.entry.options.get(CONF_SWITCHES, []))

    @property
    def duration(self) -> timedelta:
        """Length of the sunrise before the alarm time."""
        return timedelta(
            minutes=self.entry.options.get(CONF_DURATION, DEFAULT_DURATION)
        )

    @property
    def lights_off_after(self) -> timedelta:
        """How long after the alarm the lights turn off (0: they stay on)."""
        return timedelta(
            minutes=self.entry.options.get(
                CONF_LIGHTS_OFF_AFTER, DEFAULT_LIGHTS_OFF_AFTER
            )
        )

    @property
    def sunrise_colors(self) -> bool:
        """Whether color lights fade from red through orange to white."""
        return bool(self.entry.options.get(CONF_SUNRISE_COLORS, True))

    # --- lifecycle --------------------------------------------------------

    async def async_load(self) -> None:
        """Load alarms and interrupted wake-ups from storage."""
        data = await self._store.async_load() or {}
        for item in data.get("alarms", []):
            try:
                alarm = Alarm.from_dict(item)
            except (KeyError, TypeError, ValueError):
                _LOGGER.warning("Ignoring invalid stored alarm: %s", item)
                continue
            self.alarms[alarm.id] = alarm
        self._saved_runs = list(data.get("runs", []))

    @callback
    def async_start(self) -> None:
        """Resume interrupted wake-ups, then schedule all alarms."""
        now = dt_util.utcnow()
        for data in self._saved_runs:
            try:
                run = WakeRun.from_dict(self, data)
            except (KeyError, TypeError, ValueError):
                _LOGGER.warning("Ignoring invalid stored wake-up: %s", data)
                continue
            if run is not None:
                self._resume(run, now)
        self._saved_runs = []
        for alarm_id in list(self.alarms):
            # A sunrise that started while HA was down continues on its timeline.
            self._schedule(alarm_id, resume=True)
        self.entry.async_create_task(self.hass, self.async_save())
        self._notify()

    @callback
    def async_shutdown(self) -> None:
        """Cancel timers. Devices stay as they are; running wake-ups stay stored."""
        for unsub in self._timers.values():
            unsub()
        self._timers.clear()
        for run in self.runs.values():
            run.async_cancel()
        self.runs.clear()

    async def async_remove_storage(self) -> None:
        """Delete the stored alarms (config entry removed)."""
        await self._store.async_remove()

    @callback
    def async_options_updated(self) -> None:
        """Settings changed: the sunrise length may have moved start times."""
        for alarm_id in list(self.alarms):
            self._schedule(alarm_id, resume=True)
        self._notify()

    async def async_save(self) -> None:
        """Store alarms and running wake-ups (so they survive a restart)."""
        await self._store.async_save(
            {
                "alarms": [alarm.as_dict() for alarm in self.alarms.values()],
                "runs": [
                    run.as_dict() for run in self.runs.values() if not run.is_test
                ],
            }
        )

    # --- listeners --------------------------------------------------------

    @callback
    def async_add_listener(
        self, listener: Callable[[], None], *, progress: bool = False
    ) -> CALLBACK_TYPE:
        """Call `listener` when alarms or runs change (or on every ramp step)."""
        target = self._progress_listeners if progress else self._listeners
        target.append(listener)
        return lambda: target.remove(listener)

    @callback
    def async_add_alarm_listener(
        self, listener: Callable[[Alarm], None]
    ) -> CALLBACK_TYPE:
        """Call `listener` with each newly created alarm."""
        self._added_listeners.append(listener)
        return lambda: self._added_listeners.remove(listener)

    @callback
    def _notify(self) -> None:
        for listener in list(self._listeners):
            listener()
        self.notify_progress()

    @callback
    def notify_progress(self) -> None:
        """Tell progress listeners that a sunrise advanced."""
        for listener in list(self._progress_listeners):
            listener()

    # --- queries ----------------------------------------------------------

    def sunrise_run(self, alarm_id: str) -> WakeRun | None:
        """The run of this alarm that is still in its sunrise phase."""
        for run in self.runs.values():
            if (
                run.alarm is not None
                and run.alarm.id == alarm_id
                and run.phase is Phase.SUNRISE
            ):
                return run
        return None

    def next_ring(self, alarm: Alarm) -> datetime | None:
        """When this alarm rings next (its current sunrise counts as next)."""
        if (run := self.sunrise_run(alarm.id)) is not None:
            return run.end
        now = dt_util.utcnow()
        handled = self._handled.get(alarm.id)
        after = max(now, handled) if handled else now
        return next_occurrence(alarm, after)

    def next_alarm(self) -> tuple[datetime, Alarm] | None:
        """The alarm that rings next, with its time."""
        upcoming = [
            (at, alarm)
            for alarm in self.alarms.values()
            if (at := self.next_ring(alarm)) is not None
        ]
        return min(upcoming, key=lambda item: item[0]) if upcoming else None

    def alarm_entity_id(self, alarm_id: str) -> str | None:
        """Entity id of an alarm's switch."""
        return er.async_get(self.hass).async_get_entity_id(
            "switch", DOMAIN, f"{self.entry.entry_id}_{alarm_id}"
        )

    @property
    def status(self) -> tuple[str, WakeRun | None]:
        """Idle, sunrise (with the run furthest along) or awake (lights on)."""
        sunrises = [run for run in self.runs.values() if run.phase is Phase.SUNRISE]
        if sunrises:
            return STATUS_SUNRISE, max(sunrises, key=lambda run: run.progress)
        if self.runs:
            return STATUS_AWAKE, min(
                self.runs.values(), key=lambda run: run.off_at or run.end
            )
        return STATUS_IDLE, None

    # --- changes ----------------------------------------------------------

    async def async_create(
        self,
        *,
        at: time,
        days: Any = (),
        label: str = "",
        enabled: bool = True,
    ) -> Alarm:
        """Create an alarm."""
        number = max((alarm.number for alarm in self.alarms.values()), default=0) + 1
        alarm = Alarm(
            id=uuid.uuid4().hex[:12],
            number=number,
            time=at.replace(second=0, microsecond=0),
            days=normalize_days(days),
            label=label.strip(),
            enabled=enabled,
        )
        self._refresh_once_at(alarm)
        self.alarms[alarm.id] = alarm
        await self.async_save()
        for listener in list(self._added_listeners):
            listener(alarm)
        self._schedule(alarm.id)
        self._notify()
        return alarm

    async def async_update(
        self,
        alarm_id: str,
        *,
        at: time | None = None,
        days: Any = None,
        label: str | None = None,
        enabled: bool | None = None,
    ) -> Alarm:
        """Change an alarm. Changing when it rings restarts its schedule."""
        alarm = self._get(alarm_id)
        reschedule = False
        if at is not None and at.replace(second=0, microsecond=0) != alarm.time:
            alarm.time = at.replace(second=0, microsecond=0)
            reschedule = True
        if days is not None and normalize_days(days) != alarm.days:
            alarm.days = normalize_days(days)
            reschedule = True
        if enabled is not None and enabled != alarm.enabled:
            alarm.enabled = enabled
            reschedule = True
        if label is not None:
            alarm.label = label.strip()

        if reschedule:
            # Only a sunrise that hasn't rung yet is affected; lights that are
            # already on after an alarm still turn off as planned.
            self._cancel_sunrise(alarm_id)
            self._handled.pop(alarm_id, None)
            self._refresh_once_at(alarm)
        await self.async_save()
        if reschedule:
            self._schedule(alarm_id)
        self._notify()
        return alarm

    async def async_delete(self, alarm_id: str) -> None:
        """Delete an alarm and its switch entity."""
        self._get(alarm_id)
        entity_id = self.alarm_entity_id(alarm_id)
        self._cancel_sunrise(alarm_id)
        if unsub := self._timers.pop(alarm_id, None):
            unsub()
        self._handled.pop(alarm_id, None)
        del self.alarms[alarm_id]
        await self.async_save()
        if entity_id:
            er.async_get(self.hass).async_remove(entity_id)
        self._notify()

    async def async_stop(self, action: str) -> None:
        """Stop all running wake-ups and do `action` with the lights."""
        if not self.runs:
            return
        # Earliest run last, so "restore" ends at the oldest snapshot.
        for run in sorted(self.runs.values(), key=lambda run: run.start, reverse=True):
            await run.async_stop(action)
        self.hass.bus.async_fire(
            EVENT_STOPPED, {"config_entry_id": self.entry.entry_id, "action": action}
        )

    @callback
    def async_test(self) -> None:
        """Run a one-minute sunrise with the lights, then restore them."""
        for run in [run for run in self.runs.values() if run.is_test]:
            run.async_cancel()
            del self.runs[run.id]
        now = dt_util.utcnow()
        run = WakeRun(
            self,
            alarm=None,
            start=now,
            end=now + timedelta(seconds=TEST_DURATION_SECONDS),
        )
        self.runs[run.id] = run
        run.async_start()
        self._notify()

    # --- called by runs ---------------------------------------------------

    @callback
    def run_rang(self, run: WakeRun) -> None:
        """A run reached its alarm time."""
        self._mark_handled(run)
        self.entry.async_create_task(self.hass, self.async_save())
        self._notify()

    @callback
    def run_finished(self, run: WakeRun) -> None:
        """A run is over (lights off, restored, or stopped)."""
        if self.runs.get(run.id) is not run:
            return
        del self.runs[run.id]
        if run.phase is Phase.SUNRISE:
            # Stopped before it rang: this alarm moment is done.
            self._mark_handled(run)
        self.entry.async_create_task(self.hass, self.async_save())
        self._notify()

    def event_data(self, alarm: Alarm, at: datetime) -> dict[str, Any]:
        """Data for the integration's events."""
        return {
            "config_entry_id": self.entry.entry_id,
            "alarm_id": alarm.id,
            "entity_id": self.alarm_entity_id(alarm.id),
            "label": alarm.label,
            "time": alarm.time_str,
            "alarm_at": at.isoformat(),
        }

    # --- internals --------------------------------------------------------

    def _get(self, alarm_id: str) -> Alarm:
        if (alarm := self.alarms.get(alarm_id)) is None:
            raise HomeAssistantError(f"Unknown alarm {alarm_id}")
        return alarm

    def _refresh_once_at(self, alarm: Alarm) -> None:
        alarm.once_at = (
            next_time_of_day(alarm.time, dt_util.utcnow())
            if alarm.enabled and not alarm.days
            else None
        )

    @callback
    def _mark_handled(self, run: WakeRun) -> None:
        """Remember the alarm moment; switch one-time alarms off; plan the next."""
        alarm = run.alarm
        if alarm is None or self.alarms.get(alarm.id) is not alarm:
            return
        self._handled[alarm.id] = run.end
        if not alarm.days:
            alarm.enabled = False
            alarm.once_at = None
        self._schedule(alarm.id)

    @callback
    def _cancel_sunrise(self, alarm_id: str) -> None:
        if (run := self.sunrise_run(alarm_id)) is not None:
            run.async_cancel()
            del self.runs[run.id]

    @callback
    def _resume(self, run: WakeRun, now: datetime) -> None:
        """Continue a wake-up that was running when Home Assistant stopped."""
        if run.phase is Phase.SUNRISE:
            if now < run.end:
                self.runs[run.id] = run
                run.async_start()
                return
            if self.lights_off_after and now < run.end + self.lights_off_after:
                # Missed the alarm moment by a little: ring now.
                self.runs[run.id] = run
                run.async_ring_now()
                return
        elif run.off_at is not None and now < run.off_at + LATE_OFF_GRACE:
            self.runs[run.id] = run
            run.async_resume_awake()
            return
        _LOGGER.debug("Dropping stale wake-up from %s", run.end)

    @callback
    def _schedule(self, alarm_id: str, *, resume: bool = False) -> None:
        """(Re)plan the next sunrise of one alarm.

        If the sunrise window has already begun, `resume` continues on the original
        timeline (after a restart); otherwise the ramp starts from dark now, so an
        alarm set ten minutes ahead doesn't switch the lights on at 66%.
        """
        if unsub := self._timers.pop(alarm_id, None):
            unsub()
        alarm = self.alarms.get(alarm_id)
        if alarm is None or not alarm.enabled or self.sunrise_run(alarm_id):
            return
        at = self.next_ring(alarm)
        if at is None:
            if not alarm.days:
                # One-time alarm whose moment passed (e.g. while HA was down).
                self.entry.async_create_task(
                    self.hass, self.async_update(alarm_id, enabled=False)
                )
            return
        start = at - self.duration
        now = dt_util.utcnow()
        if start <= now:
            self._start_run(alarm, at, start=start if resume else now)
            return

        @callback
        def _begin(_now: datetime) -> None:
            self._timers.pop(alarm_id, None)
            current = self.alarms.get(alarm_id)
            if current is not None and current.enabled:
                self._start_run(current, at, start=start)

        self._timers[alarm_id] = async_track_point_in_time(self.hass, _begin, start)

    @callback
    def _start_run(self, alarm: Alarm, at: datetime, *, start: datetime) -> None:
        if self.sunrise_run(alarm.id):
            return
        run = WakeRun(self, alarm=alarm, start=start, end=at)
        self.runs[run.id] = run
        run.async_start()
        self.hass.bus.async_fire(EVENT_SUNRISE_STARTED, self.event_data(alarm, at))
        self.entry.async_create_task(self.hass, self.async_save())
        self._notify()


class WakeRun:
    """One wake-up: sunrise until the alarm time, then lights on until they go off."""

    def __init__(
        self,
        clock: AlarmClock,
        *,
        alarm: Alarm | None,
        start: datetime,
        end: datetime,
        run_id: str | None = None,
        phase: Phase = Phase.SUNRISE,
        off_at: datetime | None = None,
        snapshot: list[State] | None = None,
        touched: set[str] | None = None,
        released: set[str] | None = None,
    ) -> None:
        """Prepare a run from `start` to `end` (the alarm time)."""
        self.id = run_id or uuid.uuid4().hex[:12]
        self.clock = clock
        self.hass = clock.hass
        self.alarm = alarm
        self.start = start
        self.end = end
        self.phase = phase
        self.off_at = off_at
        self.context = Context()
        self.progress = 1.0 if phase is Phase.AWAKE else 0.0
        # How the lights were before the sunrise ("restore" goes back to this).
        self.snapshot = snapshot if snapshot is not None else self._take_snapshot()
        # Lights this run switched on or changed, and lights someone else took over.
        self.touched = touched or set()
        self.released = released or set()
        self._last_set: dict[str, int] = {}
        self._sent_at: dict[str, datetime] = {}
        self._inflight: dict[str, asyncio.Task[None]] = {}
        self._suspect: dict[str, datetime] = {}
        self._steps = 0
        self._started_at = dt_util.utcnow()
        span = max((end - start).total_seconds(), 0.0)
        min_step = MIN_STEP_TEST if alarm is None else MIN_STEP
        self.interval = max(min_step, min(MAX_STEP, span / STEPS))
        self._unsubs: list[CALLBACK_TYPE] = []

    @property
    def is_test(self) -> bool:
        """True for the short test sunrise."""
        return self.alarm is None

    # --- persistence ------------------------------------------------------

    def as_dict(self) -> dict[str, Any]:
        """Serialize for storage."""
        return {
            "id": self.id,
            "alarm_id": self.alarm.id if self.alarm else None,
            "start": self.start.isoformat(),
            "end": self.end.isoformat(),
            "phase": self.phase.value,
            "off_at": self.off_at.isoformat() if self.off_at else None,
            "snapshot": [state.as_dict() for state in self.snapshot],
            "touched": sorted(self.touched),
            "released": sorted(self.released),
        }

    @classmethod
    def from_dict(cls, clock: AlarmClock, data: dict[str, Any]) -> WakeRun | None:
        """Load from storage; None if its alarm no longer exists."""
        alarm = clock.alarms.get(data.get("alarm_id") or "")
        if alarm is None:
            return None
        off_at = data.get("off_at")
        return cls(
            clock,
            alarm=alarm,
            start=_parse(data["start"]),
            end=_parse(data["end"]),
            run_id=data["id"],
            phase=Phase(data["phase"]),
            off_at=_parse(off_at) if off_at else None,
            snapshot=[
                state
                for item in data.get("snapshot", [])
                if (state := State.from_dict(item)) is not None
            ],
            touched=set(data.get("touched", [])),
            released=set(data.get("released", [])),
        )

    def _take_snapshot(self) -> list[State]:
        return [
            state
            for entity_id in self.clock.lights
            if (state := self.hass.states.get(entity_id)) is not None
            and state.state not in _GONE
        ]

    # --- lifecycle --------------------------------------------------------

    @callback
    def async_start(self) -> None:
        """Start (or continue) the sunrise."""
        self._unsubs.append(
            async_track_time_interval(
                self.hass,
                self._async_step,
                timedelta(seconds=self.interval),
                name=f"{DOMAIN} sunrise step",
            )
        )
        self._unsubs.append(
            async_track_point_in_time(self.hass, self._async_ring, self.end)
        )
        self._background(self._async_step(dt_util.utcnow()), "first step")

    @callback
    def async_ring_now(self) -> None:
        """Ring right away (the alarm moment passed while HA was down)."""
        self._background(self._async_ring(dt_util.utcnow()), "late alarm")

    @callback
    def async_resume_awake(self) -> None:
        """Wait for (or do) the lights-off of a run restored after a restart."""
        assert self.off_at is not None
        if self.off_at <= dt_util.utcnow():
            self._background(self._async_lights_out(dt_util.utcnow()), "lights off")
        else:
            self._unsubs.append(
                async_track_point_in_time(
                    self.hass, self._async_lights_out, self.off_at
                )
            )

    @callback
    def async_cancel(self) -> None:
        """Stop the timers; devices stay as they are."""
        for unsub in self._unsubs:
            unsub()
        self._unsubs.clear()

    async def async_stop(self, action: str) -> None:
        """Someone stopped the alarm: do what they chose with the lights."""
        self.async_cancel()
        await self._async_wait_inflight()
        if action == STOP_RESTORE:
            await self._async_restore()
        elif action == STOP_FULL:
            await self._async_all_lights_full()
        elif action == STOP_OFF:
            await self._async_turn_off(
                [
                    entity_id
                    for entity_id in self.clock.lights
                    if (state := self.hass.states.get(entity_id)) is not None
                    and state.state == STATE_ON
                ]
            )
        self.clock.run_finished(self)

    def _background(self, target: Any, name: str) -> None:
        self.clock.entry.async_create_background_task(
            self.hass, target, f"{DOMAIN} {name}"
        )

    # --- phases -----------------------------------------------------------

    def _progress_at(self, now: datetime) -> float:
        span = (self.end - self.start).total_seconds()
        if span <= 0:
            return 1.0
        return max(0.0, min(1.0, (now - self.start).total_seconds() / span))

    async def _async_step(self, now: datetime) -> None:
        if not self._unsubs or self.phase is not Phase.SUNRISE:
            return
        self.progress = self._progress_at(now)
        color_turn = self._steps % 2 == 1
        self._steps += 1
        touched = len(self.touched)
        for entity_id in self.clock.lights:
            data = self._light_command(
                entity_id, self.progress, now, final=False, color_turn=color_turn
            )
            if data is not None:
                # Not awaited: one slow bulb must not hold up the others.
                self._inflight[entity_id] = self.clock.entry.async_create_task(
                    self.hass, self._async_send(entity_id, data), f"{DOMAIN} light"
                )
        if len(self.touched) != touched:
            await self.clock.async_save()
        self.clock.notify_progress()

    async def _async_ring(self, now: datetime) -> None:
        """Alarm time: everything on, then wait to switch the lights off."""
        self.async_cancel()
        self.progress = 1.0
        jobs = [self._async_all_lights_full()]
        if not self.is_test:
            # The test run only shows the light ramp; it never starts e.g. a coffee machine.
            switches = [
                entity_id
                for entity_id in self.clock.switches
                if (state := self.hass.states.get(entity_id)) is not None
                and state.state != STATE_UNAVAILABLE
            ]
            if switches:
                jobs.append(
                    self._async_call(
                        "homeassistant", SERVICE_TURN_ON, {ATTR_ENTITY_ID: switches}
                    )
                )
            assert self.alarm is not None
            self.hass.bus.async_fire(
                EVENT_ALARM, self.clock.event_data(self.alarm, self.end)
            )
        # Lights and switches together, so a slow bulb doesn't delay the coffee.
        await asyncio.gather(*jobs)

        hold = (
            timedelta(seconds=TEST_HOLD_SECONDS)
            if self.is_test
            else self.clock.lights_off_after
        )
        self.phase = Phase.AWAKE
        if not hold:
            self.clock.run_rang(self)
            self.clock.run_finished(self)
            return
        self.off_at = max(self.end + hold, now)
        self._unsubs.append(
            async_track_point_in_time(self.hass, self._async_lights_out, self.off_at)
        )
        self.clock.run_rang(self)

    async def _async_lights_out(self, _now: datetime) -> None:
        """Nobody stopped the alarm: lights off (a test goes back to before)."""
        self.async_cancel()
        await self._async_wait_inflight()
        if self.is_test:
            await self._async_restore()
        else:
            await self._async_turn_off(self._lights_still_ours())
        self.clock.run_finished(self)

    # --- devices ----------------------------------------------------------

    async def _async_all_lights_full(self) -> None:
        """Every light to 100 % (alarm time, or "full brightness")."""
        now = dt_util.utcnow()
        jobs = []
        for entity_id in self.clock.lights:
            if (task := self._inflight.get(entity_id)) is not None and not task.done():
                await asyncio.wait({task}, timeout=INFLIGHT_WAIT)
            data = self._light_command(entity_id, 1.0, now, final=True)
            if data is not None:
                jobs.append(self._async_send(entity_id, data))
        await asyncio.gather(*jobs)

    def _light_command(
        self,
        entity_id: str,
        progress: float,
        now: datetime,
        *,
        final: bool,
        color_turn: bool = False,
    ) -> dict[str, Any] | None:
        """light.turn_on data for one light now, or None to leave it this time."""
        state = self.hass.states.get(entity_id)
        if not self._may_control(entity_id, state, now, final=final):
            return None
        assert state is not None
        return self._sunrise_data(
            entity_id, state, progress, final=final, color_turn=color_turn
        )

    def _may_control(
        self, entity_id: str, state: State | None, now: datetime, *, final: bool
    ) -> bool:
        if entity_id in self.released or state is None or state.state in _GONE:
            return False
        if not final and not self._settled(entity_id, state, now):
            return False
        verdict = self._judge(entity_id, state, now)
        if verdict is _Verdict.THEIRS:
            _LOGGER.debug("%s was changed by someone else, leaving it alone", entity_id)
            self.released.add(entity_id)
        return verdict is _Verdict.OURS

    def _sunrise_data(
        self,
        entity_id: str,
        state: State,
        progress: float,
        *,
        final: bool,
        color_turn: bool,
    ) -> dict[str, Any] | None:
        modes = state.attributes.get(ATTR_SUPPORTED_COLOR_MODES)
        if not is_dimmable(modes):
            # On/off-only lights behave like switches: on at alarm time.
            return {} if final and state.state != STATE_ON else None

        target = brightness_for(progress)
        current = (
            (state.attributes.get(ATTR_BRIGHTNESS) or 0)
            if state.state == STATE_ON
            else 0
        )
        # The test always shows the whole sunrise; the lights go back afterwards.
        takeover = self.is_test and entity_id not in self.touched
        if current >= target and not takeover:
            # Never dim a light down (e.g. it was already on, or another alarm is ahead).
            return None

        params = sunrise_params(
            modes, state.attributes, progress, colors=self.clock.sunrise_colors
        )
        colored = len(params) > 1
        fades = bool(
            state.attributes.get(ATTR_SUPPORTED_FEATURES, 0)
            & LightEntityFeature.TRANSITION
        )
        if final:
            # Alarm time, or "full brightness": go straight there.
            return params
        if state.state != STATE_ON or takeover:
            # Switch on at the start values without a fade. Fading up from off makes
            # many Zigbee bulbs show their last color (and brightness) first.
            return {**params, ATTR_TRANSITION: 0} if fades else params
        if colored and color_turn:
            # Only the color, at once: the change per step is too small to see.
            return {
                key: value for key, value in params.items() if key != ATTR_BRIGHTNESS
            }
        data: dict[str, Any] = {ATTR_BRIGHTNESS: target}
        if fades:
            data[ATTR_TRANSITION] = round(
                self.interval * (FADE_SHARE if colored else 1), 1
            )
        return data

    def _settled(self, entity_id: str, state: State, now: datetime) -> bool:
        """True once the light has carried out (and reported) our last command."""
        if (task := self._inflight.get(entity_id)) is not None and not task.done():
            return False
        sent = self._sent_at.get(entity_id)
        return (
            sent is None or state.last_reported >= sent or now - sent > PENDING_TIMEOUT
        )

    def _judge(self, entity_id: str, state: State, now: datetime) -> _Verdict:
        """Is the light still ours, or did someone else change it?"""
        if state.context.id == self.context.id:
            self._suspect.pop(entity_id, None)
            return _Verdict.OURS
        last = self._last_set.get(entity_id)
        if state.state == STATE_OFF:
            # Off although we switched it on, or switched off during the sunrise.
            changed = (
                last is not None
                or entity_id in self.touched
                or state.last_changed > self._started_at
            )
        else:
            brightness = state.attributes.get(ATTR_BRIGHTNESS)
            changed = (
                last is not None
                and brightness is not None
                and abs(brightness - last) > MANUAL_MARGIN
            )
        if not changed:
            self._suspect.pop(entity_id, None)
            return _Verdict.OURS
        if state.context.user_id or state.context.parent_id:
            return _Verdict.THEIRS  # a person, an automation or a script
        since = self._suspect.setdefault(entity_id, now)
        return _Verdict.THEIRS if now - since >= SETTLE_TIME else _Verdict.WAIT

    def _async_send(self, entity_id: str, data: dict[str, Any]) -> Awaitable[None]:
        """Note what we send (right away), then send it."""
        if ATTR_BRIGHTNESS in data:
            self._last_set[entity_id] = data[ATTR_BRIGHTNESS]
        self.touched.add(entity_id)
        self._sent_at[entity_id] = dt_util.utcnow()
        return self._async_call(
            LIGHT_DOMAIN, SERVICE_TURN_ON, {ATTR_ENTITY_ID: entity_id, **data}
        )

    async def _async_wait_inflight(self) -> None:
        tasks = {task for task in self._inflight.values() if not task.done()}
        if tasks:
            await asyncio.wait(tasks, timeout=INFLIGHT_WAIT)

    def _lights_still_ours(self) -> list[str]:
        """Lights this run switched on that are still on as it left them."""
        result = []
        for entity_id in self.clock.lights:
            if entity_id not in self.touched or entity_id in self.released:
                continue
            state = self.hass.states.get(entity_id)
            if state is None or state.state != STATE_ON:
                continue
            brightness = state.attributes.get(ATTR_BRIGHTNESS)
            if brightness is not None and brightness < 255 - MANUAL_MARGIN:
                continue  # Someone dimmed it after the alarm: theirs now.
            result.append(entity_id)
        return result

    async def _async_restore(self) -> None:
        """Put the lights this run changed back to how they were."""
        states = [
            state
            for state in self.snapshot
            if state.entity_id in self.touched and state.entity_id not in self.released
        ]
        if not states:
            return
        try:
            await async_reproduce_state(self.hass, states, context=self.context)
        except (HomeAssistantError, vol.Invalid) as err:
            _LOGGER.warning("Could not restore the lights: %s", err)

    async def _async_turn_off(self, entity_ids: list[str]) -> None:
        if entity_ids:
            await self._async_call(
                LIGHT_DOMAIN, SERVICE_TURN_OFF, {ATTR_ENTITY_ID: entity_ids}
            )

    async def _async_call(
        self, domain: str, service: str, data: dict[str, Any]
    ) -> None:
        try:
            await self.hass.services.async_call(
                domain, service, data, blocking=True, context=self.context
            )
        except (HomeAssistantError, vol.Invalid) as err:
            _LOGGER.warning(
                "Wake-up could not control %s: %s", data[ATTR_ENTITY_ID], err
            )


def _parse(value: str) -> datetime:
    if (parsed := dt_util.parse_datetime(value)) is None:
        raise ValueError(value)
    return parsed
