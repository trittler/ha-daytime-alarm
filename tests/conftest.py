"""Shared fixtures: fake lights/switches and a configured alarm clock."""

from __future__ import annotations

from collections.abc import Generator
from unittest.mock import AsyncMock, MagicMock, patch

from freezegun.api import FrozenDateTimeFactory
import pytest
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_fire_time_changed,
)

from custom_components.daytime_alarm.const import (
    CONF_DURATION,
    CONF_LIGHTS,
    CONF_SUNRISE_COLORS,
    CONF_SWITCHES,
    DOMAIN,
)
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.util import dt as dt_util

CT_LIGHT = "light.ceiling"  # color temperature + hs, supports transitions
WHITE_LIGHT = "light.nightstand"  # brightness only
ONOFF_LIGHT = "light.fairy"  # on/off only
SWITCH = "switch.coffee"


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations: None) -> None:
    """Load integrations from custom_components."""


@pytest.fixture(autouse=True)
def mock_frontend(hass: HomeAssistant) -> Generator[None]:
    """The card registration needs http/frontend; tests don't."""
    hass.config.components.add("http")
    hass.config.components.add("frontend")
    hass.http = MagicMock(async_register_static_paths=AsyncMock())
    with patch("custom_components.daytime_alarm.add_extra_js_url"):
        yield


@pytest.fixture
async def berlin(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory
) -> FrozenDateTimeFactory:
    """Thursday 2026-11-12 05:00 in Berlin."""
    await hass.config.async_set_time_zone("Europe/Berlin")
    freezer.move_to("2026-11-12T05:00:00+01:00")
    return freezer


@pytest.fixture
def calls(hass: HomeAssistant) -> list[ServiceCall]:
    """Fake devices that behave like real ones: turn_on updates the state with the caller's context."""
    recorded: list[ServiceCall] = []
    hass.states.async_set(
        CT_LIGHT,
        "off",
        {
            "supported_color_modes": ["color_temp", "hs"],
            "min_color_temp_kelvin": 2000,
            "max_color_temp_kelvin": 6500,
            "supported_features": 32,
        },
    )
    hass.states.async_set(WHITE_LIGHT, "off", {"supported_color_modes": ["brightness"]})
    hass.states.async_set(ONOFF_LIGHT, "off", {"supported_color_modes": ["onoff"]})
    hass.states.async_set(SWITCH, "off", {})

    async def turn_on(call: ServiceCall) -> None:
        recorded.append(call)
        ids = call.data["entity_id"]
        for entity_id in [ids] if isinstance(ids, str) else ids:
            attributes = dict(hass.states.get(entity_id).attributes)
            if "brightness" in call.data:
                attributes["brightness"] = call.data["brightness"]
            hass.states.async_set(entity_id, "on", attributes, context=call.context)

    async def turn_off(call: ServiceCall) -> None:
        recorded.append(call)
        ids = call.data["entity_id"]
        for entity_id in [ids] if isinstance(ids, str) else ids:
            attributes = dict(hass.states.get(entity_id).attributes)
            attributes.pop("brightness", None)
            hass.states.async_set(entity_id, "off", attributes, context=call.context)

    hass.services.async_register("light", "turn_on", turn_on)
    hass.services.async_register("light", "turn_off", turn_off)
    hass.services.async_register("homeassistant", "turn_on", turn_on)
    return recorded


@pytest.fixture
async def entry(
    hass: HomeAssistant, berlin: FrozenDateTimeFactory, calls: list
) -> MockConfigEntry:
    """A loaded alarm clock called Bedroom with a 30 minute sunrise."""
    config_entry = MockConfigEntry(
        domain=DOMAIN,
        title="Bedroom",
        data={},
        options={
            CONF_LIGHTS: [CT_LIGHT, WHITE_LIGHT, ONOFF_LIGHT],
            CONF_SWITCHES: [SWITCH],
            CONF_DURATION: 30,
            CONF_SUNRISE_COLORS: True,
        },
    )
    config_entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()
    return config_entry


async def travel(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory, when: str
) -> None:
    """Move the clock and run everything that became due."""
    freezer.move_to(when)
    async_fire_time_changed(hass, dt_util.utcnow())
    await hass.async_block_till_done()


def calls_for(
    calls: list[ServiceCall], entity_id: str, service: str = "turn_on"
) -> list[dict]:
    """Service data of all `service` calls that targeted `entity_id`."""
    result = []
    for call in calls:
        ids = call.data["entity_id"]
        if call.service == service and entity_id in (
            [ids] if isinstance(ids, str) else ids
        ):
            result.append(dict(call.data))
    return result
