import { expect, it, startGame } from "reforged-test/map";
import { Init } from "reforged-ts";

// The top level runs again for each test, in a Lua state of its own.
const joined: string[] = [];

Init.onGameStart(() => {
  joined.push("host");
});

it("sees the game start once", () => {
  startGame();
  expect(joined).toEqual(["host"]);
});

it("sees nothing of the test before it", () => {
  startGame();
  expect(joined).toHaveLength(1);
});
