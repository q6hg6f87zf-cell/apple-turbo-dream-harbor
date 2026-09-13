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

console.log(
  "Hollow authority smoke passed: trusted sync, one-time claim, replay defense, shared treasury conservation, idempotent card settlement and overdraft protection.",
);
