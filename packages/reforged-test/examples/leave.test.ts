import { expect, it, startGame } from "reforged-test/map";
import { Init, MapPlayer, on, PlayerEvents } from "reforged-ts";

Init.onGameStart(() => {
  on(PlayerEvents.leave, ({ player }) => {
    print(`Player ${tostring(player.id)} left the game`);
  });
});

it("says who left", () => {
  const game = startGame();
  const guest = MapPlayer.fromIndex(1);
  if (guest === undefined) throw new Error("no player");
  game.leave(guest);
  expect(guest.slotState).toBe(PLAYER_SLOT_STATE_LEFT);
  expect(game.printed).toEqual(["Player 1 left the game"]);
});
