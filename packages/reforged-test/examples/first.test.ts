import { expect, it, startGame } from "reforged-test/map";
import { Init, MapPlayer, on, Unit, UnitEvents } from "reforged-ts";

const FOOTMAN = FourCC("hfoo");

// The map's own code: in a Map project, an import of `src/main`.
Init.onGameStart(() => {
  on(UnitEvents.death, ({ unit }) => {
    if (unit.typeId === FOOTMAN) print("A footman died");
  });
});

it("says when a footman dies", () => {
  const game = startGame();
  const host = MapPlayer.fromIndex(0);
  if (host === undefined) throw new Error("no player");
  const footman = Unit.create(host, FOOTMAN, 0, 0);
  game.kill(footman);
  expect(game.printed).toContain("A footman died");
});
