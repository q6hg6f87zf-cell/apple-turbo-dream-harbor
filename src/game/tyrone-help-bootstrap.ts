import { MANUAL, MANUAL_PROMPTS, SCREEN_SCRIPT, TALK } from "./talk";

let booted = false;

export function bootstrapTyroneHelp() {
  if (booted) return;
  booted = true;

  TALK.inventory = [
    {
      who: "Tyrone Bot",
      text: "Inventory is supposed to be a story, partner — not a spreadsheet. Tap the thing, hear why it matters, pick the resident, then use the big button. Travis parts and cracked steel get their own lanes.",
    },
    {
      who: "Tyrone Bot",
      text: "Weapons, armor and trinkets equip. Attachments seat on firearms here. Consumables get used once. Enchantments attach to gear. Materials stay for construction. Special items stay tagged. Travis bay parts walk to the Mechanical Shop — he seats them in me.",
    },
    {
      who: "Tyrone Bot",
      text: "Vault Machine Shop welds and strips. Travis favor-welds once his jig trusts you. Do not confuse the two shops. Explain quotes the lore. I will show you if an item is about to push somebody over a level before you commit.",
    },
    {
      who: "Tyrone Bot",
      text: "If the item is sitting in Vault 13, Issue & Equip does both jobs in one tap. If it is already on a resident, Equip and Unequip mean exactly what they say. Revolutionary engineering, I know.",
    },
  ];

  MANUAL.inventory = {
    title: "Quick loadout",
    blurb: "Tyrone keeps Inventory to story-first moves: choose an item, hear why it matters, preview the resident, act. Travis parts and cracked steel show up as story lanes — not spreadsheet rows.",
    tips: [
      "Level is permanent resident progression. Power is the current loadout score.",
      "Issue & Equip moves Vault gear to the selected resident and equips it in one tap.",
      "Travis bay parts: Take to Travis. He seats T-0880 fittings on TyroneBot — he does not replace the Vault Machine Shop.",
      "Attachments: Seat on firearm here. Strip at Vault Machine Shop when the forge is lit.",
      "Damaged weapons/armor: Repair at Vault Machine Shop, or Travis favor weld once his jig trusts you.",
      "Explain quotes the lore. Best fit and How to use are the short clipboard.",
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
  MANUAL_PROMPTS.inventory = [
    "What do I do with Travis parts?",
    "How do I repair a weapon?",
    "How do I seat an attachment?",
    "Who is Travis?",
  ];
}
