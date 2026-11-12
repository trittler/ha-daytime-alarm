// Time, weekday and duration formatting that follows the user's HA locale settings.
// Alarm times live in the server's time zone, so all "which day / what time"
// math happens there, not in the browser's zone.

import { language, localize } from "./localize";
import type { HomeAssistant } from "./types";

export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const FIRST_WEEKDAY: Record<string, number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
};

const pad = (value: number) => String(value).padStart(2, "0");

export function serverTimeZone(hass: HomeAssistant): string | undefined {
  return (hass as unknown as { config?: { time_zone?: string } }).config?.time_zone;
}

export function uses24h(hass: HomeAssistant): boolean {
  const setting = hass.locale?.time_format;
  if (setting === "24") return true;
  if (setting === "12") return false;
  const locale = setting === "system" ? undefined : language(hass);
  const cycle = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hourCycle;
  return cycle === "h23" || cycle === "h24";
}

/** "07:00" → { main: "07:00", suffix: "" } or { main: "7:00", suffix: "AM" }. */
export function splitTime(hass: HomeAssistant, time: string): { main: string; suffix: string } {
  const [hours, minutes] = time.split(":").map(Number);
  if (uses24h(hass)) return { main: `${pad(hours)}:${pad(minutes)}`, suffix: "" };
  const parts = new Intl.DateTimeFormat(language(hass), {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(new Date(2000, 0, 1, hours, minutes));
  return {
    main: parts
      .filter((part) => part.type !== "dayPeriod")
      .map((part) => part.value)
      .join("")
      .trim(),
    suffix: parts.find((part) => part.type === "dayPeriod")?.value ?? "",
  };
}

export function formatTime(hass: HomeAssistant, time: string): string {
  const { main, suffix } = splitTime(hass, time);
  return suffix ? `${main} ${suffix}` : main;
}

/** Clock time of a date in the server's time zone, as HH:MM. */
export function clockOf(hass: HomeAssistant, date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: serverTimeZone(hass),
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${get("hour")}:${get("minute")}`;
}

/** Days between today and `date`, both in the server's time zone. */
function dayOffset(hass: HomeAssistant, date: Date, now = new Date()): number {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: serverTimeZone(hass),
  });
  const toUtc = (value: Date) => Date.parse(`${fmt.format(value)}T00:00:00Z`);
  return Math.round((toUtc(date) - toUtc(now)) / 86_400_000);
}

/** "Today", "Tomorrow" or the weekday name. */
export function relativeDay(hass: HomeAssistant, date: Date): string {
  const offset = dayOffset(hass, date);
  if (offset === 0) return localize(hass, "today");
  if (offset === 1) return localize(hass, "tomorrow");
  return new Intl.DateTimeFormat(language(hass), {
    weekday: "long",
    timeZone: serverTimeZone(hass),
  }).format(date);
}

/** "8h 12m" style duration in the user's language. */
export function formatDuration(hass: HomeAssistant, totalMinutes: number): string {
  const minutesLeft = Math.max(1, Math.round(totalMinutes));
  const days = Math.floor(minutesLeft / 1440);
  const hours = Math.floor((minutesLeft % 1440) / 60);
  const minutes = minutesLeft % 60;
  const value = days ? { days, hours } : hours ? { hours, minutes } : { minutes };
  const DurationFormat = (Intl as unknown as { DurationFormat?: any }).DurationFormat;
  if (DurationFormat) {
    return new DurationFormat(language(hass), { style: "narrow" }).format(value);
  }
  return [
    days ? `${days} d` : "",
    hours ? `${hours} h` : "",
    !days && minutes ? `${minutes} min` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function timeUntil(hass: HomeAssistant, date: Date): string {
  const minutes = (date.getTime() - Date.now()) / 60_000;
  if (minutes < 1) return localize(hass, "soon");
  return localize(hass, "in", { duration: formatDuration(hass, minutes) });
}

/** Weekday keys in the order of the user's first day of the week. */
export function weekdayOrder(hass: HomeAssistant): string[] {
  const setting = hass.locale?.first_weekday;
  let first = setting && setting in FIRST_WEEKDAY ? FIRST_WEEKDAY[setting] : undefined;
  if (first === undefined) {
    try {
      const locale = new Intl.Locale(language(hass)) as Intl.Locale & {
        getWeekInfo?: () => { firstDay: number };
        weekInfo?: { firstDay: number };
      };
      const info = locale.getWeekInfo?.() ?? locale.weekInfo;
      first = info ? (info.firstDay + 6) % 7 : 0;
    } catch {
      first = 0;
    }
  }
  return [...WEEKDAYS.slice(first), ...WEEKDAYS.slice(0, first)];
}

export function dayName(hass: HomeAssistant, day: string, style: "narrow" | "short" | "long"): string {
  // 2024-01-01 was a Monday.
  const date = new Date(Date.UTC(2024, 0, 1 + WEEKDAYS.indexOf(day), 12));
  return new Intl.DateTimeFormat(language(hass), { weekday: style, timeZone: "UTC" }).format(date);
}

export function scheduleText(hass: HomeAssistant, days: string[]): string {
  const set = new Set(days);
  if (set.size === 7) return localize(hass, "every_day");
  if (set.size === 5 && ["mon", "tue", "wed", "thu", "fri"].every((day) => set.has(day))) {
    return localize(hass, "weekdays");
  }
  if (set.size === 2 && set.has("sat") && set.has("sun")) return localize(hass, "weekends");
  return weekdayOrder(hass)
    .filter((day) => set.has(day))
    .map((day) => dayName(hass, day, "short"))
    .join(", ");
}

/** "07:00" minus 30 minutes → "06:30" (wraps around midnight). */
export function subtractMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number);
  const total = (((hours * 60 + mins - minutes) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

/** Minutes from now until an alarm at `time` on `days` would ring (server time zone). */
export function minutesUntilRing(hass: HomeAssistant, time: string, days: string[]): number {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: serverTimeZone(hass),
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const today = WEEKDAYS.indexOf(get("weekday").toLowerCase().slice(0, 3));
  const nowMinutes = Number(get("hour")) * 60 + Number(get("minute")) + now.getSeconds() / 60;
  const [hours, mins] = time.split(":").map(Number);
  const alarmMinutes = hours * 60 + mins;
  for (let offset = 0; offset <= 7; offset++) {
    const weekday = WEEKDAYS[(today + offset) % 7];
    if (days.length && !days.includes(weekday)) continue;
    const delta = offset * 1440 + alarmMinutes - nowMinutes;
    if (delta > 0) return delta;
  }
  return 7 * 1440;
}
