/** @noSelfInFile */

// `SyncedMap`: the `Map` surface, iterated in sorted key order. The values
// live in a raw table keyed by key, the order in `SortedKeys`; like that
// module, this one never compiles to `pairs` or `next` (see sortedkeys.ts).

import { SortedKeys, type KeyComparator } from "./sortedkeys";

export type { KeyComparator } from "./sortedkeys";

/**
 * A `Map` whose every loop runs in sorted key order, the same on every client.
 *
 * @remarks
 * A Lua table iterated with `pairs` (what a plain object or `Object.keys`
 * compiles to) visits its keys in an order the game does not guarantee to be
 * the same on every client, and code that changes game state in that order
 * desyncs the lobby. `SyncedMap` never uses `pairs`: its `forEach`, `keys`,
 * `values`, `entries` and `for...of` walk the keys sorted, numbers
 * numerically, strings by byte, other keys by the comparator given to the
 * constructor. Swapping a `Map` for a `SyncedMap` is a type change.
 *
 * Without a comparator the keys of one instance must be all numbers or all
 * strings: in Dev mode a key of another kind raises where it is inserted, in
 * release the sort raises when it compares them. A loop walks a snapshot of
 * the keys taken when it starts, so deleting any key during it is safe: a key
 * deleted before the loop reaches it is skipped, and a key set during the
 * loop is visited by the next one. Iteration sorts once after a burst of
 * mutations, not per insertion.
 *
 * @example
 * {@includeCode ../../examples/synced-map-scores.ts}
 */
export class SyncedMap<K extends AnyNotNil, V> {
  private readonly order: SortedKeys<K>;
  private readonly stored = new LuaMap<K, V>();

  /**
   * An empty map, ordering its keys with `comparator`, or with Lua's `<` when
   * none is given (number or string keys only).
   *
   * @remarks
   * The comparator must be a total order that gives the same answer on every
   * client (compare ids or names, never handle addresses or `tostring`), or
   * the sorted order is not the same everywhere.
   */
  public constructor(comparator?: KeyComparator<K>);
  /**
   * A map holding `entries`, inserted in their order, then iterated sorted
   * by `comparator`, or by Lua's `<` when none is given.
   *
   * @remarks
   * The comparator must be a total order that gives the same answer on every
   * client, or the sorted order is not the same everywhere.
   */
  public constructor(
    entries: Iterable<readonly [K, V]> | null | undefined,
    comparator?: KeyComparator<K>,
  );
  public constructor(
    first?: KeyComparator<K> | Iterable<readonly [K, V]> | null,
    comparator?: KeyComparator<K>,
  ) {
    if (typeof first === "function") {
      this.order = new SortedKeys("SyncedMap", first);
    } else {
      this.order = new SortedKeys("SyncedMap", comparator);
      if (first !== undefined && first !== null) {
        for (const [key, value] of first) {
          this.set(key, value);
        }
      }
    }
  }

  /**
   * The number of keys.
   *
   * @remarks
   * Kept as a count, so reading it walks nothing and is the same on every
   * client.
   */
  public get size(): number {
    return this.order.size;
  }

  /**
   * The value stored for `key`, or undefined when there is none.
   *
   * @remarks
   * A lookup does not depend on iteration order, so it is multiplayer-safe as
   * on a `Map`.
   */
  public get(key: K): V | undefined {
    return this.stored.get(key);
  }

  /**
   * Whether `key` is present, including when its value is undefined.
   *
   * @remarks
   * A lookup does not depend on iteration order, so it is multiplayer-safe as
   * on a `Map`.
   */
  public has(key: K): boolean {
    return this.order.has(key);
  }

  /**
   * Stores `value` for `key` and returns this map.
   *
   * @remarks
   * A new key takes its sorted place, not the end: the next loop visits it
   * in the same position on every client. In Dev mode, without a comparator,
   * a key that is not of the kind of the present keys (all numbers or all
   * strings) raises here, where it is inserted, instead of in a later sort.
   */
  public set(key: K, value: V): this {
    this.order.add(key);
    this.stored.set(key, value);
    return this;
  }

  /**
   * Removes `key`; returns whether it was present.
   *
   * @remarks
   * Safe during a loop over this map: the loop skips the key if it has not
   * reached it yet and visits every other key once.
   */
  public delete(key: K): boolean {
    if (!this.order.remove(key)) {
      return false;
    }
    this.stored.delete(key);
    return true;
  }

  /**
   * Removes every key.
   *
   * @remarks
   * Walks the key array by index, never with `pairs`, so its cost does not
   * depend on a client-specific order either.
   */
  public clear(): void {
    const keys = this.order.snapshot();
    for (const key of keys) {
      this.stored.delete(key);
    }
    this.order.clear();
  }

  /**
   * Calls `callback` with each value, its key and this map, in sorted key
   * order.
   *
   * @remarks
   * The order is the same on every client, so the callback may change game
   * state. It walks a snapshot of the keys: deleting any key meanwhile
   * neither skips nor repeats one, and a key deleted before its turn is not
   * visited.
   */
  public forEach(callback: (value: V, key: K, map: this) => void): void {
    const keys = this.order.snapshot();
    for (const key of keys) {
      if (this.order.has(key)) {
        callback(this.stored.get(key) as V, key, this);
      }
    }
  }

  /**
   * The keys, in sorted order.
   *
   * @remarks
   * The order is the same on every client. The iterator walks a snapshot
   * taken when it starts, skipping keys deleted before their turn.
   */
  public *keys(): IterableIterator<K> {
    const keys = this.order.snapshot();
    for (const key of keys) {
      if (this.order.has(key)) {
        yield key;
      }
    }
  }

  /**
   * The values, in the sorted order of their keys.
   *
   * @remarks
   * The order is the same on every client. The iterator walks a snapshot
   * taken when it starts, skipping keys deleted before their turn.
   */
  public *values(): IterableIterator<V> {
    const keys = this.order.snapshot();
    for (const key of keys) {
      if (this.order.has(key)) {
        yield this.stored.get(key) as V;
      }
    }
  }

  /**
   * The `[key, value]` pairs, in sorted key order.
   *
   * @remarks
   * The order is the same on every client. The iterator walks a snapshot
   * taken when it starts, skipping keys deleted before their turn.
   */
  public *entries(): IterableIterator<[K, V]> {
    const keys = this.order.snapshot();
    for (const key of keys) {
      if (this.order.has(key)) {
        yield [key, this.stored.get(key) as V];
      }
    }
  }

  /**
   * The `[key, value]` pairs, in sorted key order: what `for...of` walks.
   *
   * @remarks
   * The order is the same on every client, unlike `pairs` over a table.
   */
  public [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.entries();
  }
}
