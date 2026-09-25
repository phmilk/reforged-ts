// A Map or Set becomes a SyncedMap or SyncedSet by a type change: the same
// constructor calls, members and loops, with a comparator for object keys.
import { SyncedMap, SyncedSet, type KeyComparator } from "reforged-ts";

const gold = new SyncedMap<number, number>([[1, 100]]);
gold.set(2, 50).set(3, 75);
const total: number[] = [];
gold.forEach((amount, playerId, map) => {
  total.push(amount + playerId + map.size);
});
for (const [playerId, amount] of gold) {
  total.push(playerId + amount);
}
const ids: number[] = [...gold.keys()];
const first: number | undefined = gold.get(1);
const removed: boolean = gold.delete(1);

interface Hero {
  readonly id: number;
}
const byId: KeyComparator<Hero> = (a, b) => a.id - b.id;
const heroes = new SyncedMap<Hero, string>(byId);
const names = new SyncedSet<string>(["b", "a"]);
const picked = new SyncedSet<Hero>((a, b) => a.id - b.id);
const letters: string[] = [...names];

export { first, heroes, ids, letters, names, picked, removed, total };
