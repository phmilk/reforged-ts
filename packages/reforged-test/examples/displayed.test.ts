import { expect, it, startGame } from "reforged-test/map";
import { Init, MapPlayer } from "reforged-ts";

Init.onGameStart(() => {
  const host = MapPlayer.fromIndex(0);
  if (host === undefined) return;
  host.displayText(0, 0, "Choose a hero");
  host.displayTimedText(0, 0, 30, "The first wave comes in 30 seconds");
});

it("shows the host the hero choice, then the first wave", () => {
  const { displayed } = startGame();
  expect(displayed).toHaveLength(2);
  const [choice, wave] = displayed;
  expect(choice).toMatchObject({ text: "Choose a hero", player: Player(0) });
  // DisplayTextToPlayer takes no duration.
  expect(choice.duration).toBeUndefined();
  expect(wave.duration).toEqual(30);
});
