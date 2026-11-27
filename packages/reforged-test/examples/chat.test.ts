import { expect, it, startGame } from "reforged-test/map";
import { Init, MapPlayer, on, PlayerEvents } from "reforged-ts";

Init.onGameStart(() => {
  const host = MapPlayer.fromIndex(0);
  if (host === undefined) return;
  // Without an exact match, the event fires on any message holding the text.
  on(PlayerEvents.chat(host, "-gold ", false), ({ message, matched }) => {
    print(`The host asks for ${message.substring(matched.length)} gold`);
  });
});

it("reads the amount typed after the command", () => {
  const game = startGame();
  const host = MapPlayer.fromIndex(0);
  if (host === undefined) throw new Error("no player");
  // The game ignores case when it matches, and hands the message as typed.
  game.chat(host, "-GOLD 500");
  expect(game.printed).toEqual(["The host asks for 500 gold"]);
});

it("hears nothing from another player", () => {
  const game = startGame();
  const guest = MapPlayer.fromIndex(1);
  if (guest === undefined) throw new Error("no player");
  game.chat(guest, "-gold 500");
  expect(game.printed).toEqual([]);
});
