import {
  expect,
  it,
  newHandle,
  startGame,
  stubNative,
} from "reforged-test/map";
import { Init, MapPlayer, Unit } from "reforged-ts";

let corpse: Unit | undefined;

Init.onGameStart(() => {
  const host = MapPlayer.fromIndex(0);
  if (host !== undefined) {
    corpse = Unit.createCorpse(host, FourCC("hfoo"), 0, 0);
  }
});

// No Stub answers CreateCorpse, and it must return a unit the harness knows.
stubNative("CreateCorpse", () => newHandle("unit"));

it("leaves a corpse when the game starts", () => {
  startGame();
  expect(corpse).toBeDefined();
});
