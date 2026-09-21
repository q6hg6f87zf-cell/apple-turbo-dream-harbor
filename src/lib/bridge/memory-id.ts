import { createHash } from "node:crypto";

export function sanitizeClaim(raw: unknown) {
  return String(raw ?? "")
    .replace(/[\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 480);
}

export function memoryId(discordId: string, kind: string, claim: string) {
  return `mem-${createHash("sha256").update(`${discordId}:${kind}:${claim}`).digest("hex").slice(0, 20)}`;
}
