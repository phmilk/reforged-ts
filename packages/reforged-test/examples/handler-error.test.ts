import { expect, it, startGame } from "reforged-test/map";
import { MapPlayer, on, Reforged, Unit, UnitEvents } from "reforged-ts";

it("throws a handler's error out of the Game action, with Dev mode off", () => {
  const game = startGame();
  // The Test game forces no Dev mode: the library catches no handler's
  // error, and it fails the test at once.
  expect(Reforged.devMode).toBe(false);
  on(UnitEvents.death, () => {
    error("the death handler broke");
  });
  const host = MapPlayer.fromIndex(0);
  if (host === undefined) throw new Error("no player");
  const footman = Unit.create(host, FourCC("hfoo"), 0, 0);
  expect(() => {
    game.kill(footman);
  }).toThrow("the death handler broke");
});
