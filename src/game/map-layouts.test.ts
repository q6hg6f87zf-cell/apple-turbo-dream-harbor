import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { poiMapUv, regionLayoutSync } from "./map-layouts.ts";

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
    }
  });
});
