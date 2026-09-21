# Hollow Realm

## The shift loop

Working a site in a region is the core minute-to-minute loop, and it now ends in
a **field report** rather than a toast.

- Every pin in a region (scout, salvage, listen) files a `SiteReport`: what was
  found, what is hunting, what it cost, and a short list of things to do next.
- A report always carries a verb. Chain into the next site, run a lead, brief a
  sortie, walk to the market, or rest. A shift with no watches left is a report
  whose primary action is **Rest until dawn**, not a refusal.
- A second sweep of the same site in one day is allowed and simply pays less.
  The old flat "you already worked this site today" is what used to end the day
  with nothing left to press.
- Sites gain **depth** (Unread → Marked → Mapped → Read → Owned) as they are
  worked. Depth lowers what a sortie has to roll there and opens better leads.
- A good sweep names a **lead**: a concrete follow-up job with its own DC
  relief, caps bonus and extra loot rolls. Deploying on a lead builds the
  mission around what was found instead of the generic three beats.
- Intel pushes a five-stage **region story thread**. Reports and debriefs read
  the thread back, so intel is a story counter rather than only a number.

Reports are kept on the save file and surfaced on the Profile tab.

## Profile

A hub tab that collects what mid-shift decisions actually need: rider plate and
rank, the character file and its body dice, the equipped loadout with full
weapon ballistics and ammo on hand, per-region intel / site mastery / boss
state, open leads, and the record of everything filed so far.

## Missions

- Every sortie carries an **objective** drawn from the region's story thread,
  with a caps bonus for closing it cleanly.
- Every beat states **why** it is in the run.
- **Complications** fire mid-run off the state of the fiction — a fumble, a hot
  Kane trail, a breach approach, a wounded line — and inject a beat the deploy
  screen never showed. One of a kind per run, never on the last beat.

## Enemy doctrine

Hostiles have roles, and a role wants something specific out of a round.

| Role | Behaviour |
|---|---|
| Brawler | Walks at the strongest thing standing; swings wild when morale drops |
| Skirmisher | Hunts the wounded, goes around a guard rather than through it |
| Marksman | Spends a round settling, then shoots through cover |
| Controller | Targets the highest INT/WIS and pins the next order |
| Pack | Braver in numbers, feral alone |
| Machine | No morale, no flinch, punches through guard |
| Warden | Named. Marks whoever hurt it most; never routs, never calls |

Morale falls as allies drop. A broken hostile shouts for help once, then leaves
the field alive — which ends the fight without a kill. Named villains are exempt:
their phases, including the Reckoning, are how they refuse to stop.

Every decision is written into the combat log as a decision, so the player can
read the intent and play against it.

## Gear

- The campaign starts on **150 caps**. The market always stocks at least one lot
  a broke rider can afford.
- Every forged rider is handed the **Vault 13 BB Rifle** and a tube of BBs — the
  floor of the weapon ladder. Silent, harmless, and never quite useless.
- The **.30-06** shelf: the M70 Springfield (cheap five-round bolt), the M1903
  Marksman (AP 2, the longest ballistic reach on the frontier) and the
  Ought-Six Covenant (legendary, AP 3), plus M2 Ball and steel-core Black Tip.
- Generated weapon descriptions now state chambering, magazine, where the gun
  wants to be used, what it costs to shoot and whether it opens plate.

## Server authority migration

Hollow Realm now has a staged server-authoritative path for verified TyroneBot riders.

- Public URL parameters cannot mint caps, XP, rank or Pack items.
- TyroneBot writes require a trusted server key.
- Identity linking uses short-lived one-time claims with only claim hashes stored server-side.
- Verified riders join the shared `moon-squad` campaign economy.
- Vault 13 treasury caps and each linked rider's Moon Squad bank-card caps settle on the server.
- Vault → card, card → Vault and linked rider → linked rider transfers are atomic and idempotent.
- Duplicate request IDs cannot double-credit or double-debit caps.
- Overdrafts and transfers to unlinked riders are rejected server-side.
- The client refreshes authoritative card/treasury values on focus and on a light polling interval.
- Verified authority mode keeps Vault expansion locked until campaign progression and upgrade requirements are also server-owned.

LocalStorage remains a gameplay/cache layer during this migration. It is not considered a trusted source for linked rider economy values.

The authoritative card layer passed TypeScript, production build, the 2,500-run campaign simulation, server authority security smoke and iPhone-shaped gameplay smoke before this documentation-only update.

The next migration slice is server-owned campaign progression and reward issuance, followed by authoritative Vault expansion and inventory ownership.
