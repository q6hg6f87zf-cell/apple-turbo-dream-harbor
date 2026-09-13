import { getBearerToken } from "@/lib/auth/client";
import type { ClassName, DailyShop } from "./types";

export type ServerAcquisitionSnapshot = {
  authority: "server";
  campaignId: string;
  treasury: {
    caps: number;
    ore: number;
  };
  exchange: DailyShop & { ledgerTier: number };
  forge?: {
    duplicate: boolean;
    cost: number;
    rosterCount: number;
    rosterCap: number;
  };
  purchase?: {
    duplicate: boolean;
    name: string;
    price: number;
    oreUnits: number;
  };
  supply?: {
    duplicate: boolean;
    name: string;
  };
  error?: string;
};

function headers(json = false) {
  const h = new Headers({ accept: "application/json" });
  if (json) h.set("content-type", "application/json");
  const bearer = getBearerToken();
  if (bearer) h.set("Authorization", `Bearer ${bearer}`);
  return h;
}

function requestId(prefix: string) {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 16)}`;
  return `${prefix}:${id}`.slice(0, 96);
}

async function decode(response: Response): Promise<ServerAcquisitionSnapshot> {
  const body = (await response.json().catch(() => ({}))) as ServerAcquisitionSnapshot;
  if (!response.ok) throw new Error(body.error || `Acquisition request failed (${response.status})`);
  return body;
}

async function post(payload: Record<string, unknown>) {
  const response = await fetch("/api/hollow/acquisition", {
    method: "POST",
    credentials: "same-origin",
    headers: headers(true),
    body: JSON.stringify(payload),
  });
  return decode(response);
}

export async function pullServerAcquisition(): Promise<ServerAcquisitionSnapshot | null> {
  const response = await fetch("/api/hollow/acquisition", {
    method: "GET",
    credentials: "same-origin",
    headers: headers(),
  });
  if (response.status === 401 || response.status === 404) return null;
  return decode(response);
}

export function forgeServerResident(
  residentId: string,
  name: string,
  cls: ClassName,
  race: string,
) {
  return post({ command: "forge_resident", residentId, name, cls, race });
}

export function buyServerExchange(tier: "bargain" | "essential" | "artifact") {
  return post({ command: "buy_exchange", tier });
}

export function buyServerVendor(name: string) {
  return post({ command: "buy_vendor", requestId: requestId("vendor"), name });
}

export function grantServerBrokerSupply(residentId: string) {
  return post({ command: "grant_broker_supply", residentId });
}
