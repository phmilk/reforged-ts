/** @noSelfInFile */

import { canonicalWrapper, type Handle } from "../handles/handle";
import { type HandleHolder, hold, iterateHandles, unhold } from "./handlekeys";

/**
 * A `Set` of Wrappers, for per-unit (per-Handle) membership, whose members
 * disappear when they are destroyed: `unit.destroy()` removes the unit from
 * every `HandleSet` holding it, in Dev mode and in release.
 *
 * It holds Handles, not Wrapper objects, so membership is answered through
 * whatever Wrapper is canonical for that Handle: a `Widget` added from
 * `Widget.fromEvent()` is a member when asked through the `Unit` the
 * registry upgraded it to. The members it returns are the canonical Wrapper
 * when the loop reaches them.
 *
 * A `HandleSet` keeps its members alive until they are deleted or
 * destroyed. A unit the game removed on its own (a decayed corpse) stays
 * until it is deleted, because the library sees no `destroy()` for it.
 *
 * @remarks
 * In multiplayer, iteration order must be the same on every client, or code
 * that loops and changes game state desyncs. A `Set` or a plain table of
 * Wrapper objects is iterated with `pairs`, whose order depends on the
 * table's memory layout. A `HandleSet` iterates in insertion order and never
 * through `pairs`, so a loop runs identically on every client as long as the
 * insertions ran in the same order, which holds when they ran in
 * synchronous code (not inside `MapPlayer.runLocal`).
 *
 * @example
 * {@includeCode ../../examples/harness/handle-map-kills.ts}
 * @typeParam K - The Wrapper class of the members, `Unit` or `Widget`.
 */
export class HandleSet<K extends Handle<handle>> {
  /** Each member's Handle, with the Wrapper last added for it. */
  private readonly memberOf = new Map<handle, K>();

  private readonly holder: HandleHolder = {
    drop: (handle) => {
      this.memberOf.delete(handle);
    },
  };

  /**
   * A set holding `values`, added in their order, or an empty set: the
   * constructor of `Set`, so swapping a `Set` of Wrappers for a `HandleSet`
   * is a change of the class name only.
   *
   * @param values - The Wrappers to add at once, in the iteration order.
   */
  public constructor(values?: Iterable<K> | null) {
    if (values !== undefined && values !== null) {
      for (const value of values) {
        this.add(value);
      }
    }
  }

  /**
   * Counts the members: `delete`, `clear` and a member's `destroy()` lower
   * it.
   *
   * @remarks
   * Kept in step on every client by the same additions, deletions and
   * destructions, so it is safe to branch on in multiplayer.
   * @returns The number of members, 0 for an empty set.
   */
  public get size(): number {
    return this.memberOf.size;
  }

  /**
   * Tells whether `member`'s Handle is in the set.
   *
   * @remarks
   * Looks up by Handle, so any Wrapper of the same game object answers the
   * same, on every client alike.
   * @param member - A Wrapper of the game object.
   * @returns True when the Handle is a member.
   */
  public has(member: K): boolean {
    return this.memberOf.has(member.handle);
  }

  /**
   * Adds `member`'s Handle. A new member goes last in the iteration order;
   * one already there keeps its place.
   *
   * @remarks
   * The insertion order is the iteration order, so call it from synchronous
   * code, never inside `MapPlayer.runLocal`, for loops to agree across
   * clients.
   * @param member - A Wrapper of the game object; the canonical one is
   * returned in loops.
   * @returns This set, for chaining.
   */
  public add(member: K): this {
    const handle = member.handle;
    const isNew = !this.memberOf.has(handle);
    this.memberOf.set(handle, member);
    if (isNew) {
      hold(handle, this.holder);
    }
    return this;
  }

  /**
   * Removes `member`'s Handle. After it, destroying the member has nothing
   * left to do for this set.
   *
   * @remarks
   * Deleting is a game-state change like `add`: call it from synchronous
   * code, never inside `MapPlayer.runLocal`.
   * @param member - A Wrapper of the game object.
   * @returns True when it was in the set.
   */
  public delete(member: K): boolean {
    const handle = member.handle;
    if (!this.memberOf.delete(handle)) {
      return false;
    }
    unhold(handle, this.holder);
    return true;
  }

  /**
   * Removes every member.
   *
   * @remarks
   * Clearing is a game-state change like `add`: call it from synchronous
   * code, never inside `MapPlayer.runLocal`.
   */
  public clear(): void {
    this.memberOf.forEach((_, handle) => {
      unhold(handle, this.holder);
    });
    this.memberOf.clear();
  }

  /**
   * Calls `callback` for each member, in insertion order. A member deleted
   * during the loop, by `delete` or by being destroyed, is skipped if not
   * yet reached, and the loop goes on; a member added during the loop is not
   * visited.
   *
   * @remarks
   * Insertion order, never `pairs`: the loop runs in the same order on every
   * client, so it may change game state in multiplayer.
   * @param callback - Called with the canonical Wrapper twice (as
   * `Set.forEach` does) and this set.
   */
  public forEach(callback: (value: K, key: K, set: this) => void): void {
    for (const member of this.values()) {
      callback(member, member, this);
    }
  }

  /**
   * Iterates over the members, in insertion order. Deleting during the
   * iteration is safe, as for `forEach`.
   *
   * @remarks
   * Insertion order, never `pairs`: safe to iterate in multiplayer.
   * @returns An iterator of the members, each the canonical Wrapper of its
   * Handle when the iteration reaches it.
   */
  public values(): IterableIterator<K> {
    return iterateHandles(this.memberOf, (handle, added) =>
      this.memberFor(handle, added),
    );
  }

  /**
   * Iterates over the members, as `values()` does and `Set.keys` is.
   *
   * @remarks
   * Insertion order, never `pairs`: safe to iterate in multiplayer.
   * @returns An iterator of the members.
   */
  public keys(): IterableIterator<K> {
    return this.values();
  }

  /**
   * Iterates over the members as `[member, member]` pairs, in insertion
   * order, as `Set.entries` does.
   *
   * @remarks
   * Insertion order, never `pairs`: safe to iterate in multiplayer.
   * @returns An iterator of the pairs.
   */
  public entries(): IterableIterator<[K, K]> {
    return iterateHandles(this.memberOf, (handle, added): [K, K] => {
      const member = this.memberFor(handle, added);
      return [member, member];
    });
  }

  /**
   * Iterates over the members, as `values()` does: `for (const unit of set)`.
   *
   * @remarks
   * Insertion order, never `pairs`: safe to iterate in multiplayer.
   * @returns An iterator of the members.
   */
  public [Symbol.iterator](): IterableIterator<K> {
    return this.values();
  }

  /** The canonical Wrapper of a member's Handle, else the last one added. */
  private memberFor(handle: handle, added: K): K {
    return (canonicalWrapper(handle) as K | undefined) ?? added;
  }
}
