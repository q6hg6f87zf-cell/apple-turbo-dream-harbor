import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { bootLoadPercent, bootStageLabel, bootStageName } from "./opening";
import { BOOT_LINES } from "./terminal";

describe("SYNAPSE boot", () => {
  it("never prints RobCo on the CRT", () => {
    const blob = BOOT_LINES.join("\n");
    assert.equal(/robco|termlink|pip-?boy|vault-?tec/i.test(blob), false);
    assert.match(blob, /S\.Y\.N\.A\.P\.S\.E UNIFIED OPERATING SYSTEM/);
    assert.match(blob, /WELCOME TO SYNAPSE ACCESS/);
  });

  it("tracks CRT → file → uplink → porch", () => {
    const startedAt = 1_000;
    assert.equal(bootStageName({ hydrated: false, uplinkReady: false, porchLit: false }), "CRT");
    assert.equal(bootStageLabel("CRT"), "Seating CRT");
    const early = bootLoadPercent({
      hydrated: false,
      uplinkReady: false,
      porchLit: false,
      startedAt,
      now: startedAt + 200,
    });
    assert.ok(early >= 12 && early < 20);

    const file = bootLoadPercent({
      hydrated: true,
      uplinkReady: false,
      porchLit: false,
      startedAt,
      now: startedAt + 500,
    });
    assert.ok(file >= 48 && file <= 72);
    assert.equal(bootStageName({ hydrated: true, uplinkReady: false, porchLit: false }), "UPLINK");

    const uplink = bootLoadPercent({
      hydrated: true,
      uplinkReady: true,
      porchLit: false,
      startedAt,
      now: startedAt + 8_000,
    });
    assert.equal(uplink, 86);
    assert.equal(bootStageName({ hydrated: true, uplinkReady: true, porchLit: false }), "UPLINK");
    assert.equal(
      bootLoadPercent({
        hydrated: true,
        uplinkReady: true,
        porchLit: true,
        startedAt,
        now: startedAt + 9_000,
      }),
      100,
    );
    assert.equal(bootStageName({ hydrated: true, uplinkReady: true, porchLit: true }), "PORCH");
  });
});
