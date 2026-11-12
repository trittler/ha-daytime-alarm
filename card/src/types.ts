// The parts of Home Assistant's frontend objects this card uses.

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
  last_changed: string;
  last_updated: string;
}

export interface EntityRegistryDisplayEntry {
  entity_id: string;
  device_id?: string;
  platform?: string;
  translation_key?: string;
}

export interface DeviceRegistryEntry {
  id: string;
  config_entries: string[];
  identifiers: [string, string][];
  name: string | null;
  name_by_user: string | null;
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  entities: Record<string, EntityRegistryDisplayEntry>;
  devices: Record<string, DeviceRegistryEntry>;
  language: string;
  locale: { language: string; time_format: string; first_weekday?: string };
  themes: { darkMode: boolean };
  user?: { is_admin: boolean };
  callService(
    domain: string,
    service: string,
    data?: Record<string, unknown>,
    target?: Record<string, unknown>,
  ): Promise<unknown>;
}

export interface CardConfig {
  type: string;
  entry_id?: string;
  title?: string;
  show_devices?: boolean;
}

export interface Alarm {
  entityId: string;
  time: string; // HH:MM
  days: string[]; // mon..sun
  label: string;
  enabled: boolean;
  nextAlarm?: Date;
  sunriseStart?: Date;
  active: boolean;
}

export interface Clock {
  entryId: string;
  name: string;
  alarms: Alarm[];
  next?: { at: Date; entityId?: string };
  duration: number; // minutes
  lightsOffAfter: number; // minutes, 0 = lights stay on
  lights: string[];
  switches: string[];
  wake?: {
    status: "sunrise" | "awake";
    progress: number;
    at?: Date;
    offAt?: Date;
    test: boolean;
    entityId?: string;
  };
  testEntity?: string;
}
