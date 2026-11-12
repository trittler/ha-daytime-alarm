"""Daytime Alarm: sunrise wake-up alarms for Home Assistant."""

from __future__ import annotations

import hashlib
from pathlib import Path

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

from .const import DOMAIN, FRONTEND_URL
from .manager import AlarmClock
from .services import async_setup_services

PLATFORMS = [Platform.BUTTON, Platform.SENSOR, Platform.SWITCH]
CARD_FILE = Path(__file__).parent / "frontend" / "daytime-alarm-card.js"

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

type DaytimeAlarmConfigEntry = ConfigEntry[AlarmClock]


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Serve the dashboard card and register services."""
    await hass.http.async_register_static_paths(
        [StaticPathConfig(FRONTEND_URL, str(CARD_FILE), cache_headers=True)]
    )
    # Cache-bust with the file hash so updates show up without clearing caches.
    digest = await hass.async_add_executor_job(_file_hash, CARD_FILE)
    add_extra_js_url(hass, f"{FRONTEND_URL}?v={digest}")
    async_setup_services(hass)
    return True


def _file_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:10]


async def async_setup_entry(
    hass: HomeAssistant, entry: DaytimeAlarmConfigEntry
) -> bool:
    """Set up one alarm clock."""
    clock = AlarmClock(hass, entry)
    await clock.async_load()
    entry.runtime_data = clock
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    clock.async_start()
    entry.async_on_unload(clock.async_shutdown)
    entry.async_on_unload(entry.add_update_listener(_async_options_updated))
    return True


async def _async_options_updated(
    hass: HomeAssistant, entry: DaytimeAlarmConfigEntry
) -> None:
    entry.runtime_data.async_options_updated()


async def async_unload_entry(
    hass: HomeAssistant, entry: DaytimeAlarmConfigEntry
) -> bool:
    """Unload an alarm clock."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def async_remove_entry(
    hass: HomeAssistant, entry: DaytimeAlarmConfigEntry
) -> None:
    """Delete stored alarms when the entry is removed."""
    await AlarmClock(hass, entry).async_remove_storage()
