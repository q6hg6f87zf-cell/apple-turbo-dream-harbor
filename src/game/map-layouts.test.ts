import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { poiMapUv, poiShortLabel, regionLayoutSync } from "./map-layouts.ts";

describe("map-layouts", () => {
  it("keeps percent POI coords as 0–1 UV", () => {
    assert.deepEqual(poiMapUv(48, 55), { u: 0.48, v: 0.55 });
    assert.deepEqual(poiMapUv(0.42, 0.61), { u: 0.42, v: 0.61 });
  });

  it("ships sync defaults for every region", () => {
    for (const id of ["ironclad", "slagtown", "blackspire", "brasswater", "veyra"] as const) {
      const layout = regionLayoutSync(id);
      assert.equal(layout.id, id);
      assert.ok(layout.camera.fov > 0);
      assert.ok(layout.map.includes(`/map/regions/${id}.jpg`));
      assert.ok(layout.height?.includes(`/map/regions/${id}.height.png`));
    }
  });
});

describe("poiShortLabel", () => {
  it("keeps war-room names readable", () => {
    assert.equal(poiShortLabel("Relay Tower Three"), "TOWER");
    assert.equal(poiShortLabel("The Iron Gate"), "IRON GATE");
    assert.equal(poiShortLabel("Rail Cut"), "RAIL CUT");
    assert.equal(poiShortLabel("Vault 13"), "VAULT 13");
  });
});
