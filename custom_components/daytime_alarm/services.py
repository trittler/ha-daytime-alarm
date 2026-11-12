"""Services to manage alarms (used by the card and by automations)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import Platform
from homeassistant.core import (
    HomeAssistant,
    ServiceCall,
    ServiceResponse,
    SupportsResponse,
    callback,
)
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv, service
import voluptuous as vol

from .const import (
    ATTR_ACTION,
    ATTR_CONFIG_ENTRY_ID,
    ATTR_DAYS,
    ATTR_ENABLED,
    ATTR_LABEL,
    ATTR_TIME,
    DOMAIN,
    SERVICE_CREATE_ALARM,
    SERVICE_DELETE_ALARM,
    SERVICE_STOP,
    SERVICE_UPDATE_ALARM,
    STOP_ACTIONS,
    WEEKDAYS,
)

if TYPE_CHECKING:
    from .manager import AlarmClock

DAYS_SCHEMA = vol.All(cv.ensure_list, [vol.All(cv.string, vol.Lower, vol.In(WEEKDAYS))])

CREATE_SCHEMA = vol.Schema(
    {
        vol.Optional(ATTR_CONFIG_ENTRY_ID): cv.string,
        vol.Required(ATTR_TIME): cv.time,
        vol.Optional(ATTR_DAYS, default=[]): DAYS_SCHEMA,
        vol.Optional(ATTR_LABEL, default=""): cv.string,
        vol.Optional(ATTR_ENABLED, default=True): cv.boolean,
    }
)

STOP_SCHEMA = vol.Schema(
    {
        vol.Optional(ATTR_CONFIG_ENTRY_ID): cv.string,
        vol.Required(ATTR_ACTION): vol.In(STOP_ACTIONS),
    }
)

UPDATE_FIELDS = {
    vol.Optional(ATTR_TIME): cv.time,
    vol.Optional(ATTR_DAYS): DAYS_SCHEMA,
    vol.Optional(ATTR_LABEL): cv.string,
    vol.Optional(ATTR_ENABLED): cv.boolean,
}


@callback
def async_setup_services(hass: HomeAssistant) -> None:
    """Register the integration's services."""

    async def create_alarm(call: ServiceCall) -> ServiceResponse:
        clock = _get_clock(hass, call.data.get(ATTR_CONFIG_ENTRY_ID))
        alarm = await clock.async_create(
            at=call.data[ATTR_TIME],
            days=call.data[ATTR_DAYS],
            label=call.data[ATTR_LABEL],
            enabled=call.data[ATTR_ENABLED],
        )
        return {"alarm_id": alarm.id, "entity_id": clock.alarm_entity_id(alarm.id)}

    hass.services.async_register(
        DOMAIN,
        SERVICE_CREATE_ALARM,
        create_alarm,
        schema=CREATE_SCHEMA,
        supports_response=SupportsResponse.OPTIONAL,
    )

    async def stop(call: ServiceCall) -> None:
        clock = _get_clock(hass, call.data.get(ATTR_CONFIG_ENTRY_ID))
        await clock.async_stop(call.data[ATTR_ACTION])

    hass.services.async_register(DOMAIN, SERVICE_STOP, stop, schema=STOP_SCHEMA)
    service.async_register_platform_entity_service(
        hass,
        DOMAIN,
        SERVICE_UPDATE_ALARM,
        entity_domain=Platform.SWITCH,
        schema=UPDATE_FIELDS,
        func="async_update_alarm",
    )
    service.async_register_platform_entity_service(
        hass,
        DOMAIN,
        SERVICE_DELETE_ALARM,
        entity_domain=Platform.SWITCH,
        schema=None,
        func="async_delete_alarm",
    )


def _get_clock(hass: HomeAssistant, entry_id: str | None) -> AlarmClock:
    """Find the alarm clock; the entry may be omitted when there is only one."""
    entries = [
        entry
        for entry in hass.config_entries.async_entries(DOMAIN)
        if entry.state is ConfigEntryState.LOADED
    ]
    if entry_id is not None:
        entries = [entry for entry in entries if entry.entry_id == entry_id]
        if not entries:
            raise ServiceValidationError(
                translation_domain=DOMAIN,
                translation_key="entry_not_found",
                translation_placeholders={"entry_id": entry_id},
            )
    elif len(entries) != 1:
        raise ServiceValidationError(
            translation_domain=DOMAIN, translation_key="entry_required"
        )
    return entries[0].runtime_data
