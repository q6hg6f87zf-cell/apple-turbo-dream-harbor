import { lookupSoul } from "@/lib/auth/hollow-soul.server";
import { getSql } from "@/lib/db";
import { lookupRider } from "@/lib/auth/discord-riders.server";
import { relevantMemories } from "./memory.server";

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
