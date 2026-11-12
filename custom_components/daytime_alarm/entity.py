"""Base entity for Daytime Alarm."""

from __future__ import annotations

from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.entity import Entity

from .const import DOMAIN
from .manager import AlarmClock


class DaytimeAlarmEntity(Entity):
    """Entity that belongs to an alarm clock device and follows its updates."""

    _attr_has_entity_name = True
    _attr_should_poll = False
    _listen_to_progress = False

    def __init__(self, clock: AlarmClock, key: str) -> None:
        """Attach to the clock's device."""
        self.clock = clock
        entry = clock.entry
        self._attr_unique_id = f"{entry.entry_id}_{key}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
            name=entry.title,
            manufacturer="Daytime Alarm",
            model="Sunrise alarm clock",
            entry_type=DeviceEntryType.SERVICE,
        )

    async def async_added_to_hass(self) -> None:
        """Follow clock updates."""
        self.async_on_remove(
            self.clock.async_add_listener(
                self._handle_update, progress=self._listen_to_progress
            )
        )

    def _handle_update(self) -> None:
        self.async_write_ha_state()
