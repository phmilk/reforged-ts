/** @noSelfInFile */

import { MapPlayer } from "../handles/player";
import { onStage } from "../init/stages";

export * from "./order";

/**
 * One `MapPlayer` per player slot, `Players[i]` for slot `i`. Empty until the
 * `globals` stage: the library fills it after `InitGlobals`, before any
 * `Init.onGlobals` callback of the Map project. Read it from `Init.onGlobals`
 * or a later stage, never at module top level, where it holds nothing.
 */
export const Players: MapPlayer[] = [];

onStage(
  "globals",
  "library",
  () => {
    for (let i = 0; i < bj_MAX_PLAYER_SLOTS; i++) {
      const pl = MapPlayer.fromHandle(Player(i));
      if (pl) {
        Players[i] = pl;
      }
    }
  },
  "Players",
);
