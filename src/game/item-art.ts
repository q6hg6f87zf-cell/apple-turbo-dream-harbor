import type { AmmoType, ItemKind, WeaponFamily } from "./types";

export const REGION_STREET: Record<string, string> = {
  ironclad: "/art/places/ironclad-street.jpg",
  slagtown: "/art/places/slagtown-street.jpg",
  blackspire: "/art/places/blackspire-street.jpg",
  brasswater: "/art/places/brasswater-street.jpg",
  veyra: "/art/places/veyra-street.jpg",
};

const ART = {
  rifle: "/art/items/rifle.jpg",
  m4: "/art/items/m4.jpg",
  m16: "/art/items/m16.jpg",
  m14: "/art/items/m14.jpg",
  m700: "/art/items/m700.jpg",
  m70: "/art/items/m70.jpg",
  bolt: "/art/items/bolt.jpg",
  shotgun: "/art/items/shotgun.jpg",
  pump: "/art/items/shotgun-pump.jpg",
  pistol: "/art/items/pistol.jpg",
  sidearm: "/art/items/pistol-service.jpg",
  laser: "/art/items/laser.jpg",
  l8: "/art/items/laser-l8.jpg",
  l6: "/art/items/l6.jpg",
  rail: "/art/items/rail.jpg",
  rail2753: "/art/items/rail-2753.jpg",
  saw: "/art/items/saw.jpg",
  harpoon: "/art/items/harpoon.jpg",
  ammo: "/art/items/ammo.jpg",
  ammo308: "/art/items/ammo-308.jpg",
  ammo556: "/art/items/ammo-556.jpg",
  ammo3030: "/art/items/ammo-3030.jpg",
  ammo12g: "/art/items/ammo-12g.jpg",
  crate: "/art/items/surplus-crate.jpg",
  cell: "/art/items/cell.jpg",
  armor: "/art/items/armor.jpg",
  plate: "/art/items/plate.jpg",
  carrier: "/art/items/plate-carrier.jpg",
  exo: "/art/items/exoshell.jpg",
  rivet: "/art/items/rivetguard.jpg",
  heat: "/art/items/heat-shell.jpg",
  aegis: "/art/items/aegis.jpg",
  chem: "/art/items/chem.jpg",
  stim: "/art/items/stim.jpg",
  medgel: "/art/items/med-gel.jpg",
  coil: "/art/items/coil.jpg",
  ironcoil: "/art/items/ironbound-coil.jpg",
  trinket: "/art/items/trinket.jpg",
  mask: "/art/items/respirator.jpg",
  lever: "/art/items/lever-3030.jpg",
  railspike: "/art/items/railspike.jpg",
  sword: "/art/items/sword.jpg",
  knives: "/art/items/knives.jpg",
  spike: "/art/items/spike.jpg",
  stick: "/art/items/stick.jpg",
  scalpel: "/art/items/scalpel.jpg",
  lute: "/art/items/lute.jpg",
  pin: "/art/items/bobby-pin.jpg",
  sigil: "/art/items/sigil.jpg",
  whetstone: "/art/items/whetstone.jpg",
  staff: "/art/items/staff.jpg",
  mace: "/art/items/mace.jpg",
};

function ammoStill(ammoType: AmmoType | undefined, name: string): string {
  const n = name.toLowerCase();
  if (ammoType === ".308" || /\.308/.test(n)) return ART.ammo308;
  if (ammoType === "5.56" || /5\.56/.test(n)) return ART.ammo556;
  if (ammoType === ".30-30" || /30-30/.test(n)) return ART.ammo3030;
  if (ammoType === "12g" || /12g|shotgun shell/.test(n)) return ART.ammo12g;
  if (ammoType === "laser" || ammoType === "cell" || /cell|laser|crystal|capacitor/.test(n)) return ART.cell;
  return ART.ammo;
}

function meleeStill(n: string): string {
  if (/lute|harp|flute/.test(n)) return ART.lute;
  if (/scalpel/.test(n)) return ART.scalpel;
  if (/throwing|knives/.test(n)) return ART.knives;
  if (/knife|shiv|needle/.test(n)) return ART.knives;
  if (/spike/.test(n)) return ART.spike;
  if (/iron-shod|stick/.test(n)) return ART.stick;
  if (/mace|maul|halberd/.test(n)) return ART.mace;
  if (/staff|wand|tome|femur|spine|censer/.test(n)) return ART.staff;
  if (/sword|cleaver|blade|judgement/.test(n)) return ART.sword;
  if (/cane|ledger|scales|hook|chain|baton/.test(n)) return ART.stick;
  return ART.sword;
}

function looksMelee(n: string, fam?: WeaponFamily): boolean {
  if (fam === "melee") return true;
  if (fam) return false;
  return /sword|mace|halberd|cleaver|knife|knives|shiv|spike|hook|baton|chain|dagger|staff|axe|spear|lute|harp|flute|stick|scalpel|wand|tome|cane|maul|blade|femur|censer|ledger|scales/.test(n);
}

export function itemArt(input: {
  kind: ItemKind;
  name: string;
  ammoType?: AmmoType;
  weaponFamily?: WeaponFamily;
}): string | null {
  const n = input.name.toLowerCase();
  if (/bobby\s*pin/.test(n)) return ART.pin;
  if (/whetstone/.test(n)) return ART.whetstone;
  if (/gate sigil|dented gate/.test(n)) return ART.sigil;
  if (/2753 rail/.test(n) && !/aegis|crate/.test(n)) return ART.rail2753;
  if (/skyline exo|exoshell/.test(n)) return ART.exo;
  if (/rivetguard/.test(n)) return ART.rivet;
  if (/aegis weave|2753 aegis/.test(n)) return ART.aegis;
  if (/heat shell/.test(n)) return ART.heat;
  if (/plate carrier/.test(n)) return ART.carrier;
  if (/ash filter|respirator/.test(n)) return ART.mask;
  if (/ironbound coil/.test(n)) return ART.ironcoil;
  if (/med-gel|med gel/.test(n)) return ART.medgel;
  if ((/surplus crate|2753 crate/.test(n) && !input.ammoType)) return ART.crate;
  if (/railspike/.test(n)) return ART.railspike;

  if (input.kind === "consumable") {
    if (input.ammoType || /box|crate|pack|bundle|shell/.test(n)) return ammoStill(input.ammoType, n);
    if (/stim|syringe|vial/.test(n)) return ART.stim;
    return ART.chem;
  }

  if (input.kind === "armor") {
    if (/plate|cuirass|chest/.test(n)) return ART.plate;
    return ART.armor;
  }
  if (input.kind === "enchantment") return ART.coil;
  if (input.kind === "trinket" || input.kind === "special") return ART.trinket;

  // Attachments and materials have no art of their own yet, and a line icon
  // beside a photographed rifle is the tell that breaks the shelf. Stand them
  // in on the nearest still until they are drawn.
  if (input.kind === "attachment") return ART.coil;
  if (input.kind === "material") {
    if (/cell|capacitor|signal|vial|salt|charge/.test(n)) return ART.cell;
    return ART.whetstone;
  }

  if (input.kind !== "weapon") return null;

  if (/\bl8\b/.test(n)) return ART.l8;
  if (/\bl6\b/.test(n)) return ART.l6;
  if (/\bm14\b/.test(n)) return ART.m14;
  if (/\bm16\b/.test(n)) return ART.m16;
  if (/\bm4\b/.test(n)) return ART.m4;
  if (/\bm700\b/.test(n)) return ART.m700;
  if (/\bm70 magnum\b/.test(n)) return ART.m70;
  if (/\bm70\b/.test(n)) return ART.m70;
  if (/\bsaw\b/.test(n)) return ART.saw;
  if (/harpoon/.test(n)) return ART.harpoon;
  if (/\bm94\b|\bm336\b/.test(n) || input.ammoType === ".30-30") return ART.lever;
  if (/service pistol|sidearm/.test(n)) return ART.sidearm;
  if (/combat shotgun|(^|\s)pump(\s|$)/.test(n)) return ART.pump;

  if (looksMelee(n, input.weaponFamily)) return meleeStill(n);

  const fam = input.weaponFamily;
  if (fam === "energy" || /l4|l9|laser|coil|arc|phase/.test(n)) return ART.laser;
  if (fam === "heavy" || input.ammoType === "rail" || /rail|cannon/.test(n)) return ART.rail;
  if (fam === "shotgun" || /shotgun|scatter/.test(n)) return ART.shotgun;
  if (fam === "pistol" || fam === "smg" || /pistol|subgun/.test(n)) return ART.pistol;
  if (fam === "sniper" || /m24|marksman|survey|springfield/.test(n)) return ART.bolt;
  return ART.rifle;
}

export function itemThumbUrl(src: string | null): string | null {
  if (!src) return null;
  const path = src.split("?")[0] ?? src;
  if (!path.startsWith("/art/items/") || path.includes("/thumbs/")) return src;
  const file = path.slice("/art/items/".length);
  return `/art/items/thumbs/${file}`;
}

export function preloadItemArt(urls: (string | null | undefined)[]) {
  if (typeof window === "undefined") return;
  const seen = new Set<string>();
  for (const url of urls) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const img = new Image();
    img.decoding = "async";
    img.src = url;
  }
}
