"""Constants for the Daytime Alarm integration."""

from __future__ import annotations

from typing import Final

DOMAIN: Final = "daytime_alarm"

CONF_LIGHTS: Final = "lights"
CONF_SWITCHES: Final = "switches"
CONF_DURATION: Final = "duration"
CONF_SUNRISE_COLORS: Final = "sunrise_colors"
CONF_LIGHTS_OFF_AFTER: Final = "lights_off_after"

DEFAULT_NAME: Final = "Wake-up light"
DEFAULT_DURATION: Final = 30  # minutes
MIN_DURATION: Final = 1
MAX_DURATION: Final = 120
DEFAULT_LIGHTS_OFF_AFTER: Final = 30  # minutes after the alarm; 0 = leave them on
MAX_LIGHTS_OFF_AFTER: Final = 240

STORAGE_VERSION: Final = 1

# Weekday keys used in services and entity attributes. Index == datetime.weekday().
WEEKDAYS: Final = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

ATTR_ALARM_ID: Final = "alarm_id"
ATTR_TIME: Final = "time"
ATTR_DAYS: Final = "days"
ATTR_LABEL: Final = "label"
ATTR_ENABLED: Final = "enabled"
ATTR_NEXT_ALARM: Final = "next_alarm"
ATTR_SUNRISE_START: Final = "sunrise_start"
ATTR_PROGRESS: Final = "progress"
ATTR_ALARM_ENTITY_ID: Final = "alarm_entity_id"
ATTR_CONFIG_ENTRY_ID: Final = "config_entry_id"
ATTR_ACTION: Final = "action"
ATTR_ALARM_AT: Final = "alarm_at"
ATTR_LIGHTS_OFF_AT: Final = "lights_off_at"

# What happens to the lights when someone stops the alarm.
STOP_RESTORE: Final = "restore"  # back to how they were before the sunrise
STOP_FULL: Final = "full"  # full brightness
STOP_OFF: Final = "off"  # all lights off
STOP_ACTIONS: Final = [STOP_RESTORE, STOP_FULL, STOP_OFF]

# Wake-up status (sensor states).
STATUS_IDLE: Final = "idle"
STATUS_SUNRISE: Final = "sunrise"
STATUS_AWAKE: Final = "awake"

EVENT_SUNRISE_STARTED: Final = f"{DOMAIN}_sunrise_started"
EVENT_ALARM: Final = f"{DOMAIN}_alarm"
EVENT_STOPPED: Final = f"{DOMAIN}_stopped"

SERVICE_CREATE_ALARM: Final = "create_alarm"
SERVICE_UPDATE_ALARM: Final = "update_alarm"
SERVICE_DELETE_ALARM: Final = "delete_alarm"
SERVICE_STOP: Final = "stop"

# Test run: a short sunrise to check the lights, then back to how they were.
TEST_DURATION_SECONDS: Final = 60
TEST_HOLD_SECONDS: Final = 10

FRONTEND_URL: Final = f"/{DOMAIN}/daytime-alarm-card.js"
