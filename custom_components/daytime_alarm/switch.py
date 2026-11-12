"""One switch per alarm: on = armed."""

from __future__ import annotations

from datetime import time as dt_time
from typing import TYPE_CHECKING, Any

from homeassistant.components.switch import SwitchEntity
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.util import slugify

from .const import (
    ATTR_ALARM_ID,
    ATTR_DAYS,
    ATTR_LABEL,
    ATTR_NEXT_ALARM,
    ATTR_SUNRISE_START,
    ATTR_TIME,
    DOMAIN,
)
from .entity import DaytimeAlarmEntity
from .manager import Alarm, AlarmClock

if TYPE_CHECKING:
    from . import DaytimeAlarmConfigEntry

PARALLEL_UPDATES = 0


async def async_setup_entry(
    hass: HomeAssistant,
    entry: DaytimeAlarmConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Add a switch for every alarm, now and when new ones are created."""
    clock = entry.runtime_data
    _remove_orphans(hass, clock)
    async_add_entities(AlarmSwitch(clock, alarm) for alarm in clock.alarms.values())

    @callback
    def _alarm_added(alarm: Alarm) -> None:
        async_add_entities([AlarmSwitch(clock, alarm)])

    entry.async_on_unload(clock.async_add_alarm_listener(_alarm_added))


def _remove_orphans(hass: HomeAssistant, clock: AlarmClock) -> None:
    """Drop switch entities whose alarm no longer exists."""
    registry = er.async_get(hass)
    entry_id = clock.entry.entry_id
    known = {f"{entry_id}_{alarm_id}" for alarm_id in clock.alarms}
    for entity in er.async_entries_for_config_entry(registry, entry_id):
        if entity.domain == "switch" and entity.unique_id not in known:
            registry.async_remove(entity.entity_id)


class AlarmSwitch(DaytimeAlarmEntity, SwitchEntity):
    """An alarm. Turning it off disarms it (and stops its running sunrise)."""

    _attr_translation_key = "alarm"
    _unrecorded_attributes = frozenset(
        {ATTR_ALARM_ID, ATTR_NEXT_ALARM, ATTR_SUNRISE_START, "sunrise_active"}
    )

    def __init__(self, clock: AlarmClock, alarm: Alarm) -> None:
        """Create the switch for `alarm`."""
        super().__init__(clock, alarm.id)
        self._alarm = alarm
        base = slugify(clock.entry.title) or DOMAIN
        self.entity_id = f"switch.{base}_alarm_{alarm.number}"

    @property
    def name(self) -> str:
        """Label, or the alarm time when there is none."""
        return self._alarm.label or self._alarm.time_str

    @property
    def is_on(self) -> bool:
        """Armed?"""
        return self._alarm.enabled

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Alarm details for the card and automations."""
        alarm = self._alarm
        next_ring = self.clock.next_ring(alarm)
        return {
            ATTR_ALARM_ID: alarm.id,
            ATTR_TIME: alarm.time_str,
            ATTR_DAYS: alarm.day_keys,
            ATTR_LABEL: alarm.label,
            ATTR_NEXT_ALARM: next_ring.isoformat() if next_ring else None,
            ATTR_SUNRISE_START: (
                (next_ring - self.clock.duration).isoformat() if next_ring else None
            ),
            "sunrise_active": self.clock.sunrise_run(alarm.id) is not None,
        }

    @callback
    def _handle_update(self) -> None:
        if self._alarm.id in self.clock.alarms:
            self.async_write_ha_state()

    async def async_turn_on(self, **kwargs: Any) -> None:
        """Arm the alarm."""
        await self.clock.async_update(self._alarm.id, enabled=True)

    async def async_turn_off(self, **kwargs: Any) -> None:
        """Disarm the alarm."""
        await self.clock.async_update(self._alarm.id, enabled=False)

    async def async_update_alarm(
        self,
        time: dt_time | None = None,
        days: list[str] | None = None,
        label: str | None = None,
        enabled: bool | None = None,
    ) -> None:
        """Service: change time, days, label or state."""
        await self.clock.async_update(
            self._alarm.id, at=time, days=days, label=label, enabled=enabled
        )

    async def async_delete_alarm(self) -> None:
        """Service: delete this alarm."""
        await self.clock.async_delete(self._alarm.id)
