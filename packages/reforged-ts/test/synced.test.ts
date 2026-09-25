/** @noSelfInFile */

// SyncedMap and SyncedSet as a Map project observes them: the order its loops
// run in, what `size` and `has` answer next to a `Map` given the same
// operations, and what raises. The file's tests share one Lua state; the
// Dev mode tests turn the flag on and put it back off.

import { describe, expect, it } from "reforged-test/lua";
import { Reforged } from "../src/reforged/index";
import { SyncedMap } from "../src/system/syncedmap";
import { SyncedSet } from "../src/system/syncedset";
import { raisedIn } from "./support/raised-in";

/** The keys, inserted out of order. */
const NUMBERS = [42, -3, 7, 1000, 0, 7.5, 13];
const NUMBERS_SORTED = [-3, 0, 7, 7.5, 13, 42, 1000];
const STRINGS = ["thrall", "Arthas", "jaina", "illidan", "Uther", "arthas"];
const STRINGS_SORTED = [
  "Arthas",
  "Uther",
  "arthas",
  "illidan",
  "jaina",
  "thrall",
];

interface Hero {
  readonly id: number;
  readonly name: string;
}
const byId = (a: Hero, b: Hero) => a.id - b.id;
const HEROES: Hero[] = [
  { id: 30, name: "c" },
  { id: 10, name: "a" },
  { id: 40, name: "d" },
  { id: 20, name: "b" },
];

/** What `forEach` visits, as `key=value`. */
function visited<K extends AnyNotNil, V>(map: SyncedMap<K, V>): string[] {
  const seen: string[] = [];
  map.forEach((value, key) => {
    seen.push(`${tostring(key)}=${tostring(value)}`);
  });
  return seen;
}

function withDevMode(body: () => void): void {
  Reforged.configure({ devMode: true });
  try {
    body();
  } finally {
    Reforged.configure({ devMode: false });
  }
}

describe("SyncedMap order", () => {
  it("iterates number keys sorted, whatever the insertion order", () => {
    const map = new SyncedMap<number, string>();
    for (const key of NUMBERS) {
      map.set(key, `v${tostring(key)}`);
    }
    expect([...map.keys()]).toEqual(NUMBERS_SORTED);
    expect([...map.values()]).toEqual(
      NUMBERS_SORTED.map((key) => `v${tostring(key)}`),
    );
    expect([...map].map(([key]) => key)).toEqual(NUMBERS_SORTED);
    expect([...map.entries()].map(([, value]) => value)).toEqual(
      NUMBERS_SORTED.map((key) => `v${tostring(key)}`),
    );
    expect(visited(map)).toEqual(
      NUMBERS_SORTED.map((key) => `${tostring(key)}=v${tostring(key)}`),
    );
  });

  it("iterates string keys in byte order", () => {
    const map = new SyncedMap<string, number>();
    STRINGS.forEach((key, index) => map.set(key, index));
    expect([...map.keys()]).toEqual(STRINGS_SORTED);
  });

  it("iterates object keys by the constructor's comparator", () => {
    const map = new SyncedMap<Hero, number>(byId);
    for (const hero of HEROES) {
      map.set(hero, hero.id * 2);
    }
    expect([...map.keys()].map((hero) => hero.name)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
    expect([...map.values()]).toEqual([20, 40, 60, 80]);
  });

  it("takes initial entries, as Map's constructor does, with or without a comparator", () => {
    const map = new SyncedMap<number, string>([
      [3, "c"],
      [1, "a"],
      [2, "b"],
    ]);
    expect([...map.values()]).toEqual(["a", "b", "c"]);
    const reversed = new SyncedMap<number, string>(
      [
        [1, "a"],
        [3, "c"],
        [2, "b"],
      ],
      (a, b) => b - a,
    );
    expect([...reversed.values()]).toEqual(["c", "b", "a"]);
  });

  it("puts a key set after a loop in its sorted place", () => {
    const map = new SyncedMap<number, boolean>();
    map.set(5, true).set(1, true);
    expect([...map.keys()]).toEqual([1, 5]);
    map.set(3, true);
    map.delete(1);
    map.set(0, true);
    expect([...map.keys()]).toEqual([0, 3, 5]);
  });

  it("lists a key deleted and set again once", () => {
    const map = new SyncedMap<number, string>();
    map.set(2, "a").set(1, "b");
    map.delete(2);
    map.set(2, "c");
    expect(visited(map)).toEqual(["1=b", "2=c"]);
  });
});

describe("SyncedMap deletion during a loop", () => {
  it("deleting the current key in forEach neither skips nor repeats", () => {
    const map = new SyncedMap<number, number>();
    for (const key of NUMBERS) {
      map.set(key, key);
    }
    const seen: number[] = [];
    map.forEach((_value, key) => {
      seen.push(key);
      map.delete(key);
    });
    expect(seen).toEqual(NUMBERS_SORTED);
    expect(map.size).toEqual(0);
  });

  it("deleting the current key in a for...of neither skips nor repeats", () => {
    const map = new SyncedMap<string, number>();
    STRINGS.forEach((key, index) => map.set(key, index));
    const seen: string[] = [];
    for (const [key] of map) {
      seen.push(key);
      map.delete(key);
    }
    expect(seen).toEqual(STRINGS_SORTED);
  });

  it("does not visit a key deleted before its turn, and visits a key set during the loop on the next one", () => {
    const map = new SyncedMap<number, number>();
    map.set(1, 1).set(2, 2).set(3, 3);
    const seen: number[] = [];
    map.forEach((_value, key) => {
      seen.push(key);
      if (key === 1) {
        map.delete(2);
        map.set(4, 4);
      }
    });
    expect(seen).toEqual([1, 3]);
    expect([...map.keys()]).toEqual([1, 3, 4]);
  });
});

describe("SyncedMap size and has, next to a Map", () => {
  it("answers as a Map given the same operations", () => {
    const synced = new SyncedMap<number, string | undefined>();
    const plain = new Map<number, string | undefined>();
    const steps: [op: "set" | "delete" | "clear", key: number][] = [
      ["set", 3],
      ["set", 1],
      ["set", 3],
      ["delete", 2],
      ["set", 2],
      ["delete", 3],
      ["delete", 3],
      ["clear", 0],
      ["set", 7],
      ["set", 8],
    ];
    for (const [op, key] of steps) {
      if (op === "set") {
        // An undefined value is still a present key, as in a Map.
        synced.set(key, undefined);
        plain.set(key, undefined);
      } else if (op === "delete") {
        expect(synced.delete(key)).toEqual(plain.delete(key));
      } else {
        synced.clear();
        plain.clear();
      }
      expect(synced.size).toEqual(plain.size);
      for (const probe of [1, 2, 3, 7, 8]) {
        expect(synced.has(probe)).toEqual(plain.has(probe));
        expect(synced.get(probe)).toEqual(plain.get(probe));
      }
    }
  });

  it("returns itself from set and the stored value from get", () => {
    const map = new SyncedMap<string, number>();
    expect(map.set("a", 1)).toBe(map);
    map.set("a", 2);
    expect(map.get("a")).toEqual(2);
    expect(map.size).toEqual(1);
  });
});

describe("SyncedSet", () => {
  it("iterates numbers, strings and compared objects sorted", () => {
    const numbers = new SyncedSet<number>();
    for (const value of NUMBERS) {
      numbers.add(value);
    }
    expect([...numbers]).toEqual(NUMBERS_SORTED);
    expect([...numbers.keys()]).toEqual(NUMBERS_SORTED);
    expect([...numbers.entries()].map(([a, b]) => a === b)).toEqual(
      NUMBERS_SORTED.map(() => true),
    );
    const strings = new SyncedSet<string>(STRINGS);
    expect([...strings.values()]).toEqual(STRINGS_SORTED);
    const heroes = new SyncedSet<Hero>(byId);
    for (const hero of HEROES) {
      heroes.add(hero);
    }
    expect([...heroes].map((hero) => hero.name)).toEqual(["a", "b", "c", "d"]);
  });

  it("deleting the current value in forEach neither skips nor repeats", () => {
    const set = new SyncedSet<number>(NUMBERS);
    const seen: number[] = [];
    set.forEach((value, again) => {
      expect(again).toEqual(value);
      seen.push(value);
      set.delete(value);
    });
    expect(seen).toEqual(NUMBERS_SORTED);
    expect(set.size).toEqual(0);
  });

  it("answers size and has as a Set given the same operations", () => {
    const synced = new SyncedSet<string>();
    const plain = new Set<string>();
    for (const value of ["b", "a", "b", "c"]) {
      synced.add(value);
      plain.add(value);
      expect(synced.size).toEqual(plain.size);
    }
    expect(synced.delete("a")).toEqual(plain.delete("a"));
    expect(synced.delete("a")).toEqual(plain.delete("a"));
    expect(synced.size).toEqual(plain.size);
    for (const probe of ["a", "b", "c", "d"]) {
      expect(synced.has(probe)).toEqual(plain.has(probe));
    }
    synced.clear();
    plain.clear();
    expect(synced.size).toEqual(plain.size);
    expect(synced.has("b")).toEqual(plain.has("b"));
  });
});

describe("mixed key kinds", () => {
  it("raises in Dev mode at the insertion that mixes number and string keys", () => {
    withDevMode(() => {
      const map = new SyncedMap<number | string, boolean>();
      map.set(1, true);
      expect(
        raisedIn(() => {
          map.set("one", true);
        }),
      ).toEqual(
        "reforged-ts: SyncedMap without a comparator takes keys of one kind, got a string after number keys: the sorted order that keeps iteration identical on every client cannot compare them",
      );
      expect(map.has("one")).toBeFalsy();
      expect(map.size).toEqual(1);

      const set = new SyncedSet<number | string>();
      set.add("a");
      expect(
        raisedIn(() => {
          set.add(2);
        }),
      ).toEqual(
        "reforged-ts: SyncedSet without a comparator takes keys of one kind, got a number after string keys: the sorted order that keeps iteration identical on every client cannot compare them",
      );
    });
  });

  it("raises in Dev mode on a key that is neither a number nor a string, without a comparator", () => {
    withDevMode(() => {
      const map = new SyncedMap<Hero, boolean>();
      expect(
        raisedIn(() => {
          map.set({ id: 1, name: "a" }, true);
        }),
      ).toEqual(
        "reforged-ts: SyncedMap without a comparator takes number or string keys, got a table: pass a comparator to the constructor to order other keys",
      );
    });
  });

  it("accepts another kind in Dev mode once the map is empty again", () => {
    withDevMode(() => {
      const map = new SyncedMap<number | string, boolean>();
      map.set(1, true);
      map.delete(1);
      map.set("a", true);
      expect([...map.keys()]).toEqual(["a"]);
    });
  });

  it("accepts the insertion in release and raises when the loop sorts", () => {
    const map = new SyncedMap<number | string, boolean>();
    map.set(1, true);
    map.set("one", true);
    expect(map.size).toEqual(2);
    expect(() => [...map.keys()]).toThrow("attempt to compare");
  });
});
