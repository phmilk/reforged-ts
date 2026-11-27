import { expect, it, startGame } from "reforged-test/map";
import { Init, MapPlayer, on, Unit, UnitEvents } from "reforged-ts";

const FOOTMAN = FourCC("hfoo");

Init.onGameStart(() => {
  let selected = 0;
  on(UnitEvents.selected, () => {
    selected++;
    print(`${tostring(selected)} selected`);
  });
  on(UnitEvents.deselected, () => {
    selected--;
    print(`${tostring(selected)} selected`);
  });
});

it("counts the units in a selection", () => {
  const game = startGame();
  const host = MapPlayer.fromIndex(0);
  if (host === undefined) throw new Error("no player");
  const first = Unit.create(host, FOOTMAN, 0, 0);
  const second = Unit.create(host, FOOTMAN, 100, 0);
  // Each select adds to the selection and clears nothing.
  game.select(host, first);
  game.select(host, second);
  game.deselect(host, first);
  expect(game.printed).toEqual(["1 selected", "2 selected", "1 selected"]);
  expect(first.isSelected(host)).toBe(false);
  expect(second.isSelected(host)).toBe(true);
});
