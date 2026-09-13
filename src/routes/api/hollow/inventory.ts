import { createFileRoute } from "@tanstack/react-router";
import { randomBytes, randomInt } from "node:crypto";
import { getSql } from "@/lib/db";
import { assertSameSiteRequest } from "@/lib/auth/isolation.server";
import { requireUserId } from "@/lib/auth/verify.server";
import {
  authorityTemplateByKey,
  itemFromAuthorityTemplate,
  legacyItemTemplate,
  SERVER_TREASURE_BY_REGION,
  type AuthorityItemTemplate,
} from "@/game/authority-items";
import type { Condition, ItemKind, MissionKind, RegionId } from "@/game/types";

const CAMPAIGN_ID = "moon-squad";
const HEADERS: Record<string, string> = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
const CONDITIONS: Condition[] = ["Pristine", "Worn", "Damaged", "Broken"];
const RARITY_RANK = { Common: 0, Uncommon: 1, Rare: 2, Legendary: 3, Mythic: 4, Cursed: 4 } as const;

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: HEADERS });
}

async function verifiedUser(): Promise<{ userId?: string; response?: Response }> {
  try {
    assertSameSiteRequest();
    return { userId: await requireUserId() };
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error && typeof error.status === "number" ? error.status : 503;
    return { response: json({ error: error instanceof Error ? error.message : "identity unavailable" }, status) };
  }
}

function cleanRequestId(raw: unknown) {
  const value = String(raw ?? "").trim();
  return /^[A-Za-z0-9._:-]{12,96}$/.test(value) ? value : null;
}
function cleanInstanceId(raw: unknown) {
  const value = String(raw ?? "").trim();
  return /^[a-f0-9]{24,64}$/i.test(value) ? value : null;
}
function cleanResidentId(raw: unknown) {
  const value = String(raw ?? "").trim();
  return /^[A-Za-z0-9._:-]{2,96}$/.test(value) ? value : null;
}

type ItemRow = {
  instance_id: string;
  template_key: string;
  owner_type: "vault" | "resident";
  owner_user_id: string | null;
  owner_resident_id: string | null;
  equipped: boolean;
  condition: Condition;
  enchantments: string[];
  source_event: string;
  discovered_day: number;
  revision: number;
};

type MigrationRow = { state: "started" | "complete"; accepted_count: number; rejected_count: number };

async function linked(userId: string) {
  const sql = await getSql();
  const rows = await sql<{ ok: boolean }>`
    select exists(
      select 1 from hollow_campaign_member where campaign_id = ${CAMPAIGN_ID} and user_id = ${userId}
    ) as ok
  `;
  return !!rows[0]?.ok;
}

async function readRows(userId: string) {
  const sql = await getSql();
  return sql<ItemRow>`
    select instance_id, template_key, owner_type, owner_user_id, owner_resident_id,
           equipped, condition, enchantments, source_event, discovered_day, revision
    from hollow_item_instance
    where campaign_id = ${CAMPAIGN_ID}
      and destroyed_at is null
      and (owner_type = 'vault' or owner_user_id = ${userId})
    order by created_at asc
  `;
}

async function migrationStatus(userId: string): Promise<MigrationRow | null> {
  const sql = await getSql();
  const rows = await sql<MigrationRow>`
    select state, accepted_count, rejected_count from hollow_inventory_migration where user_id = ${userId} limit 1
  `;
  return rows[0] ?? null;
}

function rowJson(row: ItemRow) {
  const template = authorityTemplateByKey(row.template_key);
  if (!template) return null;
  const enchantments = (row.enchantments ?? []).map(authorityTemplateByKey).filter((item): item is AuthorityItemTemplate => !!item);
  return {
    item: itemFromAuthorityTemplate(template, row.instance_id, {
      condition: row.condition,
      equipped: row.equipped,
      discoveredDay: row.discovered_day,
      enchantments,
    }),
    ownerType: row.owner_type,
    residentId: row.owner_resident_id,
    revision: Number(row.revision || 0),
    sourceEvent: row.source_event,
  };
}

async function snapshot(userId: string, extras: Record<string, unknown> = {}) {
  const rows = await readRows(userId);
  const migration = await migrationStatus(userId);
  return {
    authority: "server",
    campaignId: CAMPAIGN_ID,
    migration: migration ? { done: migration.state === "complete", accepted: migration.accepted_count, rejected: migration.rejected_count } : { done: false, accepted: 0, rejected: 0 },
    items: rows.map(rowJson).filter(Boolean),
    ...extras,
  };
}

async function ownResident(userId: string, residentId: string) {
  const sql = await getSql();
  const rows = await sql<{ ok: boolean }>`
    select exists(
      select 1 from hollow_resident_progress
      where campaign_id = ${CAMPAIGN_ID} and resident_id = ${residentId} and created_by_user_id = ${userId}
    ) as ok
  `;
  return !!rows[0]?.ok;
}

async function commandGuard(userId: string, requestId: string, command: string) {
  const sql = await getSql();
  const rows = await sql<{ accepted: boolean }>`
    with guard as (
      insert into hollow_command_receipt (user_id, request_id, command_type)
      values (${userId}, ${requestId}, ${command})
      on conflict (user_id, request_id) do nothing
      returning 1
    )
    select exists(select 1 from guard) as accepted
  `;
  return !!rows[0]?.accepted;
}

async function grantMastery(instanceId: string, residentId: string, kind: "equip" | "consume" | "enchant", xp: number) {
  const sql = await getSql();
  await sql`
    with award as (
      insert into hollow_item_mastery (instance_id, resident_id, mastery_kind, granted_xp)
      values (${instanceId}, ${residentId}, ${kind}, ${xp})
      on conflict (instance_id, resident_id, mastery_kind) do nothing
      returning granted_xp
    )
    update hollow_resident_progress
    set xp_total = xp_total + coalesce((select granted_xp from award), 0),
        revision = revision + case when exists(select 1 from award) then 1 else 0 end,
        updated_at = now()
    where campaign_id = ${CAMPAIGN_ID} and resident_id = ${residentId}
      and exists(select 1 from award)
  `;
}

async function migrateLegacy(userId: string, rawItems: unknown) {
  const previous = await migrationStatus(userId);
  if (previous?.state === "complete") return { duplicate: true, accepted: previous.accepted_count, rejected: previous.rejected_count };
  const sql = await getSql();
  await sql`
    insert into hollow_inventory_migration (user_id, state)
    values (${userId}, 'started')
    on conflict (user_id) do nothing
  `;

  const input = Array.isArray(rawItems) ? rawItems.slice(0, 48) : [];
  const seen = new Set<string>();
  let accepted = 0;
  let rejected = 0;
  const dayRows = await sql<{ campaign_day: number }>`select campaign_day from hollow_campaign_state where campaign_id = ${CAMPAIGN_ID}`;
  const day = Number(dayRows[0]?.campaign_day ?? 1);

  for (const raw of input) {
    if (!raw || typeof raw !== "object") { rejected += 1; continue; }
    const row = raw as Record<string, unknown>;
    const kind = String(row.kind ?? "") as ItemKind;
    const name = String(row.name ?? "").trim();
    const template = legacyItemTemplate({ name, kind, effect: "", lore: "", rarity: "Common", condition: "Pristine", value: 0, id: "legacy" });
    if (!template || seen.has(template.key) || accepted >= 24) { rejected += 1; continue; }
    seen.add(template.key);
    const instanceId = randomBytes(18).toString("hex");
    const sourceEvent = `legacy:${userId}:${template.key}`;
    const inserted = await sql<{ inserted: boolean }>`
      with add as (
        insert into hollow_item_instance (
          instance_id, campaign_id, template_key, owner_type, source_event, discovered_day
        ) values (
          ${instanceId}, ${CAMPAIGN_ID}, ${template.key}, 'vault', ${sourceEvent}, ${day}
        )
        on conflict (campaign_id, source_event) do nothing
        returning 1
      ) select exists(select 1 from add) as inserted
    `;
    if (inserted[0]?.inserted) accepted += 1;
  }
  rejected += Math.max(0, input.length - accepted - rejected);
  await sql`
    update hollow_inventory_migration
    set state = 'complete', accepted_count = ${accepted}, rejected_count = ${rejected},
        completed_at = now(), updated_at = now()
    where user_id = ${userId}
  `;
  return { duplicate: false, accepted, rejected };
}

function socketCapacity(template: AuthorityItemTemplate) {
  if (template.rarity === "Mythic" || template.rarity === "Cursed") return 3;
  if (template.rarity === "Rare" || template.rarity === "Legendary") return 2;
  return 1;
}

async function issueEquip(userId: string, requestId: string, itemId: string, residentId: string) {
  if (!(await ownResident(userId, residentId))) return { error: "That resident is not yours to equip.", status: 403 as const };
  const sql = await getSql();
  const items = await sql<ItemRow>`
    select instance_id, template_key, owner_type, owner_user_id, owner_resident_id, equipped, condition, enchantments, source_event, discovered_day, revision
    from hollow_item_instance
    where campaign_id = ${CAMPAIGN_ID} and instance_id = ${itemId} and destroyed_at is null
      and (owner_type = 'vault' or owner_user_id = ${userId}) limit 1
  `;
  const item = items[0];
  const template = item ? authorityTemplateByKey(item.template_key) : null;
  if (!item || !template?.slot) return { error: "Equippable server item not found.", status: 404 as const };
  if (!(await commandGuard(userId, requestId, "inventory_issue_equip"))) return { duplicate: true };
  await sql`
    update hollow_item_instance set equipped = false, revision = revision + 1, updated_at = now()
    where campaign_id = ${CAMPAIGN_ID} and owner_user_id = ${userId}
      and owner_resident_id = ${residentId} and destroyed_at is null and equipped = true
      and template_key in (
        select template_key from hollow_item_instance where false
      )
  `;
  // Slot conflicts are resolved in application space because the canonical slot
  // lives in code, not as a mutable database column.
  const residentItems = await sql<ItemRow>`
    select instance_id, template_key, owner_type, owner_user_id, owner_resident_id, equipped, condition, enchantments, source_event, discovered_day, revision
    from hollow_item_instance where campaign_id = ${CAMPAIGN_ID} and owner_user_id = ${userId}
      and owner_resident_id = ${residentId} and destroyed_at is null and equipped = true
  `;
  for (const existing of residentItems) {
    const existingTemplate = authorityTemplateByKey(existing.template_key);
    if (existingTemplate?.slot === template.slot && existing.instance_id !== itemId) {
      await sql`update hollow_item_instance set equipped = false, revision = revision + 1, updated_at = now() where instance_id = ${existing.instance_id}`;
    }
  }
  await sql`
    update hollow_item_instance
    set owner_type = 'resident', owner_user_id = ${userId}, owner_resident_id = ${residentId}, equipped = true,
        revision = revision + 1, updated_at = now()
    where instance_id = ${itemId} and campaign_id = ${CAMPAIGN_ID} and destroyed_at is null
  `;
  await grantMastery(itemId, residentId, "equip", 4);
  return { duplicate: false };
}

async function setEquipped(userId: string, requestId: string, itemId: string, equipped: boolean) {
  const sql = await getSql();
  const rows = await sql<ItemRow>`
    select instance_id, template_key, owner_type, owner_user_id, owner_resident_id, equipped, condition, enchantments, source_event, discovered_day, revision
    from hollow_item_instance where instance_id = ${itemId} and campaign_id = ${CAMPAIGN_ID}
      and owner_type = 'resident' and owner_user_id = ${userId} and destroyed_at is null limit 1
  `;
  const row = rows[0];
  if (!row?.owner_resident_id) return { error: "Resident item not found.", status: 404 as const };
  const template = authorityTemplateByKey(row.template_key);
  if (!template?.slot) return { error: "That item cannot be equipped.", status: 409 as const };
  if (!(await commandGuard(userId, requestId, equipped ? "inventory_equip" : "inventory_unequip"))) return { duplicate: true };
  if (equipped) {
    const residentItems = await sql<ItemRow>`
      select instance_id, template_key, owner_type, owner_user_id, owner_resident_id, equipped, condition, enchantments, source_event, discovered_day, revision
      from hollow_item_instance where campaign_id = ${CAMPAIGN_ID} and owner_user_id = ${userId}
        and owner_resident_id = ${row.owner_resident_id} and equipped = true and destroyed_at is null
    `;
    for (const existing of residentItems) {
      if (existing.instance_id === itemId) continue;
      if (authorityTemplateByKey(existing.template_key)?.slot === template.slot) {
        await sql`update hollow_item_instance set equipped = false, revision = revision + 1, updated_at = now() where instance_id = ${existing.instance_id}`;
      }
    }
  }
  await sql`update hollow_item_instance set equipped = ${equipped}, revision = revision + 1, updated_at = now() where instance_id = ${itemId}`;
  if (equipped) await grantMastery(itemId, row.owner_resident_id, "equip", 4);
  return { duplicate: false };
}

async function stash(userId: string, requestId: string, itemId: string) {
  if (!(await commandGuard(userId, requestId, "inventory_stash"))) return { duplicate: true };
  const sql = await getSql();
  const rows = await sql<{ moved: boolean }>`
    with moved as (
      update hollow_item_instance
      set owner_type='vault', owner_user_id=null, owner_resident_id=null, equipped=false, revision=revision+1, updated_at=now()
      where instance_id=${itemId} and campaign_id=${CAMPAIGN_ID} and owner_user_id=${userId} and destroyed_at is null
      returning 1
    ) select exists(select 1 from moved) as moved
  `;
  return rows[0]?.moved ? { duplicate: false } : { error: "You do not own that resident item.", status: 404 as const };
}

async function consume(userId: string, requestId: string, itemId: string, residentId: string) {
  if (!(await ownResident(userId, residentId))) return { error: "That resident is not yours.", status: 403 as const };
  const sql = await getSql();
  const rows = await sql<ItemRow>`
    select instance_id, template_key, owner_type, owner_user_id, owner_resident_id, equipped, condition, enchantments, source_event, discovered_day, revision
    from hollow_item_instance where instance_id=${itemId} and campaign_id=${CAMPAIGN_ID} and destroyed_at is null
      and (owner_type='vault' or owner_user_id=${userId}) limit 1
  `;
  const row = rows[0];
  const template = row ? authorityTemplateByKey(row.template_key) : null;
  if (!row || template?.kind !== "consumable") return { error: "Consumable not found.", status: 404 as const };
  if (!(await commandGuard(userId, requestId, "inventory_consume"))) return { duplicate: true, effect: template.effect, name: template.name };
  const changed = await sql<{ consumed: boolean }>`
    with consumed as (
      update hollow_item_instance set destroyed_at=now(), equipped=false, revision=revision+1, updated_at=now()
      where instance_id=${itemId} and destroyed_at is null returning 1
    ) select exists(select 1 from consumed) as consumed
  `;
  if (!changed[0]?.consumed) return { duplicate: true, effect: template.effect, name: template.name };
  await grantMastery(itemId, residentId, "consume", 6);
  return { duplicate: false, effect: template.effect, name: template.name };
}

async function attachEnchant(userId: string, requestId: string, enchantId: string, targetId: string, residentId: string) {
  if (!(await ownResident(userId, residentId))) return { error: "That resident is not yours.", status: 403 as const };
  const sql = await getSql();
  const rows = await sql<ItemRow>`
    select instance_id, template_key, owner_type, owner_user_id, owner_resident_id, equipped, condition, enchantments, source_event, discovered_day, revision
    from hollow_item_instance
    where campaign_id=${CAMPAIGN_ID} and destroyed_at is null and instance_id in (${enchantId}, ${targetId})
  `;
  const enchant = rows.find((row) => row.instance_id === enchantId);
  const target = rows.find((row) => row.instance_id === targetId);
  const enchantTemplate = enchant ? authorityTemplateByKey(enchant.template_key) : null;
  const targetTemplate = target ? authorityTemplateByKey(target.template_key) : null;
  if (!enchant || enchantTemplate?.kind !== "enchantment") return { error: "Enchanting component not found.", status: 404 as const };
  if (!target || target.owner_user_id !== userId || target.owner_resident_id !== residentId || !targetTemplate?.slot) return { error: "Target gear is not owned by that resident.", status: 409 as const };
  if (!(enchant.owner_type === "vault" || enchant.owner_user_id === userId)) return { error: "Enchanting component is not available to you.", status: 403 as const };
  if ((target.enchantments ?? []).length >= socketCapacity(targetTemplate)) return { error: `${targetTemplate.name} has no resonance sockets left.`, status: 409 as const };
  if (!(await commandGuard(userId, requestId, "inventory_attach"))) return { duplicate: true };
  const enchantJson = JSON.stringify([enchantTemplate.key]);
  await sql`
    update hollow_item_instance set enchantments=enchantments || ${enchantJson}::jsonb, revision=revision+1, updated_at=now()
    where instance_id=${targetId} and destroyed_at is null
  `;
  await sql`update hollow_item_instance set destroyed_at=now(), equipped=false, revision=revision+1, updated_at=now() where instance_id=${enchantId} and destroyed_at is null`;
  await grantMastery(enchantId, residentId, "enchant", 8);
  return { duplicate: false };
}

async function degrade(userId: string, requestId: string, itemId: string, nextCondition: Condition) {
  const sql = await getSql();
  const rows = await sql<ItemRow>`select instance_id, template_key, owner_type, owner_user_id, owner_resident_id, equipped, condition, enchantments, source_event, discovered_day, revision from hollow_item_instance where instance_id=${itemId} and campaign_id=${CAMPAIGN_ID} and destroyed_at is null and (owner_type='vault' or owner_user_id=${userId}) limit 1`;
  const row = rows[0];
  if (!row) return { error: "Item not found.", status: 404 as const };
  if (CONDITIONS.indexOf(nextCondition) <= CONDITIONS.indexOf(row.condition)) return { error: "Condition reports may only worsen gear. Use Machine Shop repair to improve it.", status: 409 as const };
  if (!(await commandGuard(userId, requestId, "inventory_degrade"))) return { duplicate: true };
  await sql`update hollow_item_instance set condition=${nextCondition}, revision=revision+1, updated_at=now() where instance_id=${itemId}`;
  return { duplicate: false };
}

async function repair(userId: string, requestId: string, itemId: string) {
  const sql = await getSql();
  const items = await sql<ItemRow>`select instance_id, template_key, owner_type, owner_user_id, owner_resident_id, equipped, condition, enchantments, source_event, discovered_day, revision from hollow_item_instance where instance_id=${itemId} and campaign_id=${CAMPAIGN_ID} and destroyed_at is null and (owner_type='vault' or owner_user_id=${userId}) limit 1`;
  const item = items[0];
  if (!item) return { error: "Item not found.", status: 404 as const };
  const rank = CONDITIONS.indexOf(item.condition);
  if (rank <= 0) return { error: "That item is already Pristine.", status: 409 as const };
  const campaign = await sql<{ vault_caps: number; rooms: Record<string, number> }>`select vault_caps, rooms from hollow_campaign_state where campaign_id=${CAMPAIGN_ID} limit 1`;
  const forgeTier = Math.max(0, Number(campaign[0]?.rooms?.forge ?? 0));
  const base = [0, 220, 520, 980][rank] ?? 980;
  const cost = Math.max(40, Math.round(base * Math.max(0.35, 1 - forgeTier * 0.1)));
  if (Number(campaign[0]?.vault_caps ?? 0) < cost) return { error: `Vault 13 needs ${cost} caps for that repair.`, status: 409 as const };
  if (!(await commandGuard(userId, requestId, "inventory_repair"))) return { duplicate: true, repairCost: cost };
  const moved = await sql<{ repaired: boolean }>`
    with spend as (
      update hollow_campaign_state set vault_caps=vault_caps-${cost}, revision=revision+1, updated_at=now()
      where campaign_id=${CAMPAIGN_ID} and vault_caps>=${cost} returning 1
    ), repaired as (
      update hollow_item_instance set condition='Pristine', revision=revision+1, updated_at=now()
      where instance_id=${itemId} and exists(select 1 from spend) returning 1
    ) select exists(select 1 from repaired) as repaired
  `;
  return moved[0]?.repaired ? { duplicate: false, repairCost: cost } : { error: "Repair settlement failed.", status: 409 as const };
}

function weightedTreasure(pool: AuthorityItemTemplate[], maxRank: number) {
  const candidates = pool.filter((item) => RARITY_RANK[item.rarity] <= maxRank);
  const source = candidates.length ? candidates : pool;
  const weighted = source.flatMap((item) => {
    const rank = RARITY_RANK[item.rarity];
    const weight = [18, 11, 6, 3, 1][rank] ?? 1;
    return Array.from({ length: weight }, () => item);
  });
  return weighted[randomInt(Math.max(1, weighted.length))] ?? source[0] ?? null;
}

async function claimMissionTreasure(userId: string, ticketId: string) {
  const sql = await getSql();
  const previous = await sql<{ result: Record<string, unknown> }>`select result from hollow_item_drop_event where ticket_id=${ticketId} and user_id=${userId} limit 1`;
  if (previous[0]) return { duplicate: true, result: previous[0].result };
  const tickets = await sql<{ region: RegionId; mission_kind: MissionKind; performance_score: number | null; settled_at: string | null }>`
    select region, mission_kind, performance_score, settled_at from hollow_mission_ticket
    where ticket_id=${ticketId} and campaign_id=${CAMPAIGN_ID} and user_id=${userId} limit 1
  `;
  const ticket = tickets[0];
  if (!ticket?.settled_at) return { error: "Mission contract has not been settled.", status: 409 as const };
  const pool = SERVER_TREASURE_BY_REGION[ticket.region] ?? [];
  const score = Math.max(0, Math.min(1000, Number(ticket.performance_score ?? 500)));
  const kind = ticket.mission_kind;
  const chance = kind === "boss" ? 1 : kind === "bounty" ? 0.9 : kind === "raid" ? 0.82 : kind === "forage" ? 0.62 : kind === "trade" ? 0.48 : 0.42;
  const slots = kind === "boss" ? 2 : 1;
  const baseMax = kind === "boss" ? 4 : kind === "bounty" || kind === "raid" ? 3 : kind === "forage" ? 2 : 1;
  const maxRank = Math.max(0, Math.min(4, baseMax + (score >= 900 ? 1 : score < 450 ? -1 : 0)));
  const drops: { instanceId: string; templateKey: string; name: string; rarity: string }[] = [];
  const dayRows = await sql<{ campaign_day: number }>`select campaign_day from hollow_campaign_state where campaign_id=${CAMPAIGN_ID}`;
  const day = Number(dayRows[0]?.campaign_day ?? 1);

  for (let i = 0; i < slots; i++) {
    if (randomInt(10_000) / 10_000 > chance) continue;
    const template = weightedTreasure(pool, maxRank);
    if (!template) continue;
    const instanceId = randomBytes(18).toString("hex");
    const sourceEvent = `mission:${ticketId}:${i}`;
    await sql`
      insert into hollow_item_instance (instance_id, campaign_id, template_key, owner_type, source_event, discovered_day)
      values (${instanceId}, ${CAMPAIGN_ID}, ${template.key}, 'vault', ${sourceEvent}, ${day})
      on conflict (campaign_id, source_event) do nothing
    `;
    drops.push({ instanceId, templateKey: template.key, name: template.name, rarity: template.rarity });
  }
  const result = { region: ticket.region, kind, performanceScore: score, drops };
  const resultJson = JSON.stringify(result);
  await sql`insert into hollow_item_drop_event (ticket_id, user_id, result) values (${ticketId}, ${userId}, ${resultJson}::jsonb) on conflict (ticket_id) do nothing`;
  const stored = await sql<{ result: Record<string, unknown> }>`select result from hollow_item_drop_event where ticket_id=${ticketId} and user_id=${userId} limit 1`;
  return { duplicate: false, result: stored[0]?.result ?? result };
}

export const Route = createFileRoute("/api/hollow/inventory")({
  server: {
    handlers: {
      GET: async () => {
        const identity = await verifiedUser();
        if (identity.response) return identity.response;
        if (!(await linked(identity.userId!))) return json({ error: "Link TyroneBot before using server inventory." }, 404);
        return json(await snapshot(identity.userId!));
      },
      POST: async ({ request }) => {
        const identity = await verifiedUser();
        if (identity.response) return identity.response;
        const userId = identity.userId!;
        if (!(await linked(userId))) return json({ error: "Link TyroneBot before using server inventory." }, 404);
        let body: Record<string, unknown>;
        try { body = (await request.json()) as Record<string, unknown>; } catch { return json({ error: "bad json" }, 400); }
        const command = String(body.command ?? "").trim();

        if (command === "migrate_legacy") {
          const result = await migrateLegacy(userId, body.items);
          return json(await snapshot(userId, { migrationResult: result }));
        }
        if (command === "claim_mission_treasure") {
          const ticketId = String(body.ticketId ?? "").trim();
          if (!/^[a-f0-9]{48,96}$/i.test(ticketId)) return json({ error: "invalid mission ticket" }, 400);
          const result = await claimMissionTreasure(userId, ticketId);
          if ("error" in result) return json({ error: result.error }, result.status);
          return json(await snapshot(userId, { treasure: result }));
        }

        const requestId = cleanRequestId(body.requestId);
        if (!requestId) return json({ error: "invalid request id" }, 400);
        const itemId = cleanInstanceId(body.itemId);
        let result: Record<string, unknown> | { error: string; status: number };
        if (command === "issue_equip") {
          const residentId = cleanResidentId(body.residentId);
          if (!itemId || !residentId) return json({ error: "invalid item/resident" }, 400);
          result = await issueEquip(userId, requestId, itemId, residentId);
        } else if (command === "equip" || command === "unequip") {
          if (!itemId) return json({ error: "invalid item" }, 400);
          result = await setEquipped(userId, requestId, itemId, command === "equip");
        } else if (command === "stash") {
          if (!itemId) return json({ error: "invalid item" }, 400);
          result = await stash(userId, requestId, itemId);
        } else if (command === "consume") {
          const residentId = cleanResidentId(body.residentId);
          if (!itemId || !residentId) return json({ error: "invalid item/resident" }, 400);
          result = await consume(userId, requestId, itemId, residentId);
        } else if (command === "attach") {
          const residentId = cleanResidentId(body.residentId);
          const targetId = cleanInstanceId(body.targetItemId);
          if (!itemId || !targetId || !residentId) return json({ error: "invalid enchantment target" }, 400);
          result = await attachEnchant(userId, requestId, itemId, targetId, residentId);
        } else if (command === "degrade") {
          const condition = String(body.condition ?? "") as Condition;
          if (!itemId || !CONDITIONS.includes(condition)) return json({ error: "invalid condition report" }, 400);
          result = await degrade(userId, requestId, itemId, condition);
        } else if (command === "repair") {
          if (!itemId) return json({ error: "invalid item" }, 400);
          result = await repair(userId, requestId, itemId);
        } else {
          return json({ error: "unknown inventory command" }, 400);
        }
        if ("error" in result) return json({ error: result.error }, result.status);
        return json(await snapshot(userId, result));
      },
    },
  },
});
