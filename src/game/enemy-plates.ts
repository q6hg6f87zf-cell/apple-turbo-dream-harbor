import { CAST, type CastId } from "./cast";

/** Photographic plates for contacts that are not already a named face. */
const FIELD: Record<string, string> = {
  "Slag-Rat": "/art/npcs/field/slag-rat.jpg",
  "Dust Picker": "/art/npcs/field/dust-picker.jpg",
  "Porch Mutt": "/art/npcs/field/porch-mutt.jpg",
  "Alley Runner": "/art/npcs/field/alley-runner.jpg",
  "Slag-Hound": "/art/npcs/field/slag-hound.jpg",
  "Ironclad Watch": "/art/npcs/field/ironclad-watch.jpg",
  "Ashen Briar": "/art/npcs/field/ashen-briar.jpg",
  "Furnace Debtman": "/art/npcs/field/furnace-debtman.jpg",
  "Slag Bruiser": "/art/npcs/field/slag-bruiser.jpg",
  "Kane Buyer": "/art/npcs/field/kane-buyer.jpg",
  "Ore-Leech": "/art/npcs/field/ore-leech.jpg",
  "Lift-Cage Horror": "/art/npcs/field/lift-cage.jpg",
  "Survey Shade": "/art/npcs/field/survey-shade.jpg",
  "Drowned Page": "/art/npcs/field/drowned-page.jpg",
  "Tide Warden": "/art/npcs/field/tide-warden.jpg",
  "Kane Diver": "/art/npcs/field/kane-diver.jpg",
  "AEGIS Specialist": "/art/npcs/field/aegis-specialist.jpg",
  "2753 Frame": "/art/npcs/field/frame-2753.jpg",
  "Spire Interceptor": "/art/npcs/field/spire-interceptor.jpg",
};

const BOSSES: Record<string, CastId> = {
  Gravenor: "gravenor",
  "Valdris the Unmourned": "valdris",
  "Thessaly Vane": "thessaly",
  "The Sink": "sink",
  "AEGIS Warden 2753": "warden",
};

const FALLBACK = "/art/npcs/field/contact.jpg";

/** A face for whoever is standing in the fight. Never empty. */
export function plateFor(name: string | undefined): string {
  if (!name) return FALLBACK;
  if (FIELD[name]) return FIELD[name];
  const boss = BOSSES[name];
  if (boss) return CAST[boss].portrait;
  if (/2753/.test(name)) return FIELD["2753 Frame"]!;
  if (/deserter/i.test(name)) return FIELD["Alley Runner"]!;
  if (/smuggler/i.test(name)) return FIELD["Kane Buyer"]!;
  if (/alchemist/i.test(name)) return FIELD["Dust Picker"]!;
  if (/cultist/i.test(name)) return FIELD["Drowned Page"]!;
  if (/aegis|specialist/i.test(name)) return FIELD["AEGIS Specialist"]!;
  return FALLBACK;
}
