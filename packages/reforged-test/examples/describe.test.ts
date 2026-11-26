import { describe, expect, it, startGame } from "reforged-test/map";
import { Init } from "reforged-ts";

Init.onGameStart(() => {
  print("Round 1");
});

// Reported as "the rounds > the first round > is announced".
describe("the rounds", () => {
  describe("the first round", () => {
    it("is announced", () => {
      expect(startGame().printed).toEqual(["Round 1"]);
    });
  });
});
