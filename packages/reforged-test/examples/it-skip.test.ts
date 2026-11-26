import { expect, it, startGame } from "reforged-test/map";
import { Init } from "reforged-ts";

Init.onGameStart(() => {
  print("Wave 1");
});

it("announces the first wave", () => {
  expect(startGame().printed).toEqual(["Wave 1"]);
});

// Reported as skipped: its body does not run, and it opens no game.
it.skip("announces the second wave", () => {
  expect(startGame().printed).toContain("Wave 2");
});

// Reported as todo: a name, and no body yet.
it.todo("announces the boss");
