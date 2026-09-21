import { characterForged } from "@/game/engine";
import { parseDeepTo, screenForTo } from "@/lib/bridge/catalog";
import { getBearerToken } from "@/lib/auth/client";
import { cooling } from "@/game/tyrone-mind";
import { speakTyrone } from "@/game/tyrone-voice";
import { useGame } from "@/game/store";
import { useEffect, useRef } from "react";
import type { TyroneBond, TyronePromise } from "@/game/types";

function headers() {
  const token = getBearerToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function postChronicle(body: unknown) {
  return fetch("/api/hollow/chronicle", {
    method: "POST",
    credentials: "include",
    headers: headers(),
    body: JSON.stringify(body),
  })
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => null);
}

export function WorldBridgeRuntime() {
  const discordId = useGame((g) => g.s.discordId);
  const started = useGame((g) => g.s.started);
  const day = useGame((g) => g.s.day);
  const loc = useGame((g) => g.s.selectedLoc);
  const poi = useGame((g) => g.s.selectedPoiId);
  const forged = useGame((g) => characterForged(g.s));
  const bossFlags = useGame((g) =>
    Object.entries(g.s.locations)
      .filter(([, row]) => row.bossDefeated)
      .map(([id]) => id)
      .join(","),
  );
  const unlocked = useGame((g) =>
    Object.entries(g.s.locations)
      .filter(([, row]) => row.unlocked)
      .map(([id]) => id)
      .join(","),
  );
  const lastPromise = useGame((g) => g.s.tyrone?.promises.at(-1)?.text ?? "");
  const lastEpisode = useGame((g) => g.s.tyrone?.episodic.at(-1)?.id ?? "");
  const kept = useGame((g) =>
    (g.s.tyrone?.promises ?? [])
      .filter((row) => row.kept && String(row.id).startsWith("prm-"))
      .map((row) => row.id)
      .join(","),
  );
  const hydrated = useGame((g) => g.hydrated);
  const seen = useRef({
    forged: false,
    day: 0,
    bosses: "",
    unlocks: "",
    promise: "",
    episode: "",
    dest: false,
    kept: "",
    loc: "",
  });

  useEffect(() => {
    if (!hydrated || seen.current.dest) return;
    const params = new URLSearchParams(window.location.search);
    const dest = parseDeepTo(params.get("to"));
    const stored = parseDeepTo(sessionStorage.getItem("hr_to"));
    const to = dest ?? stored;
    if (dest) sessionStorage.setItem("hr_to", dest);
    if (!to || !started) return;
    seen.current.dest = true;
    const screen = screenForTo(to);
    useGame.getState().setScreen(screen);
    const region = params.get("region") || sessionStorage.getItem("hr_region");
    if (region && ["ironclad", "slagtown", "blackspire", "brasswater", "veyra", "kingdom", "caverns", "library"].includes(region)) {
      useGame.getState().selectLoc(region as never);
    }
  }, [hydrated, started]);

  useEffect(() => {
    if (!discordId) return;
    fetch("/api/hollow/chronicle", { credentials: "include", headers: headers() })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (!body) return;
        useGame.setState((store) => {
          const semantic = [...store.s.tyrone.semantic];
          for (const mem of (body.memories ?? []) as { id: string; kind: string; claim: string; tags?: string[] }[]) {
            if (mem.kind !== "fact" && mem.kind !== "promise" && mem.kind !== "episode") continue;
            if (semantic.some((row) => row.id === mem.id)) continue;
            semantic.push({ id: mem.id, claim: mem.claim, evidence: 1, tags: mem.tags ?? [mem.kind] });
          }
          const promises: TyronePromise[] = [...store.s.tyrone.promises];
          for (const row of (body.promises ?? []) as {
            id: string;
            subject: string;
            status: string;
            locationId?: string | null;
            poiId?: string | null;
          }[]) {
            const existing = promises.find((p) => p.id === row.id);
            if (existing) {
              existing.kept = row.status !== "active";
              existing.locationId = row.locationId ?? existing.locationId;
              existing.poiId = row.poiId ?? existing.poiId;
              continue;
            }
            promises.push({
              id: row.id,
              text: row.subject,
              locationId: row.locationId ?? undefined,
              poiId: row.poiId ?? undefined,
              day: store.s.day,
              kept: row.status !== "active",
            });
          }
          const relationship = body.relationship
            ? ({ ...store.s.tyrone.relationship, ...body.relationship } as TyroneBond)
            : store.s.tyrone.relationship;
          return {
            s: {
              ...store.s,
              tyrone: {
                ...store.s.tyrone,
                semantic: semantic.slice(-24),
                promises: promises.slice(-12),
                relationship,
              },
            },
          };
        });
      })
      .catch(() => {});
  }, [discordId]);

  useEffect(() => {
    if (!discordId || !forged || seen.current.forged) return;
    seen.current.forged = true;
    const op = useGame.getState().s.operatives[0];
    postChronicle({
      event: {
        type: "character.forged",
        key: `forge:${discordId}:${op?.id ?? "file"}`,
        payload: { name: op?.name, classKey: op?.cls },
      },
      memory: {
        kind: "episode",
        id: `forge-${op?.id ?? discordId}`,
        claim: `${op?.name ?? "A rider"} cut their file. The Machine Shop closed.`,
        importance: 8,
        tags: ["forge", "character"],
      },
    });
  }, [discordId, forged]);

  useEffect(() => {
    if (!discordId || !seen.current.day) {
      seen.current.day = day;
      return;
    }
    if (day <= seen.current.day) return;
    seen.current.day = day;
    postChronicle({
      event: { type: "campaign.day_advanced", key: `day:${discordId}:${day}`, payload: { day } },
    });
  }, [discordId, day]);

  useEffect(() => {
    if (!discordId || !bossFlags || bossFlags === seen.current.bosses) {
      seen.current.bosses = bossFlags;
      return;
    }
    const prev = new Set(seen.current.bosses.split(",").filter(Boolean));
    seen.current.bosses = bossFlags;
    for (const id of bossFlags.split(",").filter((row) => row && !prev.has(row))) {
      postChronicle({
        event: { type: "boss.defeated", key: `boss:${discordId}:${id}`, payload: { region: id } },
        memory: {
          kind: "episode",
          id: `boss-${id}`,
          claim: `The named raid in ${id} is over.`,
          importance: 9,
          tags: ["boss", id],
        },
      });
    }
  }, [discordId, bossFlags]);

  useEffect(() => {
    if (!discordId || !unlocked || unlocked === seen.current.unlocks) {
      seen.current.unlocks = unlocked;
      return;
    }
    const prev = new Set(seen.current.unlocks.split(",").filter(Boolean));
    seen.current.unlocks = unlocked;
    for (const id of unlocked.split(",").filter((row) => row && !prev.has(row))) {
      postChronicle({
        event: { type: "region.unlocked", key: `unlock:${discordId}:${id}`, payload: { region: id } },
      });
    }
  }, [discordId, unlocked]);

  useEffect(() => {
    if (!discordId || !lastPromise || lastPromise === seen.current.promise) {
      seen.current.promise = lastPromise;
      return;
    }
    seen.current.promise = lastPromise;
    postChronicle({
      event: { type: "tyrone.promise_created", key: `prom:${discordId}:${lastPromise.slice(0, 40)}`, payload: { claim: lastPromise } },
      memory: { kind: "promise", claim: lastPromise, importance: 6, tags: ["promise"] },
    });
  }, [discordId, lastPromise]);

  useEffect(() => {
    if (!discordId || !lastEpisode || lastEpisode === seen.current.episode) {
      seen.current.episode = lastEpisode;
      return;
    }
    seen.current.episode = lastEpisode;
    const ep = useGame.getState().s.tyrone.episodic.find((row) => row.id === lastEpisode);
    if (!ep || ep.importance < 5) return;
    postChronicle({
      memory: {
        kind: "episode",
        id: ep.id,
        claim: ep.description,
        importance: ep.importance,
        tags: ep.tags,
        locationId: ep.locationId,
      },
    });
  }, [discordId, lastEpisode]);

  useEffect(() => {
    if (!discordId || !loc) return;
    if (seen.current.loc === loc) return;
    seen.current.loc = loc;
    const live = useGame.getState().s;
    postChronicle({
      trigger: {
        type: "player.entered_region",
        region: loc,
        poi,
        combat: Boolean(live.combat),
        assist: live.tyrone?.settings?.assist ?? "normal",
      },
    }).then((body) => {
      const hit = Array.isArray(body?.surface) ? body.surface[0] : null;
      if (!hit?.id || !hit?.text) return;
      let said = false;
      useGame.setState((store) => {
        const s = store.s;
        said = speakTyrone(s, {
          text: String(hit.text),
          concept: "promise-" + hit.id,
          priority: 2,
          reason: "canonical promise at this site",
        });
        if (said) {
          cooling(s, "promise-" + hit.id, 80);
          const row = s.tyrone.promises.find((p) => p.id === hit.id);
          if (row && hit.fulfillOnSpeak) row.kept = true;
        }
        return { s };
      });
      if (!said) return;
      postChronicle({ spoken: { promiseId: hit.id } });
      if (hit.fulfillOnSpeak) postChronicle({ promise: { action: "fulfill", id: hit.id } });
    });
  }, [discordId, loc, poi]);

  useEffect(() => {
    if (!discordId || !kept || kept === seen.current.kept) {
      seen.current.kept = kept;
      return;
    }
    const prev = new Set(seen.current.kept.split(",").filter(Boolean));
    seen.current.kept = kept;
    for (const id of kept.split(",").filter((row) => row && !prev.has(row))) {
      postChronicle({ promise: { action: "fulfill", id } });
    }
  }, [discordId, kept]);

  return null;
}
