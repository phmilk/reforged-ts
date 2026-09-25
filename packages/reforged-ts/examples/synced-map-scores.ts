// Scores kept by player id and a set of player names, looped over in sorted
// order: the same order on every client, whatever order they were set in.
import { Init, MapPlayer, SyncedMap, SyncedSet } from "reforged-ts";

const scores = new SyncedMap<number, number>();
const finished = new SyncedSet<string>();

/** Adds points to a player's score. */
export function score(player: MapPlayer, points: number): void {
  scores.set(player.id, (scores.get(player.id) ?? 0) + points);
}

Init.onGameStart(() => {
  for (const [index, points] of [
    [2, 5],
    [0, 3],
  ]) {
    const player = MapPlayer.fromIndex(index);
    if (player !== undefined) {
      score(player, points);
    }
  }
  finished.add("Zed").add("Ann");

  // Player 0 first, then player 2: sorted by id, not by insertion.
  for (const [id, points] of scores) {
    print(`Player ${String(id + 1)}: ${String(points)}`);
  }
  // "Ann", then "Zed".
  finished.forEach((name) => {
    print(`${name} finished`);
  });
});
