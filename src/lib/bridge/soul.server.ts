import { lookupSoul } from "@/lib/auth/hollow-soul.server";
import { getSql } from "@/lib/db";
import { lookupRider } from "@/lib/auth/discord-riders.server";
import { relevantMemories } from "./memory.server";
import { recentEventsFor } from "./events.server";

export type SoulSummary = {
  linked: boolean;
  status: "UNLINKED" | "LINKED" | "NEEDS INITIAL CHARACTER" | "ACTIVE";
  discordId: string;
  handle: string | null;
  displayName: string | null;
  playerName: string | null;
  character: { name: string; classKey: string; hp: number; maxHp: number; status: string } | null;
  campaign: string;
  caps: number;
  xp: number;
  level: number;
  region: string | null;
  bosses: string[];
  inventory: string[];
  memories: number;
  open: string;
};

const CAMPAIGN = "moon-squad";

export async function soulSummary(discordId: string, origin = "https://thehollowrealm.com"): Promise<SoulSummary> {
  const rider = await lookupRider(discordId);
  const soul = await lookupSoul(discordId);
  let caps = 0;
  let xp = 0;
  let level = 1;
  try {
    const sql = await getSql();
    const rows = await sql<{ card_caps: number; xp: number; level: number }>`
      select card_caps, xp, level
      from hollow_campaign_member
      where discord_id = ${discordId} and campaign_id = ${CAMPAIGN}
      limit 1
    `;
    if (rows[0]) {
      caps = Number(rows[0].card_caps) || 0;
      xp = Number(rows[0].xp) || 0;
      level = Number(rows[0].level) || 1;
    }
  } catch {
    /* member row is optional on a fresh file */
  }
  const memories = await relevantMemories({ discordId, limit: 12 }).catch(() => []);
  const linked = !!rider || !!soul;
  const character = soul?.operative
    ? {
        name: soul.operative.name,
        classKey: soul.operative.cls,
        hp: soul.operative.hp,
        maxHp: soul.operative.maxHp,
        status: soul.operative.status,
      }
    : null;
  const status: SoulSummary["status"] = !linked
    ? "UNLINKED"
    : character
      ? "ACTIVE"
      : "NEEDS INITIAL CHARACTER";
  return {
    linked,
    status,
    discordId,
    handle: rider?.handle ?? null,
    displayName: rider?.name ?? soul?.operative.name ?? null,
    playerName: soul?.operative.name ?? rider?.name ?? null,
    character,
    campaign: CAMPAIGN,
    caps,
    xp,
    level,
    region: null,
    bosses: [],
    inventory: [],
    memories: memories.length,
    open: origin,
  };
}

export async function tyroneContext(discordId: string, query?: string) {
  const soul = await soulSummary(discordId);
  const memories = await relevantMemories({ discordId, query, limit: 6 });
  const events = await recentEventsFor(discordId, 6).catch(() => []);
  const facts: { key: string; value: string }[] = [];
  if (soul.playerName) facts.push({ key: "name", value: soul.playerName });
  if (soul.handle) facts.push({ key: "handle", value: `@${soul.handle.replace(/^@/, "")}` });
  if (soul.character) {
    facts.push({ key: "character", value: soul.character.name });
    facts.push({ key: "class", value: soul.character.classKey });
    facts.push({ key: "status", value: soul.character.status });
  }
  facts.push({ key: "campaign", value: "Moon Squad" });
  facts.push({ key: "caps", value: String(soul.caps) });
  facts.push({ key: "xp", value: String(soul.xp) });
  facts.push({ key: "level", value: String(soul.level) });
  facts.push({ key: "link", value: soul.status });
  for (const mem of memories) facts.push({ key: `memory.${mem.kind}`, value: mem.claim });
  const unknown: string[] = [];
  if (!soul.character) unknown.push("character");
  if (!soul.region) unknown.push("region");
  if (!soul.inventory.length) unknown.push("inventory");
  if (!soul.bosses.length) unknown.push("bosses");
  return {
    soul,
    facts,
    unknown,
    memories: memories.map((row) => ({
      id: row.id,
      kind: row.kind,
      claim: row.claim,
      importance: row.importance,
      source: row.source,
      at: row.created_at,
    })),
    events: events.map((row) => ({
      type: row.event_type,
      visibility: row.visibility,
      at: row.created_at,
      payload: row.payload,
    })),
    rule: "Only state values present in facts. If a key is missing, say you do not have that information. Do not invent inventory, deaths, bosses, caps, or promises.",
  };
}
