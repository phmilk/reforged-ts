import { expect, it, startGame } from "reforged-test/map";
import { MapPlayer } from "reforged-ts";

function showHint(player: MapPlayer): void {
  // Runs on that player's client only.
  MapPlayer.runLocal(player, () => {
    print("Press F1 to pick a hero");
  });
}

it("shows the hint on its player's client only", () => {
  const game = startGame();
  const second = MapPlayer.fromIndex(1);
  if (second === undefined) throw new Error("slot 1 holds no player");
  // The test's client is Player(0) until it says otherwise.
  showHint(second);
  expect(game.printed).toEqual([]);
  game.setLocalPlayer(second);
  showHint(second);
  expect(game.printed).toEqual(["Press F1 to pick a hero"]);
});
