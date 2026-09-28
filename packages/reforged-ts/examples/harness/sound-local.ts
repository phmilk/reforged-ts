// A voice line whose subtitle stays on screen as long as the line plays.
// A voice file's length depends on the client's language, and whether a
// sound still plays is the local client's own: both decide what the player
// sees and hears, never game state, so no Timer is started from them.
import {
  Init,
  MapPlayer,
  on,
  PlayerEvents,
  Sound,
  tsGlobals,
} from "reforged-ts";

const LINE = "Sound\\Dialogue\\HumanCampaign\\Human01\\H01Uther01.flac";

/** Plays the line with its subtitle, unless it still plays on this client. */
export function playLine(voice: Sound): void {
  if (voice.playing) {
    return;
  }
  voice.start();
  // In milliseconds, as this client plays the line.
  const length =
    voice.duration > 0 ? voice.duration : Sound.getFileDuration(LINE);
  MapPlayer.fromLocal().displayTimedText(
    0,
    0,
    length / 1000,
    "Uther: For the Light!",
  );
}

Init.onTriggers(() => {
  const voice = Sound.create(LINE, false, false, false, 10, 10, "");
  // Every client registers the same chat event and plays the line.
  for (const player of tsGlobals.Players) {
    on(PlayerEvents.chat(player, "-uther", true), () => {
      playLine(voice);
    });
  }
});
