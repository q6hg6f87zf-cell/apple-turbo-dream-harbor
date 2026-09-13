import { MANUAL, SCREEN_SCRIPT, TALK } from "./talk";

let booted = false;

export function bootstrapTyroneHelp() {
  if (booted) return;
  booted = true;

  TALK.inventory = [
    {
      who: "Tyrone Bot",
      text: "Inventory is supposed to be fast, partner. Tap the thing, pick the resident, read the before-and-after numbers, then use the big button. If you need a spreadsheet to equip a coat, I failed you.",
    },
    {
      who: "Tyrone Bot",
      text: "Weapons, armor and trinkets equip. Consumables get used once. Enchantments attach to gear and disappear into it. Materials stay in Vault 13 for construction. Special items stay tagged until a door, boss or story asks for them.",
    },
    {
      who: "Tyrone Bot",
      text: "Power is loadout strength. Level is the resident. First-time item mastery gives a little XP, but sorties are where real training happens. I will show you if an item is about to push somebody over a level before you commit.",
    },
    {
      who: "Tyrone Bot",
      text: "If the item is sitting in Vault 13, Issue & Equip does both jobs in one tap. If it is already on a resident, Equip and Unequip mean exactly what they say. Revolutionary engineering, I know.",
    },
  ];

  MANUAL.inventory = {
    title: "Quick loadout",
    blurb: "Tyrone keeps Inventory to three moves: choose an item, preview the resident, act. The sheet explains what changes before anything is consumed or equipped.",
    tips: [
      "Level is permanent resident progression. Power is the current loadout score.",
      "Issue & Equip moves Vault gear to the selected resident and equips it in one tap.",
      "Consumables disappear when used. Enchantments attach permanently to one gear item.",
      "Materials feed Vault 13 upgrades. Special items are keys, relics and story/system pieces.",
      "Use Explain, Best fit, or How to use on an item for Tyrone's context-specific answer.",
    ],
  };

  SCREEN_SCRIPT.inventory = "inventory";

  // Keep old dialogue from promising the retired rapid-idle economy.
  if (TALK.resume?.[2]) {
    TALK.resume[2].text = "Same Vault as yesterday, partner. Passive caps are a drip now, not a fire hose. Real progress comes from sorties, raid contribution, salvage and keeping the squad alive.";
  }
  if (TALK.hq?.[1]) {
    TALK.hq[1].text = "Vault 13 upgrades are campaign projects now. Caps are only one requirement. Higher tiers ask for Hollow Ore, Moon Favor, regional materials, boss clears, riders and time. Read Expansion Protocol before you spend.";
  }
  if (TALK.deploy?.[3]) {
    TALK.deploy[3].text = "Bosses are Moon Squad raids. Scout for intel, build rider contribution XP, keep the party healthy, and bring different classes. If the Raid Matrix says no, I mean no. Improve the team before you feed me paperwork.";
  }
}
