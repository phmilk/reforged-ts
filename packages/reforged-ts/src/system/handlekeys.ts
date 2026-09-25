/** @noSelfInFile */

// What `HandleMap` and `HandleSet` share: the registration that drops a
// destroyed Handle from every collection holding it, and the iteration over
// a collection's Handles. Package-internal: `system/index.ts` does not
// re-export this module.
//
// Neither part iterates with `pairs` or `next`: the registration is a
// `WeakMap` read by key, and the collections are typescript-to-lua `Map`s,
// whose runtime keeps their keys in an insertion-ordered linked list.

import { onHandleReleased } from "../handles/handle";

/** One collection as the registration sees it: how to drop a Handle. */
export interface HandleHolder {
  /** Removes the entry of `handle`, which the release step just released. */
  drop(handle: handle): void;
}

/**
 * The registration: for each Handle, the collections holding it. Weak on the
 * Handle, so a Handle nothing else holds does not stay alive through it; the
 * collections are held strongly while they hold the Handle, and not after
 * they deleted it.
 */
const holdersOf = new WeakMap<handle, Set<HandleHolder>>();

/** Registers `holder` as holding `handle`: `set` and `add` call it. */
export function hold(handle: handle, holder: HandleHolder): void {
  let holders = holdersOf.get(handle);
  if (holders === undefined) {
    holders = new Set();
    holdersOf.set(handle, holders);
  }
  holders.add(holder);
}

/** Unregisters `holder` for `handle`: `delete` and `clear` call it. */
export function unhold(handle: handle, holder: HandleHolder): void {
  const holders = holdersOf.get(handle);
  if (holders === undefined) {
    return;
  }
  holders.delete(holder);
  if (holders.size === 0) {
    holdersOf.delete(handle);
  }
}

/**
 * The number of collections registered as holding `handle`: what its
 * `destroy()` would notify. 0 once every holder deleted it, cleared or was
 * told of its release; how a test sees that nothing is left to notify.
 */
export function holderCount(handle: handle): number {
  return holdersOf.get(handle)?.size ?? 0;
}

// The release step of the Handle base, in both modes: every collection
// holding the destroyed Handle drops it, and the registration forgets it.
onHandleReleased(({ handle }) => {
  const holders = holdersOf.get(handle);
  if (holders === undefined) {
    return;
  }
  holdersOf.delete(handle);
  holders.forEach((holder) => {
    holder.drop(handle);
  });
});

/**
 * An iterator over the Handles `entries` holds now, in insertion order, each
 * read through `read` with what `entries` stores for it (an object, never
 * undefined, so a missing entry is one deleted). It walks a snapshot of the keys, so an entry deleted
 * during the loop (by `delete`, `clear` or a `destroy()`) is skipped when
 * the loop reaches it and the loop goes on, and an entry added during the
 * loop is not visited. typescript-to-lua's own `Map` iterator stops at an
 * entry deleted under it.
 */
export function iterateHandles<T extends object, R>(
  entries: ReadonlyMap<handle, T>,
  read: (handle: handle, stored: T) => R,
): IterableIterator<R> {
  const handles: handle[] = [];
  entries.forEach((_, handle) => {
    handles.push(handle);
  });
  let index = 0;
  const iterator: IterableIterator<R> = {
    next(): IteratorResult<R> {
      while (index < handles.length) {
        const handle = handles[index];
        index++;
        const stored = entries.get(handle);
        if (stored !== undefined) {
          return { done: false, value: read(handle, stored) };
        }
      }
      return { done: true, value: undefined };
    },
    [Symbol.iterator]() {
      return iterator;
    },
  };
  return iterator;
}
