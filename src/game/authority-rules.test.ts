import assert from "node:assert/strict";
import test from "node:test";
import {
  authorityEconomyLocked,
  authorityPerformanceScale,
  normalizePerformanceScore,
  scaleAuthorityAmount,
} from "./authority-rules";

test("performance score clamps to 0–1000", () => {
  assert.equal(normalizePerformanceScore(-40), 0);
  assert.equal(normalizePerformanceScore(500.4), 500);
  assert.equal(normalizePerformanceScore(1800), 1000);
});

test("a mid sortie is 1.00x and extremes stay bounded", () => {
  assert.equal(authorityPerformanceScale(500), 1);
  assert.equal(authorityPerformanceScale(0), 0.55);
  assert.equal(authorityPerformanceScale(1000), 1.45);
  assert.equal(scaleAuthorityAmount(1000, 500), 1000);
  assert.equal(scaleAuthorityAmount(1000, 0), 550);
  assert.equal(scaleAuthorityAmount(1000, 1000), 1450);
});

test("verified campaign lock is explicit", () => {
  assert.equal(authorityEconomyLocked({}), false);
  assert.equal(authorityEconomyLocked({ authorityCampaign: { active: false } }), false);
  assert.equal(authorityEconomyLocked({ authorityCampaign: { active: true } }), true);
});
