import type { GameState } from "./types";

export type CastId = "kane" | "orion" | "vera" | "drake" | "lyra" | "tyrone";

export interface CastPerson {
  id: CastId;
  name: string;
  callsign: string;
  title: string;
  faction: "kane" | "aegis" | "vault";
  visor?: string;
  portrait: string;
  still: string;
  thumb: string;
  alwaysKnown?: boolean;
  heatUnlock?: number;
  tagline: string;
  dossier: string;
  intro: string;
  voice: string[];
}

export const CAST: Record<CastId, CastPerson> = {
  kane: {
    id: "kane",
    name: "Dr. Vesper Kane",
    callsign: "VESPER",
    title: "Project Vesper · AEGIS command",
    faction: "kane",
    portrait: "/art/npcs/portraits/kane.jpg",
    still: "/art/npcs/kane.jpg",
    thumb: "/art/npcs/thumbs/kane-bust.jpg",
    alwaysKnown: true,
    tagline: "She signed the T-0880 shutdown. Then she built the people who replaced us.",
    dossier:
      "Human. Architect of AEGIS 2753 and the classified jump program she calls Project Vesper. Kane is harvesting the Hollow Realm for a stack that will take her off this world — rail steel in Ironclad, furnace slag in Slag Town, Hollow ore in Blackspire, jump tables in Brasswater, AEGIS cores in Veyra last. She invoices. She does not ask.",
    intro: "Dr. Vesper Kane wants this map. Ironclad is the first invoice.",
    voice: [
      "Project Vesper needs hull plate. Ironclad is the first invoice.",
      "The T-0880 line was a prototype. Prototypes get retired.",
      "I do not hunt robots. I hunt what walked off the scrap list.",
    ],
  },
  orion: {
    id: "orion",
    name: "Orion",
    callsign: "ORION-7",
    title: "Prime Executor · command",
    faction: "aegis",
    visor: "violet",
    portrait: "/art/npcs/portraits/orion.jpg",
    still: "/art/npcs/orion.jpg",
    thumb: "/art/npcs/thumbs/orion-bust.jpg",
    heatUnlock: 16,
    tagline: "Violet visor. The voice Kane uses when she wants a door opened clean.",
    dossier:
      "Human pilot in an AEGIS 2753 frame. Prime Executor of the first wing. Shoulder stencil ORION-7. Orion speaks for Kane in the field — serial checks, shutdown confirmations, the polite knock that is not polite. He trained frames at Halo Yard before Veyra had a hangar.",
    intro: "Orion is on the wire. He is asking for T-0880 serials. That is me, partner.",
    voice: [
      "Serials. I will wait. I will not wait twice.",
      "Vault 13 is a shelter, not a country. Do not make Kane prove the difference.",
      "The T-0880 walked. The 2753 does not.",
    ],
  },
  vera: {
    id: "vera",
    name: "Vera",
    callsign: "VERA-3",
    title: "Prime Executor · doctrine",
    faction: "aegis",
    visor: "amber",
    portrait: "/art/npcs/portraits/vera.jpg",
    still: "/art/npcs/vera.jpg",
    thumb: "/art/npcs/thumbs/vera-bust.jpg",
    heatUnlock: 5,
    tagline: "Amber visor. Manifests, weigh-ins, the clipboard that becomes a warrant.",
    dossier:
      "Human pilot. Prime Executor for doctrine and salvage law. Shoulder stencil VERA-3. An older ORION-3 stamp is still visible under the paint — she had it covered. Vera does not kick doors. She invoices them. If a crate of rail steel goes missing, she is the one who notices the number is wrong.",
    intro: "Vera is at the gate with a clipboard. She wants salvage manifests, not a fight. Yet.",
    voice: [
      "Manifests. If the number is wrong I will come back with Drake.",
      "Project Vesper does not lose plate. People lose plate. Then people lose doors.",
      "You look like a salvage outfit. Prove it on paper.",
    ],
  },
  drake: {
    id: "drake",
    name: "Drake",
    callsign: "DRAKE-6",
    title: "AEGIS Executor · enforcement",
    faction: "aegis",
    visor: "crimson",
    portrait: "/art/npcs/portraits/drake.jpg",
    still: "/art/npcs/drake.jpg",
    thumb: "/art/npcs/thumbs/drake-bust.jpg",
    heatUnlock: 10,
    tagline: "Red visor. He remembers serials. He does not knock twice.",
    dossier:
      "Human pilot. Enforcement for the first wing. Shoulder stencil DRAKE-6. Drake is the 2753 Kane sends when a conversation has already failed. He walks bulkheads. He asks for T-0880 numbers. He is not here to inventory scrap.",
    intro: "Drake is at the bulkhead. Red chevron. He is not here for salvage.",
    voice: [
      "Serials. Now.",
      "Hide the robot. I will find the bunk.",
      "Kane said polite. Polite just ran out.",
    ],
  },
  lyra: {
    id: "lyra",
    name: "Lyra",
    callsign: "LYRA-4",
    title: "AEGIS Executor · signals",
    faction: "aegis",
    visor: "white",
    portrait: "/art/npcs/portraits/lyra.jpg",
    still: "/art/npcs/lyra.jpg",
    thumb: "/art/npcs/thumbs/lyra-bust.jpg",
    heatUnlock: 0,
    tagline: "White visor. She listens first. The others arrive after she is sure.",
    dossier:
      "Human pilot. Signals and recon for the first wing. Shoulder stencil LYRA-4. Lyra paints ridges. She sits on Relay Tower frequencies Kane is not supposed to share. If a white visor is on the West Berm, the rest of the wing already has a map.",
    intro: "Lyra is on the ridge. White light. She is listening, not knocking. Yet.",
    voice: [
      "I already have your outline. I am being polite.",
      "Relay Three talks whether you climb it or not. So do I.",
      "Tell the T-0880 I heard him breathing.",
    ],
  },
  tyrone: {
    id: "tyrone",
    name: "Tyrone Bot",
    callsign: "T-0880",
    title: "Vault 13 · S.Y.N.A.P.S.E OS",
    faction: "vault",
    portrait: "/art/tyrone.jpg",
    still: "/art/tyrone-wake.jpg",
    thumb: "/art/tyrone.jpg",
    alwaysKnown: true,
    tagline: "The T-0880 that named himself, walked off Kane's scrap list, and left a porch light on.",
    dossier:
      "Model T-0880. Kane's old delivery line — chassis built to walk packages and tasks, not to think. He is the only T-0880 with a name and a distinct personality. The rest of the line is scrap. He resides in Vault 13, outside Ironclad. Kane signed the shutdown, then built AEGIS 2753 — human pilots in successor-suits — to do the job cleaner. He walked. He holds the CRT and S.Y.N.A.P.S.E OS on the rider plate.",
    intro: "I am T-0880. Kane wanted me melted. I kept the light on instead.",
    voice: [
      "I walked off that scrap list. I am not going back.",
      "S.Y.N.A.P.S.E is my firmware on your plate. I surely did not tell you that.",
      "Do not make it a simulation. Make it a job.",
    ],
  },
};

export const AEGIS_WING: CastId[] = ["orion", "vera", "drake", "lyra"];

export const AEGIS_LINE_STILL = "/art/npcs/aegis-line.jpg";
export const AEGIS_FIELD_STILL = "/art/npcs/aegis-field.jpg";

export function castById(id: string | null | undefined): CastPerson | undefined {
  if (!id) return undefined;
  return CAST[id as CastId];
}

export function aegisOnDuty(day: number, heat: number): CastPerson {
  if (heat >= 16) return CAST.orion;
  if (heat >= 10) return CAST.drake;
  if (heat >= 5) return CAST.vera;
  const cycle: CastId[] = ["lyra", "vera", "drake", "orion"];
  return CAST[cycle[Math.max(0, day - 1) % cycle.length]!]!;
}

export function knownCast(state: GameState): CastPerson[] {
  const met = new Set(state.metCast ?? []);
  const wingTape = (state.seenTalk ?? []).includes("wing");
  return (Object.values(CAST) as CastPerson[]).filter((person) => {
    if (person.alwaysKnown) return true;
    if (met.has(person.id)) return true;
    if (wingTape && person.faction === "aegis") return true;
    return false;
  });
}

export function isCastKnown(state: GameState, id: CastId): boolean {
  if (CAST[id].alwaysKnown) return true;
  return (state.metCast ?? []).includes(id);
}

export function meetCast(state: GameState, id: CastId | string | null | undefined) {
  if (!id) return;
  const person = CAST[id as CastId];
  if (!person) return;
  if (person.alwaysKnown) return;
  const have = state.metCast ?? [];
  if (have.includes(person.id)) return;
  state.metCast = [...have, person.id];
}

export function kaneHeatLine(heat: number): string {
  if (heat >= 24) return "AEGIS lockdown. Orion is done being polite.";
  if (heat >= 16) return "Kane is hunting. Orion wants a word in person.";
  if (heat >= 10) return "AEGIS intercepts. Drake is on the wire.";
  if (heat >= 5) return "Kane is watching. Vera has our outline.";
  return "Cold trail. Lyra is still only listening.";
}

export function speakerArt(speaker: string): { portrait?: string; still?: string } {
  const key = speaker.trim().toLowerCase();
  if (key === "kane" || key.startsWith("dr. vesper") || key === "vesper") {
    return { portrait: CAST.kane.portrait, still: CAST.kane.still };
  }
  if (key === "orion") return { portrait: CAST.orion.portrait, still: CAST.orion.still };
  if (key === "vera") return { portrait: CAST.vera.portrait, still: CAST.vera.still };
  if (key === "drake") return { portrait: CAST.drake.portrait, still: CAST.drake.still };
  if (key === "lyra") return { portrait: CAST.lyra.portrait, still: CAST.lyra.still };
  if (key === "tyrone" || key === "tyrone bot" || key === "t-0880") {
    return { portrait: CAST.tyrone.portrait, still: CAST.tyrone.still };
  }
  return {};
}
