"""Sunrise math: brightness and color for a given ramp progress.

Pure functions so they are easy to test and reason about.
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from typing import Any

from homeassistant.components.light import (
    ATTR_BRIGHTNESS,
    ATTR_COLOR_MODE,
    ATTR_COLOR_TEMP_KELVIN,
    ATTR_HS_COLOR,
    ATTR_MAX_COLOR_TEMP_KELVIN,
    ATTR_MIN_COLOR_TEMP_KELVIN,
    ATTR_RGB_COLOR,
    ATTR_RGBW_COLOR,
    ATTR_RGBWW_COLOR,
    ATTR_XY_COLOR,
    ColorMode,
)
from homeassistant.util import color as color_util

# The sunrise starts as a deep red glow, turns orange and ends in neutral white.
START_KELVIN = 2000
END_KELVIN = 4000
# Share of the ramp spent in the red-to-orange phase (only for color lights).
RED_PHASE = 0.3
START_HUE = 0.0
START_SATURATION = 100.0
# About 1 %. Some Zigbee bulbs switch off instead of dimming when sent brightness 1.
MIN_BRIGHTNESS = 3

_HS_MODES = {ColorMode.HS, ColorMode.RGB, ColorMode.RGBW, ColorMode.RGBWW, ColorMode.XY}
# The attribute that holds a light's color in each color mode.
_COLOR_KEYS = {
    ColorMode.COLOR_TEMP: ATTR_COLOR_TEMP_KELVIN,
    ColorMode.HS: ATTR_HS_COLOR,
    ColorMode.XY: ATTR_XY_COLOR,
    ColorMode.RGB: ATTR_RGB_COLOR,
    ColorMode.RGBW: ATTR_RGBW_COLOR,
    ColorMode.RGBWW: ATTR_RGBWW_COLOR,
}


def is_dimmable(color_modes: Iterable[str] | None) -> bool:
    """Return True if a light with these color modes supports brightness."""
    modes = set(color_modes or ())
    return bool(modes - {ColorMode.ONOFF, ColorMode.UNKNOWN})


def brightness_for(progress: float) -> int:
    """Brightness (MIN_BRIGHTNESS-255) for a ramp progress between 0 and 1."""
    return max(MIN_BRIGHTNESS, min(255, round(255 * _clamp(progress))))


def light_settings(attributes: Mapping[str, Any]) -> dict[str, Any]:
    """Brightness and color of a light that is on, as light.turn_on data."""
    settings: dict[str, Any] = {}
    if (brightness := attributes.get(ATTR_BRIGHTNESS)) is not None:
        settings[ATTR_BRIGHTNESS] = int(brightness)
    key = _COLOR_KEYS.get(attributes.get(ATTR_COLOR_MODE))  # type: ignore[call-overload]
    if key is not None and (value := attributes.get(key)) is not None:
        settings[key] = list(value) if isinstance(value, (list, tuple)) else value
    return settings


def sunrise_params(
    color_modes: Iterable[str] | None,
    attributes: Mapping[str, Any],
    progress: float,
    *,
    colors: bool,
) -> dict[str, Any]:
    """Return light.turn_on data for one step of the sunrise."""
    progress = _clamp(progress)
    params: dict[str, Any] = {ATTR_BRIGHTNESS: brightness_for(progress)}
    if not colors:
        return params

    modes = set(color_modes or ())
    has_ct = ColorMode.COLOR_TEMP in modes
    has_hs = bool(modes & _HS_MODES)
    if not has_ct and not has_hs:
        return params

    low, high = START_KELVIN, END_KELVIN
    if has_ct:
        low = max(low, int(attributes.get(ATTR_MIN_COLOR_TEMP_KELVIN) or low))
        high = max(
            low, min(high, int(attributes.get(ATTR_MAX_COLOR_TEMP_KELVIN) or high))
        )

    if has_hs and progress < RED_PHASE:
        # Deep red glow fading into the warmest white the light can do.
        hue, sat = color_util.color_temperature_to_hs(low)
        factor = progress / RED_PHASE
        params[ATTR_HS_COLOR] = (
            round(_lerp(START_HUE, hue, factor), 1),
            round(_lerp(START_SATURATION, sat, factor), 1),
        )
        return params

    factor = (progress - RED_PHASE) / (1 - RED_PHASE) if has_hs else progress
    kelvin = round(_lerp(low, high, _clamp(factor)))
    if has_ct:
        params[ATTR_COLOR_TEMP_KELVIN] = kelvin
    else:
        hue, sat = color_util.color_temperature_to_hs(kelvin)
        params[ATTR_HS_COLOR] = (round(hue, 1), round(sat, 1))
    return params


def _lerp(start: float, end: float, factor: float) -> float:
    return start + (end - start) * factor


def _clamp(value: float) -> float:
    return max(0.0, min(1.0, value))
