/**
 * Inventory-as-story: Tyrone and Travis speak from the item, not a generic kit sheet.
 * Travis keeps the T-0880 bay — he does not replace the Vault Machine Shop as universal smith.
 * He will read your steel and, once the jig trusts you, favor-weld a weapon or plate.
 */
import { CAST } from "./cast";
import { improve, repairCost } from "./engine";
import { addJournal, ensureNarrative, hasFlag, setFlag } from "./narrative-state";
import { rememberTyrone } from "./tyrone-mind";
import {
  isTravisPart,
  moduleById,
  moduleByPartName,
  pendingModules,
  travisRepairFactor,
  type TravisModule,
} from "./travis";
import type { Condition, GameState, Item, Operative } from "./types";
import { peekWeapon, inferFamily, magLine } from "./weapon-ops";

export type ItemSpeaker = "tyrone" | "travis";

export type ItemStoryBeat = {
  speaker: ItemSpeaker;
  who: string;
  portrait: string;
  headline: string;
  lines: string[];
  route?: "travis-bay" | "machine-shop" | "none";
  cta?: string;
};

function bags(state: GameState): Item[] {
  return [...state.vault, ...state.operatives.flatMap((o) => o.inventory)];
}

function findItem(state: GameState, itemId: string): { item: Item; where: "vault" | "operative"; opId?: string } | null {
  const vault = state.vault.find((i) => i.id === itemId);
  if (vault) return { item: vault, where: "vault" };
  for (const op of state.operatives) {
    const hit = op.inventory.find((i) => i.id === itemId);
    if (hit) return { item: hit, where: "operative", opId: op.id };
  }
  return null;
}

function bumpItem(state: GameState, itemId: string, fn: (it: Item) => Item) {
  const vi = state.vault.findIndex((i) => i.id === itemId);
  if (vi >= 0) {
    state.vault[vi] = fn(state.vault[vi]!);
    return;
  }
  for (let oi = 0; oi < state.operatives.length; oi++) {
    const op = state.operatives[oi]!;
    const ii = op.inventory.findIndex((i) => i.id === itemId);
    if (ii >= 0) {
      const inv = [...op.inventory];
      inv[ii] = fn(inv[ii]!);
      state.operatives[oi] = { ...op, inventory: inv };
      return;
    }
  }
}

export function conditionStory(condition: Condition): string {
  if (condition === "Pristine") return "Still remembers the factory stamp.";
  if (condition === "Worn") return "Honest wear. Still holds a job.";
  if (condition === "Damaged") return "Crack in the work. One more bad day and it fails you.";
  return "Broken. A name without a job until somebody welds it.";
}

function travisModFor(item: Item): TravisModule | undefined {
  const fromTag = item.tags?.find((t) => t.startsWith("travis:"))?.slice(7);
  return (fromTag && moduleById(fromTag)) || moduleByPartName(item.name);
}

function rarityLine(item: Item): string {
  if (item.rarity === "Mythic" || item.rarity === "Legendary")
    return "That rarity is not a sticker. The Hollow will remember if you waste it.";
  if (item.rarity === "Cursed") return "Cursed steel keeps a debt. Equip it like you mean the invoice.";
  if (item.rarity === "Rare") return "Rare enough that ICR would invent a bulletin if it walked into Market Square.";
  return "";
}

function regionLine(item: Item): string {
  if (!item.sourceRegion) return "";
  const map: Record<string, string> = {
    ironclad: "Ironclad steel. Smells like slag and honest work.",
    slag: "Slag Town heat. Do not leave it near the Med Bay lamps.",
    caverns: "Blackspire chalk on the receiver. Coherent light country.",
    library: "Brasswater flood marks. Dry it before you chamber a round.",
    veyra: "Veyra finish. Pretty enough to get you robbed under the Gate.",
  };
  return map[item.sourceRegion] ?? "";
}

/** Tyrone Explain — lore first, then one tactical sentence. */
export function tyroneExplainItem(item: Item, target: Operative | null): string {
  const live = peekWeapon(item);
  const bits: string[] = [];
  if (live.lore?.trim()) bits.push(live.lore.trim());
  else bits.push(`${live.name}. ${live.effect}`);

  if (isTravisPart(live)) {
    const mod = travisModFor(live);
    bits.push(
      mod
        ? `Marked for Travis at the Ironclad Mechanical Shop. He pays ${mod.pay} caps and seats the ${mod.part} in me. That is not Vault inventory clutter — that is my chassis.`
        : "Marked for Travis. Walk it to the Mechanical Shop under Ironclad. He seats it in me.",
    );
    return bits.join(" ");
  }

  if (live.kind === "attachment") {
    bits.push(
      `Attachment · ${live.attachmentSlot ?? "slot"}. Seat it on a matching firearm. One part per socket. Strip at the Vault Machine Shop when the forge is lit.`,
    );
  } else if (live.kind === "weapon") {
    const fam = inferFamily(live);
    const chamber = magLine(live);
    bits.push(
      fam === "melee"
        ? "Blade work. Close band. No mag to babysit."
        : `Family ${fam}. ${chamber && chamber !== "melee" ? `Chamber ${chamber}. ` : ""}${conditionStory(live.condition)}`,
    );
  } else if (live.kind === "armor") {
    bits.push(`${conditionStory(live.condition)} Defense is only a number if somebody is wearing it.`);
  } else if (live.kind === "consumable" && live.ammoType) {
    bits.push(`Ammunition · ${live.ammoType}. Issue it to the shooter. Do not drink it.`);
  } else if (live.kind === "material") {
    bits.push("Construction stock. Expansion Protocol eats the right pile when you build.");
  } else if (live.kind === "special") {
    bits.push("Special means a door, a boss, or a later system will ask. Keep it tagged.");
  }

  const rare = rarityLine(live);
  if (rare) bits.push(rare);
  const region = regionLine(live);
  if (region) bits.push(region);

  if (target && live.classHint) {
    bits.push(
      live.classHint === target.cls
        ? `${target.name} is the right class for this kit.`
        : `${target.name} can carry it, but it was cut for a different class.`,
    );
  }

  return bits.join(" ");
}

export function tyroneFitItem(item: Item, target: Operative | null): string {
  if (!target) return "Pick a resident first, partner. I cannot compare steel to an empty bunk.";
  if (isTravisPart(item)) return "That part is for me, not for a resident loadout. Travis seats it. I walk heavier.";
  if (item.kind === "attachment") {
    const guns = target.inventory.filter((i) => i.kind === "weapon");
    if (!guns.length) return `${target.name} has no firearm on them. Issue a gun first, then seat the part.`;
    return `Seat this on ${target.name}'s firearm — one socket per slot. Family has to match.`;
  }
  if (!item.classHint) return `${item.name} is universal kit. ${target.name} can use it without fighting the design.`;
  return item.classHint === target.cls
    ? `${item.name} was built for their class. ${target.name} is the right set of hands.`
    : `${item.name} favors another class. ${target.name} can still carry it, but the fit is not ideal.`;
}

export function tyroneHowToUse(item: Item): string {
  if (isTravisPart(item))
    return "Do not Issue & Equip. Take it to Travis at the Ironclad Mechanical Shop — World map, Ironclad, the shop with the empty jig. Fit pays caps into the porch.";
  if (item.kind === "attachment")
    return "Pick a resident who holds a matching firearm, then Seat on firearm. Strip later at the Vault Machine Shop (forge lit).";
  if (item.kind === "weapon" || item.kind === "armor" || item.kind === "trinket")
    return "Preview the power change, then Equip. If it is in Vault 13, Issue & Equip does both steps. Damaged steel: Repair at the Vault bench, or show Travis once his jig trusts you.";
  if (item.kind === "consumable")
    return item.ammoType
      ? `Ammunition. ${item.ammoCount ?? "?"} rounds of ${item.ammoType}. Issue it to the shooter. Do not drink it.`
      : "Consumables are one-use. Pick who needs the dose before you burn it.";
  if (item.kind === "enchantment")
    return "Enchantments are not worn alone. Pick a resident, choose gear, Attach. The coil disappears into that item.";
  if (item.kind === "material") return "Material stays in Vault 13. Construction consumes the right regional stock.";
  return "Special items are keys, relics, records. Keep them until a screen asks.";
}

/** Travis reads the steel — dialogue depends on the item. */
export function travisReadItem(state: GameState, item: Item): ItemStoryBeat {
  const live = peekWeapon(item);
  const who = CAST.travis.name;
  const portrait = CAST.travis.portrait;

  if (isTravisPart(live)) {
    const mod = travisModFor(item)!;
    const pending = pendingModules(state).some((p) => p.mod.id === mod.id);
    return {
      speaker: "travis",
      who,
      portrait,
      headline: mod.name,
      lines: [
        pending
          ? `That is a ${mod.part}. Put it on the jig. I pay ${mod.pay} caps and I seat it in him.`
          : `${mod.name} — already spoken for, or already in him. Do not waste my time pretending otherwise.`,
        mod.lore,
        mod.fit,
      ],
      route: "travis-bay",
      cta: "Open the bay",
    };
  }

  if (live.kind === "weapon") {
    const fam = inferFamily(live);
    const lines: string[] = [];
    if (live.tags?.some((t) => /kane|aegis|vesper|2753/i.test(t)) || /kane|aegis|vesper|2753/i.test(live.name)) {
      lines.push("Kane steel. I will weld a friend. I will not polish her invoice.");
    }
    if (fam === "energy" || live.ammoType === "laser") {
      lines.push("Coherent light. Blackspire talk. My jig still thinks in tubes and tread — but I can straighten a mount.");
    } else if (fam === "melee") {
      lines.push("Blade. Honest. No mag to lie to you mid-fight.");
    } else {
      const chamber = magLine(live);
      lines.push(`${fam} work. ${chamber !== "melee" ? `Chamber looks like ${chamber}. ` : ""}${conditionStory(live.condition)}`);
    }
    if (live.condition === "Broken" || live.condition === "Damaged") {
      lines.push(
        (state.travis?.fitted.length ?? 0) >= 1
          ? "Jig trusts you. Lay it here and I will favor-weld a step toward pristine. Vault Machine Shop still does the long jobs and the strip."
          : "Bring me a T-0880 part first. Earn the bay. Then I favor-weld your steel.",
      );
    } else {
      lines.push("Looks like it will hold. If it starts cracking, the Vault forge or my favor weld — not Kane's buyers.");
    }
    const rare = rarityLine(live);
    if (rare) lines.push(rare.replace("The Hollow", "Ironclad"));
    return {
      speaker: "travis",
      who,
      portrait,
      headline: live.name,
      lines,
      route: live.condition !== "Pristine" ? "travis-bay" : "none",
      cta: live.condition !== "Pristine" ? "Ask for a favor weld" : undefined,
    };
  }

  if (live.kind === "armor") {
    return {
      speaker: "travis",
      who,
      portrait,
      headline: live.name,
      lines: [
        `Plate talk. ${conditionStory(live.condition)}`,
        (state.travis?.fitted.length ?? 0) >= 1
          ? "I can favor-weld armor the same as a rifle — one step. Full rebuild stays at Vault 13."
          : "Seat a part in him first. Then we talk plate.",
        live.lore || live.effect,
      ],
      route: live.condition !== "Pristine" ? "travis-bay" : "none",
      cta: live.condition !== "Pristine" ? "Ask for a favor weld" : undefined,
    };
  }

  if (live.kind === "attachment") {
    return {
      speaker: "travis",
      who,
      portrait,
      headline: live.name,
      lines: [
        `Socket part · ${live.attachmentSlot ?? "unknown"}. That seats on a firearm at Vault 13 — Machine Shop strip, inventory seat.`,
        "My jig is for T-0880 chassis, not optics. Do not confuse the two shops.",
      ],
      route: "machine-shop",
      cta: "Back to inventory",
    };
  }

  return {
    speaker: "travis",
    who,
    portrait,
    headline: live.name,
    lines: [
      "That is not bay work. Caps and scrap maybe. Tyrone's clipboard for the rest.",
      live.lore || live.effect,
    ],
    route: "none",
  };
}

/** Full story card for the inventory inspect sheet. */
export function itemStoryCard(state: GameState, item: Item, target: Operative | null): ItemStoryBeat {
  if (isTravisPart(item)) return travisReadItem(state, item);
  return {
    speaker: "tyrone",
    who: CAST.tyrone.name,
    portrait: CAST.tyrone.portrait,
    headline: item.name,
    lines: [tyroneExplainItem(item, target)],
    route: item.condition !== "Pristine" && (item.kind === "weapon" || item.kind === "armor")
      ? "machine-shop"
      : item.kind === "attachment"
        ? "machine-shop"
        : "none",
    cta:
      item.condition !== "Pristine" && (item.kind === "weapon" || item.kind === "armor")
        ? "Repair at Vault Machine Shop"
        : undefined,
  };
}

export function travisCanFavorWeld(state: GameState): boolean {
  return (state.travis?.fitted.length ?? 0) >= 1 || hasFlag(state, "travis_jig_filled");
}

/** Travis favor weld — one condition step, no Vault forge required; bay trust required. */
export function travisFavorRepair(state: GameState, itemId: string): { cost: number; line: string; item: Item } | string {
  ensureNarrative(state);
  if (!travisCanFavorWeld(state)) {
    return "Jig does not trust you yet. Seat a T-0880 part first. Then I weld.";
  }
  const found = findItem(state, itemId);
  if (!found) return "Nothing on my bench with that name.";
  const { item } = found;
  if (item.kind !== "weapon" && item.kind !== "armor") return "I favor-weld weapons and plate. Not candy.";
  if (item.condition === "Pristine") return "Already pristine. Do not waste a weld.";
  const cost = Math.max(35, Math.round(repairCost(state, item) * Math.min(1, travisRepairFactor(state) + 0.05)));
  if (state.coins < cost) return `Need ${cost} caps.`;
  state.coins -= cost;
  const before = item.condition;
  bumpItem(state, itemId, (it) => ({ ...it, condition: improve(it.condition) }));
  const after = findItem(state, itemId)!.item;
  if (!state.travis) state.travis = { fitted: [], paid: 0, jobs: 0 };
  state.travis.jobs += 1;
  const line = `${CAST.travis.name} favor-welds ${item.name}. ${before} → ${after.condition}. -${cost} caps. Vault Machine Shop still owns the long rebuilds.`;
  rememberTyrone(state, {
    id: `travis-weld-${itemId}-${state.day}`,
    type: "upgrade",
    description: line,
    locationId: "ironclad",
    regionId: "ironclad",
    poiId: "ironclad-shop",
    operativeIds: [],
    importance: item.rarity === "Legendary" || item.rarity === "Mythic" ? 6 : 3,
    weight: 2,
    tags: ["travis", "repair", item.kind, item.name],
    permanent: item.rarity === "Legendary" || item.rarity === "Mythic",
    outcome: `${before}→${after.condition}`,
  });
  if (item.rarity === "Legendary" || item.rarity === "Mythic" || item.rarity === "Cursed") {
    setFlag(state, "travis_bay_used", true);
    addJournal(state, {
      act: state.narrative?.act ?? "act_i",
      day: state.day,
      title: `Travis welded ${item.name}`,
      body: `${before} toward ${after.condition}. The Mechanical Shop keeps a receipt. Kane does not get a copy.`,
      tags: ["travis", "inventory", item.rarity],
    });
  }
  return { cost, line, item: after };
}

/** Show Travis an item — sets met flag, returns his read, optional journal for Kane steel. */
export function showTravisItem(state: GameState, itemId: string): ItemStoryBeat | string {
  ensureNarrative(state);
  const found = findItem(state, itemId);
  if (!found) return "That item walked off before it reached the bay.";
  setFlag(state, "travis_met", true);
  const beat = travisReadItem(state, found.item);
  if (
    found.item.tags?.some((t) => /kane|aegis|vesper/i.test(t)) ||
    /kane|aegis|vesper/i.test(found.item.name)
  ) {
    addJournal(state, {
      act: state.narrative?.act ?? "act_i",
      day: state.day,
      title: "Travis spat on Kane steel",
      body: `You laid ${found.item.name} on his bench. He did not polish the invoice.`,
      tags: ["travis", "kane", "inventory"],
    });
  }
  return beat;
}

export function inventoryStoryFilter(
  item: Item | undefined,
  lane: "all" | "travis" | "damaged" | "parts",
): boolean {
  if (lane === "all" || !item) return true;
  if (lane === "travis") return isTravisPart(item);
  if (lane === "damaged") return item.condition !== "Pristine" && (item.kind === "weapon" || item.kind === "armor");
  if (lane === "parts") return item.kind === "attachment" || isTravisPart(item);
  return true;
}

export function storyBadge(item: Item): string | null {
  if (isTravisPart(item)) return "Travis bay";
  if (item.kind === "attachment") return item.attachmentSlot ? `Socket · ${item.attachmentSlot}` : "Attachment";
  if (item.condition === "Broken") return "Broken";
  if (item.condition === "Damaged") return "Needs weld";
  if (item.sockets && Object.keys(item.sockets).length) return "Fitted";
  return null;
}

export function vaultFirearms(state: GameState, opId: string): Item[] {
  return state.operatives.find((o) => o.id === opId)?.inventory.filter((i) => i.kind === "weapon") ?? [];
}

export function allRepairCandidates(state: GameState): { item: Item; opId: string | "vault" }[] {
  const rows: { item: Item; opId: string | "vault" }[] = [];
  for (const item of state.vault) {
    if ((item.kind === "weapon" || item.kind === "armor") && item.condition !== "Pristine") {
      rows.push({ item, opId: "vault" });
    }
  }
  for (const op of state.operatives) {
    for (const item of op.inventory) {
      if ((item.kind === "weapon" || item.kind === "armor") && item.condition !== "Pristine") {
        rows.push({ item, opId: op.id });
      }
    }
  }
  return rows;
}

/** Count story hooks sitting in bags — for HUD / empty states. */
export function inventoryStoryPulse(state: GameState): { travis: number; damaged: number; attachments: number } {
  const all = bags(state);
  return {
    travis: all.filter(isTravisPart).length,
    damaged: all.filter((i) => (i.kind === "weapon" || i.kind === "armor") && i.condition !== "Pristine").length,
    attachments: all.filter((i) => i.kind === "attachment").length,
  };
}
