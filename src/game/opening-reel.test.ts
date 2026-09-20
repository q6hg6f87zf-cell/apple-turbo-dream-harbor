import { describe, it } from "node:test";
import assert from "assert/strict";
import { GALLERY, SCORE, wakeLineAt, WAKE_CUES, WAKE_REEL } from "./opening-reel";
import { RADIO_TAPES, scoreCueForGame } from "./radio";

describe("opening reel cues", () => {
  it("holds line 0 until the first spoken cut", () => {
    assert.equal(wakeLineAt(-1), 0);
    assert.equal(wakeLineAt(0), 0);
    assert.equal(wakeLineAt(12.59), 0);
  });

  it("advances with the tape, not the picture cuts", () => {
    assert.equal(wakeLineAt(12.6), 1);
    assert.equal(wakeLineAt(21.5), 2);
    assert.equal(wakeLineAt(30.2), 3);
    assert.equal(wakeLineAt(41.9), 4);
    assert.equal(wakeLineAt(58.3), 5);
    assert.equal(wakeLineAt(76), 6);
    assert.equal(wakeLineAt(87.3), 7);
    assert.equal(wakeLineAt(WAKE_REEL.duration), 7);
  });

  it("covers every spoken line", () => {
    assert.equal(WAKE_CUES.length, 8);
    assert.equal(WAKE_CUES[WAKE_CUES.length - 1]?.i, 7);
  });
});

describe("score stays off the radio deck", () => {
  it("is not a catalogued tape", () => {
    assert.equal(
      RADIO_TAPES.some((t) => t.src === SCORE.src || /chronicles/i.test(t.id) || /chronicles/i.test(t.title)),
      false,
    );
  });

  it("keeps a gallery that can replay the opening", () => {
    assert.ok(GALLERY.some((item) => item.kind === "reel" && item.id === "found-you"));
    assert.ok(GALLERY.filter((item) => item.kind === "still").length >= 4);
  });

  it("beds the score on the title porch and boss fights only", () => {
    assert.equal(scoreCueForGame({ screen: "title", boss: false }), "title");
    assert.equal(scoreCueForGame({ screen: "rules", boss: false }), "title");
    assert.equal(scoreCueForGame({ screen: "map", boss: true }), "boss");
    assert.equal(scoreCueForGame({ screen: "hq", boss: true }), "boss");
    assert.equal(scoreCueForGame({ screen: "briefing", boss: false }), "hold");
    assert.equal(scoreCueForGame({ screen: "gallery", boss: false }), "hold");
    assert.equal(scoreCueForGame({ screen: "hq", boss: false }), "stop");
    assert.equal(scoreCueForGame({ screen: "map", boss: false }), "stop");
    assert.equal(scoreCueForGame({ screen: "arcade", boss: false }), "stop");
  });

  it("does not treat the wake as a title score cut", () => {
    assert.equal(scoreCueForGame({ screen: "briefing", boss: false }), "hold");
    assert.notEqual(scoreCueForGame({ screen: "briefing", boss: false }), "title");
    assert.notEqual(scoreCueForGame({ screen: "briefing", boss: false }), "stop");
  });
});
