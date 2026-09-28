// The new-quest chime one second into the game. The Sound is created at init,
// so the game has loaded its file by the time the Timer starts it;
// killWhenDone destroys it once it has played.
import { Init, Sound, Timer } from "reforged-ts";

Init.onTriggers(() => {
  const chime = Sound.create(
    "Sound\\Interface\\QuestNew.wav",
    false,
    false,
    false,
    10,
    10,
    "DefaultEAXON",
  );
  Timer.after(1, () => {
    chime.setVolume(127);
    chime.start();
    chime.killWhenDone();
  });
});
