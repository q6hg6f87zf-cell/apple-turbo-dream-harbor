import { coupleAmmo, gradeFromLoad, gunQuality, ammoQuality } from "./ammo-matrix";
import { arsenalByName } from "./arsenal";
import type {
  AttachmentSlot,
  Combatant,
  GameState,
  Item,
  Operative,
  RangeBand,
  WeaponFamily,
  WeaponSpec,
} from "./types";

export const MAG_SIZE: Record<WeaponFamily, number> = {
  melee: 0,
  pistol: 8,
  smg: 18,
  rifle: 10,
  shotgun: 5,
  sniper: 4,
  energy: 12,
  heavy: 6,
};

export const RANGE_ORDER: RangeBand[] = ["close", "mid", "long"];

const BALLISTIC: WeaponFamily[] = ["pistol", "smg", "rifle", "shotgun", "sniper"];
const SLOTS: AttachmentSlot[] = ["optic", "muzzle", "barrel", "mag", "stock", "underbarrel", "receiver"];

export type WeaponProfile = {
  family: WeaponFamily;
  ammoType?: Item["ammoType"];
  rangeBand: RangeBand;
  ap: number;
  accuracy: number;
  recoil: number;
  mag: number;
  magSize: number;
  damageBonus: number;
  roundsPerShot: number;
  dry: boolean;
};

export type ShotResult = {
  dry: boolean;
  rushed: boolean;
  apBonus: number;
  damageBonus: number;
  accuracyBonus: number;
  log: string;
};

type ItemSource = { kind: "vault" } | { kind: "operative"; opId: string };

export function copyWeaponSpec(src: WeaponSpec | undefined): WeaponSpec {
  if (!src) return {};
  return {
    weaponFamily: src.weaponFamily,
    ammoType: src.ammoType,
    rangeBand: src.rangeBand,
    ap: src.ap,
    accuracy: src.accuracy,
    recoil: src.recoil,
    attachmentSlot: src.attachmentSlot,
    fitsFamilies: src.fitsFamilies ? [...src.fitsFamilies] : undefined,
    sockets: src.sockets ? { ...src.sockets } : undefined,
    ammoCount: src.ammoCount,
    mag: src.mag,
    magSize: src.magSize,
    ammoLoad: src.ammoLoad,
    ammoGrade: src.ammoGrade,
    loadAp: src.loadAp,
    loadDamage: src.loadDamage,
    loadAccuracy: src.loadAccuracy,
  };
}

export function inferFamily(item: Item): WeaponFamily {
  if (item.weaponFamily) return item.weaponFamily;
  const n = `${item.name} ${item.effect}`.toLowerCase();
  if (/\b(saw|rail cannon|harpoon|cannon|gate breaker)\b/.test(n)) return "heavy";
  if (/\b(l4|l6|l8|l9|laser|pulse|coherent)\b/.test(n)) return "energy";
  if (/\b(coil|arc|phase|lance|energy)\b/.test(n)) return "energy";
  if (/\b(sniper|marksman|needle|magnum|m24|m70 magnum)\b/.test(n)) return "sniper";
  if (/\b(shotgun|scatter|pump)\b/.test(n)) return "shotgun";
  if (/\b(smg|subgun|machine pistol)\b/.test(n)) return "smg";
  if (/\b(rifle|carbine)\b/.test(n)) return "rifle";
  if (/\b(pistol|revolver|sidearm|bb gun)\b/.test(n)) return "pistol";
  return "melee";
}

export function hydrateWeapon(item: Item): Item {
  if (item.kind !== "weapon") {
    if (item.kind === "attachment" && !item.attachmentSlot) {
      const cat = arsenalByName(item.name);
      if (cat) Object.assign(item, copyWeaponSpec(cat));
    }
    if (item.kind === "consumable" && item.ammoType && item.ammoCount == null) {
      const cat = arsenalByName(item.name);
      if (cat?.ammoCount) item.ammoCount = cat.ammoCount;
    }
    return item;
  }
  const cat = arsenalByName(item.name);
  if (cat) {
    item.weaponFamily ??= cat.weaponFamily;
    item.ammoType ??= cat.ammoType;
    item.rangeBand ??= cat.rangeBand;
    item.ap ??= cat.ap;
    item.accuracy ??= cat.accuracy;
    item.recoil ??= cat.recoil;
    item.magSize ??= cat.magSize;
    item.damage ??= cat.damage;
  }
  const family = inferFamily(item);
  item.weaponFamily = family;
  if (family === "melee") {
    item.magSize = 0;
    item.mag = 0;
    item.rangeBand ??= "close";
    return item;
  }
  item.magSize ??= MAG_SIZE[family];
  if (item.mag == null) item.mag = item.magSize;
  item.rangeBand ??= family === "sniper" || family === "heavy" ? "long" : family === "shotgun" || family === "smg" ? "close" : "mid";
  return item;
}

function parseMods(text: string) {
  const out = { accuracy: 0, ap: 0, mag: 0, damage: 0, recoil: 0, range: undefined as RangeBand | undefined, freeReload: false };
  if (!text) return out;
  const acc = text.match(/([+-]\s*\d+)\s+accuracy/i);
  if (acc) out.accuracy += Number(acc[1]!.replace(/\s/g, ""));
  const ap = text.match(/\bAP\s*([+-]?\s*\d+)/i) || text.match(/([+-]\s*\d+)\s+AP\b/i);
  if (ap) out.ap += Number(ap[1]!.replace(/\s/g, ""));
  const mag = text.match(/([+-]\s*\d+)\s+mag\b/i);
  if (mag) out.mag += Number(mag[1]!.replace(/\s/g, ""));
  const dmg = text.match(/([+-]\s*\d+)\s+damage/i);
  if (dmg) out.damage += Number(dmg[1]!.replace(/\s/g, ""));
  const rec = text.match(/([+-]\s*\d+)\s+recoil/i);
  if (rec) out.recoil += Number(rec[1]!.replace(/\s/g, ""));
  if (/\bRange long\b/i.test(text)) out.range = "long";
  else if (/\bRange close\b/i.test(text)) out.range = "close";
  else if (/\bRange mid\b/i.test(text)) out.range = "mid";
  if (/rushed reload is free/i.test(text)) out.freeReload = true;
  return out;
}

function socketText(item: Item): string {
  const i = item.effect.indexOf("•");
  return i >= 0 ? item.effect.slice(i) : "";
}

export function roundsPerShot(item: Item, family: WeaponFamily): number {
  const m = item.effect.match(/Spends\s+(\d+)\s+rounds/i);
  if (m) return Math.max(1, Number(m[1]));
  if (family === "smg") return 2;
  return 1;
}

export function resolveWeapon(item: Item | undefined): WeaponProfile {
  if (!item) {
    return {
      family: "melee",
      rangeBand: "close",
      ap: 0,
      accuracy: 0,
      recoil: 0,
      mag: 0,
      magSize: 0,
      damageBonus: 0,
      roundsPerShot: 1,
      dry: false,
    };
  }
  hydrateWeapon(item);
  const family = inferFamily(item);
  const mods = parseMods(socketText(item));
  const magSize = Math.max(0, (item.magSize ?? MAG_SIZE[family]) + mods.mag);
  const mag = family === "melee" ? 0 : Math.max(0, item.mag ?? magSize);
  const spend = roundsPerShot(item, family);
  return {
    family,
    ammoType: item.ammoType,
    rangeBand: mods.range ?? item.rangeBand ?? "mid",
    ap: (item.ap ?? 0) + mods.ap,
    accuracy: (item.accuracy ?? 0) + mods.accuracy,
    recoil: (item.recoil ?? 0) + mods.recoil,
    mag,
    magSize,
    damageBonus: mods.damage,
    roundsPerShot: spend,
    dry: family !== "melee" && mag < spend,
  };
}

export function magLine(item: Item | undefined): string {
  if (!item) return "";
  const p = resolveWeapon(item);
  if (p.family === "melee") return "melee";
  const ammo = p.ammoType ?? "—";
  const load = item.ammoLoad && item.ammoLoad !== "FMJ" && item.ammoLoad !== "Ball" ? ` ${item.ammoLoad}` : "";
  const grade = item.ammoGrade && item.ammoGrade !== "ball" ? ` ${item.ammoGrade}` : "";
  return `${p.mag}/${p.magSize} · ${ammo}${load || grade}`;
}

export function canAttachPart(weapon: Item, part: Item): string | null {
  if (weapon.kind !== "weapon") return "That is not a firearm or a blade.";
  if (part.kind !== "attachment") return "That is not an attachment.";
  hydrateWeapon(weapon);
  hydrateWeapon(part);
  const slot = part.attachmentSlot;
  if (!slot) return "That part has no slot stamped.";
  const family = inferFamily(weapon);
  const fits = part.fitsFamilies;
  if (fits && fits.length) {
    if (!fits.includes(family)) return `${part.name} does not fit a ${family}.`;
  } else if (family === "melee") {
    if (slot !== "underbarrel") return "Blades take a bayonet. Not an optic.";
  }
  const taken = weapon.sockets?.[slot];
  if (taken) return `${slot} already holds ${taken}. Strip it at the Machine Shop first.`;
  return null;
}

function findSourceItem(state: GameState, source: ItemSource, itemId: string) {
  if (source.kind === "vault") return state.vault.find((item) => item.id === itemId) ?? null;
  return state.operatives.find((op) => op.id === source.opId)?.inventory.find((item) => item.id === itemId) ?? null;
}

function removeSourceItem(state: GameState, source: ItemSource, itemId: string) {
  if (source.kind === "vault") {
    state.vault = state.vault.filter((item) => item.id !== itemId);
    return;
  }
  const i = state.operatives.findIndex((op) => op.id === source.opId);
  if (i < 0) return;
  state.operatives[i] = {
    ...state.operatives[i],
    inventory: state.operatives[i].inventory.filter((item) => item.id !== itemId),
  };
}

export function attachPart(
  state: GameState,
  source: ItemSource,
  partId: string,
  targetOpId: string,
  targetItemId: string,
): string | null {
  const part = findSourceItem(state, source, partId);
  const op = state.operatives.find((x) => x.id === targetOpId);
  const weapon = op?.inventory.find((item) => item.id === targetItemId);
  if (!part || !op || !weapon) return "Tyrone cannot find that part or that firearm.";
  const block = canAttachPart(weapon, part);
  if (block) return block;
  const slot = part.attachmentSlot!;
  const mods = parseMods(part.effect);
  weapon.sockets = { ...(weapon.sockets ?? {}), [slot]: part.name };
  weapon.tags = [...(weapon.tags ?? []), `socket:${slot}:${part.name}`];
  weapon.effect = `${weapon.effect} • ${part.name}: ${part.effect}`;
  weapon.value += Math.max(1, Math.round(part.value * 0.45));
  if (mods.mag) {
    weapon.magSize = (weapon.magSize ?? MAG_SIZE[inferFamily(weapon)]) + mods.mag;
    weapon.mag = (weapon.mag ?? 0) + mods.mag;
  }
  removeSourceItem(state, source, partId);
  return `${part.name} seated in the ${slot} of ${weapon.name}.`;
}

export function stripPart(state: GameState, opId: string, weaponId: string, slot: AttachmentSlot): string | null {
  if ((state.rooms.forge ?? 0) < 1) return "Machine Shop is dark. I will not strip a live firearm on the porch.";
  const op = state.operatives.find((x) => x.id === opId);
  const weapon = op?.inventory.find((item) => item.id === weaponId);
  if (!op || !weapon) return "That firearm is not on a resident.";
  const name = weapon.sockets?.[slot];
  if (!name) return `Nothing in the ${slot}.`;
  const cat = arsenalByName(name);
  const mods = parseMods(cat?.effect ?? "");
  const returned: Item = {
    id: `part-${Date.now().toString(36)}`,
    name,
    kind: "attachment",
    rarity: cat?.rarity ?? "Uncommon",
    condition: "Worn",
    effect: cat?.effect ?? "Stripped field part.",
    lore: cat?.lore ?? "Pulled at the Machine Shop.",
    value: cat ? Math.round(cat.value * 0.7) : 80,
    attachmentSlot: slot,
    fitsFamilies: cat?.fitsFamilies,
    sourceRegion: cat?.sourceRegion,
    tags: ["stripped"],
  };
  if (mods.mag) {
    weapon.magSize = Math.max(MAG_SIZE[inferFamily(weapon)], (weapon.magSize ?? 0) - mods.mag);
    weapon.mag = Math.min(weapon.mag ?? 0, weapon.magSize);
  }
  const nextSockets = { ...(weapon.sockets ?? {}) };
  delete nextSockets[slot];
  weapon.sockets = nextSockets;
  weapon.tags = (weapon.tags ?? []).filter((t) => !t.startsWith(`socket:${slot}:`));
  weapon.effect = weapon.effect
    .split("•")
    .map((chunk) => chunk.trim())
    .filter((chunk) => !chunk.startsWith(name))
    .join(" • ");
  state.vault.push(returned);
  return `${name} stripped from ${weapon.name}. Back in the Salvage Depot, Worn.`;
}

export function loadGrade(box: Item): string {
  const n = box.name;
  if (/\bAP\b/i.test(n)) return "AP";
  if (/Match/i.test(n)) return "Match";
  if (/Soft Point/i.test(n)) return "Soft Point";
  if (/Hot Load/i.test(n)) return "Hot";
  if (/Overcharged/i.test(n)) return "Overcharged";
  if (/Focusing/i.test(n)) return "Focusing";
  if (/Capacitor/i.test(n)) return "Pulse";
  if (/Slug/i.test(n)) return "Slug";
  if (/Incendiary/i.test(n)) return "Incendiary";
  if (/Hollow/i.test(n)) return "Hollow";
  if (/Bonded/i.test(n)) return "Bonded";
  if (/Partition/i.test(n)) return "Partition";
  if (/Tracer/i.test(n)) return "Tracer";
  return "FMJ";
}

function stampLoad(weapon: Item, box: Item) {
  const mods = parseMods(box.effect);
  const grade = box.ammoGrade ?? gradeFromLoad(box.name);
  const coupled = coupleAmmo(gunQuality(weapon), ammoQuality(grade), {
    ap: box.ap ?? mods.ap,
    damage: mods.damage,
    accuracy: mods.accuracy,
  });
  weapon.ammoLoad = loadGrade(box);
  weapon.ammoGrade = grade;
  weapon.loadAp = coupled.ap;
  weapon.loadDamage = coupled.damage;
  weapon.loadAccuracy = coupled.accuracy;
}

export function findAmmoBox(op: Operative, ammoType: Item["ammoType"]): Item | undefined {
  if (!ammoType) return undefined;
  return op.inventory.find((i) => i.kind === "consumable" && i.ammoType === ammoType && (i.ammoCount ?? 0) > 0);
}

function consumeFromBox(op: Operative, box: Item, n: number) {
  box.ammoCount = Math.max(0, (box.ammoCount ?? 0) - n);
  if ((box.ammoCount ?? 0) <= 0) {
    op.inventory = op.inventory.filter((i) => i.id !== box.id);
  }
}

export function reloadWeapon(op: Operative, weapon: Item): { rushed: boolean; log: string } | null {
  hydrateWeapon(weapon);
  const p = resolveWeapon(weapon);
  if (p.family === "melee" || p.magSize <= 0) return null;
  const need = p.magSize - p.mag;
  if (need <= 0) return { rushed: false, log: `${weapon.name} is already seated.` };
  const box = findAmmoBox(op, p.ammoType);
  if (!box) return null;
  const take = Math.min(need, box.ammoCount ?? 0);
  consumeFromBox(op, box, take);
  weapon.mag = p.mag + take;
  stampLoad(weapon, box);
  const free = parseMods(socketText(weapon)).freeReload;
  return { rushed: !free, log: `Reload ${take} ${p.ammoType}${weapon.ammoLoad && weapon.ammoLoad !== "FMJ" ? ` ${weapon.ammoLoad}` : ""}. ${weapon.mag}/${p.magSize}.` };
}

export function spendShot(op: Operative, weapon: Item | undefined): ShotResult {
  if (!weapon) return { dry: false, rushed: false, apBonus: 0, damageBonus: 0, accuracyBonus: 0, log: "" };
  hydrateWeapon(weapon);
  const p = resolveWeapon(weapon);
  if (p.family === "melee") return { dry: false, rushed: false, apBonus: 0, damageBonus: 0, accuracyBonus: 0, log: "" };

  let rushed = false;
  if (p.dry) {
    const reload = reloadWeapon(op, weapon);
    if (reload) {
      rushed = reload.rushed;
      Object.assign(p, resolveWeapon(weapon));
    }
  }

  const live = resolveWeapon(weapon);
  if (live.mag < live.roundsPerShot) {
    return {
      dry: true,
      rushed,
      apBonus: 0,
      damageBonus: 0,
      accuracyBonus: 0,
      log: "Dry click. Empty chamber.",
    };
  }

  weapon.mag = live.mag - live.roundsPerShot;
  return {
    dry: false,
    rushed,
    apBonus: weapon.loadAp ?? 0,
    damageBonus: weapon.loadDamage ?? 0,
    accuracyBonus: weapon.loadAccuracy ?? 0,
    log: rushed ? `Rushed reload. ${weapon.mag}/${live.magSize}.` : "",
  };
}

export function rangeHitMod(weaponRange: RangeBand, preferred: RangeBand | undefined, family: WeaponFamily): number {
  if (family === "melee") return preferred && preferred !== "close" ? -1 : 1;
  const a = RANGE_ORDER.indexOf(weaponRange);
  const b = RANGE_ORDER.indexOf(preferred ?? "mid");
  const steps = Math.abs(a - b);
  if (family === "shotgun" && weaponRange === "close" && preferred === "long") return -3;
  if (family === "sniper" && weaponRange === "long" && preferred === "close") return -2;
  if (steps === 0) return 1;
  if (steps === 1) return 0;
  return -2;
}

export function applyArmor(dmg: number, profile: WeaponProfile, target: Combatant): number {
  let out = dmg;
  const family = profile.family;
  const ballistic = BALLISTIC.includes(family);
  const resist = target.resist ?? [];
  const amt = target.resistAmt ?? 1;
  const resisted =
    resist.includes(family) ||
    (resist.includes("ballistic") && ballistic) ||
    (resist.includes("energy") && family === "energy") ||
    (resist.includes("melee") && family === "melee");
  const laser = profile.ammoType === "laser";
  const punched = profile.ap >= 2 || (laser && profile.ap >= 1);
  if (resisted && !punched) out -= amt;
  const weak = target.weakness ?? [];
  const weakHit =
    weak.includes(family) ||
    (weak.includes("ap-rifle") && family === "rifle" && profile.ap >= 2) ||
    (weak.includes("rail") && profile.ammoType === "rail") ||
    (weak.includes("energy") && family === "energy") ||
    (weak.includes("laser") && laser) ||
    (weak.includes("shotgun") && family === "shotgun") ||
    (weak.includes("rifle") && family === "rifle");
  if (weakHit) out += 2;
  if (target.armorClass === "beast" && family === "shotgun") out += 1;
  if (laser && (target.armorClass === "powered" || target.armorClass === "machine" || target.armorClass === "phase")) out += 2;
  return Math.max(1, out);
}

export function fieldArmor(name: string): Pick<Combatant, "armorClass" | "preferredRange" | "resist" | "weakness" | "resistAmt"> {
  const n = name.toLowerCase();
  if (/rat|mutt|picker|runner/.test(n)) return { armorClass: "soft", preferredRange: "close" };
  if (/hound|leech|briar/.test(n)) return { armorClass: "beast", preferredRange: "close", resist: ["melee"], weakness: ["shotgun"] };
  if (/watch|debt|bruiser|diver/.test(n)) return { armorClass: "plate", preferredRange: "mid", resist: ["pistol", "rifle"], weakness: ["energy"] };
  if (/frame|aegis|specialist/.test(n)) return { armorClass: "powered", preferredRange: "mid", resist: ["ballistic"], weakness: ["energy", "rail", "laser"], resistAmt: 1 };
  if (/interceptor/.test(n)) return { armorClass: "plate", preferredRange: "long", resist: ["pistol"], weakness: ["energy"] };
  if (/cage|warden|machine/.test(n)) return { armorClass: "machine", preferredRange: "close", resist: ["ballistic"], weakness: ["energy"] };
  if (/shade|page|phase/.test(n)) return { armorClass: "phase", preferredRange: "mid", resist: ["ballistic"], weakness: ["energy"], resistAmt: 2 };
  if (/buyer|smuggler/.test(n)) return { armorClass: "soft", preferredRange: "mid" };
  return { armorClass: "soft", preferredRange: "close" };
}

export function isAmmoConsumable(item: Item): boolean {
  return item.kind === "consumable" && !!item.ammoType;
}

export const ATTACHMENT_SLOTS = SLOTS;

export function socketList(item: Item): { slot: AttachmentSlot; name: string }[] {
  return SLOTS.filter((slot) => item.sockets?.[slot]).map((slot) => ({ slot, name: item.sockets![slot]! }));
}