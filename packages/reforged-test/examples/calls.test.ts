import { calls, expect, it, startGame } from "reforged-test/map";
import { Init, Timer } from "reforged-ts";

Init.onGameStart(() => {
  Timer.after(10, () => {
    print("The first wave comes");
  });
});

it("announces the first wave when its timer expires", () => {
  const game = startGame();
  // The library starts a timer of its own: the wave's is the one of 10
  // seconds, whose handler the test calls as the game would.
  for (const [, timeout, , handler] of calls(TimerStart)) {
    if (timeout === 10) handler();
  }
  expect(game.printed).toContain("The first wave comes");
});
