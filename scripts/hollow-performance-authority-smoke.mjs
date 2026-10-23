import assert from "node:assert/strict";

const baseURL = process.env.HOLLOW_QA_URL ?? "http://127.0.0.1:8080";
const party = [{ id: "qa-op-ironbound-01", name: "QA Ironbound", cls: "Warrior" }];

async function body(response) {
  return response.json().catch(() => ({}));
}

async function progression(payload) {
  return fetch(`${baseURL}/api/hollow/progression`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(payload),
  });
}

async function inventory(payload) {
  return fetch(`${baseURL}/api/hollow/inventory`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(payload),
  });
}

async function runMission(requestId, submittedScore) {
  const startResponse = await progression({
    command: "start_mission",
    requestId,
    region: "ironclad",
    kind: "scout",
    party,
  });
  assert.equal(startResponse.status, 200, `Could not start ${requestId}.`);
  const started = await body(startResponse);
  assert.ok(started.ticket?.id, "Server did not issue a mission ticket.");

  const waitMs = Math.max(0, new Date(started.ticket.availableAt).getTime() - Date.now() + 120);
  if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));

  const settleResponse = await progression({
    command: "settle_mission",
    ticketId: started.ticket.id,
    performanceScore: submittedScore,
  });
  assert.equal(settleResponse.status, 200, `Could not settle ${requestId}.`);
  const settled = await body(settleResponse);
  assert.equal(settled.ok, true);

  const rewardScore = Number(settled.reward?.performanceScore);
  const scaleFactor = Number(settled.reward?.scaleFactor);
  assert.ok(Number.isFinite(rewardScore), "Settle reward missing sealed performanceScore.");
  assert.ok(rewardScore >= 300 && rewardScore <= 950, `Settle reward score escaped envelope: ${rewardScore}`);
  assert.notEqual(rewardScore, submittedScore, `Client score ${submittedScore} minted settle reward performanceScore.`);
  const expectedScale = Math.round((0.55 + (rewardScore / 1000) * 0.9) * 1000) / 1000;
  assert.equal(scaleFactor, expectedScale, "Settle scaleFactor did not match sealed performanceScore.");
  if (started.ticket.sealedPerformanceScore != null) {
    assert.equal(
      rewardScore,
      Number(started.ticket.sealedPerformanceScore),
      "Settle reward did not use ticket sealedPerformanceScore.",
    );
  }

  const treasureResponse = await inventory({
    command: "claim_mission_treasure",
    ticketId: started.ticket.id,
  });
  assert.equal(treasureResponse.status, 200);
  const treasure = await body(treasureResponse);
  const score = Number(treasure.treasure?.result?.performanceScore);
  assert.ok(Number.isFinite(score), "Treasure receipt did not expose the sealed server performance score.");
  assert.ok(score >= 300 && score <= 950, `Server score escaped its authority envelope: ${score}`);
  assert.notEqual(score, submittedScore, `Client-submitted score ${submittedScore} survived as authoritative performance.`);
  assert.equal(score, rewardScore, "Treasure score diverged from settle sealed score.");

  return { ticketId: started.ticket.id, score, treasure, scaleFactor, rewardScore };
}

const perfectCheat = await runMission("qa-performance-perfect-0001", 1000);
const zeroCheat = await runMission("qa-performance-zero-0002", 0);

// Replaying settlement with a different client score must not alter the sealed
// result or regenerate treasure.
const replayResponse = await progression({
  command: "settle_mission",
  ticketId: perfectCheat.ticketId,
  performanceScore: 0,
});
assert.equal(replayResponse.status, 200);
const replay = await body(replayResponse);
assert.equal(replay.duplicate, true, "Settled mission did not recognize a replay.");

const treasureReplayResponse = await inventory({
  command: "claim_mission_treasure",
  ticketId: perfectCheat.ticketId,
});
assert.equal(treasureReplayResponse.status, 200);
const treasureReplay = await body(treasureReplayResponse);
assert.equal(treasureReplay.treasure.duplicate, true);
assert.equal(
  Number(treasureReplay.treasure.result.performanceScore),
  perfectCheat.score,
  "Replay changed the server-sealed performance score.",
);

assert.notEqual(perfectCheat.score, 1000);
assert.notEqual(zeroCheat.score, 0);

console.log(
  `Hollow performance authority smoke passed: browser scores 1000/0 were replaced by server scores ${perfectCheat.score}/${zeroCheat.score}, and replay could not change the sealed result.`,
);
