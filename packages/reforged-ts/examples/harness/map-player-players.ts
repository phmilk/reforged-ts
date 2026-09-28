// When the game starts, each user still in it gets a greeting naming their
// slot. tsGlobals.Players is filled from the globals stage on, so every later
// stage can read it.
import { Init, tsGlobals } from "reforged-ts";

Init.onGameStart(() => {
  for (const player of tsGlobals.Players) {
    if (
      player.slotState === PLAYER_SLOT_STATE_PLAYING &&
      player.controller === MAP_CONTROL_USER
    ) {
      player.displayTimedText(
        0,
        0,
        10,
        `Welcome, player ${String(player.id + 1)}.`,
      );
    }
  }
});
