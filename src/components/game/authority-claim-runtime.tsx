import { cloneState } from "@/game/engine";
import { setActiveIdentity } from "@/game/save";
import { registerMember, switchMember } from "@/game/squad";
import { useGame } from "@/game/store";
import { useEffect } from "react";

type ClaimResponse = {
  ok?: boolean;
  discord?: string;
  name?: string;
  error?: string;
};

function claimFromLocation() {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const claim = url.searchParams.get("claim")?.trim();
  return claim && claim.length >= 32 ? { claim, url } : null;
}

function clearClaim(url: URL) {
  url.searchParams.delete("claim");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

/**
 * Exchanges a Tyrone-issued one-time claim for the authenticated account.
 *
 * Deliberately imports NO economy fields into the local save. The claim proves
 * identity only. Server-owned caps/inventory/progression are migrated through
 * authoritative commands in the next persistence phase.
 */
export function AuthorityClaimRuntime() {
  useEffect(() => {
    const pending = claimFromLocation();
    if (!pending) return;
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch("/api/tyrone/claim", {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify({ claim: pending.claim }),
        });
        const body = (await response.json().catch(() => ({}))) as ClaimResponse;
        if (cancelled) return;

        if (response.status === 401) {
          useGame.setState((store) => ({
            s: { ...store.s, toast: "Tyrone claim is waiting. Sign in, then reopen this link." },
          }));
          return;
        }
        if (!response.ok || !body.discord) {
          clearClaim(pending.url);
          useGame.setState((store) => ({
            s: { ...store.s, toast: body.error || "Tyrone could not verify that claim." },
          }));
          return;
        }

        const identity = { id: body.discord, name: body.name || body.discord };
        setActiveIdentity(identity);
        useGame.setState((store) => {
          const s = cloneState(store.s);
          s.discordId = identity.id;
          s.discordName = identity.name;
          registerMember(s, identity.name, identity.name, identity.id);
          const rider = s.squad.find((member) => member.discordId === identity.id);
          if (rider) switchMember(s, rider.id);
          s.toast = `${identity.name} verified. Tyrone locked the rider identity to this account.`;
          return { s };
        });
        clearClaim(pending.url);
      } catch {
        if (cancelled) return;
        useGame.setState((store) => ({
          s: { ...store.s, toast: "Tyrone claim service is unavailable. The claim was not consumed." },
        }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
