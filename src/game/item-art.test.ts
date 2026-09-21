import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { itemArt, itemThumbUrl } from "./item-art";

describe("itemThumbUrl", () => {
  it("rewrites item stills into 256px thumbs", () => {
    assert.equal(itemThumbUrl("/art/items/m14.jpg"), "/art/items/thumbs/m14.jpg");
    assert.equal(itemThumbUrl("/art/items/thumbs/m14.jpg"), "/art/items/thumbs/m14.jpg");
    assert.equal(itemThumbUrl("/art/rooms/squad.jpg"), "/art/rooms/squad.jpg");
    assert.equal(itemThumbUrl(null), null);
  });
});

describe("itemArt catalogue stills", () => {
  it("maps new crate stills by name", () => {
    assert.equal(itemArt({ kind: "trinket", name: "Railmaster's Torque" }), "/art/items/rail-torque.jpg");
    assert.equal(itemArt({ kind: "armor", name: "Rivet Crown" }), "/art/items/rivet-crown.jpg");
    assert.equal(itemArt({ kind: "special", name: "Founder's Rivet" }), "/art/items/founders-rivet.jpg");
    assert.equal(itemArt({ kind: "weapon", name: "Gatekeeper Shotcaster" }), "/art/items/shotcaster.jpg");
    assert.equal(itemArt({ kind: "special", name: "Tyrone's Spare Relay" }), "/art/items/spare-relay.jpg");
    assert.equal(itemArt({ kind: "armor", name: "Warden-Pattern Bulwark" }), "/art/items/bulwark.jpg");
    assert.equal(itemArt({ kind: "weapon", name: "Stormcoil Pistol" }), "/art/items/stormcoil.jpg");
    assert.equal(itemArt({ kind: "trinket", name: "Transit Halo" }), "/art/items/transit-halo.jpg");
    assert.equal(itemArt({ kind: "armor", name: "Nightglass Carapace" }), "/art/items/nightglass.jpg");
    assert.equal(itemArt({ kind: "special", name: "Molten Gospel" }), "/art/items/molten-gospel.jpg");
    assert.equal(itemArt({ kind: "armor", name: "Phaseguard Mantle" }), "/art/items/phase-mantle.jpg");
    assert.equal(itemArt({ kind: "special", name: "Cartographer's Nail" }), "/art/items/cartographer-nail.jpg");
    assert.equal(itemArt({ kind: "special", name: "Tide King's Ledger" }), "/art/items/tide-ledger.jpg");
    assert.equal(itemArt({ kind: "special", name: "Null Warden Memory Shard" }), "/art/items/memory-shard.jpg");
    assert.equal(itemArt({ kind: "material", name: "Red Ash Canister" }), "/art/items/ash-canister.jpg");
    assert.equal(itemArt({ kind: "special", name: "Union Foreman's Seal" }), "/art/items/union-seal.jpg");
    assert.equal(itemArt({ kind: "consumable", name: "Civic Reboot Dose" }), "/art/items/reboot-dose.jpg");
    assert.equal(itemArt({ kind: "material", name: "Prismatic Conduit" }), "/art/items/prism-conduit.jpg");
    assert.equal(itemArt({ kind: "weapon", name: "Vault 13 BB Gun" }), "/art/items/bb-gun.jpg");
    assert.equal(itemArt({ kind: "consumable", name: "Steel BB Tin", ammoType: "bb" }), "/art/items/bb-tin.jpg");
  });
});
