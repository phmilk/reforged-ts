// The chat command "-gold": one Trigger watches every player's messages, its
// condition lets each player claim the gold once, and its action pays it.
import { Init, MapPlayer, Trigger, tsGlobals } from "reforged-ts";

const claimed = new Set<MapPlayer>();

Init.onTriggers(() => {
  const trigger = Trigger.create();
  for (const player of tsGlobals.Players) {
    trigger.registerPlayerChatEvent(player, "-gold", true);
  }
  trigger
    .addCondition(() => {
      const player = MapPlayer.fromEvent();
      return player !== undefined && !claimed.has(player);
    })
    .addAction(() => {
      const player = MapPlayer.fromEvent();
      if (player === undefined) {
        return;
      }
      claimed.add(player);
      const gold = player.getState(PLAYER_STATE_RESOURCE_GOLD);
      player.setState(PLAYER_STATE_RESOURCE_GOLD, gold + 500);
    });
});
