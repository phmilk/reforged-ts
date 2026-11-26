import { expect, it, startGame } from "reforged-test/map";
import { Init, MapPlayer } from "reforged-ts";

Init.onGameStart(() => {
  print("Welcome!");
  const host = MapPlayer.fromIndex(0);
  if (host !== undefined) host.displayTimedText(0, 0, 10, "You are the host");
});

it("greets the players when the game starts", () => {
  const game = startGame();
  expect(game.printed).toEqual(["Welcome!"]);
  expect(game.displayed).toMatchObject([
    { text: "You are the host", duration: 10 },
  ]);
});

it("starts from nothing", () => {
  const game = startGame();
  expect(game.printed).toEqual(["Welcome!"]);
});
