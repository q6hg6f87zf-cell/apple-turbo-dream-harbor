import assert from "node:assert/strict";

const baseURL = process.env.HOLLOW_QA_URL ?? "http://127.0.0.1:8080";

async function body(response) {
  return response.json().catch(() => ({}));
}

async function acquisition(payload) {
  return fetch(`${baseURL}/api/hollow/acquisition`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(payload),
  });
}

async function inventory() {
  return body(await fetch(`${baseURL}/api/hollow/inventory`, { headers: { accept: "application/json" } }));
}

async function progression(payload) {
  return fetch(`${baseURL}/api/hollow/progression`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(payload),
  });
}

const initialResponse = await fetch(`${baseURL}/api/hollow/acquisition`, { headers: { accept: "application/json" } });
assert.equal(initialResponse.status, 200, "Linked rider could not read acquisition authority.");
const initial = await body(initialResponse);
assert.equal(initial.authority, "server");
assert.ok(initial.exchange?.bargain?.name, "Server did not publish deterministic daily Exchange stock.");
const initialCaps = initial.treasury.caps;

// The second resident was introduced by the earlier boss-readiness attack but
// remained unsealed. The real Forge must be able to recover that record, charge
// the correct server cost, and issue a serialized starter loadout exactly once.
const secondForgeResponse = await acquisition({
  command: "forge_resident",
  residentId: "qa-op-sawbones-02",
  name: "QA Sawbones",
  cls: "Healer",
  race: "Dust-Walker",
});
assert.equal(secondForgeResponse.status, 200, "Server Forge could not seal an existing unsealed resident record.");
const secondForge = await body(secondForgeResponse);
assert.equal(secondForge.forge.duplicate, false);
assert.equal(secondForge.forge.cost, 950, "Second resident Forge cost drifted from the authoritative curve.");
assert.equal(secondForge.treasury.caps, initialCaps - 950, "Second Forge did not debit the shared Vault treasury exactly once.");

const afterForgeInventory = await inventory();
const sawbonesGear = afterForgeInventory.items.filter((entry) => entry.residentId === "qa-op-sawbones-02");
assert.ok(sawbonesGear.length >= 2, "Sealed second resident did not receive authoritative starter gear.");
assert.equal(sawbonesGear.filter((entry) => entry.item.equipped && entry.item.slot === "weapon").length, 1);

const secondForgeReplay = await acquisition({
  command: "forge_resident",
  residentId: "qa-op-sawbones-02",
  name: "QA Sawbones",
  cls: "Healer",
  race: "Dust-Walker",
});
assert.equal(secondForgeReplay.status, 200);
const replay = await body(secondForgeReplay);
assert.equal(replay.forge.duplicate, true, "Resident Forge replay was not idempotent.");
assert.equal(replay.treasury.caps, secondForge.treasury.caps, "Forge replay charged the Vault twice.");

// Daily Exchange stock is server-selected and one purchase per tier/day. The
// browser cannot substitute another item or buy the same slot repeatedly.
const bargain = replay.exchange.bargain;
const exchangeBuyResponse = await acquisition({ command: "buy_exchange", tier: "bargain", name: "Arc Lance", price: 1 });
assert.equal(exchangeBuyResponse.status, 200);
const exchangeBuy = await body(exchangeBuyResponse);
assert.equal(exchangeBuy.purchase.name, bargain.name, "Client overrode the server-selected daily Exchange item.");
assert.equal(exchangeBuy.purchase.price, bargain.price, "Client overrode the authoritative Exchange price.");
assert.equal(exchangeBuy.exchange.bought.bargain, true);
assert.equal(exchangeBuy.treasury.caps, replay.treasury.caps - bargain.price);

const exchangeInventory = await inventory();
const exchangeEntries = exchangeInventory.items.filter((entry) => entry.sourceEvent?.includes(":bargain") && entry.item?.name === bargain.name);
assert.equal(exchangeEntries.length, 1, "Daily Exchange purchase did not create exactly one server item serial.");

const exchangeReplayResponse = await acquisition({ command: "buy_exchange", tier: "bargain" });
assert.equal(exchangeReplayResponse.status, 200);
const exchangeReplay = await body(exchangeReplayResponse);
assert.equal(exchangeReplay.purchase.duplicate, true, "Daily Exchange slot could be bought twice.");
assert.equal(exchangeReplay.treasury.caps, exchangeBuy.treasury.caps, "Daily Exchange replay charged caps twice.");
assert.equal((await inventory()).items.filter((entry) => entry.sourceEvent?.includes(":bargain") && entry.item?.name === bargain.name).length, 1);

// NPC price/name are canonical server data. A client-supplied fake price is ignored.
const rationsRequestId = "qa-vendor-rations-0001";
const rationsResponse = await acquisition({
  command: "buy_vendor",
  requestId: rationsRequestId,
  name: "Standard Rations",
  price: 1,
});
assert.equal(rationsResponse.status, 200);
const rations = await body(rationsResponse);
assert.equal(rations.purchase.name, "Standard Rations");
assert.equal(rations.purchase.price, 150, "Client forged the NPC price.");
assert.equal(rations.treasury.caps, exchangeReplay.treasury.caps - 150);
const rationsInventory = await inventory();
assert.equal(rationsInventory.items.filter((entry) => entry.sourceEvent?.endsWith(rationsRequestId)).length, 1);

const rationsReplayResponse = await acquisition({
  command: "buy_vendor",
  requestId: rationsRequestId,
  name: "Standard Rations",
  price: 1,
});
assert.equal(rationsReplayResponse.status, 200);
const rationsReplay = await body(rationsReplayResponse);
assert.equal(rationsReplay.purchase.duplicate, true, "Vendor receipt replay minted another purchase.");
assert.equal(rationsReplay.treasury.caps, rations.treasury.caps);

// Hollow Ore is not a decorative Inventory prop anymore. It goes straight into
// the same authoritative reserve used by Vault 13 expansion math.
const oreBefore = rationsReplay.treasury.ore;
const oreResponse = await acquisition({
  command: "buy_vendor",
  requestId: "qa-vendor-ore-0001",
  name: "Hollow Ore",
  price: 1,
});
assert.equal(oreResponse.status, 200);
const ore = await body(oreResponse);
assert.equal(ore.purchase.price, 400);
assert.equal(ore.purchase.oreUnits, 1);
assert.equal(ore.treasury.ore, oreBefore + 1, "Purchased Hollow Ore did not enter the authoritative upgrade reserve.");
assert.equal(ore.treasury.caps, rationsReplay.treasury.caps - 400);

const forgedVendor = await acquisition({
  command: "buy_vendor",
  requestId: "qa-vendor-forged-0001",
  name: "QA GOD GUN",
  price: 1,
});
assert.equal(forgedVendor.status, 404, "Unknown vendor item was accepted by acquisition authority.");
const afterForgedVendor = await body(await fetch(`${baseURL}/api/hollow/acquisition`, { headers: { accept: "application/json" } }));
assert.equal(afterForgedVendor.treasury.caps, ore.treasury.caps, "Rejected vendor forgery changed Vault caps.");
assert.equal(afterForgedVendor.treasury.ore, ore.treasury.ore, "Rejected vendor forgery changed Hollow Ore.");

// A fabricated resident can still be described by a hostile client, but the DB
// refuses to issue a mission ticket until that resident has a sealed Forge row.
const fakeMission = await progression({
  command: "start_mission",
  requestId: "qa-unsealed-resident-mission-0001",
  region: "ironclad",
  kind: "scout",
  party: [{ id: "qa-forged-resident-99", name: "Injected Resident", cls: "Rogue" }],
});
assert.ok(fakeMission.status >= 400, "Unsealed fabricated resident obtained a server mission ticket.");

console.log("Hollow acquisition authority smoke passed: sealed Forge costs/loadouts, Forge replay defense, deterministic one-per-day Exchange stock, canonical vendor pricing, Ore reserve settlement and unsealed-resident mission rejection.");
