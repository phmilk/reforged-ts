import { expect, it, startGame } from "reforged-test/map";
import { getElapsedTime, Init, Timer } from "reforged-ts";

Init.onGameStart(() => {
  let left = 3;
  const countdown = Timer.create().start(1, true, () => {
    left -= 1;
    if (left > 0) {
      print(`${tostring(left)}...`);
      return;
    }
    print("Fight!");
    countdown.destroy();
  });
});

it("counts down to the fight", () => {
  const game = startGame();
  // Nothing expires on its own: the countdown waits for the test.
  expect(game.printed).toEqual([]);
  game.advanceTime(2);
  expect(game.printed).toEqual(["2...", "1..."]);
  game.advanceTime(1);
  expect(game.printed).toEqual(["2...", "1...", "Fight!"]);
});

it("moves the game's own time", () => {
  const game = startGame();
  game.advanceTime(120);
  expect(getElapsedTime()).toEqual(120);
  // The countdown destroyed its timer: it never prints again.
  expect(game.printed).toEqual(["2...", "1...", "Fight!"]);
});
