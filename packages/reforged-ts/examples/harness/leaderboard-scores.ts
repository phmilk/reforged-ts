// A kill count for every playing player, best first. The board is built
// once the game runs, from a Timer, and grows to fit its items only when
// told to.
import {
  Init,
  Leaderboard,
  MapPlayer,
  Timer,
  Trigger,
  Unit,
  tsGlobals,
} from "reforged-ts";

Init.onTriggers(() => {
  Timer.after(0, () => {
    const board = Leaderboard.create();
    const kills = new Map<MapPlayer, number>();
    board.label = "Kills";
    for (const player of tsGlobals.Players) {
      if (player.slotState === PLAYER_SLOT_STATE_PLAYING) {
        kills.set(player, 0);
        board.addItem(player.name, 0, player);
        board.setPlayerBoard(player);
      }
    }
    const size = board.itemCount;
    board.itemCount = size;
    board.display();

    Trigger.create()
      .registerAnyUnitEvent(EVENT_PLAYER_UNIT_DEATH)
      .addAction(() => {
        const owner = Unit.fromKilling()?.getOwner();
        const count = owner === undefined ? undefined : kills.get(owner);
        if (owner === undefined || count === undefined) {
          return;
        }
        kills.set(owner, count + 1);
        board.setItemValue(board.getPlayerIndex(owner), count + 1);
        board.sortByValue(false);
      });
  });
});
