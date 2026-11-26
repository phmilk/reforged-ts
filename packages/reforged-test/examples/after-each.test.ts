import { afterEach, expect, it, startGame } from "reforged-test/map";
import type { Game } from "reforged-test/map";
import { Init, MapPlayer } from "reforged-ts";

Init.onGameStart(() => {
  MapPlayer.fromIndex(0)?.displayText(0, 0, "Choose a hero");
});

let game: Game;

// Runs after each test, even one that failed: no test may show the host
// more than the hero choice.
afterEach(() => {
  expect(game.displayed).toHaveLength(1);
});

it("shows the host the hero choice", () => {
  game = startGame();
  expect(game.displayed).toMatchObject([{ text: "Choose a hero" }]);
});
