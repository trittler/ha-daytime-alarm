import type { HomeAssistant } from "./types";

const en = {
  default_title: "Wake-up light",
  next: "Next alarm {when}",
  in: "in {duration}",
  soon: "in less than a minute",
  no_alarm: "No alarm set",
  today: "Today",
  tomorrow: "Tomorrow",
  every_day: "Every day",
  weekdays: "Weekdays",
  weekends: "Weekends",
  not_scheduled: "Not scheduled",
  sunrise_from: "Sunrise from {time}",
  sunrise: "Sunrise",
  test_sunrise: "Test sunrise",
  alarm_at: "Alarm at {time}",
  good_morning: "Good morning",
  lights_off_at: "Lights off at {time}",
  test_restore: "Lights go back to before in a moment",
  stop: "Stop",
  stop_title: "How should the lights stay?",
  stop_restore: "As before",
  stop_full: "Full brightness",
  stop_off: "All off",
  add: "Add alarm",
  empty_title: "No alarms yet",
  empty_text: "Lights brighten slowly before the alarm, like a sunrise.",
  label: "Label",
  delete: "Delete",
  cancel: "Cancel",
  save: "Save",
  close: "Close",
  deleted: "Alarm deleted",
  undo: "Undo",
  rings: "Rings {when}",
  rings_once: "Rings once, {when}",
  minutes: "{n} min sunrise",
  test: "Test",
  test_hint: "Try a one-minute sunrise with your lights",
  settings: "Settings",
  not_found: "Wake-up light not found.",
  not_found_hint: "Set one up under Settings → Devices & services.",
  set_up: "Set up",
  failed: "Could not save: {error}",
  editor_entry: "Wake-up light",
  editor_title: "Title",
  editor_show_devices: "Show devices",
  picker_description: "Wake-up light with sunrise: all your alarms at a glance, switch them on and off, edit them.",
};

type Strings = typeof en;

const de: Strings = {
  default_title: "Lichtwecker",
  next: "Nächster Wecker {when}",
  in: "in {duration}",
  soon: "in weniger als einer Minute",
  no_alarm: "Kein Wecker gestellt",
  today: "Heute",
  tomorrow: "Morgen",
  every_day: "Täglich",
  weekdays: "Werktags",
  weekends: "Wochenende",
  not_scheduled: "Nicht geplant",
  sunrise_from: "Sonnenaufgang ab {time}",
  sunrise: "Sonnenaufgang",
  test_sunrise: "Test-Sonnenaufgang",
  alarm_at: "Wecker um {time}",
  good_morning: "Guten Morgen",
  lights_off_at: "Licht aus um {time}",
  test_restore: "Gleich wieder wie vorher",
  stop: "Stopp",
  stop_title: "Wie soll das Licht bleiben?",
  stop_restore: "Wie vorher",
  stop_full: "Volle Helligkeit",
  stop_off: "Alles aus",
  add: "Wecker hinzufügen",
  empty_title: "Noch keine Wecker",
  empty_text: "Vor dem Wecker werden die Lampen langsam heller, wie bei einem Sonnenaufgang.",
  label: "Name",
  delete: "Löschen",
  cancel: "Abbrechen",
  save: "Speichern",
  close: "Schließen",
  deleted: "Wecker gelöscht",
  undo: "Rückgängig",
  rings: "Klingelt {when}",
  rings_once: "Klingelt einmal, {when}",
  minutes: "{n} Min. Sonnenaufgang",
  test: "Testen",
  test_hint: "Einminütigen Sonnenaufgang mit deinen Lampen ausprobieren",
  settings: "Einstellungen",
  not_found: "Lichtwecker nicht gefunden.",
  not_found_hint: "Richte ihn unter Einstellungen → Geräte & Dienste ein.",
  set_up: "Einrichten",
  failed: "Speichern fehlgeschlagen: {error}",
  editor_entry: "Lichtwecker",
  editor_title: "Titel",
  editor_show_devices: "Geräte anzeigen",
  picker_description: "Lichtwecker mit Sonnenaufgang: alle Wecker auf einen Blick, ein- und ausschalten und bearbeiten.",
};

const STRINGS: Record<string, Strings> = { en, de };

export type StringKey = keyof Strings;

export function language(hass?: HomeAssistant): string {
  return hass?.locale?.language || hass?.language || "en";
}

export function localize(
  hass: HomeAssistant | undefined,
  key: StringKey,
  values: Record<string, string | number> = {},
): string {
  const strings = STRINGS[language(hass).split("-")[0]] ?? en;
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replace(`{${name}}`, String(value)),
    strings[key] ?? en[key],
  );
}
