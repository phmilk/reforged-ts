import { expect, it, startGame } from "reforged-test/map";
import { Init } from "reforged-ts";

// The map's own code: the third wave is missing from its table.
const waves: { readonly size: number }[] = [{ size: 4 }, { size: 6 }];

Init.onGameStart(() => {
  const third = waves[2];
  print(`The third wave brings ${tostring(third.size)} units`);
});

Init.onGameStart(() => {
  print(`The first wave brings ${tostring(waves[0].size)} units`);
});

it("reports the missing wave and goes on", () => {
  const game = startGame();
  // The library caught the error and went on, as in the game: without this
  // line, the test fails at its end, naming the error.
  game.expectError("attempt to index a nil value");
  expect(game.printed).toContain("The first wave brings 4 units");
});
