"""Pure logic: schedule math and sunrise colors."""

from __future__ import annotations

from datetime import datetime, time
from zoneinfo import ZoneInfo

import pytest

from custom_components.daytime_alarm.manager import (
    Alarm,
    next_occurrence,
    next_time_of_day,
    normalize_days,
)
from custom_components.daytime_alarm.sunrise import (
    brightness_for,
    is_dimmable,
    sunrise_params,
)
from homeassistant.core import HomeAssistant

BERLIN = ZoneInfo("Europe/Berlin")


@pytest.fixture(autouse=True)
async def tz(hass: HomeAssistant) -> None:
    """Schedule math uses HA's time zone."""
    await hass.config.async_set_time_zone("Europe/Berlin")


def at(*args: int) -> datetime:
    return datetime(*args, tzinfo=BERLIN)


def alarm(hh: int, mm: int, days: tuple[int, ...] = (), **kwargs) -> Alarm:
    return Alarm(id="a", number=1, time=time(hh, mm), days=days, **kwargs)


def test_normalize_days() -> None:
    assert normalize_days(["FRI", "mon", "mon", 6]) == (0, 4, 6)
    assert normalize_days(None) == ()


def test_weekdays_skip_weekend() -> None:
    weekdays = alarm(7, 0, (0, 1, 2, 3, 4))
    # Friday after the alarm → Monday.
    assert next_occurrence(weekdays, at(2026, 11, 13, 8, 0)) == at(2026, 11, 16, 7, 0)
    # Thursday before the alarm → same day.
    assert next_occurrence(weekdays, at(2026, 11, 12, 6, 59)) == at(2026, 11, 12, 7, 0)
    # Exactly at the alarm time → next day (strictly after).
    assert next_occurrence(weekdays, at(2026, 11, 12, 7, 0)) == at(2026, 11, 13, 7, 0)


def test_disabled_and_one_time() -> None:
    assert (
        next_occurrence(alarm(7, 0, (0,), enabled=False), at(2026, 11, 12, 6, 0))
        is None
    )
    once = alarm(7, 0, once_at=at(2026, 11, 13, 7, 0))
    assert next_occurrence(once, at(2026, 11, 12, 23, 0)) == at(2026, 11, 13, 7, 0)
    assert next_occurrence(once, at(2026, 11, 13, 7, 1)) is None
    assert next_time_of_day(time(7, 0), at(2026, 11, 12, 6, 0)) == at(
        2026, 11, 12, 7, 0
    )
    assert next_time_of_day(time(7, 0), at(2026, 11, 12, 7, 0)) == at(
        2026, 11, 13, 7, 0
    )


def test_daylight_saving_time() -> None:
    daily = alarm(7, 0, tuple(range(7)))
    # Night before the switch to summer time: still 07:00 local, one hour less in between.
    spring = next_occurrence(daily, at(2027, 3, 27, 22, 0))
    assert spring.astimezone(BERLIN).hour == 7
    assert spring.utcoffset().total_seconds() == 7200
    autumn = next_occurrence(daily, at(2027, 10, 30, 22, 0))
    assert autumn.astimezone(BERLIN).hour == 7
    assert autumn.utcoffset().total_seconds() == 3600
    # 02:30 does not exist on the spring-forward night; it still rings once that morning.
    gap = next_occurrence(alarm(2, 30, (6,)), at(2027, 3, 28, 0, 0))
    assert gap is not None
    assert gap.astimezone(BERLIN).date().isoformat() == "2027-03-28"


def test_dimmable() -> None:
    assert not is_dimmable(["onoff"])
    assert not is_dimmable(None)
    assert is_dimmable(["brightness"])
    assert is_dimmable(["onoff", "rgbww"])


def test_brightness_range() -> None:
    assert brightness_for(0) == 1
    assert brightness_for(0.5) == 128
    assert brightness_for(1) == 255
    assert brightness_for(2) == 255


def test_white_light_only_gets_brightness() -> None:
    assert sunrise_params(["brightness"], {}, 0.5, colors=True) == {"brightness": 128}


def test_colors_off_only_brightness() -> None:
    assert sunrise_params(["hs", "color_temp"], {}, 0.1, colors=False) == {
        "brightness": 26
    }


def test_color_light_starts_red_and_ends_neutral() -> None:
    modes = ["color_temp", "hs"]
    attrs = {"min_color_temp_kelvin": 2000, "max_color_temp_kelvin": 6500}
    start = sunrise_params(modes, attrs, 0, colors=True)
    assert start["hs_color"] == (0.0, 100.0)
    orange = sunrise_params(modes, attrs, 0.29, colors=True)
    assert 20 < orange["hs_color"][0] < 35
    middle = sunrise_params(modes, attrs, 0.65, colors=True)
    assert middle["color_temp_kelvin"] == 3000
    assert sunrise_params(modes, attrs, 1, colors=True)["color_temp_kelvin"] == 4000


def test_color_temp_respects_light_range() -> None:
    attrs = {"min_color_temp_kelvin": 2700, "max_color_temp_kelvin": 3500}
    assert (
        sunrise_params(["color_temp"], attrs, 0, colors=True)["color_temp_kelvin"]
        == 2700
    )
    assert (
        sunrise_params(["color_temp"], attrs, 1, colors=True)["color_temp_kelvin"]
        == 3500
    )


def test_rgb_only_light_uses_hs_throughout() -> None:
    end = sunrise_params(["rgbww"], {}, 1, colors=True)
    assert "color_temp_kelvin" not in end
    hue, saturation = end["hs_color"]
    assert 20 < hue < 40
    assert saturation < 50
