/** @noSelfInFile */

import { MapPlayer } from "../handles/player";
import { onStage } from "../init/stages";

export * from "./order";

/**
 * The `MapPlayer` of every player slot, `Players[i]` for slot `i`, from 0 to
 * `bj_MAX_PLAYER_SLOTS - 1`, the neutral slots included.
 * @remarks
 * Empty until the `globals` stage: the library fills it after `InitGlobals`,
 * before any {@link InitStages.onGlobals | Init.onGlobals} callback of the Map
 * project. Read it from `Init.onGlobals` or a later stage, never at module top
 * level, where it holds nothing. In w3ts 3.x it was filled when the library
 * loaded.
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
