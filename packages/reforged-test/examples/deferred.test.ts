import { expect, it, startGame } from "reforged-test/map";
import { Init, Timer } from "reforged-ts";

Init.onGameStart(() => {
  print("Setting up");
  // Deferred: it runs once whatever started the game has finished.
  Timer.create().start(0, false, () => {
    print("Ready");
  });
});

it("defers the work to a timer of timeout 0", () => {
  const game = startGame();
  expect(game.printed).toEqual(["Setting up"]);
  game.advanceTime(0);
  expect(game.printed).toEqual(["Setting up", "Ready"]);
});
