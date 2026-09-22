import { describe, it } from "node:test";
import assert from "assert/strict";
import {
  GALLERY,
  KANE_ARM,
  KANE_AUDIO_AT,
  KANE_CUES,
  KANE_REEL,
  KANE_SHOTS,
  KANE_STILLS,
  KANE_TAPE,
  REPLY_CUES,
  REPLY_STILLS,
  SCORE,
  TYRONE_REPLY_REEL,
  TYRONE_REPLY_TAPE,
  cueIndexAt,
  kaneEdgeFade,
  kaneLineAt,
  kaneShotAt,
  replyLineAt,
  stillSrcAt,
  wakeLineAt,
  WAKE_CUES,
  WAKE_REEL,
} from "./opening-reel";
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

  it("keeps wake dialogue locked to the spoken tape", async () => {
    const { TALK } = await import("./talk");
    assert.equal(TALK.wake.length, 8);
    assert.ok(TALK.welcome.length >= 7);
    assert.ok(TALK.forge.length >= 4);
  });
});

describe("Kane recording and Tyrone reply", () => {
  it("covers the 3:22 Kane tape with a cue per spoken line", async () => {
    const { TALK } = await import("./talk");
    const script = TALK.kane.map((l) => l.text).join(" ");
    assert.equal(TALK.kane.length, KANE_CUES.length);
    assert.equal(KANE_CUES[KANE_CUES.length - 1]?.i, TALK.kane.length - 1);
    assert.equal(kaneLineAt(0), 0);
    assert.equal(kaneLineAt(KANE_CUES[1]!.at), 1);
    assert.equal(kaneLineAt(KANE_TAPE.duration), TALK.kane.length - 1);
    assert.ok(KANE_TAPE.duration >= 203);
    assert.ok(KANE_ARM >= 1.4);
    assert.equal(KANE_AUDIO_AT, 4);
    assert.ok(KANE_STILLS.length >= 1);
    assert.ok(KANE_STILLS.every((s) => s.src.startsWith("/art/opening/")));
    assert.match(script, /You are listening to a recording you were never meant to hear/);
    assert.match(script, /They walked packages/);
    assert.match(script, /Orion-7/);
    assert.match(script, /you were supposed to stay retired/);
    assert.ok(KANE_CUES[17]!.at > 104 && KANE_CUES[17]!.at < 107);
    assert.ok(KANE_CUES[20]!.at > 120 && KANE_CUES[20]!.at < 122);
    assert.ok(KANE_CUES[KANE_CUES.length - 1]!.at > 199);
    assert.equal(KANE_REEL.src, "/art/opening/kane-intro.mp4");
    assert.ok(KANE_REEL.duration >= 210);
    assert.equal(KANE_REEL.loop, false);
  });

  it("holds one office reel so the tape can speak", () => {
    assert.equal(KANE_SHOTS.length, 1);
    assert.equal(KANE_SHOTS[0]!.at, 0);
    assert.equal(kaneShotAt(0).subject, "kane");
    assert.equal(kaneShotAt(0).src, KANE_REEL.src);
    assert.equal(kaneShotAt(KANE_CUES[4]!.at).src, KANE_REEL.src);
    assert.equal(kaneShotAt(KANE_CUES[16]!.at).src, KANE_REEL.src);
    assert.ok(kaneEdgeFade(KANE_CUES[4]!.at) < 0.2);
    assert.ok(kaneEdgeFade(KANE_TAPE.duration) > 0.9);
  });

  it("covers Tyrone's reply after Kane", async () => {
    const { TALK } = await import("./talk");
    assert.equal(TALK["tyrone-reply"].length, REPLY_CUES.length);
    assert.equal(replyLineAt(0), 0);
    assert.equal(replyLineAt(7), 2);
    assert.ok(TYRONE_REPLY_TAPE.duration >= 11);
    assert.ok(TYRONE_REPLY_REEL.src.endsWith(".mp4"));
    assert.equal(REPLY_STILLS.length, 5);
    assert.match(TALK["tyrone-reply"].map((l) => l.text).join(" "), /historically significant/i);
  });

  it("crossfades stills on the clock, not the caption index", () => {
    assert.equal(stillSrcAt(KANE_STILLS, 0), KANE_STILLS[0]?.src);
    const later = stillSrcAt(KANE_STILLS, 200);
    assert.equal(later, KANE_STILLS[KANE_STILLS.length - 1]?.src);
    assert.equal(cueIndexAt(KANE_CUES, KANE_CUES[2]!.at), 2);
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
    assert.ok(GALLERY.some((item) => item.id === "kane"));
    assert.ok(GALLERY.some((item) => item.id === "kane-recording"));
    assert.ok(GALLERY.some((item) => item.id === "historically-significant"));
    assert.ok(GALLERY.some((item) => item.id === "aegis-line"));
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
