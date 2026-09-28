/** @noSelfInFile */

// Package-internal: the system index does not re-export this module.

import type { MapPlayer } from "../handles/player";

/**
 * Tells whether `player` is a user who is playing: a human in a slot whose
 * state is playing.
 * @param player - The player to check, if any.
 * @returns True for a playing user, which narrows `player` to a `MapPlayer`.
 */
export function isPlayingUser(
  player: MapPlayer | undefined,
): player is MapPlayer {
  return (
    player?.slotState === PLAYER_SLOT_STATE_PLAYING &&
    player.controller === MAP_CONTROL_USER
  );
}
