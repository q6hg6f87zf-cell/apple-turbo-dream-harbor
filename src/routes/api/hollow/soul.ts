import { createFileRoute } from "@tanstack/react-router";
import { enrollMoonSquad } from "@/lib/auth/enroll-campaign.server";
import { lookupSoul, stampSoul } from "@/lib/auth/hollow-soul.server";
import { hollowVerifiedUser } from "@/lib/hollow-identity.server";

const HEADERS = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: HEADERS });
}

export const Route = createFileRoute("/api/hollow/soul")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const who = hollowVerifiedUser(request);
        if (who.response) return who.response;
        if (!who.discordId) return json({ soul: null });
        const stored = await lookupSoul(who.discordId);
        return json({ soul: stored?.operative ?? null, forgedAt: stored?.forgedAt ?? null });
      },
      POST: async ({ request }) => {
        const who = hollowVerifiedUser(request);
        if (who.response) return who.response;
        if (!who.discordId) return json({ error: "unauthorized" }, 401);
        let body: { operative?: unknown } = {};
        try {
          body = (await request.json()) as { operative?: unknown };
        } catch {
          return json({ error: "bad json" }, 400);
        }
        try {
          await enrollMoonSquad(who.discordId, who.name ?? "Rider");
        } catch {
          /* soul stamp can still proceed on hollow_souls */
        }
        const userId = who.userId;
        const result = await stampSoul(who.discordId, userId, body.operative);
        if ("error" in result) return json({ error: result.error }, result.status);
        return json({ ok: true, soul: result.operative, forgedAt: result.forgedAt });
      },
    },
  },
});
