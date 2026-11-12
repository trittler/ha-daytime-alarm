import { LitElement, html, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { localize, type StringKey } from "./localize";
import type { CardConfig, HomeAssistant } from "./types";

const SCHEMA = [
  { name: "entry_id", selector: { config_entry: { integration: "daytime_alarm" } } },
  { name: "title", selector: { text: {} } },
  { name: "show_devices", selector: { boolean: {} } },
];

const LABELS: Record<string, StringKey> = {
  entry_id: "editor_entry",
  title: "editor_title",
  show_devices: "editor_show_devices",
};

/** Visual card editor, built from Home Assistant's own form component. */
export class DaytimeAlarmCardEditor extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private _config?: CardConfig;

  setConfig(config: CardConfig): void {
    this._config = config;
  }

  protected render() {
    if (!this.hass || !this._config) return nothing;
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${{ show_devices: true, ...this._config }}
        .schema=${SCHEMA}
        .computeLabel=${(schema: { name: string }) => localize(this.hass, LABELS[schema.name])}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }

  private _valueChanged(ev: CustomEvent<{ value: CardConfig }>) {
    const config: Record<string, unknown> = { ...ev.detail.value };
    for (const key of ["entry_id", "title"]) {
      if (!config[key]) delete config[key];
    }
    if (config.show_devices === true) delete config.show_devices;
    this.dispatchEvent(
      new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }),
    );
  }
}

if (!customElements.get("daytime-alarm-card-editor")) {
  customElements.define("daytime-alarm-card-editor", DaytimeAlarmCardEditor);
}
