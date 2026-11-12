"""Config and options flow: name, devices and sunrise settings."""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import (
    ConfigEntry,
    ConfigFlow,
    ConfigFlowResult,
    OptionsFlow,
)
from homeassistant.const import CONF_NAME, Platform, UnitOfTime
from homeassistant.core import callback
from homeassistant.helpers.selector import (
    BooleanSelector,
    EntitySelector,
    EntitySelectorConfig,
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
    TextSelector,
)
import voluptuous as vol

from .const import (
    CONF_DURATION,
    CONF_LIGHTS,
    CONF_LIGHTS_OFF_AFTER,
    CONF_SUNRISE_COLORS,
    CONF_SWITCHES,
    DEFAULT_DURATION,
    DEFAULT_LIGHTS_OFF_AFTER,
    DEFAULT_NAME,
    DOMAIN,
    MAX_DURATION,
    MAX_LIGHTS_OFF_AFTER,
    MIN_DURATION,
)

SETTINGS_SCHEMA = vol.Schema(
    {
        vol.Optional(CONF_LIGHTS): EntitySelector(
            EntitySelectorConfig(domain=Platform.LIGHT, multiple=True)
        ),
        vol.Optional(CONF_SWITCHES): EntitySelector(
            EntitySelectorConfig(
                domain=[Platform.SWITCH, "input_boolean"], multiple=True
            )
        ),
        vol.Required(CONF_DURATION, default=DEFAULT_DURATION): NumberSelector(
            NumberSelectorConfig(
                min=MIN_DURATION,
                max=MAX_DURATION,
                step=1,
                mode=NumberSelectorMode.SLIDER,
                unit_of_measurement=UnitOfTime.MINUTES,
            )
        ),
        vol.Required(CONF_SUNRISE_COLORS, default=True): BooleanSelector(),
        vol.Required(
            CONF_LIGHTS_OFF_AFTER, default=DEFAULT_LIGHTS_OFF_AFTER
        ): NumberSelector(
            NumberSelectorConfig(
                min=0,
                max=MAX_LIGHTS_OFF_AFTER,
                step=5,
                mode=NumberSelectorMode.SLIDER,
                unit_of_measurement=UnitOfTime.MINUTES,
            )
        ),
    }
)


def _clean(user_input: dict[str, Any]) -> dict[str, Any]:
    return {
        CONF_LIGHTS: list(user_input.get(CONF_LIGHTS) or []),
        CONF_SWITCHES: list(user_input.get(CONF_SWITCHES) or []),
        CONF_DURATION: int(user_input[CONF_DURATION]),
        CONF_SUNRISE_COLORS: bool(user_input[CONF_SUNRISE_COLORS]),
        CONF_LIGHTS_OFF_AFTER: int(
            user_input.get(CONF_LIGHTS_OFF_AFTER, DEFAULT_LIGHTS_OFF_AFTER)
        ),
    }


def _validate(settings: dict[str, Any]) -> dict[str, str]:
    if not settings[CONF_LIGHTS] and not settings[CONF_SWITCHES]:
        return {"base": "no_devices"}
    return {}


class DaytimeAlarmConfigFlow(ConfigFlow, domain=DOMAIN):
    """Create an alarm clock (e.g. one per bedroom)."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Ask for a name and the devices."""
        errors: dict[str, str] = {}
        if user_input is not None:
            settings = _clean(user_input)
            if not (errors := _validate(settings)):
                return self.async_create_entry(
                    title=user_input[CONF_NAME].strip() or DEFAULT_NAME,
                    data={},
                    options=settings,
                )

        schema = vol.Schema(
            {vol.Required(CONF_NAME, default=DEFAULT_NAME): TextSelector()}
        ).extend(SETTINGS_SCHEMA.schema)
        return self.async_show_form(
            step_id="user",
            data_schema=self.add_suggested_values_to_schema(schema, user_input or {}),
            errors=errors,
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        """Settings of an existing alarm clock."""
        return DaytimeAlarmOptionsFlow()


class DaytimeAlarmOptionsFlow(OptionsFlow):
    """Change devices and sunrise settings."""

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Show the settings form."""
        errors: dict[str, str] = {}
        if user_input is not None:
            settings = _clean(user_input)
            if not (errors := _validate(settings)):
                return self.async_create_entry(data=settings)

        return self.async_show_form(
            step_id="init",
            data_schema=self.add_suggested_values_to_schema(
                SETTINGS_SCHEMA, user_input or self.config_entry.options
            ),
            errors=errors,
        )
