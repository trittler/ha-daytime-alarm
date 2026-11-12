"""Sensors: when the next alarm rings, and what the wake-up is doing right now."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .const import (
    ATTR_ALARM_AT,
    ATTR_ALARM_ENTITY_ID,
    ATTR_LABEL,
    ATTR_LIGHTS_OFF_AT,
    ATTR_PROGRESS,
    ATTR_SUNRISE_START,
    CONF_DURATION,
    CONF_LIGHTS,
    CONF_LIGHTS_OFF_AFTER,
    CONF_SUNRISE_COLORS,
    CONF_SWITCHES,
    STATUS_AWAKE,
    STATUS_IDLE,
    STATUS_SUNRISE,
)
from .entity import DaytimeAlarmEntity

if TYPE_CHECKING:
    from . import DaytimeAlarmConfigEntry

PARALLEL_UPDATES = 0


async def async_setup_entry(
    hass: HomeAssistant,
    entry: DaytimeAlarmConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Add the sensors."""
    clock = entry.runtime_data
    async_add_entities(
        [NextAlarmSensor(clock, "next_alarm"), StatusSensor(clock, "status")]
    )


class NextAlarmSensor(DaytimeAlarmEntity, SensorEntity):
    """When the next alarm rings."""

    _attr_translation_key = "next_alarm"
    _attr_device_class = SensorDeviceClass.TIMESTAMP
    _unrecorded_attributes = frozenset(
        {
            CONF_LIGHTS,
            CONF_SWITCHES,
            CONF_DURATION,
            CONF_LIGHTS_OFF_AFTER,
            CONF_SUNRISE_COLORS,
            ATTR_SUNRISE_START,
        }
    )

    @property
    def native_value(self) -> datetime | None:
        """Time of the next alarm."""
        if (upcoming := self.clock.next_alarm()) is None:
            return None
        return upcoming[0]

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Which alarm is next, plus the clock settings."""
        clock = self.clock
        attributes: dict[str, Any] = {
            ATTR_ALARM_ENTITY_ID: None,
            ATTR_LABEL: None,
            ATTR_SUNRISE_START: None,
            CONF_DURATION: int(clock.duration.total_seconds() // 60),
            CONF_LIGHTS_OFF_AFTER: int(clock.lights_off_after.total_seconds() // 60),
            CONF_LIGHTS: clock.lights,
            CONF_SWITCHES: clock.switches,
            CONF_SUNRISE_COLORS: clock.sunrise_colors,
        }
        if (upcoming := clock.next_alarm()) is not None:
            at, alarm = upcoming
            attributes[ATTR_ALARM_ENTITY_ID] = clock.alarm_entity_id(alarm.id)
            attributes[ATTR_LABEL] = alarm.label
            attributes[ATTR_SUNRISE_START] = (at - clock.duration).isoformat()
        return attributes


class StatusSensor(DaytimeAlarmEntity, SensorEntity):
    """Idle, sunrise (lights ramping up) or awake (alarm rang, lights on)."""

    _attr_translation_key = "status"
    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = [STATUS_IDLE, STATUS_SUNRISE, STATUS_AWAKE]
    _listen_to_progress = True
    _unrecorded_attributes = frozenset({ATTR_PROGRESS})

    @property
    def native_value(self) -> str:
        """Current status."""
        return self.clock.status[0]

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Progress, alarm time and when the lights go off."""
        _, run = self.clock.status
        if run is None:
            return {
                ATTR_PROGRESS: None,
                ATTR_ALARM_ENTITY_ID: None,
                ATTR_ALARM_AT: None,
                ATTR_LIGHTS_OFF_AT: None,
                "test": False,
            }
        return {
            ATTR_PROGRESS: round(run.progress * 100),
            ATTR_ALARM_ENTITY_ID: (
                self.clock.alarm_entity_id(run.alarm.id) if run.alarm else None
            ),
            ATTR_ALARM_AT: run.end.isoformat(),
            ATTR_LIGHTS_OFF_AT: run.off_at.isoformat() if run.off_at else None,
            "test": run.is_test,
        }
