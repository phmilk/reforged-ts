import { expect, it, startGame, stubNative } from "reforged-test/map";
import { Init, MapPlayer, Unit } from "reforged-ts";

Init.onGameStart(() => {
  const host = MapPlayer.fromIndex(0);
  if (host === undefined) return;
  const hero = Unit.create(host, FourCC("Hpal"), 0, 0);
  print(`${hero.name} joins the fight`);
});

// No Stub answers GetUnitName: the harness holds no object data.
stubNative("GetUnitName", (unit) =>
  GetUnitTypeId(unit) === FourCC("Hpal") ? "Paladin" : "Footman",
);

it("greets the hero by its name", () => {
  const game = startGame();
  expect(game.printed).toEqual(["Paladin joins the fight"]);
});

it("takes another answer in one test", () => {
  stubNative("GetUnitName", () => "Arthas");
  const game = startGame();
  expect(game.printed).toEqual(["Arthas joins the fight"]);
});
