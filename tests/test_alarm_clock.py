"""The integration end to end: flows, services, entities and sunrise runs."""

from __future__ import annotations

from freezegun.api import FrozenDateTimeFactory
import pytest
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_capture_events,
)

from custom_components.daytime_alarm.const import (
    CONF_DURATION,
    CONF_LIGHTS,
    CONF_LIGHTS_OFF_AFTER,
    CONF_SUNRISE_COLORS,
    CONF_SWITCHES,
    DOMAIN,
    EVENT_ALARM,
    EVENT_STOPPED,
    EVENT_SUNRISE_STARTED,
)
from homeassistant import config_entries
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import entity_registry as er

from .conftest import CT_LIGHT, ONOFF_LIGHT, SWITCH, WHITE_LIGHT, calls_for, travel

ALARM = "switch.bedroom_alarm_1"
NEXT = "sensor.bedroom_next_alarm"
STATUS = "sensor.bedroom_status"
WEEKDAYS = ["mon", "tue", "wed", "thu", "fri"]


async def create(hass: HomeAssistant, **data) -> dict:
    response = await hass.services.async_call(
        DOMAIN, "create_alarm", data, blocking=True, return_response=True
    )
    await hass.async_block_till_done()
    return response


# --- config & options flow -----------------------------------------------------


async def test_config_flow(hass: HomeAssistant) -> None:
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    assert result["type"] is FlowResultType.FORM

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {"name": "Bedroom", CONF_DURATION: 20, CONF_SUNRISE_COLORS: True},
    )
    assert result["errors"] == {"base": "no_devices"}

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {
            "name": "Bedroom",
            CONF_LIGHTS: [CT_LIGHT],
            CONF_DURATION: 20,
            CONF_SUNRISE_COLORS: False,
        },
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "Bedroom"
    assert result["options"] == {
        CONF_LIGHTS: [CT_LIGHT],
        CONF_SWITCHES: [],
        CONF_DURATION: 20,
        CONF_SUNRISE_COLORS: False,
        CONF_LIGHTS_OFF_AFTER: 30,
    }


async def test_options_flow_moves_sunrise(
    hass: HomeAssistant, entry: MockConfigEntry
) -> None:
    await create(hass, time="07:00", days=WEEKDAYS)
    assert (
        hass.states.get(ALARM)
        .attributes["sunrise_start"]
        .startswith("2026-11-12T06:30")
    )

    result = await hass.config_entries.options.async_init(entry.entry_id)
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            CONF_LIGHTS: [CT_LIGHT],
            CONF_SWITCHES: [],
            CONF_DURATION: 45,
            CONF_SUNRISE_COLORS: True,
            CONF_LIGHTS_OFF_AFTER: 15,
        },
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    assert (
        hass.states.get(ALARM)
        .attributes["sunrise_start"]
        .startswith("2026-11-12T06:15")
    )
    assert hass.states.get(NEXT).attributes["duration"] == 45


# --- services ------------------------------------------------------------------


async def test_create_update_delete(
    hass: HomeAssistant, entry: MockConfigEntry
) -> None:
    response = await create(hass, time="07:00", days=WEEKDAYS, label="Work")
    assert response["entity_id"] == ALARM

    state = hass.states.get(ALARM)
    assert state.state == "on"
    assert state.name == "Bedroom Work"
    assert state.attributes["time"] == "07:00"
    assert state.attributes["days"] == WEEKDAYS
    assert state.attributes["next_alarm"] == "2026-11-12T07:00:00+01:00"
    assert hass.states.get(NEXT).state == "2026-11-12T06:00:00+00:00"
    assert hass.states.get(NEXT).attributes["alarm_entity_id"] == ALARM

    await hass.services.async_call(
        DOMAIN,
        "update_alarm",
        {"entity_id": ALARM, "time": "09:30", "days": ["sat", "sun"], "label": ""},
        blocking=True,
    )
    state = hass.states.get(ALARM)
    assert state.attributes["next_alarm"] == "2026-11-14T09:30:00+01:00"
    assert state.name == "Bedroom 09:30"

    await hass.services.async_call(
        "switch", "turn_off", {"entity_id": ALARM}, blocking=True
    )
    assert hass.states.get(ALARM).state == "off"
    assert hass.states.get(NEXT).state == "unknown"

    await hass.services.async_call(
        DOMAIN, "delete_alarm", {"entity_id": ALARM}, blocking=True
    )
    await hass.async_block_till_done()
    assert hass.states.get(ALARM) is None
    assert er.async_get(hass).async_get(ALARM) is None


async def test_alarms_survive_reload(
    hass: HomeAssistant, entry: MockConfigEntry
) -> None:
    await create(hass, time="07:00", days=WEEKDAYS, label="Work")
    await create(hass, time="10:30", enabled=False)
    assert await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()
    assert hass.states.get(ALARM).attributes["label"] == "Work"
    assert hass.states.get("switch.bedroom_alarm_2").state == "off"


async def test_entry_required_with_two_clocks(
    hass: HomeAssistant, entry: MockConfigEntry
) -> None:
    second = MockConfigEntry(
        domain=DOMAIN, title="Kids", options={CONF_LIGHTS: [CT_LIGHT]}
    )
    second.add_to_hass(hass)
    assert await hass.config_entries.async_setup(second.entry_id)
    with pytest.raises(ServiceValidationError):
        await create(hass, time="07:00")
    response = await create(hass, time="07:00", config_entry_id=second.entry_id)
    assert response["entity_id"] == "switch.kids_alarm_1"


async def test_unload(hass: HomeAssistant, entry: MockConfigEntry) -> None:
    await create(hass, time="07:00")
    assert await hass.config_entries.async_unload(entry.entry_id)
    assert entry.state is ConfigEntryState.NOT_LOADED


# --- sunrise -------------------------------------------------------------------

Freezer = FrozenDateTimeFactory
Calls = list[ServiceCall]


async def stop(hass: HomeAssistant, action: str) -> None:
    await hass.services.async_call(DOMAIN, "stop", {"action": action}, blocking=True)
    await hass.async_block_till_done()


def brightness(hass: HomeAssistant, entity_id: str) -> int | None:
    return hass.states.get(entity_id).attributes.get("brightness")


async def test_sunrise_alarm_and_lights_off(
    hass: HomeAssistant, entry: MockConfigEntry, berlin: Freezer, calls: Calls
) -> None:
    started = async_capture_events(hass, EVENT_SUNRISE_STARTED)
    rang = async_capture_events(hass, EVENT_ALARM)
    await create(hass, time="07:00", days=WEEKDAYS, label="Work")
    assert hass.states.get(STATUS).state == "idle"

    await travel(hass, berlin, "2026-11-12T06:29:00+01:00")
    assert calls == []

    # 06:30: a dim, deep red glow.
    await travel(hass, berlin, "2026-11-12T06:30:00+01:00")
    assert len(started) == 1
    first = calls_for(calls, CT_LIGHT)[0]
    assert first["brightness"] == 1
    assert first["hs_color"] == (0.0, 100.0)
    assert first["transition"] == 9.0
    assert hass.states.get(STATUS).state == "sunrise"

    # 06:45: half brightness, warm white; white light only gets brightness.
    await travel(hass, berlin, "2026-11-12T06:45:00+01:00")
    middle = calls_for(calls, CT_LIGHT)[-1]
    assert middle["brightness"] == 128
    assert 2000 < middle["color_temp_kelvin"] < 4000
    assert set(calls_for(calls, WHITE_LIGHT)[-1]) == {"entity_id", "brightness"}
    assert hass.states.get(STATUS).attributes["progress"] == 50
    assert calls_for(calls, ONOFF_LIGHT) == []
    assert calls_for(calls, SWITCH) == []

    # 07:00: everything on.
    await travel(hass, berlin, "2026-11-12T07:00:00+01:00")
    final = calls_for(calls, CT_LIGHT)[-1]
    assert final["brightness"] == 255
    assert final["color_temp_kelvin"] == 4000
    assert brightness(hass, WHITE_LIGHT) == 255
    assert hass.states.get(ONOFF_LIGHT).state == "on"
    assert hass.states.get(SWITCH).state == "on"
    assert len(rang) == 1
    assert rang[0].data["label"] == "Work"
    assert rang[0].data["entity_id"] == ALARM
    status = hass.states.get(STATUS)
    assert status.state == "awake"
    assert status.attributes["lights_off_at"] == "2026-11-12T07:30:00+01:00"
    # Repeating alarm stays on; next is Friday.
    assert hass.states.get(ALARM).state == "on"
    assert hass.states.get(NEXT).state == "2026-11-13T06:00:00+00:00"

    # 07:30: nobody stopped it, so the lights go off. Switches stay on.
    await travel(hass, berlin, "2026-11-12T07:29:00+01:00")
    assert hass.states.get(CT_LIGHT).state == "on"
    await travel(hass, berlin, "2026-11-12T07:30:00+01:00")
    for light in (CT_LIGHT, WHITE_LIGHT, ONOFF_LIGHT):
        assert hass.states.get(light).state == "off"
    assert hass.states.get(SWITCH).state == "on"
    assert hass.states.get(STATUS).state == "idle"


async def test_lights_off_leaves_changed_and_foreign_lights(
    hass: HomeAssistant, entry: MockConfigEntry, berlin: Freezer, calls: Calls
) -> None:
    # The white light was already at full brightness: not ours, stays on.
    hass.states.async_set(
        WHITE_LIGHT, "on", {"supported_color_modes": ["brightness"], "brightness": 255}
    )
    await create(hass, time="07:00", days=WEEKDAYS)
    await travel(hass, berlin, "2026-11-12T06:30:00+01:00")
    await travel(hass, berlin, "2026-11-12T07:00:00+01:00")
    # Someone dims the ceiling light after the alarm: theirs now.
    attributes = dict(hass.states.get(CT_LIGHT).attributes, brightness=80)
    hass.states.async_set(CT_LIGHT, "on", attributes)

    await travel(hass, berlin, "2026-11-12T07:30:00+01:00")
    assert hass.states.get(CT_LIGHT).state == "on"
    assert hass.states.get(WHITE_LIGHT).state == "on"
    assert hass.states.get(ONOFF_LIGHT).state == "off"


async def test_lights_stay_on_when_disabled(
    hass: HomeAssistant, entry: MockConfigEntry, berlin: Freezer, calls: Calls
) -> None:
    hass.config_entries.async_update_entry(
        entry, options={**entry.options, CONF_LIGHTS_OFF_AFTER: 0}
    )
    await create(hass, time="07:00", days=WEEKDAYS)
    await travel(hass, berlin, "2026-11-12T06:30:00+01:00")
    await travel(hass, berlin, "2026-11-12T07:00:00+01:00")
    assert hass.states.get(STATUS).state == "idle"
    await travel(hass, berlin, "2026-11-12T08:00:00+01:00")
    assert hass.states.get(CT_LIGHT).state == "on"


async def test_one_time_alarm_switches_off(
    hass: HomeAssistant, entry: MockConfigEntry, berlin: Freezer
) -> None:
    await create(hass, time="06:00")
    assert (
        hass.states.get(ALARM).attributes["next_alarm"] == "2026-11-12T06:00:00+01:00"
    )
    await travel(hass, berlin, "2026-11-12T05:30:00+01:00")
    await travel(hass, berlin, "2026-11-12T06:00:00+01:00")
    assert hass.states.get(ALARM).state == "off"
    assert hass.states.get(NEXT).state == "unknown"


async def test_late_alarm_compresses_sunrise(
    hass: HomeAssistant, entry: MockConfigEntry, berlin: Freezer, calls: Calls
) -> None:
    # Set at 05:00 for 05:10: no 30 minutes left, so ramp from now instead of jumping to 66%.
    await create(hass, time="05:10")
    assert calls_for(calls, CT_LIGHT)[0]["brightness"] == 1
    await travel(hass, berlin, "2026-11-12T05:05:00+01:00")
    assert calls_for(calls, CT_LIGHT)[-1]["brightness"] == 128


async def _sunrise_until_0640(hass: HomeAssistant, berlin: Freezer) -> None:
    await create(hass, time="07:00", days=WEEKDAYS)
    await travel(hass, berlin, "2026-11-12T06:30:00+01:00")
    await travel(hass, berlin, "2026-11-12T06:40:00+01:00")


async def test_stop_restore(
    hass: HomeAssistant, entry: MockConfigEntry, berlin: Freezer, calls: Calls
) -> None:
    # Before the sunrise: ceiling off, white light on at 40.
    hass.states.async_set(
        WHITE_LIGHT, "on", {"supported_color_modes": ["brightness"], "brightness": 40}
    )
    stopped = async_capture_events(hass, EVENT_STOPPED)
    rang = async_capture_events(hass, EVENT_ALARM)
    await _sunrise_until_0640(hass, berlin)
    assert brightness(hass, WHITE_LIGHT) == 85

    await stop(hass, "restore")
    assert hass.states.get(CT_LIGHT).state == "off"
    assert hass.states.get(WHITE_LIGHT).state == "on"
    assert brightness(hass, WHITE_LIGHT) == 40
    assert hass.states.get(STATUS).state == "idle"
    assert stopped[0].data["action"] == "restore"

    # Stopped means done for today: nothing happens at 07:00 or 07:30.
    count = len(calls)
    await travel(hass, berlin, "2026-11-12T07:00:00+01:00")
    await travel(hass, berlin, "2026-11-12T07:30:00+01:00")
    assert len(calls) == count
    assert rang == []
    assert hass.states.get(ALARM).state == "on"
    assert hass.states.get(NEXT).state == "2026-11-13T06:00:00+00:00"


async def test_stop_full_brightness(
    hass: HomeAssistant, entry: MockConfigEntry, berlin: Freezer, calls: Calls
) -> None:
    await _sunrise_until_0640(hass, berlin)
    await stop(hass, "full")
    assert brightness(hass, CT_LIGHT) == 255
    assert brightness(hass, WHITE_LIGHT) == 255
    assert hass.states.get(ONOFF_LIGHT).state == "on"
    assert hass.states.get(SWITCH).state == "off"  # stopping is not the alarm
    # No automatic lights-off after a stop.
    await travel(hass, berlin, "2026-11-12T07:30:00+01:00")
    assert brightness(hass, CT_LIGHT) == 255


async def test_stop_all_off_after_alarm(
    hass: HomeAssistant, entry: MockConfigEntry, berlin: Freezer, calls: Calls
) -> None:
    await _sunrise_until_0640(hass, berlin)
    await travel(hass, berlin, "2026-11-12T07:00:00+01:00")
    assert hass.states.get(STATUS).state == "awake"
    await stop(hass, "off")
    for light in (CT_LIGHT, WHITE_LIGHT, ONOFF_LIGHT):
        assert hass.states.get(light).state == "off"
    assert hass.states.get(SWITCH).state == "on"
    assert hass.states.get(STATUS).state == "idle"


async def test_stop_buttons(
    hass: HomeAssistant, entry: MockConfigEntry, berlin: Freezer, calls: Calls
) -> None:
    await _sunrise_until_0640(hass, berlin)
    await hass.services.async_call(
        "button",
        "press",
        {"entity_id": "button.bedroom_stop_lights_as_before"},
        blocking=True,
    )
    await hass.async_block_till_done()
    assert hass.states.get(CT_LIGHT).state == "off"
    assert hass.states.get(STATUS).state == "idle"


async def test_manual_off_is_respected(
    hass: HomeAssistant, entry: MockConfigEntry, berlin: Freezer, calls: Calls
) -> None:
    await create(hass, time="07:00", days=WEEKDAYS)
    await travel(hass, berlin, "2026-11-12T06:30:00+01:00")
    await travel(hass, berlin, "2026-11-12T06:35:00+01:00")
    hass.states.async_set(CT_LIGHT, "off", hass.states.get(CT_LIGHT).attributes)
    before = len(calls_for(calls, CT_LIGHT))

    await travel(hass, berlin, "2026-11-12T06:45:00+01:00")
    await travel(hass, berlin, "2026-11-12T07:00:00+01:00")
    assert len(calls_for(calls, CT_LIGHT)) == before
    assert hass.states.get(CT_LIGHT).state == "off"
    assert brightness(hass, WHITE_LIGHT) == 255


async def test_never_dims_a_brighter_light(
    hass: HomeAssistant, entry: MockConfigEntry, berlin: Freezer, calls: Calls
) -> None:
    hass.states.async_set(
        WHITE_LIGHT, "on", {"supported_color_modes": ["brightness"], "brightness": 200}
    )
    await create(hass, time="07:00", days=WEEKDAYS)
    await travel(hass, berlin, "2026-11-12T06:30:00+01:00")
    await travel(hass, berlin, "2026-11-12T06:45:00+01:00")
    assert calls_for(calls, WHITE_LIGHT) == []
    await travel(hass, berlin, "2026-11-12T06:55:00+01:00")
    assert calls_for(calls, WHITE_LIGHT)[-1]["brightness"] == 212  # 255 * 25/30


async def test_restart_during_sunrise_continues(
    hass: HomeAssistant, entry: MockConfigEntry, berlin: Freezer, calls: Calls
) -> None:
    rang = async_capture_events(hass, EVENT_ALARM)
    await _sunrise_until_0640(hass, berlin)
    level = brightness(hass, CT_LIGHT)

    assert await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()
    # Picks up on the original timeline: same progress, no dip in brightness.
    assert hass.states.get(STATUS).state == "sunrise"
    assert hass.states.get(STATUS).attributes["progress"] == 33
    assert brightness(hass, CT_LIGHT) == level
    await travel(hass, berlin, "2026-11-12T06:45:00+01:00")
    assert brightness(hass, CT_LIGHT) == 128

    # The snapshot survived the restart: "as before" still knows the lights were off.
    await stop(hass, "restore")
    assert hass.states.get(CT_LIGHT).state == "off"
    assert rang == []


async def test_restart_after_alarm_still_turns_lights_off(
    hass: HomeAssistant, entry: MockConfigEntry, berlin: Freezer, calls: Calls
) -> None:
    await _sunrise_until_0640(hass, berlin)
    await travel(hass, berlin, "2026-11-12T07:00:00+01:00")
    assert await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()
    assert hass.states.get(STATUS).state == "awake"

    await travel(hass, berlin, "2026-11-12T07:30:00+01:00")
    assert hass.states.get(CT_LIGHT).state == "off"
    assert hass.states.get(STATUS).state == "idle"


async def test_test_run_restores_lights(
    hass: HomeAssistant, entry: MockConfigEntry, berlin: Freezer, calls: Calls
) -> None:
    await hass.services.async_call(
        "button", "press", {"entity_id": "button.bedroom_test_sunrise"}, blocking=True
    )
    await hass.async_block_till_done()
    assert hass.states.get(STATUS).attributes["test"] is True
    await travel(hass, berlin, "2026-11-12T05:01:00+01:00")
    assert brightness(hass, CT_LIGHT) == 255
    assert hass.states.get(ONOFF_LIGHT).state == "on"
    assert hass.states.get(SWITCH).state == "off"
    assert hass.states.get(STATUS).state == "awake"

    await travel(hass, berlin, "2026-11-12T05:01:10+01:00")
    for light in (CT_LIGHT, WHITE_LIGHT, ONOFF_LIGHT):
        assert hass.states.get(light).state == "off"
    assert hass.states.get(STATUS).state == "idle"
