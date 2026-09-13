import { getBearerToken } from "@/lib/auth/client";

export type ServerEconomySnapshot = {
  campaignId: string;
  treasury: {
    caps: number;
    ore: number;
    moonFavor: number;
    rooms: Record<string, number>;
    quarters: Record<string, number>;
    revision: number;
  };
  card: {
    caps: number;
    xp: number;
    level: number;
    revision: number;
    discordId: string;
    name: string;
  };
  authority: "server";
};

type EconomyError = { error?: string };

function headers(json = false) {
  const h = new Headers({ accept: "application/json" });
  if (json) h.set("content-type", "application/json");
  const bearer = getBearerToken();
  if (bearer) h.set("Authorization", `Bearer ${bearer}`);
  return h;
}

async function decode(response: Response): Promise<ServerEconomySnapshot> {
  const body = (await response.json().catch(() => ({}))) as ServerEconomySnapshot & EconomyError;
  if (!response.ok) throw new Error(body.error || `Economy request failed (${response.status})`);
  return body;
}

export async function pullServerEconomy(): Promise<ServerEconomySnapshot | null> {
  const response = await fetch("/api/hollow/economy", {
    method: "GET",
    credentials: "same-origin",
    headers: headers(),
  });
  if (response.status === 404 || response.status === 401) return null;
  return decode(response);
}

export type EconomyCommand =
  | { command: "deposit_card"; amount: number }
  | { command: "withdraw_card"; amount: number }
  | { command: "transfer_card"; amount: number; recipientDiscordId: string };

export async function sendEconomyCommand(command: EconomyCommand): Promise<ServerEconomySnapshot> {
  const requestId = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
  const response = await fetch("/api/hollow/economy", {
    method: "POST",
    credentials: "same-origin",
    headers: headers(true),
    body: JSON.stringify({ requestId, ...command }),
  });
  return decode(response);
}
