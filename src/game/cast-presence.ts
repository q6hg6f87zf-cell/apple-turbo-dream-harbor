/**
 * Reactive cast presence — Oblivion-style: NPCs greet from the world state,
 * not a static dossier dump. Queues short talk scripts keyed by flags.
 */
import { meetCast, type CastId } from "./cast";
import { hasFlag, ensureNarrative } from "./narrative-state";
import { availableScenarios } from "./scenario";
import { queueTalk } from "./talk";
import type { GameState } from "./types";

/** Pick and queue a short presence script for a cast member at a site. */
export function queueCastPresence(state: GameState, castId: CastId, force = false): string | null {
  ensureNarrative(state);
  meetCast(state, castId);
  const script = pickCastScript(state, castId);
  if (!script) return null;
  queueTalk(state, script, force);
  return script;
}

export function pickCastScript(state: GameState, castId: CastId): string | null {
  switch (castId) {
    case "travis":
      if ((state.travis?.fitted.length ?? 0) >= 3 || hasFlag(state, "travis_jig_filled")) return "travis_filled";
      if (hasFlag(state, "travis_refused")) return "travis_cold";
      if (availableScenarios(state).some((s) => s.id === "travis_bay")) return "travis_open";
      if ((state.travis?.fitted.length ?? 0) >= 1) return "travis_fit";
      return "travis";
    case "lyra":
      if (hasFlag(state, "lyra_fought")) return "lyra_scar";
      if (hasFlag(state, "lyra_hid")) return "lyra_shadow";
      if (hasFlag(state, "lyra_lied")) return "lyra_lie";
      if (hasFlag(state, "halo_ambushed") || hasFlag(state, "halo_reported")) return "lyra_halo";
      return "lyra_berm";
    case "rourke":
      if (hasFlag(state, "invoice_copied") || hasFlag(state, "invoice_sold") || hasFlag(state, "invoice_burned"))
        return "rourke_invoice";
      if (hasFlag(state, "caravan_investigated") || hasFlag(state, "caravan_staged")) return "rourke_caravan";
      if (hasFlag(state, "vesper_named")) return "rourke_vesper";
      return "rourke_mast";
    case "holt":
      if ((state.kaneHeat ?? 0) >= 10) return "holt_heat";
      if (hasFlag(state, "vesper_named")) return "holt_vesper";
      return "holt_gate";
    case "kane":
      return null; // Kane stays recording-only
    default:
      return null;
  }
}

/** When a situation opens at a cast-linked site, whisper a presence cue. */
export function presenceLineForSituation(state: GameState, scenarioId: string): string | null {
  if (scenarioId === "travis_bay") return "Travis is in the bay. The guitar is quiet. That is worse.";
  if (scenarioId === "halo_yard") return "The square still smells like spent cells.";
  if (scenarioId === "vesper_invoice") return "The gatehouse table is still warm.";
  if (scenarioId.startsWith("caravan")) return "Tracks in the slag. Someone wants an audience.";
  if (scenarioId === "slag_ledger") return "Furnace Court keeps books that do not burn.";
  if (scenarioId === "spire_lift") return "The cage rattles whether anyone rides it or not.";
  return null;
}
