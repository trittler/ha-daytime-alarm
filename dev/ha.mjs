// Tiny client for the local dev Home Assistant (uses dev/.dev-credentials).
//   node dev/ha.mjs rest GET /api/states/sensor.x
//   node dev/ha.mjs rest POST /api/services/light/turn_on '{"entity_id":"light.bed_light"}'
//   node dev/ha.mjs ws '{"type":"config/core/update","time_zone":"Europe/Berlin"}'
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const creds = JSON.parse(
  readFileSync(fileURLToPath(new URL(".dev-credentials", import.meta.url)), "utf8"),
);

export async function accessToken() {
  const res = await fetch(`${creds.url}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: creds.refresh_token,
      client_id: `${creds.url}/`,
    }),
  });
  return (await res.json()).access_token;
}

export async function rest(method, path, body) {
  const token = await accessToken();
  const res = await fetch(`${creds.url}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

export async function ws(...messages) {
  const token = await accessToken();
  const socket = new WebSocket(`${creds.url.replace(/^http/, "ws")}/api/websocket`);
  const results = [];
  let id = 0;
  return new Promise((resolve, reject) => {
    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "auth_required") socket.send(JSON.stringify({ type: "auth", access_token: token }));
      else if (msg.type === "auth_ok") send();
      else if (msg.type === "auth_invalid") reject(new Error(msg.message));
      else if (msg.type === "result") {
        results.push(msg.success ? msg.result : { error: msg.error });
        send();
      }
    };
    socket.onerror = reject;
    function send() {
      if (results.length === messages.length) {
        socket.close();
        resolve(results);
        return;
      }
      socket.send(JSON.stringify({ id: ++id, ...messages[results.length] }));
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [kind, ...args] = process.argv.slice(2);
  const out =
    kind === "rest"
      ? await rest(args[0], args[1], args[2] ? JSON.parse(args[2]) : undefined)
      : await ws(...args.map((arg) => JSON.parse(arg)));
  console.log(JSON.stringify(out, null, 2));
}
