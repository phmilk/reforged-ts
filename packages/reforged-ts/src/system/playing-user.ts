/** @noSelfInFile */

// Package-internal: the system index does not re-export this module.

import type { MapPlayer } from "../handles/player";

/** Whether `player` is a user who is playing. */
export function isPlayingUser(
  player: MapPlayer | undefined,
): player is MapPlayer {
  return (
    player?.slotState === PLAYER_SLOT_STATE_PLAYING &&
    player.controller === MAP_CONTROL_USER
  );
}
