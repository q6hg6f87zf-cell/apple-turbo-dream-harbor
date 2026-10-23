import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { hollowVerifiedUser } from "@/lib/hollow-identity.server";
import {
  attachTheaterIdentity,
  formatSseComment,
  formatSseData,
  softParseDomainEvent,
  type LiveDomainEventSoft,
  type LiveHelloBeat,
  type LiveRevisionBeat,
} from "@/game/server-live";

/**
 * Pulse Milestone 2 / Design Bible v1.3 priority 3 — campaign revision SSE
 * with shared theater identity fanout.
 *
 * - Node ReadableStream + text/event-stream (not edge).
 * - Revision detection from DB poll (~750ms), not an in-memory EventEmitter bus.
 * - Soft-read hollow_domain_event payload (region/theater/kind/heat/intel/beatId/
 *   worldConsequence.offerMutations) so Atlas applyLiveBeat can paint other riders'
 *   MissionSettled / BossCleared as shared scars — not local-only memberRevision.
 * - Long-lived streams hit platform maxDuration; client reconnects with backoff.
 * - Heartbeats keep HTTP/1.1 proxies from killing idle connections.
 */

const CAMPAIGN_ID = "moon-squad";
const POLL_MS = 750;
const HEARTBEAT_MS = 15_000;
/** Close before typical serverless maxDuration (300s) so the client reconnects cleanly. */
const MAX_STREAM_MS = 240_000;
const JSON_HEADERS = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: JSON_HEADERS });
}

type RevisionRow = {
  campaign_revision: number;
  member_revision: number;
};

async function readRevisions(userId: string): Promise<RevisionRow | null> {
  const sql = await getSql();
  const rows = await sql<RevisionRow>`
    select
      c.revision as campaign_revision,
      m.revision as member_revision
    from hollow_campaign_member m
    join hollow_campaign_state c on c.campaign_id = m.campaign_id
    where m.campaign_id = ${CAMPAIGN_ID} and m.user_id = ${userId}
    limit 1
  `;
  return rows[0] ?? null;
}

type DomainEventRow = {
  event_id: string | null;
  event_type: string | null;
  region: string | null;
  theater: string | null;
  kind: string | null;
  beat_id: string | null;
  heat_delta: unknown;
  intel_delta: unknown;
  world_consequence: unknown;
};

/**
 * Soft-read latest allowlisted domain event + payload theater identity.
 * Vault owns hollow_domain_event (migration 0018+). Fail quiet until present.
 * Never invents fields — omit when payload lacks them.
 */
async function readRecentDomainEvent(): Promise<LiveDomainEventSoft | undefined> {
  try {
    const sql = await getSql();
    const rows = await sql<DomainEventRow>`
      select
        event_id,
        event_type,
        payload->>'region' as region,
        payload->>'theater' as theater,
        payload->>'kind' as kind,
        payload->>'beatId' as beat_id,
        payload->'heatDelta' as heat_delta,
        payload->'intelDelta' as intel_delta,
        payload->'worldConsequence' as world_consequence
      from hollow_domain_event
      where campaign_id = ${CAMPAIGN_ID}
        and event_type in ('MissionSettled', 'TransferSettled', 'RaidOpened', 'BossCleared')
        and created_at > now() - interval '10 seconds'
      order by created_at desc
      limit 1
    `;
    const row = rows[0];
    if (!row) return undefined;
    const soft = softParseDomainEvent(row);
    if (!soft.eventType && !soft.region && !soft.theater) return undefined;
    return soft;
  } catch {
    return undefined;
  }
}

function sleep(ms: number, signal: AbortSignal): Promise<"ok" | "aborted"> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve("aborted");
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve("ok");
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      resolve("aborted");
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

export const Route = createFileRoute("/api/hollow/live")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const who = hollowVerifiedUser(request);
        if (who.response) return who.response;

        let initial: RevisionRow | null;
        try {
          initial = await readRevisions(who.userId!);
        } catch {
          return json({ error: "live rail unavailable" }, 503);
        }
        if (!initial) {
          return json({ error: "Link TyroneBot before using the live revision rail." }, 404);
        }

        const started = Date.now();
        let lastCampaign = Number(initial.campaign_revision) || 0;
        let lastMember = Number(initial.member_revision) || 0;
        let lastHeartbeat = 0;

        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const encoder = new TextEncoder();
            const signal = request.signal;

            const push = (chunk: string) => {
              if (signal.aborted) return;
              try {
                controller.enqueue(encoder.encode(chunk));
              } catch {
                /* closed */
              }
            };

            const hello: LiveHelloBeat = {
              type: "hello",
              campaignRevision: lastCampaign,
              memberRevision: lastMember,
              at: new Date().toISOString(),
            };
            push(formatSseData(hello));
            push(formatSseComment("pulse-live"));
            lastHeartbeat = Date.now();

            while (!signal.aborted) {
              if (Date.now() - started >= MAX_STREAM_MS) {
                push(formatSseComment("max-duration"));
                break;
              }

              const wait = await sleep(POLL_MS, signal);
              if (wait === "aborted") break;

              let row: RevisionRow | null = null;
              try {
                row = await readRevisions(who.userId!);
              } catch {
                push(formatSseComment("revision-read-error"));
                break;
              }
              if (!row) {
                push(formatSseComment("member-gone"));
                break;
              }

              const campaignRevision = Number(row.campaign_revision) || 0;
              const memberRevision = Number(row.member_revision) || 0;
              if (campaignRevision > lastCampaign || memberRevision > lastMember) {
                const soft = await readRecentDomainEvent();
                const beat: LiveRevisionBeat = {
                  type: "revision",
                  campaignRevision,
                  memberRevision,
                  at: new Date().toISOString(),
                };
                attachTheaterIdentity(beat, soft);
                push(formatSseData(beat));
                lastCampaign = campaignRevision;
                lastMember = memberRevision;
                lastHeartbeat = Date.now();
                continue;
              }

              if (Date.now() - lastHeartbeat >= HEARTBEAT_MS) {
                // Atlas parseLiveBeat requires revision fields on every beat type.
                push(
                  formatSseData({
                    type: "heartbeat",
                    campaignRevision: lastCampaign,
                    memberRevision: lastMember,
                    at: new Date().toISOString(),
                  }),
                );
                lastHeartbeat = Date.now();
              }
            }

            try {
              controller.close();
            } catch {
              /* already closed */
            }
          },
          cancel() {
            /* client disconnect */
          },
        });

        return new Response(stream, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
});
