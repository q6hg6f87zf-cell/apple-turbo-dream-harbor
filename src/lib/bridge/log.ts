const SECRET_KEYS = /secret|token|authorization|cookie|password|bearer|api[_-]?key|write[_-]?key/i;

function redactValue(key: string, value: unknown): unknown {
  if (SECRET_KEYS.test(key)) return "[redacted]";
  if (key === "claim" || key === "text" || key === "note") {
    const s = String(value ?? "");
    return s.length > 48 ? `${s.slice(0, 48)}…` : s;
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = redactValue(k, v);
    return out;
  }
  return value;
}

export function bridgeLog(event: string, fields: Record<string, unknown> = {}) {
  const body: Record<string, unknown> = { src: "hollow-bridge", event, t: Date.now() };
  for (const [key, value] of Object.entries(fields)) body[key] = redactValue(key, value);
  console.info(JSON.stringify(body));
}
