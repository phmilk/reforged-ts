/** @noSelfInFile */

import { canonicalWrapper, type Handle } from "../handles/handle";
import { type HandleHolder, hold, iterateHandles, unhold } from "./handlekeys";

/** One entry: the value, and the Wrapper last used as its key. */
interface Entry<K, V> {
  key: K;
  value: V;
}

/**
 * A `Map` keyed by Wrappers, for per-unit (per-Handle) state, whose entries
 * disappear when their key is destroyed: `unit.destroy()` removes the unit's
 * entry from every `HandleMap` holding it, in Dev mode and in release.
 *
 * It is keyed by the Wrapper's Handle, not by the Wrapper object, so an entry
 * is found through whatever Wrapper is canonical for that Handle: an entry
 * set through the `Widget` that `Widget.fromEvent()` returned is found
 * through the `Unit` the registry upgraded it to. The keys it returns
 * (`keys()`, `entries()`, `forEach`) are the canonical Wrapper when the loop
 * reaches them.
 *
 * A `HandleMap` keeps its keys alive until they are deleted or destroyed:
 * that is its point. An entry for a unit the game removed on its own (a
 * decayed corpse) stays until it is deleted, because the library sees no
 * `destroy()` for it.
 *
 * @remarks
 * In multiplayer, iteration order must be the same on every client, or code
 * that loops and changes game state desyncs. A `Map` or a plain table keyed
 * by Wrapper objects is iterated with `pairs`, whose order depends on the
 * table's memory layout. A `HandleMap` iterates in insertion order and never
 * through `pairs`, so a loop runs identically on every client as long as the
 * insertions ran in the same order, which holds when they ran in
 * synchronous code (not inside `MapPlayer.runLocal`).
 *
 * @example
 * {@includeCode ../../examples/handle-map-kills.ts}
 * @typeParam K - The Wrapper class of the keys, `Unit` or `Widget`.
 * @typeParam V - The type of the values.
 */
export class HandleMap<K extends Handle<handle>, V> {
  private readonly entryOf = new Map<handle, Entry<K, V>>();

  private readonly holder: HandleHolder = {
    drop: (handle) => {
      this.entryOf.delete(handle);
    },
  };

  /**
   * A map holding `entries`, set in their order, or an empty map: the
   * constructor of `Map`, so swapping a `Map` keyed by Wrappers for a
   * `HandleMap` is a change of the class name only.
   *
   * @param entries - The first entries, each a key Wrapper and its value.
   */
  public constructor(entries?: Iterable<readonly [K, V]> | null) {
    if (entries !== undefined && entries !== null) {
      for (const [key, value] of entries) {
        this.set(key, value);
      }
    }
  }

  /**
   * The number of entries.
   *
   * @remarks
   * Kept in step on every client by the same insertions, deletions and
   * destructions, so it is safe to branch on in multiplayer.
   */
  public get size(): number {
    return this.entryOf.size;
  }

  /**
   * The value stored for `key`'s Handle, or undefined when there is none.
   *
   * @remarks
   * Looks up by Handle, so any Wrapper of the same game object finds the
   * entry, on every client alike.
   */
  public get(key: K): V | undefined {
    return this.entryOf.get(key.handle)?.value;
  }

  /**
   * Whether an entry is stored for `key`'s Handle.
   *
   * @remarks
   * Looks up by Handle, so any Wrapper of the same game object answers the
   * same, on every client alike.
   */
  public has(key: K): boolean {
    return this.entryOf.has(key.handle);
  }

  /**
   * Stores `value` for `key`'s Handle and returns this map. A new key goes
   * last in the iteration order; an existing one keeps its place.
   *
   * @remarks
   * The insertion order is the iteration order, so call it from synchronous
   * code, never inside `MapPlayer.runLocal`, for loops to agree across
   * clients.
   */
  public set(key: K, value: V): this {
    const handle = key.handle;
    const entry = this.entryOf.get(handle);
    if (entry === undefined) {
      this.entryOf.set(handle, { key, value });
      hold(handle, this.holder);
    } else {
      entry.key = key;
      entry.value = value;
    }
    return this;
  }

  /**
   * Removes the entry of `key`'s Handle; returns whether there was one.
   * After it, destroying the key has nothing left to do for this map.
   *
   * @remarks
   * Deleting is a game-state change like `set`: call it from synchronous
   * code, never inside `MapPlayer.runLocal`.
   */
  public delete(key: K): boolean {
    const handle = key.handle;
    if (!this.entryOf.delete(handle)) {
      return false;
    }
    unhold(handle, this.holder);
    return true;
  }

  /**
   * Removes every entry.
   *
   * @remarks
   * Clearing is a game-state change like `set`: call it from synchronous
   * code, never inside `MapPlayer.runLocal`.
   */
  public clear(): void {
    this.entryOf.forEach((_, handle) => {
      unhold(handle, this.holder);
    });
    this.entryOf.clear();
  }

  /**
   * Calls `callback` for each entry, in insertion order, with the value, the
   * canonical Wrapper of the key and this map. An entry deleted during the
   * loop, by `delete` or by destroying its key, is skipped if not yet
   * reached, and the loop goes on; an entry added during the loop is not
   * visited.
   *
   * @remarks
   * Insertion order, never `pairs`: the loop runs in the same order on every
   * client, so it may change game state in multiplayer.
   */
  public forEach(callback: (value: V, key: K, map: this) => void): void {
    for (const [key, value] of this.entries()) {
      callback(value, key, this);
    }
  }

  /**
   * The keys, in insertion order, each the canonical Wrapper of its Handle
   * when the iteration reaches it. Deleting during the iteration is safe, as
   * for `forEach`.
   *
   * @remarks
   * Insertion order, never `pairs`: safe to iterate in multiplayer.
   */
  public keys(): IterableIterator<K> {
    return iterateHandles(this.entryOf, (handle, entry) =>
      this.keyOf(handle, entry),
    );
  }

  /**
   * The values, in insertion order. Deleting during the iteration is safe,
   * as for `forEach`.
   *
   * @remarks
   * Insertion order, never `pairs`: safe to iterate in multiplayer.
   */
  public values(): IterableIterator<V> {
    return iterateHandles(this.entryOf, (_, entry) => entry.value);
  }

  /**
   * The `[key, value]` pairs, in insertion order, each key the canonical
   * Wrapper of its Handle when the iteration reaches it. Deleting during the
   * iteration is safe, as for `forEach`.
   *
   * @remarks
   * Insertion order, never `pairs`: safe to iterate in multiplayer.
   */
  public entries(): IterableIterator<[K, V]> {
    return iterateHandles(this.entryOf, (handle, entry): [K, V] => [
      this.keyOf(handle, entry),
      entry.value,
    ]);
  }

  /**
   * The same as `entries()`: `for (const [unit, state] of map)`.
   *
   * @remarks
   * Insertion order, never `pairs`: safe to iterate in multiplayer.
   */
  public [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.entries();
  }

  /** The canonical Wrapper of a stored Handle, else the last key used. */
  private keyOf(handle: handle, entry: Entry<K, V>): K {
    return (canonicalWrapper(handle) as K | undefined) ?? entry.key;
  }
}
