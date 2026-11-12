import { css } from "lit";

export const cardStyles = css`
  :host {
    --da-accent: var(--daytime-alarm-accent-color, var(--orange-color, #ff9800));
    --da-tile: var(
      --daytime-alarm-tile-color,
      color-mix(in srgb, var(--primary-text-color) 5%, transparent)
    );
    --da-tile-strong: color-mix(in srgb, var(--primary-text-color) 9%, transparent);
    --da-radius: var(--daytime-alarm-tile-radius, 20px);
    --da-on-primary: var(--text-primary-color, #fff);
    --da-ease: cubic-bezier(0.2, 0, 0, 1);
  }

  ha-card {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow: hidden;
    height: 100%;
    box-sizing: border-box;
  }

  ha-icon {
    --mdc-icon-size: 20px;
    --ha-icon-size: 20px;
    display: inline-flex;
  }

  button {
    font: inherit;
    -webkit-tap-highlight-color: transparent;
  }

  /* Header ---------------------------------------------------------------- */

  .header {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 40px;
  }

  .header-icon {
    flex: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    color: var(--da-accent);
    background: color-mix(in srgb, var(--da-accent) 18%, transparent);
  }

  .header-icon ha-icon {
    --mdc-icon-size: 22px;
    --ha-icon-size: 22px;
  }

  .header-text {
    flex: 1;
    min-width: 0;
  }

  .title {
    font-size: var(--ha-font-size-l, 1.125rem);
    font-weight: var(--ha-font-weight-medium, 500);
    line-height: 1.3;
    color: var(--primary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .subtitle {
    font-size: var(--ha-font-size-s, 0.8125rem);
    line-height: 1.4;
    color: var(--secondary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .subtitle strong {
    color: var(--primary-text-color);
    font-weight: var(--ha-font-weight-medium, 500);
  }

  /* Buttons ---------------------------------------------------------------- */

  .icon-btn,
  .btn,
  .switch,
  .day,
  .chip,
  .alarm-body {
    appearance: none;
    border: none;
    margin: 0;
    background: none;
    color: inherit;
    cursor: pointer;
    outline: none;
  }

  .icon-btn {
    flex: none;
    width: 40px;
    height: 40px;
    padding: 0;
    border-radius: 50%;
    display: grid;
    place-items: center;
    color: var(--secondary-text-color);
    transition: background-color 0.2s;
  }

  .icon-btn:hover {
    background: var(--da-tile);
  }

  .icon-btn.add {
    border-radius: 14px;
    color: var(--da-on-primary);
    background: var(--primary-color);
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.2);
  }

  .icon-btn.add:hover {
    background: color-mix(in srgb, var(--primary-color) 88%, var(--da-on-primary));
  }

  .btn {
    height: 40px;
    padding: 0 16px;
    border-radius: 20px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: var(--ha-font-size-m, 0.875rem);
    font-weight: var(--ha-font-weight-medium, 500);
    letter-spacing: 0.01em;
    white-space: nowrap;
    transition:
      background-color 0.2s,
      opacity 0.2s;
  }

  .btn ha-icon {
    --mdc-icon-size: 18px;
    --ha-icon-size: 18px;
  }

  .btn.filled {
    padding: 0 24px;
    color: var(--da-on-primary);
    background: var(--primary-color);
  }

  .btn.filled:hover {
    background: color-mix(in srgb, var(--primary-color) 88%, var(--da-on-primary));
  }

  .btn.text {
    color: var(--primary-color);
  }

  .btn.text:hover {
    background: color-mix(in srgb, var(--primary-color) 10%, transparent);
  }

  .btn.danger {
    color: var(--error-color, #db4437);
  }

  .btn.danger:hover {
    background: color-mix(in srgb, var(--error-color, #db4437) 10%, transparent);
  }

  .btn[disabled] {
    opacity: 0.5;
    pointer-events: none;
  }

  .icon-btn:focus-visible,
  .btn:focus-visible,
  .switch:focus-visible,
  .day:focus-visible,
  .chip:focus-visible,
  .alarm-body:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  /* Sunrise banner ---------------------------------------------------------- */

  .banner {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 14px 14px 18px;
    border-radius: var(--da-radius);
    color: #fff;
    background: linear-gradient(
      100deg,
      #1e1b4b 0%,
      #581c87 22%,
      #be123c 45%,
      #ea580c 68%,
      #f59e0b 100%
    );
    background-size: 300% 100%;
    background-position: var(--sunrise-position, 0%) 0;
    transition: background-position 2s linear;
    animation: rise 0.35s var(--da-ease);
  }

  .banner > ha-icon {
    --mdc-icon-size: 28px;
    --ha-icon-size: 28px;
    flex: none;
    filter: drop-shadow(0 0 8px rgb(255 220 150 / 0.8));
  }

  .banner-text {
    flex: 1;
    min-width: 0;
    text-shadow: 0 1px 2px rgb(0 0 0 / 0.25);
  }

  .banner-title {
    font-weight: var(--ha-font-weight-medium, 500);
    font-variant-numeric: tabular-nums;
  }

  .banner-sub {
    font-size: var(--ha-font-size-s, 0.8125rem);
    opacity: 0.85;
  }

  .bar {
    height: 4px;
    margin-top: 8px;
    border-radius: 2px;
    overflow: hidden;
    background: rgb(255 255 255 / 0.28);
  }

  .bar > div {
    height: 100%;
    border-radius: 2px;
    background: #fff;
    transition: width 1s linear;
  }

  .banner.choosing {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 12px 12px 14px 18px;
    animation: none;
  }

  .choice-head {
    display: flex;
    align-items: center;
    gap: 8px;
    text-shadow: 0 1px 2px rgb(0 0 0 / 0.25);
  }

  .choice-head .banner-title {
    flex: 1;
  }

  .choice-head .icon-btn {
    width: 36px;
    height: 36px;
    color: #fff;
  }

  .choice-head .icon-btn:hover {
    background: rgb(255 255 255 / 0.18);
  }

  .choices {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin-inline-end: 6px;
    animation: rise 0.25s var(--da-ease);
  }

  .choice {
    appearance: none;
    border: none;
    margin: 0;
    cursor: pointer;
    min-height: 76px;
    padding: 10px 6px;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: var(--ha-font-size-s, 0.8125rem);
    font-weight: var(--ha-font-weight-medium, 500);
    line-height: 1.25;
    text-align: center;
    color: #7c2d12;
    background: rgb(255 255 255 / 0.92);
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.18);
    transition:
      background-color 0.2s,
      transform 0.15s;
  }

  .choice ha-icon {
    --mdc-icon-size: 24px;
    --ha-icon-size: 24px;
    color: #c2410c;
  }

  .choice:hover {
    background: #fff;
  }

  .choice:active {
    transform: scale(0.96);
  }

  .choice:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 2px;
  }

  .banner .btn {
    color: #9a3412;
    background: #fff;
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.2);
  }

  .banner .btn:hover {
    background: #fff7ed;
  }

  /* Alarm tiles ------------------------------------------------------------- */

  .alarms {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .alarm {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px 14px 20px;
    border-radius: var(--da-radius);
    background: var(--da-tile);
    transition:
      background-color 0.2s,
      box-shadow 0.3s;
  }

  .alarm:hover {
    background: var(--da-tile-strong);
  }

  .alarm.active {
    box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--da-accent) 70%, transparent);
    background: linear-gradient(
      120deg,
      color-mix(in srgb, var(--da-accent) 16%, transparent),
      var(--da-tile) 70%
    );
  }

  .alarm-body {
    flex: 1;
    min-width: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    text-align: start;
    border-radius: 12px;
  }

  .meta {
    max-width: 100%;
    display: flex;
    gap: 8px;
    font-size: var(--ha-font-size-m, 0.875rem);
    line-height: 1.4;
    color: var(--secondary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .meta .label {
    color: var(--primary-text-color);
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .time {
    font-size: 2.75rem;
    font-weight: 300;
    line-height: 1.15;
    letter-spacing: -0.01em;
    font-variant-numeric: tabular-nums;
    color: var(--primary-text-color);
    transition: color 0.2s;
  }

  .time .suffix {
    margin-inline-start: 6px;
    font-size: 1rem;
    font-weight: 400;
    letter-spacing: 0;
    color: var(--secondary-text-color);
  }

  .alarm.off .time {
    color: var(--secondary-text-color);
  }

  .alarm.off .meta .label {
    color: var(--secondary-text-color);
  }

  .hint {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--ha-font-size-s, 0.8125rem);
    /* Pull the accent towards the text color so it stays readable on light themes. */
    color: color-mix(in srgb, var(--da-accent) 78%, var(--primary-text-color));
  }

  .hint.muted {
    color: var(--secondary-text-color);
  }

  .hint ha-icon {
    --mdc-icon-size: 16px;
    --ha-icon-size: 16px;
  }

  /* Switch (Material 3 style) ---------------------------------------------- */

  .switch {
    flex: none;
    position: relative;
    width: 52px;
    height: 32px;
    padding: 0;
    border-radius: 16px;
    box-sizing: border-box;
    border: 2px solid var(--secondary-text-color);
    background: color-mix(in srgb, var(--primary-text-color) 6%, transparent);
    transition:
      background-color 0.2s,
      border-color 0.2s;
  }

  .switch::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 6px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--secondary-text-color);
    transform: translateY(-50%);
    transition:
      left 0.25s var(--da-ease),
      width 0.25s var(--da-ease),
      height 0.25s var(--da-ease),
      background-color 0.2s;
  }

  .switch:active::after {
    width: 28px;
    height: 28px;
    left: 0;
  }

  .switch[aria-checked="true"] {
    border-color: var(--primary-color);
    background: var(--primary-color);
  }

  .switch[aria-checked="true"]::after {
    left: 22px;
    width: 24px;
    height: 24px;
    background: var(--da-on-primary);
  }

  .switch[aria-checked="true"]:active::after {
    left: 18px;
    width: 28px;
    height: 28px;
  }

  /* Editor ------------------------------------------------------------------ */

  .editor {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px 16px 12px 20px;
    border-radius: var(--da-radius);
    background: var(--da-tile-strong);
    animation: rise 0.25s var(--da-ease);
  }

  .editor-top {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .time-input {
    flex: 1;
    min-width: 0;
    padding: 0 0 2px;
    border: none;
    border-bottom: 2px solid transparent;
    border-radius: 0;
    outline: none;
    background: transparent;
    font-family: inherit;
    font-size: 3rem;
    font-weight: 400;
    line-height: 1.15;
    font-variant-numeric: tabular-nums;
    color: var(--primary-text-color);
    transition: border-color 0.2s;
  }

  .time-input:focus {
    border-bottom-color: var(--primary-color);
  }

  .time-input::-webkit-calendar-picker-indicator {
    width: 22px;
    height: 22px;
    padding: 9px;
    margin-inline-start: 4px;
    border-radius: 50%;
    opacity: 0.55;
    cursor: pointer;
    transition:
      opacity 0.2s,
      background-color 0.2s;
  }

  .time-input::-webkit-calendar-picker-indicator:hover {
    opacity: 0.9;
    background-color: var(--da-tile-strong);
  }

  .days {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 6px;
  }

  .day {
    justify-self: center;
    width: 100%;
    max-width: 44px;
    aspect-ratio: 1;
    padding: 0;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: var(--ha-font-size-m, 0.875rem);
    font-weight: var(--ha-font-weight-medium, 500);
    color: var(--primary-text-color);
    background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
    transition:
      background-color 0.2s,
      color 0.2s,
      transform 0.15s;
  }

  .day:active {
    transform: scale(0.92);
  }

  .day[aria-pressed="true"] {
    color: var(--da-on-primary);
    background: var(--primary-color);
  }

  .summary {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: -4px;
    font-size: var(--ha-font-size-s, 0.8125rem);
    color: var(--secondary-text-color);
  }

  .field {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 48px;
    padding: 0 14px;
    border-radius: 14px;
    color: var(--secondary-text-color);
    background: color-mix(in srgb, var(--primary-text-color) 6%, transparent);
    transition: box-shadow 0.2s;
  }

  .field:focus-within {
    box-shadow: inset 0 0 0 2px var(--primary-color);
  }

  .field input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    font: inherit;
    font-size: var(--ha-font-size-m, 0.875rem);
    color: var(--primary-text-color);
  }

  .field input::placeholder {
    color: var(--secondary-text-color);
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-inline-start: -8px;
  }

  .spacer {
    flex: 1;
  }

  /* Empty state --------------------------------------------------------------- */

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 20px 16px 12px;
    text-align: center;
  }

  .empty > ha-icon {
    --mdc-icon-size: 40px;
    --ha-icon-size: 40px;
    color: var(--da-accent);
    margin-bottom: 4px;
  }

  .empty-title {
    font-weight: var(--ha-font-weight-medium, 500);
    color: var(--primary-text-color);
  }

  .empty-text {
    max-width: 280px;
    font-size: var(--ha-font-size-s, 0.8125rem);
    color: var(--secondary-text-color);
    margin-bottom: 10px;
  }

  /* Footer -------------------------------------------------------------------- */

  .footer {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid var(--divider-color);
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .chip {
    max-width: 100%;
    height: 32px;
    padding: 0 12px 0 8px;
    border-radius: 16px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: var(--ha-font-size-s, 0.8125rem);
    color: var(--primary-text-color);
    background: var(--da-tile);
    transition: background-color 0.2s;
  }

  .chip:hover {
    background: var(--da-tile-strong);
  }

  .chip span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chip ha-icon {
    --mdc-icon-size: 18px;
    --ha-icon-size: 18px;
    color: var(--secondary-text-color);
    transition: color 0.3s;
  }

  .chip.on ha-icon {
    color: var(--chip-color, var(--state-light-active-color, #ffb300));
  }

  .chip.unavailable {
    opacity: 0.5;
  }

  .footer-row {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-inline-end: -8px;
    font-size: var(--ha-font-size-s, 0.8125rem);
    color: var(--secondary-text-color);
  }

  .footer-row .duration {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .footer-row .duration ha-icon {
    --mdc-icon-size: 16px;
    --ha-icon-size: 16px;
  }

  .warning {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    color: var(--secondary-text-color);
  }

  .warning strong {
    color: var(--primary-text-color);
  }

  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation: none !important;
      transition: none !important;
    }
  }
`;
