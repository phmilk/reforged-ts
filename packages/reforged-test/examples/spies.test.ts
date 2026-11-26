import { expect, it, startGame } from "reforged-test/map";
import { Init, Timer } from "reforged-ts";

Init.onGameStart(() => {
  Timer.every(60, () => {
    print("A new wave comes");
  });
});

it("starts a timer of a minute, again and again, when the game starts", () => {
  startGame();
  // The Native itself is the Spy: nothing was replaced to watch it.
  expect(TimerStart).toHaveBeenCalledWith(
    expect.anything(),
    60,
    true,
    expect.anything(),
  );
  expect(PauseTimer).not.toHaveBeenCalled();
});
