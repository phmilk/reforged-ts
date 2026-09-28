// Telling the local player apart. `isLocal` and `fromLocal` answer
// differently on each client, so they choose what that client shows and
// never what the game does: the text tag below exists on every client and
// is visible on one. MapPlayer.runLocal wraps the common case, a block of
// visuals for one player.
import { Init, MapPlayer, TextTag } from "reforged-ts";

Init.onGameStart(() => {
  const owner = MapPlayer.fromIndex(0);
  if (owner === undefined) {
    return;
  }
  const label = TextTag.create();
  label.setText("Your base", 12, true);
  label.setPos(0, 0, 64);
  label.setVisible(owner.isLocal());

  const local = MapPlayer.fromLocal();
  print(local === owner ? "Defend your base" : `Attack ${owner.name}'s base`);
});
