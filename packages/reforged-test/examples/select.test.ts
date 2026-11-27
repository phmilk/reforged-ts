import { expect, it, startGame } from "reforged-test/map";
import { Init, MapPlayer, on, Unit, UnitEvents } from "reforged-ts";

const KNIGHT = FourCC("hkni");

Init.onGameStart(() => {
  on(UnitEvents.selected, ({ unit, player }) => {
    const selector = tostring(player.id);
    const owner = tostring(unit.getOwner().id);
    print(`Player ${selector} selected a unit of player ${owner}`);
  });
});

it("says who selected whose unit", () => {
  const game = startGame();
  const host = MapPlayer.fromIndex(0);
  const enemy = MapPlayer.fromIndex(1);
  if (host === undefined || enemy === undefined) throw new Error("no player");
  const knight = Unit.create(enemy, KNIGHT, 0, 0);
  // The unit enters the host's selection: the event is the host's, though
  // the knight is the enemy's.
  game.select(host, knight);
  expect(knight.isSelected(host)).toBe(true);
  expect(game.printed).toEqual(["Player 0 selected a unit of player 1"]);
});
