import { calls, expect, fn, it, startGame } from "reforged-test/map";
import { Init } from "reforged-ts";

const onStart = fn();
Init.onGameStart(onStart);

it("runs the start handler once, when the game starts", () => {
  expect(onStart).not.toHaveBeenCalled();
  startGame();
  expect(onStart).toHaveBeenCalledTimes(1);
});

it("answers what its implementation answers", () => {
  const double = fn((n: number) => n * 2);
  expect(double(21)).toBe(42);
  expect(double).toHaveBeenCalledWith(21);
  expect(calls(double)).toEqual([[21]]);
});
