import { expect, it, startGame } from "reforged-test/map";
import { Init } from "reforged-ts";

Init.onGlobals(() => {
  print("globals");
});
Init.onGameStart(() => {
  print("game start");
});

it("runs the Init stages in the game's order", () => {
  // Nothing ran yet: the map's initialization waits for startGame.
  const game = startGame();
  expect(game.printed).toEqual(["globals", "game start"]);
});

it("starts one game per test", () => {
  startGame();
  expect(() => startGame()).toThrow("the game already started");
});
