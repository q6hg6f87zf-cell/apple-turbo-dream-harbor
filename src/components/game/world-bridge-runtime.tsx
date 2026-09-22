import { characterForged } from "@/game/engine";
import { parseDeepTo, screenForTo } from "@/lib/bridge/catalog";
import { REGION_BOSSES } from "@/lib/bridge/continuity-core";
import { getBearerToken } from "@/lib/auth/client";
import { cooling } from "@/game/tyrone-mind";
import { speakTyrone } from "@/game/tyrone-voice";
import { useGame } from "@/game/store";
import { useEffect, useRef } from "react";
import type { GameState, TyroneBond, TyronePromise } from "@/game/types";

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

function maybeSpeak(text: string, concept: string, reason: string) {
  let said = false;
  useGame.setState((store) => {
    const s = store.s;
    said = speakTyrone(s, { text, concept, priority: 2, reason });
    if (said) cooling(s, concept, 80);
    return { s };
  });
  return said;
}

function rareIds(s: GameState) {
  return [...s.vault, ...s.operatives.flatMap((o) => o.inventory)]
    .filter((item) => item.rarity === "Legendary" || item.rarity === "Mythic")
    .map((item) => item.id);
}

export function WorldBridgeRuntime() {
  const discordId = useGame((g) => g.s.discordId);
  const started = useGame((g) => g.s.started);
  const day = useGame((g) => g.s.day);
  const loc = useGame((g) => g.s.selectedLoc);
  const poi = useGame((g) => g.s.selectedPoiId);
  const combat = useGame((g) => Boolean(g.s.combat));
  const forged = useGame((g) => characterForged(g.s));
  const missionId = useGame((g) => g.s.mission?.id ?? "");
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
  const dead = useGame((g) =>
    g.s.operatives
      .filter((o) => o.status === "dead")
      .map((o) => o.id)
      .join(","),
  );
  const rares = useGame((g) => rareIds(g.s).join(","));
  const narrativeFlags = useGame((g) =>
    Object.entries(g.s.narrative?.flags ?? {})
      .filter(([, on]) => on)
      .map(([id]) => id)
      .sort()
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
    loc: "",
    poi: "",
    deferredLoc: "",
    dead: "",
    rares: "",
    flags: "",
  });
  const missionMeta = useRef({ id: "", kind: "", loc: "", party: [] as string[] });

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
        payload: { name: op?.name, classKey: op?.cls, region: "ironclad" },
      },
    }).then((body) => {
      if (body?.utterance) maybeSpeak(String(body.utterance), "event-forge", "file cut");
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
      const boss = REGION_BOSSES[id];
      postChronicle({
        event: {
          type: "boss.defeated",
          key: `boss:${discordId}:${id}`,
          payload: { region: id, boss: boss?.name, bossId: boss?.id },
        },
      }).then((body) => {
        if (body?.utterance) maybeSpeak(String(body.utterance), `event-boss-${id}`, "named raid closed");
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

  // Narrative spine flags → continuity trigger (closes tagged promises, surfaces recall).
  useEffect(() => {
    if (!discordId) {
      seen.current.flags = narrativeFlags;
      return;
    }
    if (!seen.current.flags) {
      seen.current.flags = narrativeFlags;
      return;
    }
    if (narrativeFlags === seen.current.flags) return;
    const prev = new Set(seen.current.flags.split(",").filter(Boolean));
    seen.current.flags = narrativeFlags;
    const region = useGame.getState().s.selectedLoc;
    const poi = useGame.getState().s.selectedPoiId;
    for (const flag of narrativeFlags.split(",").filter((row) => row && !prev.has(row))) {
      postChronicle({
        trigger: {
          type: "story_flag_changed",
          region: region && region !== "hq" ? region : null,
          poi: poi ?? null,
          tags: [flag, `flag:${flag}`],
        },
        memory: {
          kind: "fact",
          claim: `Story mark: ${flag.replaceAll("_", " ")}.`,
          tags: ["story", flag],
          importance: 6,
          id: `flag:${discordId}:${flag}`,
          locationId: region && region !== "hq" ? region : undefined,
        },
      }).then((body) => {
        const hit = (body?.surface as { text?: string }[] | undefined)?.[0];
        if (hit?.text) maybeSpeak(String(hit.text), `flag-${flag}`, `story flag ${flag}`);
      });
    }
  }, [discordId, narrativeFlags]);

  useEffect(() => {
    if (!discordId) return;
    const m = useGame.getState().s.mission;
    if (m?.id) {
      missionMeta.current = { id: m.id, kind: m.kind, loc: m.locationId, party: [...m.partyIds] };
      return;
    }
    if (!missionMeta.current.id) return;
    const prev = missionMeta.current;
    missionMeta.current = { id: "", kind: "", loc: "", party: [] };
    const ops = useGame.getState().s.operatives;
    const survivors = prev.party.some((id) => {
      const o = ops.find((row) => row.id === id);
      return Boolean(o && o.hp > 0 && o.status !== "dead");
    });
    postChronicle({
      event: {
        type: survivors ? "mission.completed" : "mission.failed",
        key: `mission:${discordId}:${prev.id}`,
        payload: { region: prev.loc, kind: prev.kind, survived: survivors },
      },
    }).then((body) => {
      if (body?.utterance) maybeSpeak(String(body.utterance), `event-mission-${prev.id}`, "sortie closed");
    });
  }, [discordId, missionId]);

  useEffect(() => {
    if (!discordId || dead === seen.current.dead) {
      seen.current.dead = dead;
      return;
    }
    const prev = new Set(seen.current.dead.split(",").filter(Boolean));
    seen.current.dead = dead;
    const ops = useGame.getState().s.operatives;
    for (const id of dead.split(",").filter((row) => row && !prev.has(row))) {
      const who = ops.find((row) => row.id === id);
      postChronicle({
        event: {
          type: "character.died",
          key: `death:${discordId}:${id}`,
          payload: { name: who?.name, region: loc },
        },
      }).then((body) => {
        if (body?.utterance) maybeSpeak(String(body.utterance), `event-death-${id}`, "named death");
      });
    }
  }, [discordId, dead, loc]);

  useEffect(() => {
    if (!discordId || rares === seen.current.rares) {
      seen.current.rares = rares;
      return;
    }
    const prev = new Set(seen.current.rares.split(",").filter(Boolean));
    seen.current.rares = rares;
    const s = useGame.getState().s;
    const items = [...s.vault, ...s.operatives.flatMap((o) => o.inventory)];
    for (const id of rares.split(",").filter((row) => row && !prev.has(row))) {
      const item = items.find((row) => row.id === id);
      if (!item) continue;
      const type = item.rarity === "Mythic" || item.rarity === "Legendary" ? "legendary_item.found" : "rare_item.found";
      postChronicle({
        event: {
          type,
          key: `item:${discordId}:${id}`,
          payload: { name: item.name, region: loc, rarity: item.rarity },
        },
      });
    }
  }, [discordId, rares, loc]);

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

  function fireRegionTrigger(region: string, liveCombat: boolean) {
    const live = useGame.getState().s;
    if (liveCombat) {
      seen.current.deferredLoc = region;
      return;
    }
    postChronicle({
      trigger: {
        type: "player.entered_region",
        region,
        poi,
        combat: false,
        assist: live.tyrone?.settings?.assist ?? "normal",
        dialogue: Boolean(live.talk),
      },
    }).then((body) => {
      const hit = Array.isArray(body?.surface) ? body.surface[0] : null;
      if (!hit?.id || !hit?.text) return;
      const said = maybeSpeak(String(hit.text), "promise-" + hit.id, "canonical promise at this site");
      if (said) postChronicle({ spoken: { promiseId: hit.id } });
    });
  }

  useEffect(() => {
    if (!discordId || !loc) return;
    if (seen.current.loc === loc) return;
    seen.current.loc = loc;
    fireRegionTrigger(loc, combat);
  }, [discordId, loc, poi, combat]);

  useEffect(() => {
    if (!discordId || combat) return;
    if (!seen.current.deferredLoc) return;
    if (seen.current.deferredLoc !== loc) {
      seen.current.deferredLoc = "";
      return;
    }
    seen.current.deferredLoc = "";
    fireRegionTrigger(loc ?? "", false);
  }, [discordId, combat, loc]);

  useEffect(() => {
    if (!discordId || !poi) return;
    if (seen.current.poi === poi) return;
    seen.current.poi = poi;
    const live = useGame.getState().s;
    if (live.combat) return;
    postChronicle({
      trigger: {
        type: "player.entered_poi",
        region: loc,
        poi,
        combat: false,
        assist: live.tyrone?.settings?.assist ?? "normal",
        dialogue: Boolean(live.talk),
      },
    }).then((body) => {
      const hit = Array.isArray(body?.surface) ? body.surface[0] : null;
      if (hit?.id && hit?.text) {
        const said = maybeSpeak(String(hit.text), "promise-" + hit.id, "canonical promise at this site");
        if (said) postChronicle({ spoken: { promiseId: hit.id } });
      }
    });
  }, [discordId, poi, loc]);

  return null;
}
