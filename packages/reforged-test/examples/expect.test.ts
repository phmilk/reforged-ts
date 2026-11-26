import { expect, it, startGame } from "reforged-test/map";
import { Init } from "reforged-ts";

Init.onGameStart(() => {
  print("Wave 1 begins");
});

it("checks what the game printed", () => {
  const { printed } = startGame();
  expect(printed).toHaveLength(1);
  expect(printed[0]).toMatch("Wave 1");
  expect(printed).not.toContain("Wave 2 begins");
  // An asymmetric matcher stands for any value it accepts.
  expect(printed).toEqual([expect.stringContaining("begins")]);
});
