import { ARMOR, WEAPONS, locById, makeItemFromArmor, makeItemFromWeapon } from "./data";
import { poiById } from "./field-ops";
import type { Item, LocationId, MissionKind, Rarity } from "./types";

const RANK: Record<Rarity, number> = {
  Common: 0,
  Uncommon: 1,
  Rare: 2,
  Legendary: 3,
  Mythic: 4,
  Cursed: 2,
};

type Scrap = Omit<Item, "id">;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function rarityCap(kind: MissionKind, day: number): Rarity {
  if (kind === "scout") {
    if (day <= 2) return "Uncommon";
    if (day <= 4) return "Rare";
    return "Legendary";
  }
  if (kind === "forage" || kind === "trade") {
    if (day <= 2) return "Uncommon";
    if (day <= 5) return "Rare";
    return "Legendary";
  }
  if (kind === "raid" || kind === "bounty") {
    if (day <= 2) return "Rare";
    if (day <= 5) return "Legendary";
    return "Mythic";
  }
  if (day <= 3) return "Legendary";
  return "Mythic";
}

export function rarityFromRoll(total: number, cap: Rarity): Rarity {
  let rolled: Rarity = "Common";
  if (total >= 20) rolled = "Mythic";
  else if (total >= 18) rolled = "Legendary";
  else if (total >= 15) rolled = "Rare";
  else if (total >= 11) rolled = "Uncommon";
  return RANK[rolled] > RANK[cap] ? cap : rolled;
}

function siteScrap(loc: LocationId, poiId: string | undefined, rarity: Rarity): Scrap {
  const L = locById(loc);
  const poi = poiById(loc, poiId);
  const site = poi?.name ?? L.short;
  const table: Record<string, Scrap[]> = {
    "ironclad-rail": [
      {
        name: "Weigh-Chit 088",
        kind: "special",
        rarity: "Common",
        condition: "Worn",
        effect: "Proof Kane's surveyors were here.",
        lore: `Stamped at dawn on the ${site}. Rail steel. Due at dusk. Project Vesper does not sleep.`,
        value: 40,
      },
      {
        name: "Pulled Spike",
        kind: "material",
        rarity: "Common",
        condition: "Worn",
        effect: "Forge stock. One watch at the Machine Shop.",
        lore: `Night crews have been pulling spikes off the ${site} for hull plate. This one still has slag on the head.`,
        value: 55,
      },
      {
        name: "Surveyor's Ribbon",
        kind: "special",
        rarity: "Uncommon",
        condition: "Pristine",
        effect: "Marks a crate Kane means to take.",
        lore: `Orange tape on a rail they mean to lift. Count the crates on the ${site}. Do not sit with them.`,
        value: 90,
      },
    ],
    "ironclad-gate": [
      {
        name: "Gate Chit",
        kind: "special",
        rarity: "Common",
        condition: "Worn",
        effect: "A name on the Iron Gate log.",
        lore: `Someone signed the ${site} book in a hand that is not ours. Kane's buyers keep hours.`,
        value: 35,
      },
    ],
    "ironclad-works": [
      {
        name: "Mill Invoice",
        kind: "special",
        rarity: "Uncommon",
        condition: "Worn",
        effect: "A Project Vesper order, unsigned.",
        lore: `The ${site} is milling plate Kane did not pay for yet. The number at the bottom is a town.`,
        value: 110,
      },
    ],
    "ironclad-halo": [
      {
        name: "Drill Square Chalk",
        kind: "material",
        rarity: "Common",
        condition: "Worn",
        effect: "Old AEGIS layout dust. Marks a footprint.",
        lore: `2753 outlines still burn the ${site}. Someone retraced a heel last week.`,
        value: 50,
      },
      {
        name: "Frame Serial Scrap",
        kind: "special",
        rarity: "Uncommon",
        condition: "Worn",
        effect: "A T-line number Kane scrubbed from the books.",
        lore: `Stamped into concrete at the ${site}. Not in Vesper's open ledger.`,
        value: 95,
      },
    ],
    "ironclad-berm": [
      {
        name: "Slag Wind Mask",
        kind: "consumable",
        rarity: "Common",
        condition: "Worn",
        effect: "Ignore the first ash choke this watch.",
        lore: `Cloth and wire from the ${site}. Pack watches the hills from here.`,
        value: 70,
      },
    ],
    "ironclad-exchange": [
      {
        name: "Shut Ledger Page",
        kind: "special",
        rarity: "Uncommon",
        condition: "Worn",
        effect: "Proof the market moved under the Gate.",
        lore: `Rats kept the ${site} books. Caps still smell like Vault 13 ink.`,
        value: 100,
      },
    ],
    "slag-foundry-row": [
      {
        name: "Hot Rivet Tin",
        kind: "material",
        rarity: "Common",
        condition: "Worn",
        effect: "Forge stock. Burns hotter than Ironclad scrap.",
        lore: `Pulled off a boiler on ${site}. Still warm to the glove.`,
        value: 65,
      },
      {
        name: "Union Hall Token",
        kind: "special",
        rarity: "Uncommon",
        condition: "Pristine",
        effect: "Opens a side door on Foundry Row.",
        lore: `Brass disk. Stamp says the night shift never ended at ${site}.`,
        value: 120,
      },
    ],
    "blackspire-lift": [
      {
        name: "Cage Chain Link",
        kind: "material",
        rarity: "Common",
        condition: "Worn",
        effect: "Mine lift steel. Hollow ore residue.",
        lore: `From the ${site}. Kane wants whatever was in the cage.`,
        value: 75,
      },
    ],
    "brasswater-archive": [
      {
        name: "Brass Folio Corner",
        kind: "special",
        rarity: "Uncommon",
        condition: "Worn",
        effect: "Half a jump table. Math without a sky.",
        lore: `Salt-stained metal from the ${site}. Pre-collapse hand. Incomplete on purpose.`,
        value: 140,
      },
    ],
    "veyra-spire": [
      {
        name: "Needle Spire Shard",
        kind: "material",
        rarity: "Rare",
        condition: "Pristine",
        effect: "AEGIS frame glass. Humming faintly.",
        lore: `Chipped from the ${site}. Successor light to the T-0880 line.`,
        value: 180,
      },
    ],
  };
  const pool = (table[poiId ?? ""] ?? []).filter((row) => RANK[row.rarity] <= RANK[rarity]);
  if (pool.length) return pick(pool);
  const fallback: Scrap[] = [
    {
      name: `${site} Field Notes`,
      kind: "special",
      rarity: rarity === "Common" ? "Common" : "Uncommon",
      condition: "Worn",
      effect: "Intel. The next watch on this ground is cheaper.",
      lore: `${site}. ${L.name}. Rider wrote what the ground was doing, not what it was worth.`,
      value: 60,
    },
    {
      name: "Visor Paint Smear",
      kind: "material",
      rarity: "Common",
      condition: "Worn",
      effect: "AEGIS residue. Proof a 2753 walked here.",
      lore: `A smear of visor light on a rail at ${site}. Lyra paints ridges. Someone painted this one.`,
      value: 45,
    },
    {
      name: "Hollow Cache",
      kind: "consumable",
      rarity: "Common",
      condition: "Pristine",
      effect: "Restore 3 HP.",
      lore: `Packed for a watch on the ${site}. The person who packed it did not come back.`,
      value: 80,
    },
  ];
  return pick(fallback.filter((row) => RANK[row.rarity] <= RANK[rarity]));
}

function weaponOf(rarity: Rarity): Scrap | null {
  const weapons = WEAPONS.filter((w) => w.rarity === rarity);
  const pool = weapons.length ? weapons : WEAPONS.filter((w) => w.rarity === "Common");
  if (!pool.length) return null;
  return makeItemFromWeapon(pick(pool));
}

export function weaponsAllowed(kind: MissionKind, day: number, total: number): boolean {
  if (kind === "raid" || kind === "bounty" || kind === "boss") return total >= 10;
  if (kind === "forage") return day >= 3 && total >= 16;
  if (kind === "scout") return day >= 5 && total >= 18;
  return false;
}

export function rollLoot(opts: {
  loc: LocationId;
  kind: MissionKind;
  total: number;
  day: number;
  poiId?: string;
}): Scrap[] {
  const { loc, kind, total, day, poiId } = opts;
  const cap = rarityCap(kind, day);
  const rarity = rarityFromRoll(total, cap);
  const out: Scrap[] = [];

  if ((kind === "scout" || kind === "forage") && total >= 8) {
    out.push(siteScrap(loc, poiId, rarity));
    if (total >= 15 && Math.random() < 0.4) {
      out.push({
        name: "Kane Invoice Copy",
        kind: "special",
        rarity: RANK[rarity] >= 1 ? "Uncommon" : "Common",
        condition: "Worn",
        effect: "A paper trail. PEOPLE will remember this.",
        lore: `Project Vesper letterhead. Hull plate, ${locById(loc).short}, due. Tyrone is not on this list. He was never supposed to be.`,
        value: 120,
      });
    }
  }

  if (weaponsAllowed(kind, day, total)) {
    const gun = weaponOf(rarity === "Mythic" && day < 7 ? "Legendary" : rarity);
    if (gun) {
      gun.lore = gun.lore
        ? `${gun.lore} Lifted off ${poiById(loc, poiId)?.name ?? locById(loc).short}.`
        : `Lifted off ${poiById(loc, poiId)?.name ?? locById(loc).short}.`;
      out.push(gun);
    }
  }

  if ((kind === "raid" || kind === "boss") && total >= 14 && Math.random() < 0.45) {
    out.push(makeItemFromArmor(pick(ARMOR)));
  }

  if (loc === "caverns" || loc === "veyra") {
    out.push({
      name: "Hollow Ore",
      kind: "material",
      rarity: "Uncommon",
      condition: "Pristine",
      effect: "Forge fuel. The Machine Shop drinks it.",
      lore: `It drinks torchlight. Pulled from ${poiById(loc, poiId)?.name ?? locById(loc).short}.`,
      value: 200,
    });
  }

  if (kind === "scout" && total >= 10 && total < 15 && Math.random() < 0.35) {
    out.push({
      name: "Field Cache",
      kind: "consumable",
      rarity: "Common",
      condition: "Pristine",
      effect: "Restore 3 HP.",
      lore: `Someone packed this for a watch on ${poiById(loc, poiId)?.name ?? locById(loc).short} and did not come back.`,
      value: 80,
    });
  }

  return out;
}
