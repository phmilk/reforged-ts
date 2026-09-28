/** @noSelfInFile */

// `SyncedSet`: the `Set` surface, iterated in sorted order. The keys live in
// `SortedKeys`; like that module, this one never compiles to `pairs` or
// `next` (see sortedkeys.ts).

import { SortedKeys, type KeyComparator } from "./sortedkeys";

/**
 * A `Set` whose every loop runs in sorted order, the same on every client.
 *
 * @remarks
 * A Lua table iterated with `pairs` (what a plain object or `Object.keys`
 * compiles to) visits its keys in an order the game does not guarantee to be
 * the same on every client, and code that changes game state in that order
 * desyncs the lobby. `SyncedSet` never uses `pairs`: its `forEach`, `keys`,
 * `values`, `entries` and `for...of` walk the values sorted, numbers
 * numerically, strings by byte, other values by the comparator given to the
 * constructor. Swapping a `Set` for a `SyncedSet` is a type change.
 *
 * Without a comparator the values of one instance must be all numbers or all
 * strings: in Dev mode a value of another kind raises where it is added, in
 * release the sort raises when it compares them. A loop walks a snapshot
 * taken when it starts, so deleting any value during it is safe: a value
 * deleted before the loop reaches it is skipped, and a value added during
 * the loop is visited by the next one. Iteration sorts once after a burst of
 * mutations, not per insertion.
 *
 * @example
 * {@includeCode ../../examples/harness/synced-map-scores.ts}
 * @typeParam T - The type of the values: numbers or strings, or any value
 * with a comparator.
 */
export class SyncedSet<T extends AnyNotNil> {
  private readonly order: SortedKeys<T>;

  /**
   * An empty set, ordering its values with `comparator`, or with Lua's `<`
   * when none is given (number or string values only).
   *
   * @remarks
   * The comparator must be a total order that gives the same answer on every
   * client (compare ids or names, never handle addresses or `tostring`), or
   * the sorted order is not the same everywhere.
   * @param comparator - Orders two values: negative, zero or positive, as
   * for `Array.prototype.sort`.
   */
  public constructor(comparator?: KeyComparator<T>);
  /**
   * A set holding `values`, then iterated sorted by `comparator`, or by
   * Lua's `<` when none is given.
   *
   * @remarks
   * The comparator must be a total order that gives the same answer on every
   * client, or the sorted order is not the same everywhere.
   * @param values - The values to add at once; the set sorts them.
   * @param comparator - Orders two values: negative, zero or positive, as
   * for `Array.prototype.sort`.
   */
  public constructor(
    values: Iterable<T> | null | undefined,
    comparator?: KeyComparator<T>,
  );
  public constructor(
    first?: KeyComparator<T> | Iterable<T> | null,
    comparator?: KeyComparator<T>,
  ) {
    if (typeof first === "function") {
      this.order = new SortedKeys("SyncedSet", first);
    } else {
      this.order = new SortedKeys("SyncedSet", comparator);
      if (first !== undefined && first !== null) {
        for (const value of first) {
          this.add(value);
        }
      }
    }
  }

  /**
   * Counts the values the set holds.
   *
   * @remarks
   * Kept as a count, so reading it walks nothing and is the same on every
   * client.
   * @returns The number of values, 0 for an empty set.
   */
  public get size(): number {
    return this.order.size;
  }

  /**
   * Tells whether `value` is in the set.
   *
   * @remarks
   * A lookup does not depend on iteration order, so it is multiplayer-safe as
   * on a `Set`.
   * @param value - The value to look up.
   * @returns True when it is in the set.
   */
  public has(value: T): boolean {
    return this.order.has(value);
  }

  /**
   * Adds `value`.
   *
   * @remarks
   * A new value takes its sorted place, not the end: the next loop visits it
   * in the same position on every client. In Dev mode, without a comparator,
   * a value that is not of the kind of the present values (all numbers or
   * all strings) raises here, where it is added, instead of in a later sort.
   * @param value - The value to add.
   * @returns This set, for chaining.
   * @throws In Dev mode, without a comparator, when `value` is neither a
   * number nor a string, at the calling line:
   * `reforged-ts: SyncedSet without a comparator takes number or string keys, got a <kind>: pass a comparator to the constructor to order other keys`;
   * and when it is not of the kind of the present values:
   * `reforged-ts: SyncedSet without a comparator takes keys of one kind, got a <kind> after <kind> keys: the sorted order that keeps iteration identical on every client cannot compare them`.
   */
  public add(value: T): this {
    this.order.add(value);
    return this;
  }

  /**
   * Removes `value`.
   *
   * @remarks
   * Safe during a loop over this set: the loop skips the value if it has not
   * reached it yet and visits every other value once.
   * @param value - The value to remove.
   * @returns True when it was in the set.
   */
  public delete(value: T): boolean {
    return this.order.remove(value);
  }

  /**
   * Removes every value.
   *
   * @remarks
   * Walks the value array by index, never with `pairs`, so its cost does not
   * depend on a client-specific order either.
   */
  public clear(): void {
    this.order.clear();
  }

  /**
   * Calls `callback` for each value, in sorted order.
   *
   * @remarks
   * The order is the same on every client, so the callback may change game
   * state. It walks a snapshot: deleting any value meanwhile neither skips
   * nor repeats one, and a value deleted before its turn is not visited.
   * @param callback - Called with the value twice (as `Set.forEach` does)
   * and this set.
   */
  public forEach(callback: (value: T, value2: T, set: this) => void): void {
    const values = this.order.snapshot();
    for (const value of values) {
      if (this.order.has(value)) {
        callback(value, value, this);
      }
    }
  }

  /**
   * Iterates over the values, in sorted order.
   *
   * @remarks
   * The order is the same on every client. The iterator walks a snapshot
   * taken when it starts, skipping values deleted before their turn.
   * @returns An iterator of the values.
   */
  public *values(): IterableIterator<T> {
    const values = this.order.snapshot();
    for (const value of values) {
      if (this.order.has(value)) {
        yield value;
      }
    }
  }

  /**
   * Iterates over the values, in sorted order, as `values()` does and
   * `Set.keys` is.
   *
   * @remarks
   * The order is the same on every client.
   * @returns An iterator of the values.
   */
  public keys(): IterableIterator<T> {
    return this.values();
  }

  /**
   * Iterates over the values as `[value, value]` pairs, in sorted order, as
   * `Set.entries` does.
   *
   * @remarks
   * The order is the same on every client. The iterator walks a snapshot
   * taken when it starts, skipping values deleted before their turn.
   * @returns An iterator of the pairs.
   */
  public *entries(): IterableIterator<[T, T]> {
    const values = this.order.snapshot();
    for (const value of values) {
      if (this.order.has(value)) {
        yield [value, value];
      }
    }
  }

  /**
   * Iterates over the values, in sorted order: what `for...of` walks.
   *
   * @remarks
   * The order is the same on every client, unlike `pairs` over a table.
   * @returns An iterator of the values.
   */
  public [Symbol.iterator](): IterableIterator<T> {
    return this.values();
  }
}
