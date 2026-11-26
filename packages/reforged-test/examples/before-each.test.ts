import { beforeEach, describe, expect, it, startGame } from "reforged-test/map";
import type { Game } from "reforged-test/map";
import { Init } from "reforged-ts";

Init.onGameStart(() => {
  print("Wave 1 begins");
});

describe("the first wave", () => {
  let game: Game;
  beforeEach(() => {
    // Each test's own game, started before its body runs.
    game = startGame();
  });

  it("is announced", () => {
    expect(game.printed).toEqual(["Wave 1 begins"]);
  });

  it("is announced once", () => {
    expect(game.printed).toHaveLength(1);
  });
});
