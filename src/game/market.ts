import { HOLLOW_CATALOG, type CatalogItem } from "./hollow-catalog";
import { TREASURE_CATALOG } from "./treasure-catalog";
import { plateMember } from "./squad";
import { arsenalUnlocked, campaignOpenRegions } from "./arsenal";
import { copyWeaponSpec, hydrateWeapon } from "./weapon-ops";
import type {
  GameState,
  Item,
  MarketLot,
  MarketState,
  RegionId,
  VisitingMerchant,
} from "./types";

export const MARKET_POI_ID = "ironclad-market";
export const TOWER_POI_ID = "ironclad-tower";
export const HIGHWAY_POI_ID = "ironclad-highway";

const VISITORS: VisitingMerchant[] = [
  {
    id: "marrow",
    name: "Marrow",
    title: "Ashen fence",
    blurb: "He only sets a table when the Pack is hunting somewhere else. Pay the plate. Do not ask where it rode.",
    regionId: "ironclad",
  },
  {
    id: "cinder-bess",
    name: "Cinder Bess",
    title: "Furnace runner",
    blurb: "She smells like coke and wet coin. Slag Town sends her when the glass is still hot.",
    regionId: "slagtown",
  },
  {
    id: "nine-lift",
    name: "Nine-Lift",
    title: "Cage broker",
    blurb: "Blackspire ore that never saw a weigh-house. He talks like a lift that forgot which floor is up.",
    regionId: "blackspire",
  },
  {
    id: "salt-wren",
    name: "Salt Wren",
    title: "Tide fence",
    blurb: "Brasswater pages still dripping. She wants the black card, not a handshake.",
    regionId: "brasswater",
  },
  {
    id: "white-glove",
    name: "White Glove",
    title: "Veyra grey",
    blurb: "No serial. No receipt. Kane would call this theft. The market calls it Tuesday.",
    regionId: "veyra",
  },
];

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function seedRng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function pickN<T>(rand: () => number, arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)] ?? arr[0]!;
}

function shuffle<T>(rand: () => number, arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function roundPrice(n: number) {
  return Math.max(20, Math.round(n / 10) * 10);
}

function slotFor(kind: CatalogItem["kind"]): MarketLot["slot"] {
  if (kind === "weapon") return "weapon";
  if (kind === "armor") return "armor";
  if (kind === "trinket") return "trinket";
  return undefined;
}

function toLot(item: CatalogItem, qty: number, visitor: boolean, markup: number, id: string): MarketLot {
  return {
    id,
    name: item.name,
    kind: item.kind,
    rarity: item.rarity,
    effect: item.effect,
    lore: item.lore,
    value: item.value,
    price: roundPrice(item.value * markup),
    qty,
    sourceRegion: item.sourceRegion,
    visitor,
    classHint: item.classHint,
    damage: item.damage,
    defense: item.defense,
    slot: slotFor(item.kind),
    ...copyWeaponSpec(item),
  };
}

function poolForDay(day: number, locations?: GameState["locations"]): CatalogItem[] {
  const open = campaignOpenRegions(day, locations);
  return HOLLOW_CATALOG.filter((c) => open.includes(c.sourceRegion) && arsenalUnlocked(c, { day, open }));
}

export function emptyMarket(day = 1): MarketState {
  return { day, lots: [], visitor: null };
}

export function visitorForDay(day: number): VisitingMerchant | null {
  if (day < 3 || day % 3 !== 0) return null;
  return VISITORS[Math.floor((day - 3) / 3) % VISITORS.length]!;
}

export function rollMarket(day: number, locations?: GameState["locations"]): MarketState {
  const rand = seedRng(day * 7919 + 13);
  const open = campaignOpenRegions(day, locations);
  const pool = poolForDay(day, locations);
  const cheap = pool.filter((c) => c.rarity === "Common" || c.rarity === "Uncommon");
  const rest = pool.filter((c) => c.rarity !== "Common");
  const daily: CatalogItem[] = [];
  const take = (list: CatalogItem[], pred: (c: CatalogItem) => boolean) => {
    const cands = shuffle(rand, list.filter((c) => pred(c) && !daily.some((d) => d.name === c.name)));
    if (cands[0]) daily.push(cands[0]);
  };
  take(pool, (c) => c.kind === "weapon");
  take(pool, (c) => c.kind === "attachment");
  take(pool, (c) => c.kind === "consumable" && !!c.ammoType);
  if (open.includes("blackspire")) take(pool, (c) => c.kind === "consumable" && c.ammoType === "laser");
  if (open.includes("brasswater") || open.includes("veyra")) take(pool, (c) => c.kind === "weapon" && c.ammoType === "laser");
  const cheapShuf = shuffle(rand, cheap.length ? cheap : pool);
  for (const item of cheapShuf) {
    if (daily.length >= 3) break;
    if (daily.some((d) => d.name === item.name)) continue;
    daily.push(item);
  }
  const restShuf = shuffle(rand, rest.length ? rest : pool);
  for (const item of restShuf) {
    if (daily.length >= 6) break;
    if (daily.some((d) => d.name === item.name)) continue;
    daily.push(item);
  }
  while (daily.length < 6 && pool.length) {
    const extra = pickN(rand, pool);
    if (!daily.some((d) => d.name === extra.name)) daily.push(extra);
    else break;
  }
  const lots = daily.map((item, i) => {
    const qty = item.rarity === "Common" ? (rand() > 0.45 ? 2 : 1) : 1;
    return toLot(item, qty, false, 1.05, `stall-${day}-${i}`);
  });

  // A rider starts on 150 caps. A stall with nothing under 150 on it is a wall,
  // not a market, so the cheapest thing in the pool is always on the table.
  const AFFORDABLE = 150;
  if (!lots.some((lot) => lot.price <= AFFORDABLE)) {
    const cheapest = pool
      .filter((c) => !lots.some((l) => l.name === c.name))
      .sort((a, b) => a.value - b.value)[0];
    if (cheapest) lots.unshift(toLot(cheapest, 2, false, 1.05, `stall-${day}-floor`));
  }

  const visitor = visitorForDay(day);
  if (visitor) {
    const treasure = TREASURE_CATALOG.filter(
      (c) => c.sourceRegion === visitor.regionId && (c.rarity === "Rare" || c.rarity === "Legendary" || c.rarity === "Mythic"),
    );
    const high = shuffle(rand, treasure.length ? treasure : TREASURE_CATALOG.filter((c) => c.sourceRegion === visitor.regionId));
    high.slice(0, 3).forEach((item, i) => {
      lots.push(toLot(item, 1, true, 1.2, `guest-${day}-${i}`));
    });
  }

  return { day, lots, visitor };
}

export function marketPrice(state: GameState, lot: MarketLot) {
  const disc = state.rooms.ledger >= 3 ? 0.85 : 1;
  return Math.round(lot.price * disc);
}

export function lotToItem(lot: MarketLot, paid: number): Item {
  const item = hydrateWeapon({
    id: uid("mkt"),
    name: lot.name,
    kind: lot.kind,
    rarity: lot.rarity,
    condition: "Pristine",
    slot: lot.slot,
    classHint: lot.classHint,
    damage: lot.damage,
    defense: lot.defense,
    effect: lot.effect,
    lore: lot.visitor ? `${lot.lore} Bought off a visiting stall.` : `${lot.lore} Moon Squad Market, day stamp.`,
    value: paid,
    tags: lot.visitor ? ["market", "visitor"] : ["market"],
    sourceRegion: lot.sourceRegion,
    discoveredDay: undefined,
    ...copyWeaponSpec(lot),
  });
  if (item.kind === "weapon" && item.weaponFamily !== "melee" && item.mag == null) {
    item.mag = item.magSize;
  }
  return item;
}

export function buyMarketLot(state: GameState, lotId: string): string | null {
  if (!state.market || state.market.day !== state.day) state.market = rollMarket(state.day, state.locations);
  const lot = state.market.lots.find((l) => l.id === lotId);
  if (!lot) return "That stall packed up.";
  if (lot.qty <= 0) return "Sold out. Dawn reprints the stalls.";
  const price = marketPrice(state, lot);
  const plate = plateMember(state);
  if (plate.personalCaps < price) {
    return `Need ${price} on the black card. The Market does not take the vault drawer.`;
  }
  plate.personalCaps -= price;
  lot.qty -= 1;
  const item = lotToItem(lot, price);
  item.discoveredDay = state.day;
  state.vault.push(item);
  return null;
}

export function ensureMarket(state: GameState): MarketState {
  if (!state.market || state.market.day !== state.day || !state.market.lots.length) {
    state.market = rollMarket(state.day, state.locations);
  }
  return state.market;
}

export const TOWER_RUMORS = [
  "Relay Three catches Kane's surveyors talking rail steel like it is already hers.",
  "A skip-frequency from Slag Town. Furnace Court is buying heat, not workers.",
  "Static, then a lift-cage count from Blackspire. Somebody is still going down.",
  "Brasswater docks ping a wet page. Jump-table fragment, or a drowning.",
  "ICR 88 under the bed: Moon Squad Marketplace, under the Iron Gate, limited stock, dawn reset.",
  "East highway is quiet. That is how I found you. Quiet is not mercy.",
  "A visiting stall is coming. High loot. They only sit when the Pack is hunting somewhere else.",
  "Halo Yard still has AEGIS paint. They trained 2753s here before Veyra had a hangar.",
];

export function rumorFor(day: number, heat: number) {
  return TOWER_RUMORS[(day + heat) % TOWER_RUMORS.length]!;
}
