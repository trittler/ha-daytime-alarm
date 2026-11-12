import { LitElement, html, nothing, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import "./editor";
import {
  clockOf,
  dayName,
  formatTime,
  minutesUntilRing,
  relativeDay,
  scheduleText,
  splitTime,
  subtractMinutes,
  timeUntil,
  formatDuration,
  weekdayOrder,
} from "./format";
import { localize, type StringKey } from "./localize";
import { cardStyles } from "./styles";
import type { Alarm, CardConfig, Clock, HassEntity, HomeAssistant } from "./types";

const DOMAIN = "daytime_alarm";
const CARD_TYPE = "daytime-alarm-card";

interface Draft {
  entityId?: string; // undefined while creating a new alarm
  time: string;
  days: string[];
  label: string;
}

const isUsable = (stateObj?: HassEntity) =>
  !!stateObj && stateObj.state !== "unavailable" && stateObj.state !== "unknown";

const parseDate = (value: unknown): Date | undefined => {
  if (typeof value !== "string" || !value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

function fire(node: EventTarget, type: string, detail: unknown): void {
  node.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
}

function clockDevices(hass: HomeAssistant) {
  return Object.values(hass.devices ?? {}).filter((device) =>
    device.identifiers?.some(([domain]) => domain === DOMAIN),
  );
}

/** Collect everything the card shows from the entities of one alarm clock device. */
function resolveClock(hass: HomeAssistant, entryId?: string): Clock | undefined {
  const devices = clockDevices(hass);
  const device = entryId
    ? devices.find((dev) => dev.identifiers.some(([dom, id]) => dom === DOMAIN && id === entryId))
    : devices[0];
  if (!device) return undefined;

  const entities = Object.values(hass.entities).filter((entity) => entity.device_id === device.id);
  const find = (domain: string, key: string) =>
    entities.find((entity) => entity.entity_id.startsWith(`${domain}.`) && entity.translation_key === key)
      ?.entity_id;

  const alarms: Alarm[] = entities
    .filter((entity) => entity.entity_id.startsWith("switch."))
    .map((entity) => hass.states[entity.entity_id])
    .filter((stateObj): stateObj is HassEntity => !!stateObj && "time" in stateObj.attributes)
    .map((stateObj) => ({
      entityId: stateObj.entity_id,
      time: stateObj.attributes.time,
      days: stateObj.attributes.days ?? [],
      label: stateObj.attributes.label ?? "",
      enabled: stateObj.state === "on",
      nextAlarm: parseDate(stateObj.attributes.next_alarm),
      sunriseStart: parseDate(stateObj.attributes.sunrise_start),
      active: !!stateObj.attributes.sunrise_active,
    }))
    .sort((a, b) => a.time.localeCompare(b.time) || a.entityId.localeCompare(b.entityId));

  const nextId = find("sensor", "next_alarm");
  const next = nextId ? hass.states[nextId] : undefined;
  const nextAt = isUsable(next) ? parseDate(next!.state) : undefined;
  const statusId = find("sensor", "status");
  const status = statusId ? hass.states[statusId] : undefined;
  const phase = status?.state;

  return {
    entryId: device.identifiers.find(([dom]) => dom === DOMAIN)![1],
    name: device.name_by_user || device.name || localize(hass, "default_title"),
    alarms,
    next: nextAt ? { at: nextAt, entityId: next!.attributes.alarm_entity_id } : undefined,
    duration: Number(next?.attributes.duration ?? 30),
    lightsOffAfter: Number(next?.attributes.lights_off_after ?? 30),
    lights: next?.attributes.lights ?? [],
    switches: next?.attributes.switches ?? [],
    wake:
      status && (phase === "sunrise" || phase === "awake")
        ? {
            status: phase,
            progress: Number(status.attributes.progress ?? 0),
            at: parseDate(status.attributes.alarm_at),
            offAt: parseDate(status.attributes.lights_off_at),
            test: !!status.attributes.test,
            entityId: status.attributes.alarm_entity_id,
          }
        : undefined,
    testEntity: find("button", "test"),
  };
}

export class DaytimeAlarmCard extends LitElement {
  static styles = cardStyles;

  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private _config?: CardConfig;
  @state() private _draft?: Draft;
  @state() private _optimistic: Record<string, boolean> = {};
  @state() private _saving = false;
  @state() private _stopChoice = false;

  private _clock?: Clock;
  private _watched: string[] = [];
  private _ticker?: number;

  static getConfigElement(): HTMLElement {
    return document.createElement("daytime-alarm-card-editor");
  }

  static getStubConfig(hass: HomeAssistant): Partial<CardConfig> {
    const device = clockDevices(hass)[0];
    const entryId = device?.identifiers.find(([dom]) => dom === DOMAIN)?.[1];
    return entryId ? { entry_id: entryId } : {};
  }

  setConfig(config: CardConfig): void {
    if (!config) throw new Error("Invalid configuration");
    this._config = { show_devices: true, ...config };
  }

  getCardSize(): number {
    return 3 + (this._clock?.alarms.length ?? 1) * 2;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  connectedCallback(): void {
    super.connectedCallback();
    // Keep "in 8h 12m" fresh.
    this._ticker = window.setInterval(() => this.requestUpdate(), 30_000);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.clearInterval(this._ticker);
  }

  protected shouldUpdate(changed: PropertyValues): boolean {
    // Only re-render for state changes of our own entities and devices.
    if (changed.size !== 1 || !changed.has("hass") || !this._clock) return true;
    const old = changed.get("hass") as HomeAssistant | undefined;
    const hass = this.hass;
    if (!old || !hass) return true;
    if (
      old.entities !== hass.entities ||
      old.devices !== hass.devices ||
      old.locale !== hass.locale ||
      old.themes !== hass.themes
    ) {
      return true;
    }
    return this._watched.some((entityId) => old.states[entityId] !== hass.states[entityId]);
  }

  protected willUpdate(changed: PropertyValues): void {
    if (!this.hass || !this._config) return;
    this._clock = resolveClock(this.hass, this._config.entry_id);
    const clock = this._clock;
    if (this._stopChoice && !clock?.wake) this._stopChoice = false;
    if (clock) {
      this._watched = [
        ...clock.alarms.map((alarm) => alarm.entityId),
        ...clock.lights,
        ...clock.switches,
        ...Object.values(this.hass.entities)
          .filter((entity) => entity.platform === DOMAIN)
          .map((entity) => entity.entity_id),
      ];
    }
    if (changed.has("hass") && Object.keys(this._optimistic).length) {
      // Drop optimistic toggles once HA reports the new state.
      const pending = Object.fromEntries(
        Object.entries(this._optimistic).filter(
          ([entityId, on]) => (this.hass!.states[entityId]?.state === "on") !== on,
        ),
      );
      if (Object.keys(pending).length !== Object.keys(this._optimistic).length) {
        this._optimistic = pending;
      }
    }
  }

  private _t(key: StringKey, values?: Record<string, string | number>): string {
    return localize(this.hass, key, values);
  }

  // --- rendering -------------------------------------------------------------

  protected render(): TemplateResult | typeof nothing {
    if (!this.hass || !this._config) return nothing;
    const clock = this._clock;
    if (!clock) return this._renderNotFound();
    const editingNew = this._draft && !this._draft.entityId;

    return html`
      <ha-card>
        ${this._renderHeader(clock)} ${clock.wake ? this._renderBanner(clock) : nothing}
        <div class="alarms">
          ${editingNew ? this._renderEditor(clock, this._draft!) : nothing}
          ${clock.alarms.map((alarm) =>
            this._draft?.entityId === alarm.entityId
              ? this._renderEditor(clock, this._draft, alarm)
              : this._renderAlarm(clock, alarm),
          )}
          ${!clock.alarms.length && !editingNew ? this._renderEmpty() : nothing}
        </div>
        ${this._renderFooter(clock)}
      </ha-card>
    `;
  }

  private _renderNotFound() {
    const isAdmin = this.hass?.user?.is_admin ?? true;
    return html`
      <ha-card>
        <div class="warning">
          <strong>${this._t("not_found")}</strong>
          <span>${this._t("not_found_hint")}</span>
          ${isAdmin
            ? html`<button
                class="btn filled"
                @click=${() => this._navigate(`/config/integrations/dashboard/add?domain=${DOMAIN}`)}
              >
                ${this._t("set_up")}
              </button>`
            : nothing}
        </div>
      </ha-card>
    `;
  }

  private _renderHeader(clock: Clock) {
    const hass = this.hass!;
    let subtitle: TemplateResult | string = this._t("no_alarm");
    if (clock.next) {
      const when = `${relativeDay(hass, clock.next.at)} ${formatTime(hass, clockOf(hass, clock.next.at))}`;
      subtitle = html`<strong>${when}</strong> · ${timeUntil(hass, clock.next.at)}`;
    }
    return html`
      <div class="header">
        <div class="header-icon"><ha-icon icon="mdi:weather-sunset-up"></ha-icon></div>
        <div class="header-text">
          <div class="title">${this._config!.title || clock.name}</div>
          <div class="subtitle">${subtitle}</div>
        </div>
        <button
          class="icon-btn add"
          title=${this._t("add")}
          aria-label=${this._t("add")}
          @click=${this._addAlarm}
        >
          <ha-icon icon="mdi:plus"></ha-icon>
        </button>
      </div>
    `;
  }

  private _renderBanner(clock: Clock) {
    const hass = this.hass!;
    const wake = clock.wake!;
    const awake = wake.status === "awake";
    const progress = awake ? 100 : Math.max(0, Math.min(100, wake.progress));
    const style = styleMap({ "--sunrise-position": `${progress}%` });

    if (this._stopChoice) {
      const choices: [string, string, StringKey][] = [
        ["restore", "mdi:restore", "stop_restore"],
        ["full", "mdi:brightness-7", "stop_full"],
        ["off", "mdi:lightbulb-off-outline", "stop_off"],
      ];
      return html`
        <div class="banner choosing" style=${style} @keydown=${this._choiceKeydown}>
          <div class="choice-head">
            <span class="banner-title">${this._t("stop_title")}</span>
            <button
              class="icon-btn"
              title=${this._t("cancel")}
              aria-label=${this._t("cancel")}
              @click=${() => (this._stopChoice = false)}
            >
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
          <div class="choices">
            ${choices.map(
              ([action, icon, label]) => html`
                <button class="choice" @click=${() => this._stop(clock, action)}>
                  <ha-icon .icon=${icon}></ha-icon>
                  <span>${this._t(label)}</span>
                </button>
              `,
            )}
          </div>
        </div>
      `;
    }

    let title: string;
    let sub: string | undefined;
    if (wake.test) {
      title = `${this._t("test_sunrise")} · ${progress}%`;
      sub = awake ? this._t("test_restore") : undefined;
    } else if (awake) {
      title = this._t("good_morning");
      sub = wake.offAt
        ? this._t("lights_off_at", { time: formatTime(hass, clockOf(hass, wake.offAt)) })
        : undefined;
    } else {
      title = `${this._t("sunrise")} · ${progress}%`;
      sub = wake.at
        ? this._t("alarm_at", { time: formatTime(hass, clockOf(hass, wake.at)) })
        : undefined;
    }
    return html`
      <div class="banner" style=${style}>
        <ha-icon icon="mdi:white-balance-sunny"></ha-icon>
        <div class="banner-text">
          <div class="banner-title">${title}</div>
          ${sub ? html`<div class="banner-sub">${sub}</div>` : nothing}
          ${awake
            ? nothing
            : html`<div class="bar"><div style=${styleMap({ width: `${progress}%` })}></div></div>`}
        </div>
        <button class="btn" @click=${() => (this._stopChoice = true)}>${this._t("stop")}</button>
      </div>
    `;
  }

  private _renderAlarm(clock: Clock, alarm: Alarm) {
    const hass = this.hass!;
    const on = this._optimistic[alarm.entityId] ?? alarm.enabled;
    const { main, suffix } = splitTime(hass, alarm.time);
    const schedule = alarm.days.length
      ? scheduleText(hass, alarm.days)
      : on && alarm.nextAlarm
        ? relativeDay(hass, alarm.nextAlarm)
        : this._t("not_scheduled");
    const name = alarm.label ? `${alarm.label}, ` : "";

    return html`
      <div class="alarm ${on ? "on" : "off"} ${alarm.active ? "active" : ""}">
        <button
          class="alarm-body"
          aria-label="${name}${formatTime(hass, alarm.time)}, ${schedule}"
          @click=${() => this._edit(alarm)}
        >
          <span class="meta">
            <span>${schedule}</span>
            ${alarm.label ? html`<span class="label">${alarm.label}</span>` : nothing}
          </span>
          <span class="time">${main}${suffix ? html`<span class="suffix">${suffix}</span>` : nothing}</span>
          ${on && clock.lights.length
            ? html`<span class="hint">
                <ha-icon icon="mdi:weather-sunset-up"></ha-icon>
                ${this._t("sunrise_from", {
                  time: formatTime(hass, subtractMinutes(alarm.time, clock.duration)),
                })}
              </span>`
            : nothing}
        </button>
        ${this._renderSwitch(on, `${name}${formatTime(hass, alarm.time)}`, () =>
          this._toggle(alarm, !on),
        )}
      </div>
    `;
  }

  private _renderSwitch(on: boolean, label: string, onToggle: () => void) {
    return html`
      <button
        class="switch"
        role="switch"
        aria-checked=${on ? "true" : "false"}
        aria-label=${label}
        @click=${(ev: Event) => {
          ev.stopPropagation();
          onToggle();
        }}
      ></button>
    `;
  }

  private _renderEditor(clock: Clock, draft: Draft, alarm?: Alarm) {
    const hass = this.hass!;
    const ringsIn = formatDuration(hass, minutesUntilRing(hass, draft.time, draft.days));
    const summary = draft.days.length
      ? `${scheduleText(hass, draft.days)} · ${this._t("in", { duration: ringsIn })}`
      : this._t("rings_once", { when: this._t("in", { duration: ringsIn }) });

    return html`
      <div class="editor" @keydown=${this._editorKeydown}>
        <div class="editor-top">
          <input
            class="time-input"
            type="time"
            required
            style=${styleMap({ colorScheme: hass.themes?.darkMode ? "dark" : "light" })}
            .value=${draft.time}
            @input=${(ev: Event) => {
              const value = (ev.target as HTMLInputElement).value;
              if (value) this._patch({ time: value.slice(0, 5) });
            }}
          />
          <button
            class="icon-btn"
            title=${this._t("close")}
            aria-label=${this._t("close")}
            @click=${this._closeEditor}
          >
            <ha-icon icon="mdi:chevron-up"></ha-icon>
          </button>
        </div>

        <div class="days" role="group">
          ${weekdayOrder(hass).map((day) => {
            const selected = draft.days.includes(day);
            return html`<button
              class="day"
              aria-pressed=${selected ? "true" : "false"}
              title=${dayName(hass, day, "long")}
              aria-label=${dayName(hass, day, "long")}
              @click=${() => this._toggleDay(day)}
            >
              ${dayName(hass, day, "narrow")}
            </button>`;
          })}
        </div>

        <div class="summary">
          <span>${summary}</span>
          ${clock.lights.length
            ? html`<span class="hint">
                  <ha-icon icon="mdi:weather-sunset-up"></ha-icon>
                  ${this._t("sunrise_from", {
                    time: formatTime(hass, subtractMinutes(draft.time, clock.duration)),
                  })}
                </span>`
            : nothing}
          ${clock.lights.length && clock.lightsOffAfter
            ? html`<span class="hint muted">
                <ha-icon icon="mdi:lightbulb-off-outline"></ha-icon>
                ${this._t("lights_off_at", {
                  time: formatTime(hass, subtractMinutes(draft.time, -clock.lightsOffAfter)),
                })}
              </span>`
            : nothing}
        </div>

        <label class="field">
          <ha-icon icon="mdi:label-outline"></ha-icon>
          <input
            type="text"
            maxlength="40"
            placeholder=${this._t("label")}
            aria-label=${this._t("label")}
            .value=${draft.label}
            @input=${(ev: Event) => this._patch({ label: (ev.target as HTMLInputElement).value })}
          />
        </label>

        <div class="actions">
          ${alarm
            ? html`<button class="btn danger" @click=${() => this._delete(alarm)}>
                <ha-icon icon="mdi:delete-outline"></ha-icon>${this._t("delete")}
              </button>`
            : html`<button class="btn text" @click=${this._closeEditor}>${this._t("cancel")}</button>`}
          <span class="spacer"></span>
          <button class="btn filled" ?disabled=${this._saving} @click=${this._save}>
            ${this._t("save")}
          </button>
        </div>
      </div>
    `;
  }

  private _renderEmpty() {
    return html`
      <div class="empty">
        <ha-icon icon="mdi:weather-sunset-up"></ha-icon>
        <div class="empty-title">${this._t("empty_title")}</div>
        <div class="empty-text">${this._t("empty_text")}</div>
        <button class="btn filled" @click=${this._addAlarm}>
          <ha-icon icon="mdi:plus"></ha-icon>${this._t("add")}
        </button>
      </div>
    `;
  }

  private _renderFooter(clock: Clock) {
    const devices = [...clock.lights, ...clock.switches];
    const isAdmin = this.hass?.user?.is_admin ?? true;
    return html`
      <div class="footer">
        ${this._config!.show_devices && devices.length
          ? html`<div class="chips">${devices.map((entityId) => this._renderChip(entityId))}</div>`
          : nothing}
        <div class="footer-row">
          ${clock.lights.length
            ? html`<span class="duration">
                <ha-icon icon="mdi:timer-sand"></ha-icon>${this._t("minutes", { n: clock.duration })}
              </span>`
            : nothing}
          <span class="spacer"></span>
          ${clock.testEntity && clock.lights.length
            ? html`<button
                class="btn text"
                title=${this._t("test_hint")}
                ?disabled=${!!clock.wake}
                @click=${() => this._press(clock.testEntity!)}
              >
                <ha-icon icon="mdi:play-circle-outline"></ha-icon>${this._t("test")}
              </button>`
            : nothing}
          ${isAdmin
            ? html`<button
                class="icon-btn"
                title=${this._t("settings")}
                aria-label=${this._t("settings")}
                @click=${() => this._navigate(`/config/integrations/integration/${DOMAIN}`)}
              >
                <ha-icon icon="mdi:cog-outline"></ha-icon>
              </button>`
            : nothing}
        </div>
      </div>
    `;
  }

  private _renderChip(entityId: string) {
    const stateObj = this.hass!.states[entityId];
    const domain = entityId.split(".")[0];
    const on = stateObj?.state === "on";
    const icon =
      stateObj?.attributes.icon ||
      (domain === "light"
        ? on
          ? "mdi:lightbulb"
          : "mdi:lightbulb-outline"
        : on
          ? "mdi:toggle-switch-variant"
          : "mdi:toggle-switch-variant-off");
    const rgb = stateObj?.attributes.rgb_color as number[] | undefined;
    const style = on && rgb ? styleMap({ "--chip-color": `rgb(${rgb.join(",")})` }) : nothing;
    return html`
      <button
        class="chip ${on ? "on" : ""} ${isUsable(stateObj) ? "" : "unavailable"}"
        style=${style}
        @click=${() => fire(this, "hass-more-info", { entityId })}
      >
        <ha-icon .icon=${icon}></ha-icon>
        <span>${stateObj?.attributes.friendly_name ?? entityId}</span>
      </button>
    `;
  }

  // --- actions ---------------------------------------------------------------

  private _addAlarm = () => {
    this._draft = { time: "07:00", days: [], label: "" };
  };

  private _edit(alarm: Alarm) {
    this._draft = {
      entityId: alarm.entityId,
      time: alarm.time,
      days: [...alarm.days],
      label: alarm.label,
    };
  }

  private _closeEditor = () => {
    this._draft = undefined;
  };

  private _patch(changes: Partial<Draft>) {
    if (this._draft) this._draft = { ...this._draft, ...changes };
  }

  private _toggleDay(day: string) {
    const days = new Set(this._draft?.days);
    if (days.has(day)) days.delete(day);
    else days.add(day);
    this._patch({ days: [...days] });
  }

  private _editorKeydown = (ev: KeyboardEvent) => {
    if (ev.key === "Escape") this._closeEditor();
    if (ev.key === "Enter" && (ev.target as HTMLElement).tagName === "INPUT") this._save();
  };

  private _save = async () => {
    const draft = this._draft;
    const clock = this._clock;
    if (!draft || !clock || !this.hass || this._saving) return;
    const data = { time: draft.time, days: draft.days, label: draft.label.trim(), enabled: true };
    this._saving = true;
    try {
      if (draft.entityId) {
        await this.hass.callService(DOMAIN, "update_alarm", data, { entity_id: draft.entityId });
      } else {
        await this.hass.callService(DOMAIN, "create_alarm", {
          ...data,
          config_entry_id: clock.entryId,
        });
      }
      this._draft = undefined;
    } catch (err) {
      this._toast(this._t("failed", { error: (err as Error).message ?? String(err) }));
    } finally {
      this._saving = false;
    }
  };

  private async _delete(alarm: Alarm) {
    const hass = this.hass!;
    const entryId = this._clock!.entryId;
    try {
      await hass.callService(DOMAIN, "delete_alarm", {}, { entity_id: alarm.entityId });
    } catch (err) {
      this._toast(this._t("failed", { error: (err as Error).message ?? String(err) }));
      return;
    }
    this._draft = undefined;
    this._toast(this._t("deleted"), {
      text: this._t("undo"),
      action: () =>
        hass.callService(DOMAIN, "create_alarm", {
          config_entry_id: entryId,
          time: alarm.time,
          days: alarm.days,
          label: alarm.label,
          enabled: alarm.enabled,
        }),
    });
  }

  private async _toggle(alarm: Alarm, on: boolean) {
    this._optimistic = { ...this._optimistic, [alarm.entityId]: on };
    try {
      await this.hass!.callService("switch", on ? "turn_on" : "turn_off", {}, {
        entity_id: alarm.entityId,
      });
    } catch (err) {
      const { [alarm.entityId]: _dropped, ...rest } = this._optimistic;
      this._optimistic = rest;
      this._toast(this._t("failed", { error: (err as Error).message ?? String(err) }));
    }
  }

  private _choiceKeydown = (ev: KeyboardEvent) => {
    if (ev.key === "Escape") this._stopChoice = false;
  };

  private async _stop(clock: Clock, action: string) {
    this._stopChoice = false;
    try {
      await this.hass!.callService(DOMAIN, "stop", { config_entry_id: clock.entryId, action });
    } catch (err) {
      this._toast(this._t("failed", { error: (err as Error).message ?? String(err) }));
    }
  }

  private _press(entityId: string) {
    this.hass!.callService("button", "press", {}, { entity_id: entityId }).catch((err) =>
      this._toast(this._t("failed", { error: (err as Error).message ?? String(err) })),
    );
  }

  private _navigate(path: string) {
    history.pushState(null, "", path);
    fire(window, "location-changed", { replace: false });
  }

  private _toast(message: string, action?: { text: string; action: () => unknown }) {
    fire(this, "hass-notification", { message, action, duration: action ? 8000 : 4000 });
  }
}

if (!customElements.get(CARD_TYPE)) {
  customElements.define(CARD_TYPE, DaytimeAlarmCard);
}

const registry = window as unknown as { customCards?: Array<Record<string, unknown>> };
registry.customCards = registry.customCards ?? [];
if (!registry.customCards.some((card) => card.type === CARD_TYPE)) {
  registry.customCards.push({
    type: CARD_TYPE,
    name: "Daytime Alarm",
    // A getter: the card picker reads it when it opens, once Home Assistant knows the
    // user's language (so searching "Wecker" finds the card, too).
    get description() {
      const root = document.querySelector("home-assistant") as { hass?: HomeAssistant } | null;
      return localize(root?.hass, "picker_description");
    },
    preview: true,
    documentationURL: "https://github.com/trittler/ha-daytime-alarm",
  });
}
