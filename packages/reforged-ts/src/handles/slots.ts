/** @noSelfInFile */

// Package-internal: the handles index does not re-export this module.

import { MapPlayer } from "./player";

/**
 * Calls `callback` with the player in each of the `bj_MAX_PLAYER_SLOTS` slots,
 * skipping a slot the game has no player for. The players are read when it
 * is called, never at load.
 */
export function forEachPlayerSlot(callback: (player: MapPlayer) => void): void {
  for (let index = 0; index < bj_MAX_PLAYER_SLOTS; index++) {
    const player = MapPlayer.fromIndex(index);
    if (player !== undefined) {
      callback(player);
    }
  }
}
