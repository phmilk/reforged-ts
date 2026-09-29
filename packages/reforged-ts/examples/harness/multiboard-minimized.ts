// Reopening a scoreboard a player minimized, when the scores change. Each
// player minimizes and opens the board on their own client, so whether it
// is minimized is theirs alone: read and change it inside runLocal, for the
// player concerned, and let nothing else depend on it.
import { MapPlayer, Multiboard } from "reforged-ts";

/** Opens `board` again for `player` if they minimized it. */
export function reopenFor(player: MapPlayer, board: Multiboard): void {
  MapPlayer.runLocal(player, () => {
    if (board.minimized()) {
      board.minimize(false);
    }
  });
}
