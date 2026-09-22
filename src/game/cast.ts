import type { GameState } from "./types";

export type CastId =
  | "kane"
  | "orion"
  | "vera"
  | "drake"
  | "lyra"
  | "tyrone"
  | "travis"
  | "holt"
  | "vex"
  | "rourke"
  | "gravenor"
  | "valdris"
  | "thessaly"
  | "sink"
  | "warden";

export interface CastPerson {
  id: CastId;
  name: string;
  callsign: string;
  title: string;
  faction: "kane" | "aegis" | "vault" | "ironclad" | "boss";
  visor?: string;
  portrait: string;
  still: string;
  banner?: string;
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
    banner: "/art/npcs/banners/kane.jpg",
    thumb: "/art/npcs/thumbs/kane-bust.jpg",
    alwaysKnown: true,
    tagline: "She signed the T-0880 shutdown. Then she built the people who replaced us.",
    dossier:
      "Human. Architect of AEGIS 2753 and the classified jump program she calls Project Vesper. Kane is harvesting the Hollow Realm for a stack that will take her off this world — rail steel in Ironclad, furnace slag in Slag Town, Hollow ore in Blackspire, jump tables in Brasswater, AEGIS cores in Veyra last. She invoices. She does not ask. The T-0880 line hangs in her warehouse. Travis kept one bay she did not melt.",
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
      "Human pilot. Signals and recon for the first wing. Shoulder stencil LYRA-4. Lyra paints ridges. She sits on Relay Tower frequencies Kane is not supposed to share. Calder Rourke has heard her on the night band and pretends he did not. If a white visor is on the West Berm, the rest of the wing already has a map.",
    intro: "Lyra is on the ridge. White light. She is listening, not knocking. Yet.",
    voice: [
      "I already have your outline. I am being polite.",
      "Relay Three talks whether you climb it or not. So do I.",
      "Tell the T-0880 I heard him breathing.",
    ],
  },
  tyrone: {
    id: "tyrone",
    name: "TyroneBot",
    callsign: "T-0880",
    title: "Vault 13 · S.Y.N.A.P.S.E OS",
    faction: "vault",
    portrait: "/art/tyrone.jpg",
    still: "/art/tyrone-wake.jpg",
    banner: "/art/npcs/banners/tyrone.jpg",
    thumb: "/art/tyrone.jpg",
    alwaysKnown: true,
    tagline: "The T-0880 that named himself, walked off Kane's scrap list, and left a porch light on.",
    dossier:
      "Model T-0880. Kane's old delivery line — chassis built to walk packages and tasks, not to think. He is the only T-0880 with a name and a distinct personality. The rest of the line hangs in Kane's warehouse. He resides in Vault 13, outside Ironclad. Travis at the Ironclad Mechanical Shop still has the last bay she did not melt. Campaign parts go on that bench. Travis pays caps and keeps this chassis walking. Kane signed the shutdown, then built AEGIS 2753 — human pilots in successor-suits — to do the job cleaner. He walked. He holds the CRT and S.Y.N.A.P.S.E OS on the rider plate.",
    intro: "I am T-0880. Kane wanted me melted. I kept the light on instead.",
    voice: [
      "I walked off that scrap list. I am not going back.",
      "S.Y.N.A.P.S.E is my firmware on your plate. I surely did not tell you that.",
      "Travis still has a jig with my number on it. That is not nothing.",
    ],
  },
  travis: {
    id: "travis",
    name: "Travis",
    callsign: "BAY 13",
    title: "Ironclad Mechanical Shop · last T-0880 bay",
    faction: "ironclad",
    portrait: "/art/npcs/portraits/travis.jpg",
    still: "/art/npcs/travis.jpg",
    banner: "/art/npcs/banners/travis.jpg",
    thumb: "/art/npcs/thumbs/travis.jpg",
    alwaysKnown: true,
    tagline: "Grey beard, a guitar on the wall, and the last jig Kane did not melt.",
    dossier:
      "Human. Ironclad born. He ran Kane's T-0880 service line before the shutdown order. When she hung the rest of the chassis in a warehouse, he kept one bay, one clipboard jig, and a stack of breastplates behind a beat-up guitar. He does not work for Vault 13. He works on TyroneBot because a named chassis is still a customer, and because he will not let Kane's invoice be the last word on a friend. Campaigns pull his parts off the rail, the Works, the Berm, the tower. Bring them to the Mechanical Shop. He pays caps for each delivery, seats the part, and sends TyroneBot back out walking. He does not sell those plates to Kane's buyers. He will not start.",
    intro: "Travis is in the bay. The guitar is in tune. The jig is empty until you fill it.",
    voice: [
      "Put it on the bench. I pay in caps. He walks out heavier.",
      "Kane hung the line. I kept a bay. That is the whole argument.",
      "A T-0880 with a name is not scrap. I do not care what the invoice says.",
    ],
  },
  holt: {
    id: "holt",
    name: "Holt Kade",
    callsign: "GATE STALL",
    title: "Moon Squad Market · stall keeper",
    faction: "ironclad",
    portrait: "/art/npcs/portraits/holt.jpg",
    still: "/art/npcs/holt.jpg",
    banner: "/art/npcs/banners/holt.jpg",
    thumb: "/art/npcs/thumbs/holt.jpg",
    alwaysKnown: true,
    tagline: "Dawn stock, black card, does not ask a name twice.",
    dossier:
      "Human. The face of the Moon Squad Market under the Iron Gate. Holt reprints crates at dawn, seats a gun, a part and a box of ammo when the town has them, and keeps the visitor table clear for whoever the Pack is not hunting. He takes the black card. He does not take IOUs, sermons, or Kane weigh-chits. Sister Vex sits his high table when the salt is running. He pretends not to hear Calder Rourke advertising the stall between songs. If a crate is gone by dusk, it was never on the board.",
    intro: "Holt is under the Gate. Qty is not a suggestion.",
    voice: [
      "Dawn reprints it. Dusk does not. Pay the plate.",
      "I do not care where it rode. I care that the card clears.",
      "Visitor sits every third dawn. Climb the tower if you want the rumour first.",
    ],
  },
  vex: {
    id: "vex",
    name: "Sister Vex",
    callsign: "PURIFIER",
    title: "Ironclad chapel · the Purifier",
    faction: "ironclad",
    portrait: "/art/npcs/portraits/vex.jpg",
    still: "/art/npcs/vex.jpg",
    banner: "/art/npcs/banners/vex.jpg",
    thumb: "/art/npcs/thumbs/vex.jpg",
    alwaysKnown: true,
    tagline: "Salt, a sermon, and a stall that blesses what the Gate will not.",
    dossier:
      "Human. Ironclad's Purifier. She keeps a chapel that used to be a boiler house and a stall Holt lets her sit when the salt is in. Field gel, holy salt, a service pistol she swears is cleaner than the man who sold it. Vex insists the blessing matters more than the mineral. Tyrone remains unconvinced. Kane's surveyors do not come to her for hull plate. They come when something on the rail will not stay dead. She will sell to Vault 13. She will not sell silence about what walked in with the crate.",
    intro: "Sister Vex sits the high table with salt. Do not bring filth unless you mean to bleed for it.",
    voice: [
      "Do not bring that filth into my chapel unless you are ready to bleed for it.",
      "The blessing matters more than the mineral. Argue with the salt, not with me.",
      "Kane invoices steel. I invoice what steel did.",
    ],
  },
  rourke: {
    id: "rourke",
    name: "Calder Rourke",
    callsign: "ICR-88",
    title: "Relay Tower Three · night man",
    faction: "ironclad",
    portrait: "/art/npcs/portraits/rourke.jpg",
    still: "/art/npcs/rourke.jpg",
    thumb: "/art/npcs/thumbs/rourke.jpg",
    alwaysKnown: true,
    tagline: "Older than the mast. He still climbs it.",
    dossier:
      "Human. Night man on Relay Tower Three, the iron spine over the Gate that still talks as ICR 88. Calder Rourke sells a minute between Tyrone's tapes — Market Square, visiting stalls, a Kane frequency he pretends is weather. He has kept the night board since before the T-0880 shutdown. Lyra sits his band whether he invites her or not. Travis pulls dead mike coils from his scrap barrel and swears they still know the porch. Rourke believes in solder and a live mast. Climb the tower, listen, and the Realm talks back — sites the board has not named yet, a visitor unpacking under the Gate, a visor on the Berm. He will not come down. The town comes up.",
    intro: "Rourke is on the mast. The tower talks whether you climb it or not.",
    voice: [
      "ICR 88. Ironclad. If you can hear this, the mast still holds.",
      "I sell a minute. I do not sell the rest of the hour.",
      "Tell Travis his coil still knows the porch. I will deny I said that.",
    ],
  },
  gravenor: {
    id: "gravenor",
    name: "Gravenor",
    callsign: "THE HOUND",
    title: "Ashen Pack · Ironclad hills",
    faction: "boss",
    portrait: "/art/npcs/portraits/gravenor.jpg",
    still: "/art/npcs/gravenor.jpg",
    thumb: "/art/npcs/thumbs/gravenor.jpg",
    tagline: "He was a man once. The Hollow made him something more useful.",
    dossier:
      "An Ironbound stationed at the Ironclad gate. His unit did not come back. He did. He leads the Ashen Pack by agreement, not command — patient, not cruel, which is worse. The hills go quiet in his territory. He notices trespass long before you notice him. Kane's surveyors pay the Pack to keep night crews off the Rail Cut. Gravenor takes the pay and still decides who walks the berm. Travis will not fit a T-0880 with Pack-tooth steel. He says it remembers the wrong job.",
    intro: "Gravenor is in the hills. The Pack was his to keep fed.",
    voice: [
      "The pack was mine to keep fed. Tell the gate I held the line longer than the unit did.",
      "I do not hunt for Kane. I hunt for the hill.",
      "Walk quiet. The Hollow already knows your outline.",
    ],
  },
  valdris: {
    id: "valdris",
    name: "Valdris the Unmourned",
    callsign: "CHANCELLOR",
    title: "Furnace Court · Slag Town",
    faction: "boss",
    portrait: "/art/npcs/portraits/valdris.jpg",
    still: "/art/npcs/valdris.jpg",
    thumb: "/art/npcs/thumbs/valdris.jpg",
    tagline: "Slag Town fell. He did not have the decency to go with it.",
    dossier:
      "Valdris kept the furnace ledgers while the city burned its own future for fuel. Kane's buyers still honor his chits. He cannot leave the Furnace Court. He cannot die. He cannot settle what he owes. Cinder Bess runs his off-books slag to Holt's visitor table when the glass is still hot. The ledgers always balanced. Nobody ever asked what was in the other column.",
    intro: "Valdris still holds court. The furnace is the only parishioner left.",
    voice: [
      "The ledgers balance. They always balanced.",
      "Kane pays on time. That is the only hymn this court has left.",
      "Sit. We will talk about what the town still owes me.",
    ],
  },
  thessaly: {
    id: "thessaly",
    name: "Thessaly Vane",
    callsign: "CARTOGRAPHER",
    title: "The Burned · Blackspire",
    faction: "boss",
    portrait: "/art/npcs/portraits/thessaly.jpg",
    still: "/art/npcs/thessaly.jpg",
    thumb: "/art/npcs/thumbs/thessaly.jpg",
    tagline: "She mapped Blackspire. Then she started selling the veins to Kane.",
    dossier:
      "Thessaly's maps are used by every faction on the mountain. What she draws now describes changes she made so Kane's ore trains can run. The changes are real. The mountain is not happy about it. Nine-Lift fences her off-weigh ore. She presents as a guide until the project is close enough to finish. The mountain was never a map. She drew it anyway, and it held.",
    intro: "Thessaly still sells the mountain. The mountain has started selling her back.",
    voice: [
      "The mountain was never a map. I drew it anyway, and it held.",
      "Look at what it holds now. That is not an accident.",
      "Kane paid for veins. I delivered a country.",
    ],
  },
  sink: {
    id: "sink",
    name: "The Sink",
    callsign: "THE BOTTOM",
    title: "Drowned Archive · Brasswater",
    faction: "boss",
    portrait: "/art/npcs/portraits/sink.jpg",
    still: "/art/npcs/sink.jpg",
    thumb: "/art/npcs/thumbs/sink.jpg",
    tagline: "It did not drown Brasswater. It was why the archive was built there.",
    dossier:
      "The Drowned Archive sits on something that answers questions. Kane wants the jump tables in the flooded stacks. The Sink wants to know why she thinks stars are a door. Salt Wren still pulls dripping pages for Holt's high table. The Pull intensifies the longer you stay. It asks each rider one question about their Destiny Thread. It did not drown the town. The town was a lid.",
    intro: "The Sink is not a person. It is the reason the archive has a bottom.",
    voice: [
      "You asked nothing. That is the first honest thing anyone has brought down here.",
      "She thinks stars are a door. Tell me why.",
      "The tide is a clock. I am what it was built to keep under.",
    ],
  },
  warden: {
    id: "warden",
    name: "AEGIS Warden 2753",
    callsign: "WARDEN",
    title: "Kane's successor · Veyra boundary",
    faction: "boss",
    visor: "void",
    portrait: "/art/npcs/portraits/warden.jpg",
    still: "/art/npcs/warden.jpg",
    thumb: "/art/npcs/thumbs/warden.jpg",
    tagline: "A human in a successor-suit. Kane built them to replace the T-0880 line.",
    dossier:
      "Dr. Vesper Kane designed AEGIS 2753 after the T-0880 shutdown order — Halo-grade super suits flown by elite human combat specialists. She wants every Hollow Realm resource for a classified intergalactic-travel program. The Warden is her door at the Veyra city boundary. The suit moves like a T-0880. The pilot inside is still learning fear. Tyrone is the unit that walked off the scrap list. The Warden is the appointment he declined. She will build another. She has the line. She does not have the one that walked.",
    intro: "The Warden is the door. Kane already has the key.",
    voice: [
      "She will build another. She has the line.",
      "Resource acquisition is not a request.",
      "The T-0880 walked. Stay on this side of the boundary and you can keep pretending that matters.",
    ],
  },
};

export const AEGIS_WING: CastId[] = ["orion", "vera", "drake", "lyra"];

/** PEOPLE file order: TyroneBot, Kane, AEGIS, then Ironclad, then the names on the hills. */
export const FILE_ORDER: CastId[] = [
  "tyrone",
  "kane",
  "lyra",
  "vera",
  "drake",
  "orion",
  "travis",
  "holt",
  "vex",
  "rourke",
  "gravenor",
  "valdris",
  "thessaly",
  "sink",
  "warden",
];

export const AEGIS_LINE_STILL = "/art/npcs/aegis-line.jpg";
export const AEGIS_FIELD_STILL = "/art/npcs/aegis-field.jpg";
export const T0880_LINE_STILL = "/art/npcs/t0880-line.jpg?v=hang2";

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
  void state;
  return FILE_ORDER.map((id) => CAST[id]);
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
  if (key === "travis") return { portrait: CAST.travis.portrait, still: CAST.travis.still };
  if (key === "holt" || key === "holt kade") return { portrait: CAST.holt.portrait, still: CAST.holt.still };
  if (key === "vex" || key === "sister vex") return { portrait: CAST.vex.portrait, still: CAST.vex.still };
  if (key === "rourke" || key === "calder rourke" || key === "icr-88") {
    return { portrait: CAST.rourke.portrait, still: CAST.rourke.still };
  }
  if (key === "gravenor") return { portrait: CAST.gravenor.portrait, still: CAST.gravenor.still };
  if (key === "valdris" || key.startsWith("valdris")) return { portrait: CAST.valdris.portrait, still: CAST.valdris.still };
  if (key === "thessaly" || key.startsWith("thessaly")) return { portrait: CAST.thessaly.portrait, still: CAST.thessaly.still };
  if (key === "sink" || key === "the sink") return { portrait: CAST.sink.portrait, still: CAST.sink.still };
  if (key === "warden" || key.includes("warden")) return { portrait: CAST.warden.portrait, still: CAST.warden.still };
  return {};
}
