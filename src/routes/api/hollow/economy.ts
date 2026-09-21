import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { hollowVerifiedUser } from "@/lib/hollow-identity.server";

const CAMPAIGN_ID = "moon-squad";
const MAX_TRANSFER = 10_000_000;
const HEADERS: Record<string, string> = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: HEADERS });
}

type EconomyRow = {
  vault_caps: number;
  hollow_ore: number;
  moon_favor: number;
  rooms: Record<string, number>;
  quarters: Record<string, number>;
  campaign_revision: number;
  card_caps: number;
  xp: number;
  level: number;
  member_revision: number;
  discord_id: string;
  display_name: string;
};

async function verifiedUser(request?: Request) {
  return hollowVerifiedUser(request);
}

async function readEconomy(userId: string): Promise<EconomyRow | null> {
  const sql = await getSql();
  const rows = await sql<EconomyRow>`
    select
      c.vault_caps,
      c.hollow_ore,
      c.moon_favor,
      c.rooms,
      c.quarters,
      c.revision as campaign_revision,
      m.card_caps,
      m.xp,
      m.level,
      m.revision as member_revision,
      m.discord_id,
      s.display_name
    from hollow_campaign_member m
    join hollow_campaign_state c on c.campaign_id = m.campaign_id
    join tyrone_arcade_snapshot s on s.discord_id = m.discord_id
    where m.campaign_id = ${CAMPAIGN_ID} and m.user_id = ${userId}
    limit 1
  `;
  return rows[0] ?? null;
}

function economyJson(row: EconomyRow) {
  return {
    campaignId: CAMPAIGN_ID,
    treasury: {
      caps: row.vault_caps,
      ore: row.hollow_ore,
      moonFavor: row.moon_favor,
      rooms: row.rooms,
      quarters: row.quarters,
      revision: row.campaign_revision,
    },
    card: {
      caps: row.card_caps,
      xp: row.xp,
      level: row.level,
      revision: row.member_revision,
      discordId: row.discord_id,
      name: row.display_name,
    },
    authority: "server",
  };
}

function cleanRequestId(raw: unknown) {
  const id = String(raw ?? "").trim();
  return /^[A-Za-z0-9._:-]{12,96}$/.test(id) ? id : null;
}

function cleanAmount(raw: unknown) {
  const n = Number(raw);
  return Number.isSafeInteger(n) && n >= 1 && n <= MAX_TRANSFER ? n : null;
}

function cleanDiscord(raw: unknown) {
  const id = String(raw ?? "").trim();
  return /^\d{17,22}$/.test(id) ? id : null;
}

type MoveResult = { accepted: boolean; moved: boolean };

async function depositToCard(userId: string, requestId: string, amount: number): Promise<MoveResult> {
  const sql = await getSql();
  const rows = await sql<MoveResult>`
    with guard as (
      insert into hollow_command_receipt (user_id, request_id, command_type)
      values (${userId}, ${requestId}, 'deposit_card')
      on conflict (user_id, request_id) do nothing
      returning 1
    ), member_exists as (
      select 1 from hollow_campaign_member
      where campaign_id = ${CAMPAIGN_ID} and user_id = ${userId}
    ), campaign_move as (
      update hollow_campaign_state
      set vault_caps = vault_caps - ${amount}, revision = revision + 1, updated_at = now()
      where campaign_id = ${CAMPAIGN_ID}
        and vault_caps >= ${amount}
        and exists (select 1 from guard)
        and exists (select 1 from member_exists)
      returning 1
    ), member_move as (
      update hollow_campaign_member
      set card_caps = card_caps + ${amount}, revision = revision + 1, updated_at = now()
      where campaign_id = ${CAMPAIGN_ID} and user_id = ${userId}
        and exists (select 1 from campaign_move)
      returning 1
    )
    select exists(select 1 from guard) as accepted,
           exists(select 1 from member_move) as moved
  `;
  return rows[0] ?? { accepted: false, moved: false };
}

async function withdrawToVault(userId: string, requestId: string, amount: number): Promise<MoveResult> {
  const sql = await getSql();
  const rows = await sql<MoveResult>`
    with guard as (
      insert into hollow_command_receipt (user_id, request_id, command_type)
      values (${userId}, ${requestId}, 'withdraw_card')
      on conflict (user_id, request_id) do nothing
      returning 1
    ), campaign_exists as (
      select 1 from hollow_campaign_state where campaign_id = ${CAMPAIGN_ID}
    ), member_move as (
      update hollow_campaign_member
      set card_caps = card_caps - ${amount}, revision = revision + 1, updated_at = now()
      where campaign_id = ${CAMPAIGN_ID} and user_id = ${userId}
        and card_caps >= ${amount}
        and exists (select 1 from guard)
        and exists (select 1 from campaign_exists)
      returning 1
    ), campaign_move as (
      update hollow_campaign_state
      set vault_caps = vault_caps + ${amount}, revision = revision + 1, updated_at = now()
      where campaign_id = ${CAMPAIGN_ID}
        and exists (select 1 from member_move)
      returning 1
    )
    select exists(select 1 from guard) as accepted,
           exists(select 1 from campaign_move) as moved
  `;
  return rows[0] ?? { accepted: false, moved: false };
}

async function transferCard(
  userId: string,
  requestId: string,
  amount: number,
  recipientDiscordId: string,
): Promise<MoveResult> {
  const sql = await getSql();
  const rows = await sql<MoveResult>`
    with guard as (
      insert into hollow_command_receipt (user_id, request_id, command_type)
      values (${userId}, ${requestId}, 'transfer_card')
      on conflict (user_id, request_id) do nothing
      returning 1
    ), target as (
      select user_id from hollow_campaign_member
      where campaign_id = ${CAMPAIGN_ID}
        and discord_id = ${recipientDiscordId}
        and user_id <> ${userId}
      for update
    ), sender_move as (
      update hollow_campaign_member
      set card_caps = card_caps - ${amount}, revision = revision + 1, updated_at = now()
      where campaign_id = ${CAMPAIGN_ID} and user_id = ${userId}
        and card_caps >= ${amount}
        and exists (select 1 from guard)
        and exists (select 1 from target)
      returning 1
    ), target_move as (
      update hollow_campaign_member
      set card_caps = card_caps + ${amount}, revision = revision + 1, updated_at = now()
      where campaign_id = ${CAMPAIGN_ID}
        and user_id = (select user_id from target limit 1)
        and exists (select 1 from sender_move)
      returning 1
    )
    select exists(select 1 from guard) as accepted,
           exists(select 1 from target_move) as moved
  `;
  return rows[0] ?? { accepted: false, moved: false };
}

export const Route = createFileRoute("/api/hollow/economy")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const identity = await verifiedUser(request);
        if (identity.response) return identity.response;
        const row = await readEconomy(identity.userId!);
        if (!row) return json({ error: "link TyroneBot before using the shared Moon Squad economy" }, 404);
        return json(economyJson(row));
      },

      POST: async ({ request }) => {
        const identity = await verifiedUser(request);
        if (identity.response) return identity.response;
        const userId = identity.userId!;

        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return json({ error: "bad json" }, 400);
        }

        const command = String(body.command ?? "").trim();
        const requestId = cleanRequestId(body.requestId);
        const amount = cleanAmount(body.amount);
        if (!requestId) return json({ error: "invalid request id" }, 400);
        if (!amount) return json({ error: `amount must be an integer between 1 and ${MAX_TRANSFER}` }, 400);

        const before = await readEconomy(userId);
        if (!before) return json({ error: "link TyroneBot before using the shared Moon Squad economy" }, 404);

        let result: MoveResult;
        if (command === "deposit_card") {
          result = await depositToCard(userId, requestId, amount);
        } else if (command === "withdraw_card") {
          result = await withdrawToVault(userId, requestId, amount);
        } else if (command === "transfer_card") {
          const recipient = cleanDiscord(body.recipientDiscordId);
          if (!recipient) return json({ error: "recipient must be a linked Discord rider" }, 400);
          result = await transferCard(userId, requestId, amount, recipient);
        } else {
          return json({ error: "unknown economy command" }, 400);
        }

        const after = await readEconomy(userId);
        if (!after) return json({ error: "authoritative economy unavailable" }, 503);

        if (!result.accepted) {
          return json({ ok: true, duplicate: true, ...economyJson(after) });
        }
        if (!result.moved) {
          let reason = "command rejected by authoritative economy";
          if (command === "deposit_card" && before.vault_caps < amount) reason = "Vault 13 does not have enough caps.";
          if ((command === "withdraw_card" || command === "transfer_card") && before.card_caps < amount) {
            reason = "Moon Squad card does not have enough caps.";
          }
          if (command === "transfer_card") {
            const recipient = cleanDiscord(body.recipientDiscordId)!;
            const sql = await getSql();
            const target = await sql<{ one: number }>`
              select 1 as one from hollow_campaign_member
              where campaign_id = ${CAMPAIGN_ID} and discord_id = ${recipient} and user_id <> ${userId}
              limit 1
            `;
            if (!target[0]) reason = "That rider has not linked a Hollow Realm account yet.";
          }
          return json({ error: reason, ...economyJson(after) }, 409);
        }

        return json({ ok: true, ...economyJson(after) });
      },
    },
  },
});
