#!/usr/bin/env sh
# Run the integration tests in a throwaway Python 3.14 container.
# The harness (pytest-homeassistant-custom-component) pins an exact HA release;
# 0.13.375 is the newest and ships HA 2026.10.4. Bump it once a 2026.11 build exists.
set -e
cd "$(dirname "$0")/.."
NAME=daytime-alarm-test
HARNESS=pytest-homeassistant-custom-component==0.13.375

if ! docker inspect "$NAME" >/dev/null 2>&1; then
  docker run -d --name "$NAME" -v "$PWD:/work" -w /work python:3.14-slim sleep infinity >/dev/null
  docker exec "$NAME" pip install -q "$HARNESS" ruff
fi
docker start "$NAME" >/dev/null
docker exec "$NAME" sh -c "ruff check --no-cache --select E,F,W,B,UP,SIM,PL,RUF --ignore PLR0913,PLR2004,PLR0912,E501,RUF012 custom_components tests && ruff format --no-cache --check custom_components tests && python -m pytest -q -p no:cacheprovider $*; rc=\$?; find /work -name __pycache__ -prune -exec rm -rf {} +; exit \$rc"
