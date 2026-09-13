import assert from "node:assert/strict";

const baseURL = process.env.HOLLOW_QA_URL ?? "http://127.0.0.1:8080";
const writeKey = process.env.TYRONE_SYNC_WRITE_KEY ?? "hollow-qa-sync-key";
const discord = "123456789012345678";
const unlinkedDiscord = "222222222222222222";
const qaParty = [{ id: "qa-op-ironbound-01", name: "QA Ironbound", cls: "Warrior" }];

async function body(response) {
  return response.json().catch(() => ({}));
}

async function economy(command, requestId, amount, extra = {}) {
  return fetch(`${baseURL}/api/hollow/economy`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ command, requestId, amount, ...extra }),
  });
}

async function progression(payload) {
  return fetch(`${baseURL}/api/hollow/progression`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(payload),
  });
}

async function acquisition(payload) {
  return fetch(`${baseURL}/api/hollow/acquisition`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(payload),
  });
}

const contractResponse = await fetch(`${baseURL}/api/tyrone/sync`, { headers: { accept: "application/json" } });
assert.equal(contractResponse.status, 200);
const contract = await body(contractResponse);
assert.equal(contract.authority, "server");
assert.match(contract.open, /\?claim=/);
assert.ok(!/caps=|xp=|lvl=|pack=/i.test(contract.open), "Contract leaked economy into the player URL.");

const anonymousWrite = await fetch(`${baseURL}/api/tyrone/sync`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ discord, name: "QA Rider", caps: 999999999 }),
});
assert.equal(anonymousWrite.status, 401, "Anonymous arcade write was not rejected.");
assert.equal((await fetch(`${baseURL}/api/tyrone/sync?d=${discord}`)).status, 401, "Anonymous Discord-id read was not rejected.");

const trustedWrite = await fetch(`${baseURL}/api/tyrone/sync`, {
  method: "POST",
  headers: {
    authorization: `Bearer ${writeKey}`,
    "content-type": "application/json",
    accept: "application/json",
  },
  body: JSON.stringify({
    discord,
    name: "QA Rider",
    caps: 4321,
    xp: 87,
    level: 6,
    pack: { stimpak: 3, mentats: 2, made_up_item: 999 },
  }),
});
assert.equal(trustedWrite.status, 200);
const trusted = await body(trustedWrite);
assert.equal(trusted.ok, true);
assert.match(trusted.open, /\?claim=/);
assert.ok(!/caps=|xp=|lvl=|pack=/i.test(trusted.open), "Trusted write leaked economy into claim URL.");

const claim = new URL(trusted.open).searchParams.get("claim");
assert.ok(claim && claim.length >= 32, "Trusted sync did not issue a strong one-time claim.");
const claimResponse = await fetch(`${baseURL}/api/tyrone/claim`, {
  method: "POST",
  headers: { "content-type": "application/json", accept: "application/json" },
  body: JSON.stringify({ claim }),
});
assert.equal(claimResponse.status, 200);
const claimed = await body(claimResponse);
assert.equal(claimed.ok, true);
assert.equal(claimed.discord, discord);
assert.equal(claimed.caps, 4321);
assert.equal(claimed.xp, 87);
assert.equal(claimed.level, 6);
assert.equal(claimed.pack.stimpak, 3);
assert.equal(claimed.pack.mentats, 2);
assert.equal(claimed.pack.made_up_item, undefined, "Unknown Pack key survived server validation.");

const replay = await fetch(`${baseURL}/api/tyrone/claim`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ claim }),
});
assert.equal(replay.status, 410, "One-time Tyrone claim could be replayed.");

const linkedRead = await fetch(`${baseURL}/api/tyrone/claim`, { headers: { accept: "application/json" } });
assert.equal(linkedRead.status, 200);
assert.equal((await body(linkedRead)).authority, "server");

const economyRead = await fetch(`${baseURL}/api/hollow/economy`, { headers: { accept: "application/json" } });
assert.equal(economyRead.status, 200);
const start = await body(economyRead);
assert.equal(start.authority, "server");
assert.equal(start.campaignId, "moon-squad");
assert.equal(start.treasury.caps, 1400);
assert.equal(start.card.caps, 4321);
const conserved = start.treasury.caps + start.card.caps;

const deposited = await body(await economy("deposit_card", "qa-deposit-0001", 400));
assert.equal(deposited.treasury.caps, 1000);
assert.equal(deposited.card.caps, 4721);
assert.equal(deposited.treasury.caps + deposited.card.caps, conserved);
const duplicate = await body(await economy("deposit_card", "qa-deposit-0001", 400));
assert.equal(duplicate.duplicate, true);
assert.equal(duplicate.treasury.caps, 1000);
assert.equal(duplicate.card.caps, 4721);

const withdrawn = await body(await economy("withdraw_card", "qa-withdraw-0001", 721));
assert.equal(withdrawn.treasury.caps, 1721);
assert.equal(withdrawn.card.caps, 4000);
assert.equal(withdrawn.treasury.caps + withdrawn.card.caps, conserved);

const overdraftResponse = await economy("deposit_card", "qa-overdraft-0001", 999999);
assert.equal(overdraftResponse.status, 409, "Vault overdraft was not rejected.");
const overdraft = await body(overdraftResponse);
assert.equal(overdraft.treasury.caps, 1721);
assert.equal(overdraft.card.caps, 4000);

const unlinkedTransferResponse = await economy("transfer_card", "qa-transfer-0001", 100, { recipientDiscordId: unlinkedDiscord });
assert.equal(unlinkedTransferResponse.status, 409, "Transfer to an unlinked rider was not rejected.");

// The first field resident must now be born through the sealed Forge contract.
const forgeResponse = await acquisition({
  command: "forge_resident",
  residentId: qaParty[0].id,
  name: qaParty[0].name,
  cls: qaParty[0].cls,
  race: "Garrison-Born",
});
assert.equal(forgeResponse.status, 200, "Server Forge rejected the first legitimate resident.");
const forged = await body(forgeResponse);
assert.equal(forged.authority, "server");
assert.equal(forged.forge.cost, 0, "First sealed resident should be free.");
assert.equal(forged.forge.rosterCount, 1);
assert.equal(forged.treasury.caps, 1721, "Free first Forge changed Vault caps.");

const starterInventory = await body(await fetch(`${baseURL}/api/hollow/inventory`, { headers: { accept: "application/json" } }));
const starterItems = starterInventory.items.filter((entry) => entry.residentId === qaParty[0].id);
assert.ok(starterItems.length >= 2, "Server Forge did not issue the starter loadout.");
assert.equal(starterItems.filter((entry) => entry.item.equipped && entry.item.slot === "weapon").length, 1, "Server Forge did not seal exactly one equipped starter weapon.");

const forgeReplay = await acquisition({
  command: "forge_resident",
  residentId: qaParty[0].id,
  name: qaParty[0].name,
  cls: qaParty[0].cls,
  race: "Garrison-Born",
});
assert.equal(forgeReplay.status, 200);
const forgeReplayBody = await body(forgeReplay);
assert.equal(forgeReplayBody.forge.duplicate, true, "Resident Forge could be charged twice for the same server serial.");
assert.equal(forgeReplayBody.treasury.caps, 1721);

const progressRead = await fetch(`${baseURL}/api/hollow/progression`, { headers: { accept: "application/json" } });
assert.equal(progressRead.status, 200);
const initialProgress = await body(progressRead);
assert.equal(initialProgress.authority, "server");
assert.equal(initialProgress.campaign.day, 1);
assert.equal(initialProgress.campaign.commandRank, 1);
assert.equal(initialProgress.campaign.unlocked.ironclad, true);
assert.equal(initialProgress.campaign.unlocked.slagtown, false);

assert.equal((await progression({ command: "advance_day", requestId: "qa-day-premature-0001" })).status, 409, "Campaign day advanced without a settled mission.");

const lockedRegion = await progression({
  command: "start_mission",
  requestId: "qa-locked-slagtown-0001",
  region: "slagtown",
  kind: "scout",
  party: qaParty,
});
assert.equal(lockedRegion.status, 409, "Locked Slag Town accepted an authoritative mission contract.");

const startMissionResponse = await progression({
  command: "start_mission",
  requestId: "qa-ironclad-scout-0001",
  region: "ironclad",
  kind: "scout",
  party: qaParty,
});
assert.equal(startMissionResponse.status, 200);
const missionStart = await body(startMissionResponse);
assert.equal(missionStart.ok, true);
assert.equal(missionStart.ticket.region, "ironclad");
assert.equal(missionStart.ticket.kind, "scout");
assert.deepEqual(missionStart.ticket.partyIds, [qaParty[0].id]);
assert.match(missionStart.ticket.id, /^[a-f0-9]{48,96}$/i);

const duplicateStart = await body(await progression({
  command: "start_mission",
  requestId: "qa-ironclad-scout-0001",
  region: "ironclad",
  kind: "scout",
  party: qaParty,
}));
assert.equal(duplicateStart.duplicate, true);
assert.equal(duplicateStart.ticket.id, missionStart.ticket.id);

const parallelMission = await progression({
  command: "start_mission",
  requestId: "qa-parallel-scout-0002",
  region: "ironclad",
  kind: "scout",
  party: qaParty,
});
assert.equal(parallelMission.status, 409, "Server allowed two simultaneous mission contracts.");

const waitMs = Math.max(0, new Date(missionStart.ticket.availableAt).getTime() - Date.now() + 120);
if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
const settleResponse = await progression({
  command: "settle_mission",
  ticketId: missionStart.ticket.id,
  performanceScore: 1000,
  vaultCaps: 999999999,
  ore: 999999,
  residentXp: 999999,
});
assert.equal(settleResponse.status, 200);
const settled = await body(settleResponse);
assert.equal(settled.reward.vaultCaps, 180, "Client chose the mission cap reward.");
assert.equal(settled.reward.cardCaps, 32);
assert.equal(settled.reward.ore, 0);
assert.equal(settled.reward.favor, 1);
assert.equal(settled.reward.residentXp, 18);
assert.equal(settled.campaign.missions.ironclad, 1);
assert.equal(settled.campaign.intel.ironclad, 2);
assert.equal(settled.treasury.caps, 1901);
assert.equal(settled.card.caps, 4032);
assert.equal(settled.card.xp, 90);
const trained = settled.residents.find((resident) => resident.id === qaParty[0].id);
assert.ok(trained, "Sealed mission resident disappeared from server progression.");
assert.equal(trained.xpTotal, 18);

const settleReplay = await body(await progression({ command: "settle_mission", ticketId: missionStart.ticket.id, performanceScore: 0 }));
assert.equal(settleReplay.duplicate, true);
assert.equal(settleReplay.treasury.caps, 1901);
assert.equal(settleReplay.card.caps, 4032);
assert.equal(settleReplay.residents.find((resident) => resident.id === qaParty[0].id)?.xpTotal, 18);

const bossTooEarly = await progression({
  command: "start_mission",
  requestId: "qa-boss-too-early-0001",
  region: "ironclad",
  kind: "boss",
  party: [qaParty[0], { id: "qa-op-sawbones-02", name: "QA Sawbones", cls: "Healer" }],
});
assert.equal(bossTooEarly.status, 409, "Ironclad boss contract opened before readiness gates.");

const dayResponse = await progression({ command: "advance_day", requestId: "qa-day-earned-0001" });
assert.equal(dayResponse.status, 200);
const dayAdvanced = await body(dayResponse);
assert.equal(dayAdvanced.campaign.day, 2);
const duplicateDay = await body(await progression({ command: "advance_day", requestId: "qa-day-earned-0001" }));
assert.equal(duplicateDay.duplicate, true);
assert.equal(duplicateDay.campaign.day, 2);
assert.equal((await progression({ command: "advance_day", requestId: "qa-day-unearned-0002" })).status, 409);

const prematureVaultUpgrade = await progression({
  command: "upgrade_room",
  requestId: "qa-vault-tier2-early-0001",
  room: "vault",
});
assert.equal(prematureVaultUpgrade.status, 409, "Vault Tier 2 bypassed authoritative gates.");

console.log("Hollow authority smoke passed: identity, shared card economy, sealed Forge residents, server mission tickets, fixed rewards, resident XP, replay defense, region gates, earned days and hard Vault gates.");
