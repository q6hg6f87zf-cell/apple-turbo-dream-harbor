import { useCallback, useEffect, useState } from "react";
import { authEnabled, getBearerToken, signIn } from "./client";
import { DISCORD_PROVIDER_ID } from "./providers";
import { useCurrentUserState } from "./use-current-user";

export type DiscordAccess = {
  allowed: boolean;
  authenticated: boolean;
  discord: boolean;
  linked: boolean;
  devBypass: boolean;
  provider: string | null;
  stage?: "discord" | "tyrone" | "ready";
  discordId?: string;
  name?: string;
  handle?: string;
  error?: string;
};

const DEV_ACCESS: DiscordAccess = {
  allowed: true,
  authenticated: true,
  discord: true,
  linked: true,
  devBypass: true,
  provider: "dev",
  stage: "ready",
};

function headers() {
  const h = new Headers({ accept: "application/json" });
  const bearer = getBearerToken();
  if (bearer) h.set("Authorization", `Bearer ${bearer}`);
  return h;
}

export async function fetchDiscordAccess(): Promise<DiscordAccess> {
  if (!authEnabled) return DEV_ACCESS;
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
    devBypass: !!body.devBypass,
    provider: body.provider ?? null,
    stage: body.stage,
    discordId: body.discordId,
    name: body.name,
    handle: body.handle,
    error: body.error,
  };
}

export function useDiscordAccess() {
  const session = useCurrentUserState();
  const [access, setAccess] = useState<DiscordAccess | null>(authEnabled ? null : DEV_ACCESS);
  const [pending, setPending] = useState(authEnabled);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    if (!authEnabled) {
      setAccess(DEV_ACCESS);
      setPending(false);
      return;
    }
    if (session.isPending) {
      setPending(true);
      return;
    }

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
            authenticated: !!session.user,
            discord: false,
            linked: false,
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
  }, [session.isPending, session.user?.id, revision]);

  return { access, pending: pending || session.isPending, user: session.user, refresh };
}

export async function signInWithDiscord() {
  await signIn(DISCORD_PROVIDER_ID, { callbackURL: "/", errorCallbackURL: "/" });
}
