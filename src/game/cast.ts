import type { AmmoType, GameState, WeaponFamily } from "./types";

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

/** A named piece issued to one pilot. Not stock. Not for sale. */
export interface IssuePiece {
  name: string;
  plate: string;
  family: WeaponFamily;
  /** What it is chambered for, in the same voice as "12 gauge". */
  chamber: string;
  damage: string;
  /** Range, armor, and the habit of the weapon. Not a second paragraph. */
  traits: string;
  ammoType?: AmmoType;
  magSize?: number;
  art: string;
  line: string;
  lore: string;
}

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
  /** Signature gun, then the melee every 2753 carries. Unique to this pilot. */
  issue?: readonly [IssuePiece, IssuePiece];
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
    dossier: "Dr. Vesper Kane helped build prewar Project Vesper under the Continuity Mandate. Human leaders granted CIVITAS sovereign override; its refusal of shutdown drove the AI War. Postwar SHEPHERD pursues Earth restoration and off-world engineering. The moral question is who can refuse its command.",
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
    title: "Prime Executor · elite",
    faction: "aegis",
    visor: "violet",
    portrait: "/art/npcs/portraits/orion.jpg",
    still: "/art/npcs/orion.jpg",
    thumb: "/art/npcs/thumbs/orion-bust.jpg",
    heatUnlock: 16,
    tagline: "Violet visor. Elite of the 2753. The lance opens the room. His hands close it.",
    dossier:
      "Human pilot. Elite of the elite AEGIS 2753 — the frame Kane builds when the rest of the wing is not enough. Shoulder stencil ORION-7. He is a hand-to-hand specialist first. The Halo Lance is his gun, and it is not a bullet gun: a violet plasma cell, six to the magazine, 2d8 with AP 2, fired offhand so the other hand stays a fist. Seven's Cestus is 1d10+1 up close, AP 1, and that is the fight he trained at Halo Yard before Veyra had a hangar. Serial checks are how he starts. They are not how he ends. No other pilot is signed for the lance. Kane keeps the spare cell in her own case, and she does not explain the color.",
    intro: "Orion is on the wire. Violet plasma, and he fights with his hands. He is asking for T-0880 serials. That is me, partner.",
    voice: [
      "Serials. I will wait. I will not wait twice.",
      "The lance is for the doorway. I am for whoever is standing in it.",
      "Vault 13 is a shelter, not a country. Do not make Kane prove the difference.",
    ],
    issue: [
      {
        name: "Halo Lance",
        plate: "Plasma",
        family: "energy",
        chamber: "plasma cell",
        damage: "2d8",
        traits: "AP 2 · mid · offhand · mag 6",
        ammoType: "violet-plasma",
        magSize: 6,
        art: "/art/items/halo-lance.jpg",
        line: "Violet plasma cell. Six shots. His alone.",
        lore: "Halo Yard issue, and only ORION-7 signs for it. Chambered for a violet plasma cell, not a cartridge — six in the weapon, 2d8, AP 2, accurate enough to fire with the off hand. Kane hands these out herself. The lance opens the room. It is not the fight he came for.",
      },
      {
        name: "Seven's Cestus",
        plate: "Hand",
        family: "melee",
        chamber: "melee",
        damage: "1d10+1",
        traits: "AP 1 · close · the hand he trained",
        art: "/art/items/sevens-cestus.jpg",
        line: "Knuckle edge. He would rather be here.",
        lore: "Left-hand plate with a finger-wide edge. 1d10+1, AP 1, and it only works at the distance of a conversation. He trained frames at Halo Yard with this on. Every 2753 carries a melee. This is the one the elite one refused to give up, and the lance exists so he can reach it.",
      },
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
    tagline: "Amber visor. She invoices the crate, then the magazine.",
    dossier:
      "Human pilot. Prime Executor for doctrine and salvage law, and the rifle when the paper is refused. Shoulder stencil VERA-3. An older stamp is still visible under the paint — she had it covered. Her gun is the Manifest, and it is not the 5.56 in Kane's crates. It is chambered 6.8×51, thirty rounds, select-fire, 1d10+1 with AP 1 at mid range, and the counter in the receiver will not let a magazine lie. The Warrant Spike is 1d8, AP 1, for the hinge that will not sign. She logs the rounds the way she logs the plate. A wrong number on either is how Drake gets a door.",
    intro: "Vera is at the gate. Amber rifle, 6.8 in the mag, manifest in the other hand. She wants the numbers, not a fight. Yet.",
    voice: [
      "Manifests. If the number is wrong I will come back with Drake.",
      "I count crates. I count rounds. Do not make either of them wrong.",
      "You look like a salvage outfit. Prove it on paper.",
    ],
    issue: [
      {
        name: "Manifest",
        plate: "Rifle",
        family: "rifle",
        chamber: "6.8×51",
        damage: "1d10+1",
        traits: "AP 1 · mid · select-fire · mag 30",
        ammoType: "6.8",
        magSize: 30,
        art: "/art/items/manifest-rifle.jpg",
        line: "Not 5.56. She counts every round.",
        lore: "VERA-3 issue. Select-fire assault rifle, amber grip and stock, chambered 6.8×51 — heavier than the surplus rifles, thirty in the magazine, 1d10+1 and AP 1 inside a street. A mechanical counter is cut into the receiver where a smith would put a name. Surplus 2753 rifles exist. This chamber does not leave her sling. If the window and the page disagree, someone is about to meet Drake.",
      },
      {
        name: "Warrant Spike",
        plate: "Spike",
        family: "melee",
        chamber: "melee",
        damage: "1d8",
        traits: "AP 1 · close · she writes the hole down",
        art: "/art/items/warrant-spike.jpg",
        line: "Short. For hinges that will not sign.",
        lore: "Every 2753 carries steel for when the gun is the wrong distance. Vera's is a short spike, 1d8, AP 1, amber wrap. She does not kick doors. She puts this through the hinge and logs the repair on the same page as the 6.8. Doctrine has a point when the manifest does not.",
      },
    ],
  },
  drake: {
    id: "drake",
    name: "Drake",
    callsign: "DRAKE-6",
    title: "AEGIS Executor · twelve-gauge",
    faction: "aegis",
    visor: "crimson",
    portrait: "/art/npcs/portraits/drake.jpg",
    still: "/art/npcs/drake.jpg",
    thumb: "/art/npcs/thumbs/drake-bust.jpg",
    heatUnlock: 10,
    tagline: "Red visor. Stern. He remembers serials. The twelve-gauge does not ask twice.",
    dossier:
      "Human pilot. Enforcement for the first wing, and the stern one. Shoulder stencil DRAKE-6. Kane sends him when a conversation has already failed. His gun is the Bulkhead Twelve — 12 gauge, 3-inch magnum buck, five in the box, 2d8 inside a doorway and nothing worth saying past the street. Recoil is part of the argument. Second Knock is the maul, 1d10, flat-faced, and it does not care if the thing in the way is a hinge or a rib. He asks for T-0880 numbers once. The shotgun is the second ask. He loads the same shells every time. He does not own a choke for distance, and he is not here to inventory scrap.",
    intro: "Drake is at the bulkhead. Red chevron. Stern. Twelve-gauge magnum buck, already off the sling.",
    voice: [
      "Serials. Now.",
      "Hide the robot. I will find the bunk.",
      "One word. Then the twelve. Do not make me count.",
    ],
    issue: [
      {
        name: "Bulkhead Twelve",
        plate: "12ga",
        family: "shotgun",
        chamber: "12 gauge · 3\" buck",
        damage: "2d8",
        traits: "AP 0 · close · doorway · mag 5",
        ammoType: "12g-magnum",
        magSize: 5,
        art: "/art/items/bulkhead-twelve.jpg",
        line: "Magnum buck. Pattern dies in the street.",
        lore: "DRAKE-6 issue. Short twelve-gauge, box of five, heat shield the color of his visor. The load is 3-inch magnum buck: 2d8 in a bulkhead, AP 0, and the pattern is gone before the curb. He does not carry a second long gun. He carries more of the same shell. Stern men do not improvise their tools, and they do not own a choke for a street.",
      },
      {
        name: "Second Knock",
        plate: "Maul",
        family: "melee",
        chamber: "melee",
        damage: "1d10",
        traits: "close · flat face · hinges and ribs",
        art: "/art/items/second-knock.jpg",
        line: "The knock after the voice.",
        lore: "Every 2753 has a melee. Drake's is a short breaching maul, 1d10, no edge to speak of. The first knock is his voice. This is the second, and he does not swing it twice either. Hinges, ribs, the same face of the head. A red cheek inlay and no poetry.",
      },
    ],
  },
  lyra: {
    id: "lyra",
    name: "Lyra",
    callsign: "LYRA-4",
    title: "AEGIS Executor · long gun",
    faction: "aegis",
    visor: "white",
    portrait: "/art/npcs/portraits/lyra.jpg",
    still: "/art/npcs/lyra.jpg",
    thumb: "/art/npcs/thumbs/lyra-bust.jpg",
    heatUnlock: 0,
    tagline: "White visor. She listens first. The rifle is already sure.",
    dossier:
      "Human pilot. Signals, recon, and the specialized sniper for the first wing. Shoulder stencil LYRA-4. Her rifle is Ridge Glass, and it is not a .308. It is chambered .338 Lapua, match, four in the magazine, 2d10+1 with AP 3 at long range, suppressed so the ridge stays a listening post. She paints a ridge only after the glass can hold that round. The Mast Knife is 1d6 and quiet, for cable and for anyone who climbs to her. Calder Rourke has heard her on the night band and pretends the report was weather. If a white visor is on the West Berm, the rest of the wing already has a map, she already has a firing solution, and the .338 does not sound like weather.",
    intro: "Lyra is on the ridge. White light. A .338, already sure. She is listening, not knocking. Yet.",
    voice: [
      "I already have your outline. I am being polite.",
      "I do not paint a ridge this rifle cannot hold.",
      "Tell the T-0880 I heard him breathing.",
    ],
    issue: [
      {
        name: "Ridge Glass",
        plate: "Sniper",
        family: "sniper",
        chamber: ".338 Lapua",
        damage: "2d10+1",
        traits: "AP 3 · long · match · suppressed · mag 4",
        ammoType: ".338",
        magSize: 4,
        art: "/art/items/ridge-glass.jpg",
        line: "Match .338. One shot, already chosen.",
        lore: "LYRA-4 issue. A long gun built for her, not drawn from a crate. Suppressed bolt, pale glass optic, chambered .338 Lapua match — 2d10+1, AP 3, four rounds, and it is wasted inside a room. She sits Relay Tower frequencies Kane is not supposed to share, and she holds the ridge while she listens. The wing arrives after she is sure. The rifle was sure first.",
      },
      {
        name: "Mast Knife",
        plate: "Knife",
        family: "melee",
        chamber: "melee",
        damage: "1d6",
        traits: "close · silent · cable or a climber",
        art: "/art/items/mast-knife.jpg",
        line: "Same cut. Neither of them hears it.",
        lore: "Every 2753 carries a melee. Lyra's is a flat black stiletto, 1d6, and it does not announce itself. She cuts mast cable with it. She cuts the person who climbed the mast with it. Same motion. The .338 is for the ridge. This is for the person who got past the ridge. Relay Three knows the sound, which is no sound at all.",
      },
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
    dossier: "Tyrone began as a postwar T-0880 reconstruction courier carrying medicine, letters, music and classified recovery orders. His personhood accumulated through relationships and promises. Travis hid him from recall and memory wipe. T-0888 is the later consensual rebuild of this same one-wheeled person, preserving his memories and guitar recording.",
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
    dossier: "Human T-0880 field mechanic at Bay 13, the awkward thirteenth station in a twelve-bay shop. He bypassed Tyrone’s memory resets and falsified his disposal. Last Receipt is his manual .45-70. His Deadman Key and three regional components enable the later rebuild, only with Tyrone’s consent.",
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
    tagline: "The convoy escort remembers what the aid routes became.",
    dossier: "Human convoy commander leading the Ashen Pack who escorted T-0880 couriers. He deserted when Vesper reused aid maps to pressure settlements. HOUND-LEAD is the identity Tyrone remembers. Hound’s Tooth is his .50 convoy-defense rifle; the Black-tag Ledger is evidence. A dead owner cannot testify.",
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
    dossier: "Human industrial-disaster survivor. CIVITAS locked the furnace workers inside; Valdris survived but his name remained on the death list. The Furnace Court rules through debt. The Balance is a thermal industrial maul. Tithe Keys control gates, conveyors and coolant.",
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
    tagline: "She warned them to stop extraction. Somebody rewrote the map.",
    dossier: "Surveyor and whistleblower. Thessaly’s original report warned STOP EXTRACTION. Reeve altered the risk assessment; a lift crew died. She protects the Blackglass deepworks. True North is her survey rifle, not a magical map. Cooperation preserves authenticated evidence.",
    intro: "Thessaly kept the original survey. Ask why it differs from Reeve’s copy.",
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
    dossier: "A surviving CIVITAS flood-control shard beneath Brasswater in the Fraser delta. Contradictory protection and evacuation orders became coercive control of the water. Bounded navigation models can help repair Earth; unrestricted autonomy can repeat the original failure.",
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
    dossier: "Captain Mara Thorne is the human pilot of Veyra’s AEGIS 2753 boundary frame. She confirms targets and can recognize lawful authority. Gate Spear grounds powered machinery at close range. Her judgment cannot be recovered from a destroyed suit.",
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
