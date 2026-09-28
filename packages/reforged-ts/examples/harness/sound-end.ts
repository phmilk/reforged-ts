// Sounds the game destroys itself. A one-off sound is started, then handed
// to killWhenDone: the game destroys it once it has played. A looping one
// is stopped with `stop(true, fadeOut)`, which destroys it as well. In both
// cases the Wrapper is not marked destroyed, so the library cannot catch a
// later use: drop every reference at once and never start the sound again.
import { Init, Sound, Timer } from "reforged-ts";

/** Plays `sound` once, then lets the game destroy it. */
export function playOnce(sound: Sound): void {
  sound.start();
  sound.killWhenDone();
}

let ambience: Sound | undefined;

/** Starts the looping rain ambience, unless it already plays. */
export function startRain(): void {
  if (ambience !== undefined) {
    return;
  }
  ambience = Sound.create(
    "Sound\\Ambient\\RainAmbience.flac",
    true,
    false,
    false,
    10,
    10,
    "",
  );
  ambience.start();
}

/** Fades the ambience out and destroys it; the reference goes first. */
export function stopRain(): void {
  const sound = ambience;
  ambience = undefined;
  sound?.stop(true, true);
}

Init.onTriggers(() => {
  // Created ahead, so the game has loaded the file when it plays.
  let chime: Sound | undefined = Sound.create(
    "Sound\\Interface\\QuestNew.wav",
    false,
    false,
    false,
    10,
    10,
    "",
  );
  Timer.after(1, () => {
    if (chime !== undefined) {
      playOnce(chime);
      chime = undefined;
    }
    startRain();
  });
  Timer.after(60, stopRain);
});
