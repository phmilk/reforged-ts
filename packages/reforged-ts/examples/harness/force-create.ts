// A force of the users in the game, made once the globals stage has filled
// tsGlobals.Players. A second after the game starts, each of them reads how
// many users play.
import { Force, Init, MapPlayer, Timer, tsGlobals } from "reforged-ts";

Init.onGlobals(() => {
  const users = Force.create();
  for (const player of tsGlobals.Players) {
    if (
      player.slotState === PLAYER_SLOT_STATE_PLAYING &&
      player.controller === MAP_CONTROL_USER
    ) {
      users.addPlayer(player);
    }
  }

  Timer.after(1, () => {
    const count = users.getPlayers().length;
    users.for(() => {
      MapPlayer.fromEnum()?.displayTimedText(
        0,
        0,
        10,
        `${String(count)} users are playing.`,
      );
    });
  });
});
