import { describe, expect, it, startGame } from "reforged-test/map";
import { Init } from "reforged-ts";

Init.onGameStart(() => {
  print("Round 1");
});

it("announces the first round", () => {
  expect(startGame().printed).toEqual(["Round 1"]);
});

// Both tests are reported as skipped, and neither opens a game.
describe.skip("the shop", () => {
  it("opens after the first round", () => {
    expect(startGame().printed).toContain("Shop open");
  });

  it("closes before the second round", () => {
    expect(startGame().printed).toContain("Shop closed");
  });
});
