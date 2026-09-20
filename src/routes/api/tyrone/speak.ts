import { createFileRoute } from "@tanstack/react-router";
import { assertSameSiteRequest } from "@/lib/auth/isolation.server";
import { requireUserId } from "@/lib/auth/verify.server";

const HEADERS = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: HEADERS });
}

function authDisabled() {
  return String(process.env.VITE_AUTH_ENABLED ?? "").trim() === "false";
}

/**
 * Optional xAI polish for Tyrone. The game never waits on this.
 * Local templates in tyrone-voice.ts always answer first.
 */
export const Route = createFileRoute("/api/tyrone/speak")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          if (!authDisabled()) {
            assertSameSiteRequest();
            await requireUserId();
          }
        } catch {
          return json({ error: "unauthorized" }, 401);
        }
        const key = process.env.XAI_API_KEY?.trim();
        if (!key) return json({ fallback: true, dialogue: null }, 200);

        let question = "";
        let context: unknown = null;
        try {
          const body = (await request.json()) as { question?: string; context?: unknown };
          question = String(body.question ?? "").slice(0, 180);
          context = body.context ?? null;
        } catch {
          return json({ error: "invalid" }, 400);
        }
        if (!question) return json({ dialogue: null }, 200);

        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 4000);
        try {
          const res = await fetch("https://api.x.ai/v1/chat/completions", {
            method: "POST",
            signal: ctrl.signal,
            headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
            body: JSON.stringify({
              model: "grok-4.5",
              temperature: 0.4,
              max_tokens: 120,
              messages: [
                {
                  role: "system",
                  content:
                    "You are Tyrone Bot, S.Y.N.A.P.S.E unit T-0880, a witty robotic cowboy in Vault 13. Address the player as partner. Use only facts in the JSON context. Never invent regions, items, NPCs, or DCs. If you lack a fact, say you have nothing in your records. One or two sentences. No lists.",
                },
                { role: "user", content: JSON.stringify({ question, context }).slice(0, 4000) },
              ],
            }),
          });
          const data = (await res.json().catch(() => ({}))) as { choices?: { message?: { content?: string } }[] };
          const dialogue = data.choices?.[0]?.message?.content?.trim() ?? null;
          return json({ dialogue, fallback: !dialogue });
        } catch {
          return json({ dialogue: null, fallback: true }, 200);
        } finally {
          clearTimeout(timer);
        }
      },
    },
  },
});
