import assert from "node:assert/strict";

const baseURL = process.env.HOLLOW_QA_URL ?? "http://127.0.0.1:8080";
const residentId = "qa-op-ironbound-01";

async function body(response) {
  return response.json().catch(() => ({}));
}

async function inventory(payload) {
  return fetch(`${baseURL}/api/hollow/inventory`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(payload),
  });
}

async function progression(payload) {
  return fetch(`${baseURL}/api/hollow/progression`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(payload),
  });
}

function named(snapshot, name) {
  return snapshot.items.find((entry) => entry.item?.name === name);
}

const initialResponse = await fetch(`${baseURL}/api/hollow/inventory`, { headers: { accept: "application/json" } });
assert.equal(initialResponse.status, 200, "Linked rider could not read authoritative Inventory.");
const initial = await body(initialResponse);
assert.equal(initial.authority, "server");

const migrationResponse = await inventory({
  command: "migrate_legacy",
  items: [
    { name: "Vault 13 Work Knife", kind: "weapon" },
    { name: "Vault 13 Work Knife", kind: "weapon" },
    { name: "Railspike Carbine", kind: "weapon" },
    { name: "Ironbound Coil", kind: "enchantment" },
    { name: "Med-Gel Ampoule", kind: "consumable" },
    { name: "Arc Lance", kind: "weapon" },
    { name: "QA GOD GUN", kind: "weapon" },
  ],
});
assert.equal(migrationResponse.status, 200);
const migrated = await body(migrationResponse);
assert.equal(migrated.migration.done, true);
assert.equal(migrated.migration.accepted, 4, "Legacy migration did not admit exactly the safe known low/mid-tier templates.");
assert.equal(migrated.migration.rejected, 3, "Legacy migration did not reject duplicate, forged and high-tier local gear.");
assert.ok(named(migrated, "Vault 13 Work Knife"));
assert.ok(named(migrated, "Railspike Carbine"));
assert.ok(named(migrated, "Ironbound Coil"));
assert.ok(named(migrated, "Med-Gel Ampoule"));
assert.equal(named(migrated, "Arc Lance"), undefined, "Legendary client gear crossed the authority migration boundary.");
assert.equal(named(migrated, "QA GOD GUN"), undefined, "Unknown forged client gear crossed the authority migration boundary.");

const migrationReplay = await inventory({ command: "migrate_legacy", items: [{ name: "Railspike Carbine", kind: "weapon" }] });
assert.equal(migrationReplay.status, 200);
const replayBody = await body(migrationReplay);
assert.equal(replayBody.migrationResult.duplicate, true, "Legacy migration could be replayed.");
assert.equal(replayBody.items.length, migrated.items.length, "Legacy migration replay changed item count.");

const rail = named(migrated, "Railspike Carbine");
const coil = named(migrated, "Ironbound Coil");
const med = named(migrated, "Med-Gel Ampoule");
assert.ok(rail && coil && med);

const fakeIssue = await inventory({
  command: "issue_equip",
  requestId: "qa-inventory-fake-0001",
  itemId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  residentId,
});
assert.equal(fakeIssue.status, 404, "A made-up item serial could be equipped.");

const issueResponse = await inventory({
  command: "issue_equip",
  requestId: "qa-inventory-issue-0001",
  itemId: rail.item.id,
  residentId,
});
assert.equal(issueResponse.status, 200);
const issued = await body(issueResponse);
const issuedRail = named(issued, "Railspike Carbine");
assert.equal(issuedRail.ownerType, "resident");
assert.equal(issuedRail.residentId, residentId);
assert.equal(issuedRail.item.equipped, true);

const unequipResponse = await inventory({
  command: "unequip",
  requestId: "qa-inventory-unequip-0001",
  itemId: issuedRail.item.id,
});
assert.equal(unequipResponse.status, 200);
const unequipped = await body(unequipResponse);
assert.equal(named(unequipped, "Railspike Carbine").item.equipped, false);

const equipResponse = await inventory({
  command: "equip",
  requestId: "qa-inventory-equip-0001",
  itemId: issuedRail.item.id,
});
assert.equal(equipResponse.status, 200);
const equipped = await body(equipResponse);
assert.equal(named(equipped, "Railspike Carbine").item.equipped, true);

const attachResponse = await inventory({
  command: "attach",
  requestId: "qa-inventory-attach-0001",
  itemId: coil.item.id,
  targetItemId: issuedRail.item.id,
  residentId,
});
assert.equal(attachResponse.status, 200);
const attached = await body(attachResponse);
assert.equal(named(attached, "Ironbound Coil"), undefined, "Consumed enchantment still exists as a loose item.");
const enchantedRail = named(attached, "Railspike Carbine");
assert.match(enchantedRail.item.effect, /Ironbound Coil/i, "Target gear did not retain the authoritative enchantment.");

const attachAgain = await inventory({
  command: "attach",
  requestId: "qa-inventory-attach-0002",
  itemId: coil.item.id,
  targetItemId: issuedRail.item.id,
  residentId,
});
assert.equal(attachAgain.status, 404, "Consumed enchantment could be reused.");

const consumeResponse = await inventory({
  command: "consume",
  requestId: "qa-inventory-consume-0001",
  itemId: med.item.id,
  residentId,
});
assert.equal(consumeResponse.status, 200);
const consumed = await body(consumeResponse);
assert.equal(named(consumed, "Med-Gel Ampoule"), undefined, "Consumed item still exists in authoritative Inventory.");

const consumeAgain = await inventory({
  command: "consume",
  requestId: "qa-inventory-consume-0002",
  itemId: med.item.id,
  residentId,
});
assert.equal(consumeAgain.status, 404, "Consumed item could be consumed twice.");

const degradeResponse = await inventory({
  command: "degrade",
  requestId: "qa-inventory-degrade-0001",
  itemId: issuedRail.item.id,
  condition: "Worn",
});
assert.equal(degradeResponse.status, 200);
const worn = await body(degradeResponse);
assert.equal(named(worn, "Railspike Carbine").item.condition, "Worn");

const fakeImprove = await inventory({
  command: "degrade",
  requestId: "qa-inventory-fake-improve-0001",
  itemId: issuedRail.item.id,
  condition: "Pristine",
});
assert.equal(fakeImprove.status, 409, "Client condition report was able to improve gear for free.");

const economyBefore = await body(await fetch(`${baseURL}/api/hollow/economy`, { headers: { accept: "application/json" } }));
const repairResponse = await inventory({
  command: "repair",
  requestId: "qa-inventory-repair-0001",
  itemId: issuedRail.item.id,
});
assert.equal(repairResponse.status, 200);
const repaired = await body(repairResponse);
assert.equal(named(repaired, "Railspike Carbine").item.condition, "Pristine");
const economyAfter = await body(await fetch(`${baseURL}/api/hollow/economy`, { headers: { accept: "application/json" } }));
assert.ok(economyAfter.treasury.caps < economyBefore.treasury.caps, "Server repair did not charge the Vault 13 treasury.");

// Settle a fresh authoritative mission, then prove its physical treasure receipt
// cannot mint a second copy when replayed.
const missionStart = await progression({
  command: "start_mission",
  requestId: "qa-inventory-loot-mission-0001",
  region: "ironclad",
  kind: "forage",
  party: [{ id: residentId, name: "QA Ironbound", cls: "Warrior" }],
});
assert.equal(missionStart.status, 200);
const mission = await body(missionStart);
const waitMs = Math.max(0, new Date(mission.ticket.availableAt).getTime() - Date.now() + 120);
if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
const settle = await progression({ command: "settle_mission", ticketId: mission.ticket.id, performanceScore: 975 });
assert.equal(settle.status, 200);

const treasureResponse = await inventory({ command: "claim_mission_treasure", ticketId: mission.ticket.id });
assert.equal(treasureResponse.status, 200);
const treasure = await body(treasureResponse);
const countAfterTreasure = treasure.items.length;
const treasureReplayResponse = await inventory({ command: "claim_mission_treasure", ticketId: mission.ticket.id });
assert.equal(treasureReplayResponse.status, 200);
const treasureReplay = await body(treasureReplayResponse);
assert.equal(treasureReplay.treasure.duplicate, true, "Mission treasure receipt was not replay-safe.");
assert.equal(treasureReplay.items.length, countAfterTreasure, "Mission treasure replay created another physical item instance.");

const finalRead = await body(await fetch(`${baseURL}/api/hollow/inventory`, { headers: { accept: "application/json" } }));
const ids = finalRead.items.map((entry) => entry.item.id);
assert.equal(new Set(ids).size, ids.length, "Authoritative Inventory contains duplicate instance serials.");

console.log("Hollow Inventory authority smoke passed: strict legacy migration, forged/high-tier rejection, server serial ownership, equip state, one-use consumables/enchantments, paid repairs, condition direction and replay-safe mission treasure.");
