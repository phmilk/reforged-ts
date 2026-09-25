/** @noSelfInFile */

import { MapPlayer } from "../../handles/player";
import { required } from "../descriptor";
import { unitEventRows } from "./rows";

export const selectionRows = unitEventRows({
  /** `player` selects a unit. */
  selected: {
    event: EVENT_PLAYER_UNIT_SELECTED,
    twin: EVENT_UNIT_SELECTED,
    unit: "unit",
    read: (unit, event) => ({
      unit,
      player: required(MapPlayer.fromEvent(), "player", event),
    }),
  },
  /** `player` deselects a unit. */
  deselected: {
    event: EVENT_PLAYER_UNIT_DESELECTED,
    twin: EVENT_UNIT_DESELECTED,
    unit: "unit",
    read: (unit, event) => ({
      unit,
      player: required(MapPlayer.fromEvent(), "player", event),
    }),
  },
});
