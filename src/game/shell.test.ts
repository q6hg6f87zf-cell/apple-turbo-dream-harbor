import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { defaultState } from "./engine";
import { chromeKind, guidanceMode, guidanceSignal, navSignalKey, navSignals } from "./shell";

describe("guidanceMode", () => {
  it("tutorial is guided even if idle flavor would apply", () => {
    const s = defaultState();
    s.started = true;
    s.tutorial = "sortie";
    s.operatives = [{ id: "a", name: "Mira", status: "idle", inventory: [] } as never];
    assert.equal(guidanceMode(s), "guided");
    assert.equal(guidanceSignal(s)?.cta, "Deploy");
  });

  it("shift tutorial is still guided", () => {
    const s = defaultState();
    s.started = true;
    s.tutorial = "shift";
    assert.equal(guidanceMode(s), "guided");
  });

  it("empty roster after tutorial is urgent", () => {
    const s = defaultState();
    s.started = true;
    s.tutorial = "done";
    s.operatives = [];
    assert.equal(guidanceMode(s), "urgent");
    assert.equal(guidanceSignal(s)?.cta, "Forge");
  });

  it("downed is urgent", () => {
    const s = defaultState();
    s.started = true;
    s.tutorial = "done";
    s.operatives = [{ id: "a", name: "Mira", status: "downed", inventory: [] } as never];
    assert.equal(guidanceMode(s), "urgent");
    assert.match(guidanceSignal(s)?.text ?? "", /downed/);
  });

  it("broken equipped is urgent", () => {
    const s = defaultState();
    s.started = true;
    s.tutorial = "done";
    s.operatives = [
      {
        id: "a",
        name: "Mira",
        status: "idle",
        inventory: [{ equipped: true, condition: "Broken" }],
      } as never,
    ];
    assert.equal(guidanceMode(s), "urgent");
    assert.equal(guidanceSignal(s)?.cta, "Repair");
  });

  it("low caps and idle sortie are quiet", () => {
    const s = defaultState();
    s.started = true;
    s.tutorial = "done";
    s.coins = 10;
    s.operatives = [{ id: "a", name: "Mira", status: "idle", inventory: [] } as never];
    assert.equal(guidanceMode(s), "quiet");
    assert.equal(guidanceSignal(s), null);
  });
});

describe("chromeKind", () => {
  it("classifies hub and task", () => {
    assert.equal(chromeKind("hq"), "hub");
    assert.equal(chromeKind("map"), "hub");
    assert.equal(chromeKind("arcade"), "hub");
    assert.equal(chromeKind("inventory"), "hub");
    assert.equal(chromeKind("more"), "hub");
    assert.equal(chromeKind("file"), "hub");
    assert.equal(chromeKind("roster"), "hub");
    assert.equal(chromeKind("squad"), "hub");
    assert.equal(chromeKind("market"), "task");
    assert.equal(chromeKind("forge"), "task");
    assert.equal(chromeKind("ledger"), "task");
    assert.equal(chromeKind("vault"), "task");
    assert.equal(chromeKind("codex"), "task");
    assert.equal(chromeKind("title"), "none");
    assert.equal(chromeKind("briefing"), "none");
    assert.equal(chromeKind("gallery"), "none");
  });
});

describe("navSignals", () => {
  const ready = () => {
    const s = defaultState();
    s.started = true;
    s.tutorial = "done";
    s.operatives = [{ id: "a", name: "Mira", status: "idle", location: "hq", inventory: [] } as never];
    s.shift = { ...(s.shift ?? ({} as never)), watchesLeft: 3 } as never;
    return s;
  };

  it("flags the World when someone can walk and there is a watch left", () => {
    assert.ok(navSignals(ready()).has("map"));
  });

  it("says nothing while the tutorial is talking", () => {
    const s = ready();
    s.tutorial = "sortie";
    assert.equal(navSignals(s).size, 0);
  });

  it("says nothing while the guidance row is urgent", () => {
    const s = ready();
    s.operatives = [{ id: "a", name: "Mira", status: "downed", inventory: [] } as never];
    assert.equal(guidanceMode(s), "urgent");
    assert.equal(navSignals(s).size, 0);
  });

  it("drops the World once the watches are spent", () => {
    const s = ready();
    s.shift = { ...(s.shift ?? ({} as never)), watchesLeft: 0 } as never;
    assert.ok(!navSignals(s).has("map"));
  });

  it("flags Inventory when the vault holds gear for an open slot", () => {
    const s = ready();
    s.vault = [{ id: "g", name: "Rifle", slot: "weapon" } as never];
    assert.ok(navSignals(s).has("inventory"));
  });

  it("leaves Inventory alone when every slot is filled", () => {
    const s = ready();
    s.operatives = [
      {
        id: "a",
        name: "Mira",
        status: "idle",
        location: "hq",
        inventory: [
          { id: "w", slot: "weapon", equipped: true },
          { id: "r", slot: "armor", equipped: true },
          { id: "t", slot: "trinket", equipped: true },
        ],
      } as never,
    ];
    s.vault = [{ id: "g", name: "Rifle", slot: "weapon" } as never];
    assert.ok(!navSignals(s).has("inventory"));
  });

  it("is comparable by value so the dock can subscribe to it", () => {
    const s = ready();
    assert.equal(navSignalKey(s), navSignalKey(s));
  });
});
