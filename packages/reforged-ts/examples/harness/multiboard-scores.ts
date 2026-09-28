// A two-column table, a player's name and their gold, one row per player
// slot in use. The game shows no multiboard during map initialization, so a
// Timer builds it once the game runs.
import { Init, MapPlayer, Multiboard, Timer, tsGlobals } from "reforged-ts";

Init.onTriggers(() => {
  Timer.after(0, () => {
    const players: MapPlayer[] = tsGlobals.Players.filter(
      (player) => player.slotState === PLAYER_SLOT_STATE_PLAYING,
    );
    const board = Multiboard.create();
    board.title = "Gold";
    board.columns = 2;
    // The row count is safe to change by one at a time.
    for (let row = 1; row <= players.length; row++) {
      board.rows = row;
    }
    board.setItemsStyle(true, false);

    players.forEach((player, index) => {
      const name = board.createItem(index + 1, 1);
      name.setValue(player.name);
      name.setWidth(0.1);
      name.destroy();

      const gold = board.createItem(index + 1, 2);
      gold.setValue(String(player.getState(PLAYER_STATE_RESOURCE_GOLD)));
      gold.setValueColor(255, 204, 0, 255);
      gold.destroy();
    });

    board.display(true);
  });
});
