"""Onboard the local dev Home Assistant (owner user, Berlin time zone, German locale).

Usage: python3 dev/onboard.py [base_url]
Writes the generated credentials and an access token to dev/.dev-credentials.
"""

from __future__ import annotations

import json
from pathlib import Path
import secrets
import sys
import urllib.parse
import urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8124"
CLIENT_ID = f"{BASE}/"
CREDENTIALS = Path(__file__).parent / ".dev-credentials"


def request(path: str, data: dict | None = None, token: str | None = None, form: bool = False):
    headers = {}
    body = None
    if data is not None:
        if form:
            body = urllib.parse.urlencode(data).encode()
            headers["Content-Type"] = "application/x-www-form-urlencoded"
        else:
            body = json.dumps(data).encode()
            headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE}{path}", data=body, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read() or b"null")


def main() -> None:
    password = secrets.token_urlsafe(12)
    user = request(
        "/api/onboarding/users",
        {
            "client_id": CLIENT_ID,
            "name": "Dev",
            "username": "dev",
            "password": password,
            "language": "de",
        },
    )
    tokens = request(
        "/auth/token",
        {"grant_type": "authorization_code", "code": user["auth_code"], "client_id": CLIENT_ID},
        form=True,
    )
    access = tokens["access_token"]
    request("/api/onboarding/core_config", {}, access)
    request("/api/onboarding/analytics", {}, access)
    request("/api/onboarding/integration", {"client_id": CLIENT_ID, "redirect_uri": f"{BASE}/?auth_callback=1"}, access)
    CREDENTIALS.write_text(
        json.dumps(
            {"url": BASE, "username": "dev", "password": password, "refresh_token": tokens["refresh_token"]},
            indent=2,
        )
    )
    print(f"Onboarded {BASE}; credentials in {CREDENTIALS}")


if __name__ == "__main__":
    main()
