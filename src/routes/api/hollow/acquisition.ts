import { createFileRoute } from "@tanstack/react-router";
import { createHash, randomBytes } from "node:crypto";
import { getSql } from "@/lib/db";
import { hollowVerifiedUser } from "@/lib/hollow-identity.server";
import {
  authorityTemplate,
  npcVendorOffer,
  starterAuthorityTemplates,
} from "@/game/authority-items";
import { LEDGER_POOLS } from "@/game/data";
import type { ClassName, ShopOffer } from "@/game/types";

const CAMPAIGN_ID = "moon-squad";
const CLASSES: ClassName[] = ["Warrior", "Wizard", "Rogue", "Healer", "Merchant", "Bard"];
const TIERS = ["bargain", "essential", "artifact"] as const;
type Tier = (typeof TIERS)[number];
const HEADERS: Record<string, string> = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: HEADERS });
}

async function verifiedUser(request?: Request) {
  return hollowVerifiedUser(request);
}

async function linked(userId: string) {
  const sql = await getSql();
  const rows = await sql<{ ok: boolean }>`
    select exists(
      select 1 from hollow_campaign_member
      where campaign_id=${CAMPAIGN_ID} and user_id=${userId}
    ) as ok
  `;
  return !!rows[0]?.ok;
}

function cleanRequestId(raw: unknown) {
  const value = String(raw ?? "").trim();
  return /^[A-Za-z0-9._:-]{12,96}$/.test(value) ? value : null;
}

function cleanResidentId(raw: unknown) {
  const value = String(raw ?? "").trim();
  return /^[A-Za-z0-9._:-]{2,96}$/.test(value) ? value : null;
}

function cleanName(raw: unknown) {
  const value = String(raw ?? "").trim().replace(/\s+/g, " ").slice(0, 64);
  return value.length ? value : null;
}

function cleanClass(raw: unknown): ClassName | null {
  const value = String(raw ?? "").trim() as ClassName;
  return CLASSES.includes(value) ? value : null;
}

function cleanTier(raw: unknown): Tier | null {
  const value = String(raw ?? "").trim() as Tier;
  return TIERS.includes(value) ? value : null;
}

function deterministicOffer(day: number, tier: Tier): ShopOffer {
  const pool = LEDGER_POOLS[tier];
  const digest = createHash("sha256").update(`${CAMPAIGN_ID}:${day}:${tier}`).digest();
  const index = digest.readUInt32BE(0) % pool.length;
  return pool[index]!;
}

async function campaignRow() {
  const sql = await getSql();
  const rows = await sql<{
    campaign_day: number;
    vault_caps: number;
    hollow_ore: number;
    rooms: Record<string, number>;
  }>`
    select campaign_day, vault_caps, hollow_ore, rooms
    from hollow_campaign_state
    where campaign_id=${CAMPAIGN_ID}
    limit 1
  `;
  return rows[0] ?? null;
}

async function exchangeSnapshot(userId: string) {
  const state = await campaignRow();
  if (!state) throw new Error("Vault 13 campaign ledger unavailable.");
  const day = Math.max(1, Number(state.campaign_day || 1));
  const sql = await getSql();
  const boughtRows = await sql<{ tier: Tier }>`
    select tier
    from hollow_exchange_purchase
    where campaign_id=${CAMPAIGN_ID} and user_id=${userId} and campaign_day=${day}
  `;
  const boughtSet = new Set(boughtRows.map((row) => row.tier));
  return {
    day,
    bargain: deterministicOffer(day, "bargain"),
    essential: deterministicOffer(day, "essential"),
    artifact: deterministicOffer(day, "artifact"),
    bought: {
      bargain: boughtSet.has("bargain"),
      essential: boughtSet.has("essential"),
      artifact: boughtSet.has("artifact"),
    },
    ledgerTier: Math.max(0, Number(state.rooms?.ledger ?? 0)),
  };
}

async function snapshot(userId: string, extras: Record<string, unknown> = {}) {
  const state = await campaignRow();
  if (!state) throw new Error("Vault 13 campaign ledger unavailable.");
  return {
    authority: "server" as const,
    campaignId: CAMPAIGN_ID,
    treasury: {
      caps: Math.max(0, Number(state.vault_caps || 0)),
      ore: Math.max(0, Number(state.hollow_ore || 0)),
    },
    exchange: await exchangeSnapshot(userId),
    ...extras,
  };
}

function acquisitionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (/resident_roster_full/i.test(message)) return json({ error: "Resident Quarters are full. Expand the barracks before forging another resident." }, 409);
  if (/resident_forge_insufficient_caps/i.test(message)) return json({ error: "Vault 13 does not have enough caps to forge that resident." }, 409);
  if (/resident_id_owned/i.test(message)) return json({ error: "That resident serial belongs to another rider." }, 409);
  if (/exchange_insufficient_caps|vendor_insufficient_caps/i.test(message)) return json({ error: "Vault 13 does not have enough caps for that purchase." }, 409);
  if (/broker_resident_required/i.test(message)) return json({ error: "Broker supply requires your sealed Broker resident." }, 409);
  return json({ error: "Tyrone could not settle that acquisition." }, 409);
}

async function forgeResident(
  userId: string,
  residentId: string,
  name: string,
  cls: ClassName,
  race: string,
) {
  const starters = starterAuthorityTemplates(cls, race);
  if (!starters.length) return { error: "Unknown Hollow Realm race or starter loadout.", status: 400 as const };
  const rows = starters.map((template, index) => ({
    instance_id: randomBytes(18).toString("hex"),
    template_key: template.key,
    equipped: index === 0 && template.slot === "weapon",
    source_event: `forge:${userId}:${residentId}:${index}`,
  }));
  const payload = JSON.stringify(rows);
  const sql = await getSql();
  const result = await sql<{
    ok: boolean;
    duplicate: boolean;
    forge_cost: number;
    roster_count: number;
    roster_cap: number;
  }>`
    select * from hollow_forge_resident(
      ${userId}, ${residentId}, ${name}, ${cls}, ${race}, ${payload}::jsonb
    )
  `;
  const receipt = result[0];
  return {
    duplicate: !!receipt?.duplicate,
    cost: Math.max(0, Number(receipt?.forge_cost ?? 0)),
    rosterCount: Math.max(0, Number(receipt?.roster_count ?? 0)),
    rosterCap: Math.max(0, Number(receipt?.roster_cap ?? 0)),
  };
}

async function buyExchange(userId: string, tier: Tier) {
  const state = await campaignRow();
  if (!state) return { error: "Vault 13 campaign ledger unavailable.", status: 503 as const };
  const day = Math.max(1, Number(state.campaign_day || 1));
  const offer = deterministicOffer(day, tier);
  const ledgerTier = Math.max(0, Number(state.rooms?.ledger ?? 0));
  const price = Math.round(offer.price * (ledgerTier >= 3 ? 0.85 : 1));
  const template = authorityTemplate(offer.kind, offer.name);
  if (!template) return { error: "Exchange item is not in the authoritative catalogue.", status: 500 as const };
  const instanceId = randomBytes(18).toString("hex");
  const sourceEvent = `exchange:${userId}:${day}:${tier}`;
  const oreUnits = offer.name === "Hollow Ore x2" ? 2 : 0;
  const sql = await getSql();
  const result = await sql<{ ok: boolean; duplicate: boolean }>`
    select * from hollow_buy_exchange(
      ${userId}, ${day}, ${tier}, ${price}, ${offer.name}, ${instanceId},
      ${template.key}, ${sourceEvent}, ${oreUnits}
    )
  `;
  return {
    duplicate: !!result[0]?.duplicate,
    name: offer.name,
    price,
    oreUnits,
  };
}

async function buyVendor(userId: string, requestId: string, name: string) {
  const offer = npcVendorOffer(name);
  if (!offer) return { error: "That vendor item does not exist in the authoritative catalogue.", status: 404 as const };
  const template = authorityTemplate(offer.kind, offer.name);
  if (!template) return { error: "Vendor item template unavailable.", status: 500 as const };
  const instanceId = randomBytes(18).toString("hex");
  const sourceEvent = `vendor:${userId}:${requestId}`;
  const sql = await getSql();
  const result = await sql<{ ok: boolean; duplicate: boolean }>`
    select * from hollow_buy_vendor(
      ${userId}, ${offer.price}, ${instanceId}, ${template.key}, ${sourceEvent}, ${Math.max(0, offer.oreUnits ?? 0)}
    )
  `;
  return {
    duplicate: !!result[0]?.duplicate,
    name: offer.name,
    price: offer.price,
    oreUnits: Math.max(0, offer.oreUnits ?? 0),
  };
}

async function grantBrokerSupply(userId: string, residentId: string) {
  const state = await campaignRow();
  if (!state) return { error: "Vault 13 campaign ledger unavailable.", status: 503 as const };
  const template = authorityTemplate("consumable", "Contact's Vial");
  if (!template) return { error: "Broker supply template unavailable.", status: 500 as const };
  const day = Math.max(1, Number(state.campaign_day || 1));
  const instanceId = randomBytes(18).toString("hex");
  const sourceEvent = `broker:${userId}:${residentId}:${day}`;
  const sql = await getSql();
  const result = await sql<{ ok: boolean; duplicate: boolean }>`
    select * from hollow_grant_broker_supply(
      ${userId}, ${residentId}, ${instanceId}, ${template.key}, ${sourceEvent}
    )
  `;
  return { duplicate: !!result[0]?.duplicate, name: template.name };
}

export const Route = createFileRoute("/api/hollow/acquisition")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const identity = await verifiedUser(request);
        if (identity.response) return identity.response;
        if (!(await linked(identity.userId!))) return json({ error: "Link TyroneBot before using Vault 13 acquisition." }, 404);
        try {
          return json(await snapshot(identity.userId!));
        } catch (error) {
          return acquisitionError(error);
        }
      },
      POST: async ({ request }) => {
        const identity = await verifiedUser(request);
        if (identity.response) return identity.response;
        const userId = identity.userId!;
        if (!(await linked(userId))) return json({ error: "Link TyroneBot before using Vault 13 acquisition." }, 404);

        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return json({ error: "bad json" }, 400);
        }

        const command = String(body.command ?? "").trim();
        try {
          if (command === "forge_resident") {
            const residentId = cleanResidentId(body.residentId);
            const name = cleanName(body.name);
            const cls = cleanClass(body.cls);
            const race = cleanName(body.race);
            if (!residentId || !name || !cls || !race) return json({ error: "invalid resident forge payload" }, 400);
            const forge = await forgeResident(userId, residentId, name, cls, race);
            if ("error" in forge) return json({ error: forge.error }, forge.status);
            return json(await snapshot(userId, { forge }));
          }

          if (command === "buy_exchange") {
            const tier = cleanTier(body.tier);
            if (!tier) return json({ error: "invalid exchange tier" }, 400);
            const purchase = await buyExchange(userId, tier);
            if ("error" in purchase) return json({ error: purchase.error }, purchase.status);
            return json(await snapshot(userId, { purchase }));
          }

          if (command === "buy_vendor") {
            const requestId = cleanRequestId(body.requestId);
            const name = cleanName(body.name);
            if (!requestId || !name) return json({ error: "invalid vendor purchase" }, 400);
            const purchase = await buyVendor(userId, requestId, name);
            if ("error" in purchase) return json({ error: purchase.error }, purchase.status);
            return json(await snapshot(userId, { purchase }));
          }

          if (command === "grant_broker_supply") {
            const residentId = cleanResidentId(body.residentId);
            if (!residentId) return json({ error: "invalid Broker resident" }, 400);
            const supply = await grantBrokerSupply(userId, residentId);
            if ("error" in supply) return json({ error: supply.error }, supply.status);
            return json(await snapshot(userId, { supply }));
          }

          return json({ error: "unknown acquisition command" }, 400);
        } catch (error) {
          return acquisitionError(error);
        }
      },
    },
  },
});
