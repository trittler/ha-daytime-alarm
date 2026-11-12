# Environments

## dev (local Docker)

A throwaway Home Assistant for developing the integration and the card.

- **Image:** `ghcr.io/home-assistant/home-assistant:2026.11.1` (newest stable as of 2026-11-12)
- **Compose file:** `dev/docker-compose.yml`, container `daytime-alarm-ha`
- **URL:** http://localhost:8124 (host port 8124 → container 8123)
- **Config:** `dev/config/` (only `configuration.yaml` is tracked; HA writes the rest as root).
  The integration is bind-mounted from `custom_components/daytime_alarm`.
- **Login:** user `dev`; password and a refresh token live in `dev/.dev-credentials`
  (gitignored, created by `dev/onboard.py`).
- **Time zone / language:** Europe/Berlin, German.
- **Test devices:** the `demo` integration (RGBWW, RGBW, HS + color temperature lights,
  `switch.decorative_lights`, `switch.ac`) plus template lights `light.nightstand`
  (brightness only), `light.fairy_lights` (on/off only) and `input_boolean.coffee_machine`.
- **Dashboard:** "Wecker" at `/dashboard-wecker/wecker` (storage mode) with the card.
- **Wake-up light:** config entry "Schlafzimmer" (`switch.schlafzimmer_alarm_*`, …).

### Commands

```sh
cd dev && docker compose up -d          # start
python3 dev/onboard.py                  # first start only: create user, write .dev-credentials
docker restart daytime-alarm-ha         # after Python changes
(cd card && npm run build)              # after card changes, then reload the browser
docker logs -f daytime-alarm-ha         # logs (daytime_alarm logs at debug level)
node dev/ha.mjs rest GET /api/states/sensor.schlafzimmer_nachster_wecker
node dev/ha.mjs ws '{"type":"config/core/update","time_zone":"Europe/Berlin"}'
cd dev && docker compose down           # stop
```

### Gotchas

- Lovelace dashboard URL paths must contain a hyphen (`dashboard-wecker`, not `wecker`).
- The 2026.11 frontend ignores injected `hassTokens` (it uses PKCE); browser automation has
  to log in through the login form.
- Demo lights reset to their defaults when HA restarts.

## tests (local Docker)

`dev/test.sh` creates/uses container `daytime-alarm-test` (`python:3.14-slim`, repo mounted at
`/work`) and runs ruff + pytest. The harness `pytest-homeassistant-custom-component==0.13.375`
pins HA **2026.10.4**: no harness for 2026.11 existed yet on 2026-11-12, and the 2026.10 harness
does not run against HA 2026.11 (httpx2 switch, logger internals). 2026.11.1 behaviour is
checked end to end on the dev instance.

## GitHub / HACS (distribution)

- **Repo:** https://github.com/trittler/ha-daytime-alarm (public). Push over SSH
  (`git@github.com:trittler/ha-daytime-alarm.git`; the local SSH key authenticates as `trittler`).
- **GitHub CLI:** `~/.local/bin/gh` (installed 2026-11-12 from the official release, checksum
  verified). Log in with `gh auth login`; the token lives in gh's own config, not in this repo.
- **Install in HA:** the "Open in HACS" button in the README (My Home Assistant link
  `hacs_repository?owner=trittler&repository=ha-daytime-alarm&category=integration`).
- **Release:** bump `version` in `custom_components/daytime_alarm/manifest.json` (and
  `card/package.json`), `cd card && npm run build`, commit, push, then
  `gh release create vX.Y.Z --generate-notes`. HACS offers GitHub releases as updates.
- **CI:** `.github/workflows/validate.yml`: hassfest, HACS validation, ruff + pytest, and a
  check that the committed card bundle matches `card/src`.

## prod

Not set up yet: the user's own Home Assistant instance (host, access, install method) is unknown.
