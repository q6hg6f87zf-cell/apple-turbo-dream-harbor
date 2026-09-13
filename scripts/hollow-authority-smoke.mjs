import assert from "node:assert/strict";

const baseURL = process.env.HOLLOW_QA_URL ?? "http://127.0.0.1:8080";
const writeKey = process.env.TYRONE_SYNC_WRITE_KEY ?? "hollow-qa-sync-key";
const discord = "123456789012345678";
const unlinkedDiscord = "222222222222222222";

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

const contractResponse = await fetch(`${baseURL}/api/tyrone/sync`, {
  headers: { accept: "application/json" },
});
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

const anonymousRead = await fetch(`${baseURL}/api/tyrone/sync?d=${discord}`);
assert.equal(anonymousRead.status, 401, "Anonymous Discord-id balance read was not rejected.");

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

const claimUrl = new URL(trusted.open);
const claim = claimUrl.searchParams.get("claim");
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
const linked = await body(linkedRead);
assert.equal(linked.authority, "server");
assert.equal(linked.discord, discord);
assert.equal(linked.caps, 4321);

const economyRead = await fetch(`${baseURL}/api/hollow/economy`, { headers: { accept: "application/json" } });
assert.equal(economyRead.status, 200);
const start = await body(economyRead);
assert.equal(start.authority, "server");
assert.equal(start.campaignId, "moon-squad");
assert.equal(start.treasury.caps, 1400);
assert.equal(start.card.caps, 4321);
const conserved = start.treasury.caps + start.card.caps;

const depositResponse = await economy("deposit_card", "qa-deposit-0001", 400);
assert.equal(depositResponse.status, 200);
const deposited = await body(depositResponse);
assert.equal(deposited.treasury.caps, 1000);
assert.equal(deposited.card.caps, 4721);
assert.equal(deposited.treasury.caps + deposited.card.caps, conserved);

const duplicateResponse = await economy("deposit_card", "qa-deposit-0001", 400);
assert.equal(duplicateResponse.status, 200);
const duplicate = await body(duplicateResponse);
assert.equal(duplicate.duplicate, true, "Duplicate request id was not recognized.");
assert.equal(duplicate.treasury.caps, 1000, "Duplicate request debited Vault 13 twice.");
assert.equal(duplicate.card.caps, 4721, "Duplicate request credited the card twice.");

const withdrawResponse = await economy("withdraw_card", "qa-withdraw-0001", 721);
assert.equal(withdrawResponse.status, 200);
const withdrawn = await body(withdrawResponse);
assert.equal(withdrawn.treasury.caps, 1721);
assert.equal(withdrawn.card.caps, 4000);
assert.equal(withdrawn.treasury.caps + withdrawn.card.caps, conserved);

const overdraftResponse = await economy("deposit_card", "qa-overdraft-0001", 999999);
assert.equal(overdraftResponse.status, 409, "Vault overdraft was not rejected.");
const overdraft = await body(overdraftResponse);
assert.equal(overdraft.treasury.caps, 1721);
assert.equal(overdraft.card.caps, 4000);

const unlinkedTransferResponse = await economy("transfer_card", "qa-transfer-0001", 100, {
  recipientDiscordId: unlinkedDiscord,
});
assert.equal(unlinkedTransferResponse.status, 409, "Transfer to an unlinked rider was not rejected.");
const unlinkedTransfer = await body(unlinkedTransferResponse);
assert.match(unlinkedTransfer.error, /not linked|has not linked/i);
assert.equal(unlinkedTransfer.treasury.caps + unlinkedTransfer.card.caps, conserved);

// ---- Server-owned campaign progression and reward settlement ----
const progressRead = await fetch(`${baseURL}/api/hollow/progression`, { headers: { accept: "application/json" } });
assert.equal(progressRead.status, 200);
const initialProgress = await body(progressRead);
assert.equal(initialProgress.authority, "server");
assert.equal(initialProgress.campaign.day, 1);
assert.equal(initialProgress.campaign.commandRank, 1);
assert.equal(initialProgress.campaign.unlocked.ironclad, true);
assert.equal(initialProgress.campaign.unlocked.slagtown, false);

const prematureDay = await progression({ command: "advance_day", requestId: "qa-day-premature-0001" });
assert.equal(prematureDay.status, 409, "Campaign day advanced without a settled mission.");

const lockedRegion = await progression({
  command: "start_mission",
  requestId: "qa-locked-slagtown-0001",
  region: "slagtown",
  kind: "scout",
});
assert.equal(lockedRegion.status, 409, "Locked Slag Town accepted an authoritative mission contract.");

const startMissionResponse = await progression({
  command: "start_mission",
  requestId: "qa-ironclad-scout-0001",
  region: "ironclad",
  kind: "scout",
});
assert.equal(startMissionResponse.status, 200);
const missionStart = await body(startMissionResponse);
assert.equal(missionStart.ok, true);
assert.equal(missionStart.ticket.region, "ironclad");
assert.equal(missionStart.ticket.kind, "scout");
assert.match(missionStart.ticket.id, /^[a-f0-9]{48,96}$/i);

const duplicateStartResponse = await progression({
  command: "start_mission",
  requestId: "qa-ironclad-scout-0001",
  region: "ironclad",
  kind: "scout",
});
assert.equal(duplicateStartResponse.status, 200);
const duplicateStart = await body(duplicateStartResponse);
assert.equal(duplicateStart.duplicate, true);
assert.equal(duplicateStart.ticket.id, missionStart.ticket.id, "Reload-safe mission request did not return the same ticket.");

const parallelMission = await progression({
  command: "start_mission",
  requestId: "qa-parallel-scout-0002",
  region: "ironclad",
  kind: "scout",
});
assert.equal(parallelMission.status, 409, "Server allowed two simultaneous open mission contracts for one rider.");

const bossTooEarly = await progression({
  command: "start_mission",
  requestId: "qa-boss-too-early-0001",
  region: "ironclad",
  kind: "boss",
});
assert.equal(bossTooEarly.status, 409, "Ironclad boss contract opened without raid readiness.");

const waitMs = Math.max(0, new Date(missionStart.ticket.availableAt).getTime() - Date.now() + 120);
if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));

const settleResponse = await progression({
  command: "settle_mission",
  ticketId: missionStart.ticket.id,
  performanceScore: 1000,
  vaultCaps: 999999999,
  ore: 999999,
});
assert.equal(settleResponse.status, 200);
const settled = await body(settleResponse);
assert.equal(settled.ok, true);
assert.equal(settled.reward.vaultCaps, 180, "Client was able to choose the mission cap reward.");
assert.equal(settled.reward.cardCaps, 32, "Unexpected authoritative Ironclad scout card cut.");
assert.equal(settled.reward.ore, 0, "Client was able to choose the ore reward.");
assert.equal(settled.reward.favor, 1);
assert.equal(settled.campaign.missions.ironclad, 1);
assert.equal(settled.campaign.intel.ironclad, 2);
assert.ok([0, 1].includes(settled.campaign.materials.ironclad));
assert.equal(settled.treasury.caps, 1901);
assert.equal(settled.card.caps, 4032);
assert.equal(settled.card.xp, 90);

const settleReplayResponse = await progression({
  command: "settle_mission",
  ticketId: missionStart.ticket.id,
  performanceScore: 0,
});
assert.equal(settleReplayResponse.status, 200);
const settleReplay = await body(settleReplayResponse);
assert.equal(settleReplay.duplicate, true, "Settled mission ticket was not recognized as a replay.");
assert.equal(settleReplay.treasury.caps, 1901, "Mission replay minted treasury caps twice.");
assert.equal(settleReplay.card.caps, 4032, "Mission replay minted card caps twice.");
assert.equal(settleReplay.card.xp, 90, "Mission replay minted rider XP twice.");

const dayResponse = await progression({ command: "advance_day", requestId: "qa-day-earned-0001" });
assert.equal(dayResponse.status, 200);
const dayAdvanced = await body(dayResponse);
assert.equal(dayAdvanced.campaign.day, 2);

const duplicateDayResponse = await progression({ command: "advance_day", requestId: "qa-day-earned-0001" });
assert.equal(duplicateDayResponse.status, 200);
const duplicateDay = await body(duplicateDayResponse);
assert.equal(duplicateDay.duplicate, true);
assert.equal(duplicateDay.campaign.day, 2, "Duplicate day command advanced campaign twice.");

const unearnedSecondDay = await progression({ command: "advance_day", requestId: "qa-day-unearned-0002" });
assert.equal(unearnedSecondDay.status, 409, "Campaign advanced a second day without another settled mission.");

console.log(
  "Hollow authority smoke passed: identity claims, shared card economy, mission tickets, fixed server rewards, replay defense, region gates and earned campaign-day progression.",
);
