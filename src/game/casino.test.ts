import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  basicStrategy,
  deal,
  emptyTable,
  handValue,
  hit,
  isBlackjack,
  stand,
} from "./blackjack";
import { pays, pocketColor, spinWheel } from "./roulette";
import { evaluatePoker, pokerPayout } from "./video-poker";
import type { Card } from "./blackjack";

const c = (rank: Card["rank"], suit: Card["suit"] = "S"): Card => ({ rank, suit });

describe("blackjack", () => {
  it("counts soft and hard totals", () => {
    assert.deepEqual(handValue([c("A"), c("9")]), { total: 20, soft: true });
    assert.deepEqual(handValue([c("A"), c("A"), c("9")]), { total: 21, soft: true });
    assert.deepEqual(handValue([c("K"), c("9")]), { total: 19, soft: false });
    assert.equal(isBlackjack([c("A"), c("K")]), true);
    assert.equal(isBlackjack([c("A"), c("9"), c("A")]), false);
  });

  it("uses basic strategy a player can trust", () => {
    assert.equal(basicStrategy([c("A"), c("A")], c("6")), "split");
    assert.equal(basicStrategy([c("10"), c("6")], c("10")), "hit");
    assert.equal(basicStrategy([c("10"), c("7")], c("10")), "stand");
    assert.equal(basicStrategy([c("5"), c("6")], c("5")), "double");
    assert.equal(basicStrategy([c("10"), c("2")], c("3")), "hit");
    assert.equal(basicStrategy([c("10"), c("2")], c("4")), "stand");
    assert.equal(basicStrategy([c("10"), c("2")], c("7")), "hit");
  });

  it("deals two each and pays a player blackjack", () => {
    const shoe: Card[] = [
      c("2"), c("3"), // leftover
      c("K"), // dealer hole
      c("9"), // dealer up  — wait, draw order is player, player, dealer, dealer
    ];
    // draw() pops from end. deal draws P, P, D, D.
    const stacked = emptyTable();
    stacked.shoe = [c("2"), c("7"), c("K"), c("A"), c("Q")]; // pop Q, A, K, 7
    const table = deal(stacked, 100);
    assert.equal(isBlackjack(table.hands[0]!.cards), true);
    assert.equal(table.phase, "settle");
    assert.equal(table.payout, 250);
  });

  it("player bust loses the bet", () => {
    const t = emptyTable();
    t.shoe = [c("9"), c("9"), c("6"), c("10"), c("5"), c("K")];
    // pops: K, 5 player; 10, 6 dealer; then hit 9
    let table = deal(t, 40);
    table = hit(table);
    assert.equal(table.phase, "settle");
    assert.equal(table.payout, 0);
  });

  it("stand against a lower dealer total wins even money", () => {
    const t = emptyTable();
    // Pops from the end: player 10+9 = 19, dealer 7+2 = 9, then hits 6 = 15
    // and 2 = 17 and stands. The shoe has to cover every dealer draw — one card
    // short and the dealer finishes out of a fresh random shoe, which is how
    // this test used to lose to a 19 and push about one run in six.
    t.shoe = [c("2"), c("6"), c("2"), c("7"), c("9"), c("10")];
    let table = deal(t, 50);
    table = stand(table);
    assert.equal(table.phase, "settle");
    assert.equal(table.payout, 100);
  });
});

describe("roulette", () => {
  it("pays European prices and kills outside bets on zero", () => {
    assert.equal(pocketColor(0), "green");
    assert.equal(pocketColor(1), "red");
    assert.equal(pocketColor(2), "black");
    assert.equal(pays({ kind: "straight", n: 17, stake: 10 }, 17), 360);
    assert.equal(pays({ kind: "red", stake: 10 }, 1), 20);
    assert.equal(pays({ kind: "red", stake: 10 }, 0), 0);
    assert.equal(pays({ kind: "even", stake: 10 }, 0), 0);
    assert.equal(pays({ kind: "dozen", n: 1, stake: 10 }, 12), 30);
    assert.equal(pays({ kind: "column", n: 1, stake: 10 }, 1), 30);
    const n = spinWheel(() => 0);
    assert.equal(n, 0);
  });
});

describe("jacks or better", () => {
  it("reads a royal and jacks", () => {
    const royal = [c("10", "H"), c("J", "H"), c("Q", "H"), c("K", "H"), c("A", "H")];
    assert.equal(evaluatePoker(royal), "royal");
    assert.equal(pokerPayout("royal", 5), 4000);
    const jacks = [c("J", "S"), c("J", "H"), c("2", "D"), c("7", "C"), c("9", "S")];
    assert.equal(evaluatePoker(jacks), "jacks");
    const junk = [c("2"), c("4", "H"), c("7", "D"), c("9", "C"), c("J", "H")];
    assert.equal(evaluatePoker(junk), "nothing");
  });
});
