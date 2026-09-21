import { useCallback, useEffect, useState } from "react";
import { getBearerToken } from "./client";

export type DiscordAccess = {
  allowed: boolean;
  authenticated: boolean;
  discord: boolean;
  linked: boolean;
  stamped?: boolean;
  returning?: boolean;
  devBypass: boolean;
  provider: string | null;
  stage?: "discord" | "tyrone" | "stamp" | "ready";
  discordId?: string;
  name?: string;
  handle?: string;
  error?: string;
};

function headers() {
  const h = new Headers({ accept: "application/json" });
  const bearer = getBearerToken();
  if (bearer) h.set("Authorization", `Bearer ${bearer}`);
  return h;
}

export async function fetchDiscordAccess(): Promise<DiscordAccess> {
  const response = await fetch("/api/hollow/access", {
    method: "GET",
    credentials: "same-origin",
    headers: headers(),
  });
  const body = (await response.json().catch(() => ({}))) as Partial<DiscordAccess>;
  return {
    allowed: !!body.allowed,
    authenticated: !!body.authenticated,
    discord: !!body.discord,
    linked: !!body.linked,
    stamped: !!body.stamped,
    returning: !!body.returning,
    devBypass: !!body.devBypass,
    provider: body.provider ?? null,
    stage: body.stage,
    discordId: body.discordId,
    name: body.name,
    handle: body.handle,
    error: body.error,
  };
}

export async function stampDiscordPlate(name: string, handle?: string) {
  const response = await fetch("/api/discord/plate", {
    method: "POST",
    credentials: "same-origin",
    headers: { ...Object.fromEntries(headers()), "content-type": "application/json" },
    body: JSON.stringify({ name, handle }),
  });
  return response.ok;
}

export function useDiscordAccess() {
  const [access, setAccess] = useState<DiscordAccess | null>(null);
  const [pending, setPending] = useState(true);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    setPending(true);
    void fetchDiscordAccess()
      .then((next) => {
        if (!cancelled) setAccess(next);
      })
      .catch(() => {
        if (!cancelled) {
          setAccess({
            allowed: false,
            authenticated: false,
            discord: false,
            linked: false,
            stamped: false,
            returning: false,
            devBypass: false,
            provider: null,
            stage: "discord",
            error: "Discord access check failed. Try again.",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setPending(false);
      });

    return () => {
      cancelled = true;
    };
  }, [revision]);

  return { access, pending, refresh };
}

export async function signInWithDiscord() {
  window.location.assign("/api/discord/start");
}
