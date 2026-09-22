/**
 * Radio as world reaction — short ICR / porch bulletins driven by narrative flags.
 * Text-only overlays on dawn/night; does not replace tape audio.
 */
import { availableScenarios } from "./scenario";
import { ensureNarrative, hasFlag, type NarrativeFlagId } from "./narrative-state";
import type { GameState } from "./types";

interface Bulletin {
  id: string;
  line: string;
  /** Prefer this flag having just been set, else any true flag. */
  flag?: NarrativeFlagId;
  minDay?: number;
}

const BULLETINS: Bulletin[] = [
  {
    id: "lyra-hide",
    flag: "lyra_hid",
    line: "ICR 88 · West Berm reported dark. Surveyors call it a foundry night. Somebody is lying.",
  },
  {
    id: "lyra-fight",
    flag: "lyra_fought",
    line: "ICR 88 · Armed contact on the Berm. White light answered. The wing is writing names.",
  },
  {
    id: "lyra-lie",
    flag: "lyra_lied",
    line: "ICR 88 · Gate chatter says Vault 13 is just another mill. Lyra's frequency stayed open anyway.",
  },
  {
    id: "caravan-staged",
    flag: "caravan_staged",
    line: "ICR 88 · Missing weigh-in ruled theater. Kane's buyers want whoever wrote the script.",
  },
  {
    id: "caravan-gone",
    flag: "caravan_abandoned",
    line: "ICR 88 · Caravan still missing. Propaganda hour blames 'porch riders who would not look.'",
  },
  {
    id: "caravan-ok",
    flag: "caravan_survived",
    line: "ICR 88 · Partial steel recovered east of the Gate. Serials do not match the invoice. Curious.",
  },
  {
    id: "travis-on",
    flag: "travis_jig_filled",
    line: "ICR 88 · Mechanical Shop bay lit after midnight. Kane's buyers do not like competition.",
  },
  {
    id: "travis-off",
    flag: "travis_refused",
    line: "ICR 88 · Travis's bay stays empty. Spot ad: 'T-0880 work refused. Try Veyra.'",
  },
  {
    id: "halo",
    flag: "halo_reported",
    line: "ICR 88 · Halo Yard foot traffic. Old AEGIS paint. Someone is counting frames again.",
  },
  {
    id: "halo-hot",
    flag: "halo_ambushed",
    line: "ICR 88 · Discharge reported at Halo Yard. Officially a drill. Unofficially a warning.",
  },
  {
    id: "invoice-copy",
    flag: "invoice_copied",
    line: "ICR 88 · Weigh-chit rumor: a second copy of Project Vesper serials is in play. Kane denies the name.",
  },
  {
    id: "invoice-burn",
    flag: "invoice_burned",
    line: "ICR 88 · Gatehouse fire, contained. Books incomplete. Buyers angry. That is not weather.",
  },
  {
    id: "invoice-sold",
    flag: "invoice_sold",
    line: "ICR 88 · Cooperative salvage noted at the Gate. Caps moved. Loyalty is a rumor with a receipt.",
  },
  {
    id: "vesper",
    flag: "vesper_named",
    line: "ICR 88 · Stencil watch: V-E-S-P-E-R. Station will neither confirm nor stop saying it.",
    minDay: 3,
  },
  {
    id: "ending",
    flag: "ending_ready",
    line: "Vault 13 porch · The tape loops. Your version of the Hollow is already on the air.",
  },
  {
    id: "slag-chit",
    flag: "slag_chit_paid",
    line: "ICR 88 · Furnace Court cleared a Vault 13 chit. Kane's buyers smiled. That is never free.",
  },
  {
    id: "slag-forge",
    flag: "slag_chit_forged",
    line: "ICR 88 · Twin slag chits in circulation. Ledger clerks are counting twice.",
  },
  {
    id: "spire-ride",
    flag: "spire_cage_ridden",
    line: "ICR 88 · Empty cage, extra passenger. Blackspire ore crews want hazard pay.",
  },
];

/** Pick a bulletin that matches current flags (newest journal-adjacent first). */
export function radioBulletinFor(state: GameState): string | null {
  ensureNarrative(state);
  for (const row of [...BULLETINS].reverse()) {
    if (row.minDay && state.day < row.minDay) continue;
    if (row.flag && hasFlag(state, row.flag)) return row.line;
  }
  const open = availableScenarios(state)[0];
  if (open) {
    return `ICR 88 · Situation open: ${open.title}. The station will get it wrong. You do not have to.`;
  }
  return null;
}

/** Fold a bulletin into dawn/night copy without wiping authored nightNotes. */
export function applyRadioWorldNote(state: GameState): string | null {
  const line = radioBulletinFor(state);
  if (!line) return null;
  if (state.nightNote && state.nightNote.includes("ICR 88")) return state.nightNote;
  state.nightNote = state.nightNote ? `${state.nightNote} ${line}` : line;
  return line;
}
