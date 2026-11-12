"""Buttons: stop the alarm (three ways), or try a sunrise out."""

from __future__ import annotations

from typing import TYPE_CHECKING

from homeassistant.components.button import ButtonEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .const import STOP_FULL, STOP_OFF, STOP_RESTORE
from .entity import DaytimeAlarmEntity
from .manager import AlarmClock

if TYPE_CHECKING:
    from . import DaytimeAlarmConfigEntry

PARALLEL_UPDATES = 0


async def async_setup_entry(
    hass: HomeAssistant,
    entry: DaytimeAlarmConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Add the buttons."""
    clock = entry.runtime_data
    async_add_entities(
        [
            *(
                StopButton(clock, action)
                for action in (STOP_RESTORE, STOP_FULL, STOP_OFF)
            ),
            TestButton(clock, "test"),
        ]
    )


class StopButton(DaytimeAlarmEntity, ButtonEntity):
    """Stop the alarm and restore the lights, go to full brightness, or turn them off."""

    def __init__(self, clock: AlarmClock, action: str) -> None:
        """One button per stop action."""
        super().__init__(clock, f"stop_{action}")
        self._action = action
        self._attr_translation_key = f"stop_{action}"

    async def async_press(self) -> None:
        """Stop."""
        await self.clock.async_stop(self._action)


class TestButton(DaytimeAlarmEntity, ButtonEntity):
    """Run a one-minute sunrise with the lights, then put them back."""

    _attr_translation_key = "test"

    async def async_press(self) -> None:
        """Start the test."""
        self.clock.async_test()
