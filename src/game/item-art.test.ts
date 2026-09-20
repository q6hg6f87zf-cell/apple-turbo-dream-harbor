import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { itemThumbUrl } from "./item-art";

describe("itemThumbUrl", () => {
  it("rewrites item stills into 256px thumbs", () => {
    assert.equal(itemThumbUrl("/art/items/m14.jpg"), "/art/items/thumbs/m14.jpg");
    assert.equal(itemThumbUrl("/art/items/thumbs/m14.jpg"), "/art/items/thumbs/m14.jpg");
    assert.equal(itemThumbUrl("/art/rooms/squad.jpg"), "/art/rooms/squad.jpg");
    assert.equal(itemThumbUrl(null), null);
  });
});
