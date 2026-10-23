import assert from "node:assert/strict";
import test from "node:test";
import { readSnapshotRevisions, shouldApplyServerSnapshot } from "./apply-snapshot-revision.ts";

test("readSnapshotRevisions coerces missing to 0", () => {
  assert.deepEqual(readSnapshotRevisions({}), { campaignRevision: 0, memberRevision: 0 });
  assert.deepEqual(readSnapshotRevisions({ campaign: { revision: 4 }, card: { revision: 2 } }), {
    campaignRevision: 4,
    memberRevision: 2,
  });
});

test("shouldApply when no authority cache", () => {
  assert.equal(shouldApplyServerSnapshot({ campaign: { revision: 1 } }, null), true);
  assert.equal(shouldApplyServerSnapshot({ campaign: { revision: 1 } }, { active: false, revision: 9 }), true);
});

test("rejects older campaign revision", () => {
  assert.equal(
    shouldApplyServerSnapshot(
      { campaign: { revision: 3 }, card: { revision: 99 } },
      { active: true, revision: 4, memberRevision: 1 },
    ),
    false,
  );
});

test("accepts equal or newer campaign revision", () => {
  assert.equal(
    shouldApplyServerSnapshot(
      { campaign: { revision: 4 }, card: { revision: 1 } },
      { active: true, revision: 4, memberRevision: 1 },
    ),
    true,
  );
  assert.equal(
    shouldApplyServerSnapshot(
      { campaign: { revision: 5 }, card: { revision: 0 } },
      { active: true, revision: 4, memberRevision: 9 },
    ),
    true,
  );
});

test("same campaign rejects older member revision", () => {
  assert.equal(
    shouldApplyServerSnapshot(
      { campaign: { revision: 4 }, card: { revision: 1 } },
      { active: true, revision: 4, memberRevision: 3 },
    ),
    false,
  );
});
