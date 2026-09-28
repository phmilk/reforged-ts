// A timer window counting down to the first wave, shown to every player
// once the game starts, and destroyed with its Timer when the wave comes.
import { Init, Timer, TimerDialog } from "reforged-ts";

Init.onGameStart(() => {
  const timer = Timer.create();
  const countdown = TimerDialog.create(timer);
  countdown.setTitle("First wave");
  countdown.setTitleColor(255, 204, 0, 255);
  countdown.display = true;

  timer.start(60, false, () => {
    countdown.destroy();
    timer.destroy();
    print("The first wave comes!");
  });
});
