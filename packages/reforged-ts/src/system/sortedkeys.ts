/** @noSelfInFile */

// The key store shared by `SyncedMap` and `SyncedSet`: which keys are
// present, and an array of them sorted lazily. The multiplayer contract is
// that nothing here depends on the order `pairs` or `next` would give, so the
// module uses only raw table indexing (`LuaMap`, `LuaSet`) and walks arrays
// by index (`for...of` over an array compiles to `ipairs`, a numeric walk):
// the compiled Lua contains neither call, and a Node test asserts that on the
// emitted artefact. It sorts with `table.sort` rather than
// `Array.prototype.sort`, whose types promise JavaScript's string order.
//
// A mutation marks the array dirty. A deletion leaves the key in the array
// until the next sort, which drops every key no longer present, so a
// deletion is O(1) and a burst of mutations pays for one sort. `listed`
// records which keys the array holds (present or not), so a key deleted and
// set again before the next sort is not listed twice.

import { Reforged } from "../reforged/index";

/** How a caller orders object keys: negative, zero or positive, as `Array.prototype.sort`. */
export type KeyComparator<K> = (a: K, b: K) => number;

/** The Lua type names a comparator-less instance accepts for its keys. */
type KeyKind = "number" | "string";

/**
 * The present keys of one collection and their sorted order. Internal to the
 * two synced collections; not exported from the library.
 */
export class SortedKeys<K extends AnyNotNil> {
  private readonly present = new LuaSet<K>();
  private readonly listed = new LuaSet<K>();
  private list: K[] = [];
  private dirty = false;
  private count = 0;
  /** The kind of the present keys, when no comparator orders them. */
  private kind: KeyKind | undefined;

  public constructor(
    private readonly owner: string,
    private readonly comparator: KeyComparator<K> | undefined,
  ) {}

  public get size(): number {
    return this.count;
  }

  public has(key: K): boolean {
    return this.present.has(key);
  }

  /**
   * Adds `key` when it is absent; returns whether it was. In Dev mode, a key
   * a comparator-less instance cannot order against the present keys raises,
   * aimed at the line that called the collection's inserting member.
   */
  public add(key: K): boolean {
    if (this.present.has(key)) {
      return false;
    }
    if (this.comparator === undefined) {
      this.checkKind(key);
    }
    this.present.add(key);
    this.count += 1;
    if (!this.listed.has(key)) {
      this.listed.add(key);
      this.list[this.list.length] = key;
      this.dirty = true;
    }
    return true;
  }

  /** Removes `key`; returns whether it was present. */
  public remove(key: K): boolean {
    if (!this.present.has(key)) {
      return false;
    }
    this.present.delete(key);
    this.count -= 1;
    this.dirty = true;
    if (this.count === 0) {
      this.kind = undefined;
    }
    return true;
  }

  public clear(): void {
    const list = this.list;
    for (const key of list) {
      this.present.delete(key);
      this.listed.delete(key);
    }
    this.list = [];
    this.count = 0;
    this.dirty = false;
    this.kind = undefined;
  }

  /**
   * A copy of the present keys in sorted order, taken now: the caller walks
   * it by index, so mutations during the walk never shift it.
   */
  public snapshot(): K[] {
    this.sort();
    const list = this.list;
    const copy: K[] = [];
    for (let index = 0; index < list.length; index++) {
      copy[index] = list[index];
    }
    return copy;
  }

  /** Drops the keys deleted since the last sort, then sorts, when dirty. */
  private sort(): void {
    if (!this.dirty) {
      return;
    }
    const kept: K[] = [];
    const list = this.list;
    for (const key of list) {
      if (this.present.has(key)) {
        kept[kept.length] = key;
      } else {
        this.listed.delete(key);
      }
    }
    const comparator = this.comparator;
    if (comparator === undefined) {
      // Lua's `<`: numeric order for numbers, byte order for strings, and an
      // error when it meets a number and a string (release mode's signal).
      table.sort(kept);
    } else {
      table.sort(kept, (a, b) => comparator(a, b) < 0);
    }
    this.list = kept;
    this.dirty = false;
  }

  /**
   * In Dev mode, raises when `key` is neither a number nor a string, or not
   * of the kind of the keys already present. Read per new key rather than at
   * construction, so an instance built at module load, before the entry
   * point's `configure`, is still checked.
   */
  private checkKind(key: K): void {
    if (!Reforged.devMode) {
      return;
    }
    const kind = type(key);
    if (kind !== "number" && kind !== "string") {
      // Level 4: this function, `add`, the collection's member, its caller.
      error(
        `reforged-ts: ${this.owner} without a comparator takes number or string keys, got a ${kind}: pass a comparator to the constructor to order other keys`,
        4,
      );
    }
    if (this.kind === undefined) {
      this.kind = kind;
    } else if (this.kind !== kind) {
      error(
        `reforged-ts: ${this.owner} without a comparator takes keys of one kind, got a ${kind} after ${this.kind} keys: the sorted order that keeps iteration identical on every client cannot compare them`,
        4,
      );
    }
  }
}
