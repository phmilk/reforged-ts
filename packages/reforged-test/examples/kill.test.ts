import { expect, it, startGame } from "reforged-test/map";
import { Init, MapPlayer, on, Unit, UnitEvents } from "reforged-ts";

const FOOTMAN = FourCC("hfoo");
const KNIGHT = FourCC("hkni");

Init.onGameStart(() => {
  on(UnitEvents.death, ({ unit, killer }) => {
    if (killer === undefined) return;
    const paid = tostring(killer.getOwner().id);
    const lost = tostring(unit.getOwner().id);
    print(`Player ${paid} is paid for a unit of player ${lost}`);
  });
});

it("pays the killer's owner", () => {
  const game = startGame();
  const host = MapPlayer.fromIndex(0);
  const enemy = MapPlayer.fromIndex(1);
  if (host === undefined || enemy === undefined) throw new Error("no player");
  const footman = Unit.create(host, FOOTMAN, 0, 0);
  const knight = Unit.create(enemy, KNIGHT, 300, 0);
  // The game kills the footman: every death Trigger it would fire runs, the
  // footman already dead, and a handler reads the knight as the killer.
  game.kill(footman, { by: knight });
  expect(UnitAlive(footman.handle)).toBe(false);
  expect(game.printed).toEqual(["Player 1 is paid for a unit of player 0"]);
});

it("pays nobody for a unit nothing killed", () => {
  const game = startGame();
  const host = MapPlayer.fromIndex(0);
  if (host === undefined) throw new Error("no player");
  game.kill(Unit.create(host, FOOTMAN, 0, 0));
  expect(game.printed).toEqual([]);
});
