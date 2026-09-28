/** @noSelfInFile */

import { hasRun } from "../init/stages";
import { LIBRARY } from "../init/state";
import { configuration } from "../reforged/configuration";
import { countCreated, countDestroyed } from "../reforged/leaks";
import { assertNotLocal } from "../reforged/local";

/** The registry: the one Wrapper object for each Handle. */
const registry = new WeakMap<handle, Handle<handle>>();

/**
 * What the release step hands the collections of a destroyed Wrapper: its
 * Handle, read before the Wrapper forgets it.
 */
export interface Released {
  /** The Handle of the destroyed Wrapper. */
  readonly handle: handle;
}

/**
 * The collections told when a Handle is released. Empty until a collection
 * keyed by Handles registers itself through `onHandleReleased`.
 */
const releaseListeners: ((released: Released) => void)[] = [];

/**
 * Registers `listener` to run in every release step, after the registry
 * entry is gone: how a collection holding Handles drops the entries of a
 * destroyed one. Package-internal: `handles/index.ts` does not re-export
 * it.
 * @param listener - Called once per destroyed Wrapper, with its Handle.
 */
export function onHandleReleased(listener: (released: Released) => void) {
  releaseListeners.push(listener);
}

/**
 * The canonical Wrapper of `handle`: the one the registry holds for it now,
 * after any upgrade (`Unit` over `Widget`), or undefined when the registry
 * holds none. How a collection keyed by Handles returns keys without asking
 * for a class. Package-internal, like `onHandleReleased`.
 * @param handle - The Handle to look up.
 * @returns The Wrapper the registry holds, or `undefined` when it holds none
 * for `handle`.
 */
export function canonicalWrapper(handle: handle): Handle<handle> | undefined {
  return registry.get(handle);
}

/**
 * A Wrapper class as its static members see it: the type of `this` inside a
 * static member such as `fromHandle`.
 * @remarks
 * The abstract base itself is not one: `typeof Handle` has a `Handle<any>`
 * prototype, and `0 extends 1 & H` holds only when `H` is `any`, so
 * `Handle.fromHandle(h)` asks for a property `typeof Handle` lacks and does
 * not compile. The library exports the type because `fromHandle`'s
 * signature names it; Map project code has no need to write it.
 * @typeParam C - The Wrapper the class creates.
 */
export type WrapperClass<C extends Handle<handle>> = {
  /** The class's prototype: its instances are the Wrappers it returns. */
  readonly prototype: C;
  /** The class's name, which a creation error names. */
  readonly name: string;
} & (0 extends 1 & C["handle"]
  ? {
      /**
       * Required of the abstract base only, which lacks it, so that calling
       * a static member on the base does not compile.
       */
      readonly "the abstract Handle base wraps nothing": never;
    }
  : unknown);

/** A fresh Wrapper as the creation helper's `init` sees it: fields writable. */
type Initialising<C> = { -readonly [K in keyof C]: C[K] };

/**
 * The Handle base: every Wrapper extends it, directly or through another
 * Wrapper. It holds the registry (one Wrapper object per Handle), the
 * wrapping logic and the creation helper, and applies one error rule:
 * creation throws, lookup returns undefined.
 *
 * A Wrapper declares no public constructor. The base's protected constructor
 * takes the Handle and only stores it. A field set from a creation argument
 * (`Effect.attachWidget`, `GameCache.filename`) is a `readonly` field filled
 * through `expect`'s `init`, with no constructor; a Wrapper declares a
 * protected constructor taking the Handle and calling `super(handle)` only
 * for fields that need initialisers or other constructor work.
 *
 * Its lookups return `this.fromHandle(Native(...))`, typed `X | undefined`;
 * its creation members return `this.expect(Native(...), detail)`, typed `X`.
 * A member whose Native allocates another Wrapper's Handle calls that
 * Wrapper's protected `expect`: `return Point.expect(GetUnitLoc(this.handle))`.
 * An event lookup whose Native allocates a new Handle on each call, and
 * returns nothing outside its event (`Point.fromOrderPoint`), is a creation
 * typed `X | undefined`: it returns `this.fromAllocated(Native())`, which
 * returns undefined for nothing and otherwise counts and guards the Wrapper
 * as `expect` does.
 * Two exceptions to "lookups go through `fromHandle`":
 *
 * - The documented non-null path: `unit.getOwner()` and
 *   `MapPlayer.fromLocal()` read an existing Handle but assert an invariant
 *   the Typings cannot express (a live unit has an owner, `GetLocalPlayer`
 *   never returns nothing) through `expectFound`, so they are typed
 *   non-null and, should the game break the invariant, throw the standard
 *   message (`reforged-ts: failed to create MapPlayer`); being lookups, they
 *   skip the Dev-mode creation Guards and are not counted as creations.
 *   Each says why in its doc comment; no other lookup does this.
 * - `Frame` overrides `fromHandle`, because the game's "not found" frame has
 *   handle id 0.
 *
 * Naming rule: a Wrapper class is named after its Native type, capitalised
 * (`timer` is `Timer`, `unit` is `Unit`), unless that name collides with a
 * Native function; then it takes a descriptive noun instead (`rect` is
 * `Rectangle`, because `Rect` is a Native; `player` is `MapPlayer`, because
 * `Player` is one).
 * @example Wrapping a Handle a Native returned
 * {@includeCode ../../examples/harness/handle-from-handle.ts}
 * @typeParam T - The Native Handle type the Wrapper owns.
 * @native handle
 */
export abstract class Handle<T extends handle> {
  /**
   * The Handle this Wrapper owns, to pass to a Native the library does not
   * wrap.
   * @remarks
   * Do not keep it after `destroy()`: the game frees the object behind it.
   */
  public readonly handle: T;

  protected constructor(handle: T) {
    this.handle = handle;
  }

  /**
   * Gets the game's numeric id of the Handle.
   * @remarks
   * Ids are not recycled immediately when the object is destroyed (a new
   * Handle created right after gets the next id), and they are allocated
   * deterministically from map start. An id is never data: key a collection
   * on the Handle (or use `HandleMap` and `HandleSet`), never on its id.
   * @returns The id, unique among the live Handles.
   * @native GetHandleId
   */
  public get id() {
    return GetHandleId(this.handle);
  }

  /**
   * The release step, shared by every Wrapper: each `destroy()` calls its
   * Native, then this, and nothing else. It removes the registry entry for
   * the Handle, so a later lookup of the same Handle makes a new Wrapper
   * instead of returning this dead one, then notifies the collections
   * holding the Handle. With Dev mode off that is all: no other Native call
   * (the zero-cost definition of ADR 0007). It is the one place a
   * destroy-time Guard goes, behind one read of Dev mode; no Wrapper method
   * carries one. In Dev mode it reads the class name and the id first,
   * before anything else (the id is still readable after the Native), and,
   * after the collections were told, counts the Wrapper destroyed for
   * `Reforged.debug`, turns it into a tombstone (see `entomb`), and inside
   * `MapPlayer.runLocal` raises: a Handle freed on one client desyncs.
   */
  protected release(): void {
    const released: Released = { handle: this.handle };
    const name = configuration.devMode
      ? `${this.constructor.name}#${String(GetHandleId(released.handle))}`
      : undefined;
    registry.delete(released.handle);
    for (const listener of releaseListeners) {
      listener(released);
    }
    if (name !== undefined) {
      countDestroyed(released.handle);
      entomb(this, name);
      assertNotLocal(`destroying ${name}`, 3);
    }
  }

  /**
   * Gets the Wrapper for `handle`, making it on first use. The same Handle
   * always gives the same object; when the object cached for it is of a less
   * specific class than the one asked for (a `Timer` cached,
   * `MyTimer.fromHandle` asked), a new object of the class asked for replaces
   * it. `Unit.fromHandle(h)` is typed `Unit | undefined`.
   * @remarks
   * It creates no Handle, so none of the creation Guards of Dev mode apply:
   * wrap a Handle that Native code outside the library returned.
   * @typeParam C - The Wrapper of the class it is called on.
   * @param handle - A Handle of the class's Native type.
   * @returns The Wrapper, or `undefined` when `handle` is undefined.
   */
  public static fromHandle<C extends Handle<handle>>(
    this: WrapperClass<C>,
    handle: C["handle"] | undefined,
  ): C | undefined {
    return handle === undefined ? undefined : wrap(this, handle);
  }

  /**
   * The optional creation: the Wrapper for a Handle a Native has just
   * allocated, or undefined when it returned nothing, for an event lookup
   * that allocates (`GetOrderPointLoc` returns a new location on each call,
   * and nothing outside a point order). Nothing is not an error there, so it
   * does not throw as `expect` does; a Handle is a creation, so in Dev mode
   * it passes `expect`'s Guards and is counted created, with the same
   * tail-position rule: `return this.fromAllocated(GetOrderPointLoc())`.
   */
  protected static fromAllocated<C extends Handle<handle>>(
    this: WrapperClass<C>,
    handle: C["handle"] | undefined,
  ): C | undefined {
    if (handle === undefined) {
      return undefined;
    }
    return wrapExpected(this, handle, "", true);
  }

  /**
   * The creation helper: the Wrapper for the Handle a creation Native
   * returned, or an error when it returned nothing. The message is
   * `reforged-ts: failed to create <Wrapper> (<detail>)`, without the
   * parentheses when `detail` is empty; the detail is the identifying argument
   * (rawcode, frame name, model path).
   *
   * Call it in tail position, `return this.expect(Native(...), detail)`: the
   * error level is set for the tail call, which leaves no frame of the
   * creation member between the Map project's line and this helper, so the
   * error points at the line that called the creation member. Storing the
   * result first (`const x = this.expect(...); return x;`) points it one frame
   * off.
   *
   * `init` runs on the Wrapper before it is returned, with its fields
   * writable, for a Wrapper that keeps a creation argument in a field:
   * `return this.expect(QuestCreateItem(quest.handle), "", (item) => { item.quest = quest; })`.
   */
  protected static expect<C extends Handle<handle>>(
    this: WrapperClass<C>,
    handle: C["handle"] | undefined,
    detail = "",
    init?: (wrapper: Initialising<C>) => void,
  ): C {
    return wrapExpected(this, handle, detail, true, init);
  }

  /**
   * The documented non-null lookup: the Wrapper for a Handle the game
   * already had, read by a Native that the game guarantees returns one but
   * the Typings cannot express (`GetLocalPlayer`, `GetOwningPlayer` of a
   * live unit). It throws `expect`'s message when the Native returns
   * nothing, with the same tail-position rule, but it is a lookup: none of
   * the Dev-mode creation Guards apply (it passes before the globals Init
   * stage) and it is not counted as a creation.
   * `return MapPlayer.expectFound(GetOwningPlayer(this.handle))`.
   */
  protected static expectFound<C extends Handle<handle>>(
    this: WrapperClass<C>,
    handle: C["handle"] | undefined,
  ): C {
    return wrapExpected(this, handle, "", false);
  }
}

/**
 * Turns a destroyed Wrapper into a tombstone, in Dev mode: every field of
 * its own is cleared, the Handle included, and its metatable is replaced by
 * one that raises `reforged-ts: used after destroy: <name>` on index,
 * new-index and call and renders `<name> (destroyed)` through `tostring`.
 * typescript-to-lua keeps methods on the class prototype, which the old
 * metatable led to, and fields on the instance, so with both gone every
 * access, a second `destroy()` included, reaches the raising metamethod.
 * Level 2 names the line that made the access.
 */
function entomb(wrapper: Handle<handle>, name: string): void {
  const fields = wrapper as unknown as Record<string, unknown>;
  // Clearing the fields a traversal has already visited is allowed in Lua;
  // the order does not matter, every one is cleared.
  for (const [key] of pairs(fields)) {
    rawset(fields, key, undefined);
  }
  const message = `${LIBRARY}: used after destroy: ${name}`;
  // A block body, so `error` is not a tail call and level 2 is the access.
  const raise = () => {
    error(message, 2);
  };
  setmetatable(fields, {
    __index: raise,
    __newindex: raise,
    __call: raise,
    __tostring: () => `${name} (destroyed)`,
  });
}

/**
 * The creation helper for library code that is not a Wrapper and so cannot
 * call the protected `expect`: `Camera`, a static namespace, whose
 * `eyePoint` and `targetPoint` allocate a location. Same message, same
 * error level, same tail-position rule as `expect`:
 * `return expectWrapper(Point, GetCameraEyePositionLoc())`.
 *
 * Package-internal: `handles/index.ts` does not re-export it, so the
 * library's entry file does not reach it.
 * @param cls - The Wrapper class to wrap the Handle in.
 * @param handle - The Handle the creation Native returned.
 * @param detail - The identifying argument the message names; none when
 * left out.
 * @returns The Wrapper for `handle`.
 * @throws When `handle` is undefined:
 * `reforged-ts: failed to create <Wrapper> (<detail>)`, at the calling line.
 */
export function expectWrapper<C extends Handle<handle>>(
  cls: WrapperClass<C>,
  handle: C["handle"] | undefined,
  detail = "",
): C {
  return wrapExpected(cls, handle, detail, true);
}

/**
 * The creation check for a Handle the library does not wrap, such as the
 * `minimapicon` that `createMinimapIcon` returns: the Handle itself, or
 * `expect`'s message naming the Native type
 * (`reforged-ts: failed to create minimapicon (<detail>)`) when the Native
 * returned nothing. Same error level and tail-position rule as `expect`:
 * `return expectUnwrapped(CreateMinimapIconAtLoc(...), "minimapicon", pingPath)`.
 * The Dev-mode creation Guards and counts apply to Wrappers only, so none
 * runs here. Package-internal, like `expectWrapper`.
 * @param handle - The Handle the creation Native returned.
 * @param typeName - The Native type the message names.
 * @param detail - The identifying argument the message names; none when
 * left out.
 * @returns `handle`, known to be defined.
 * @throws When `handle` is undefined:
 * `reforged-ts: failed to create <typeName> (<detail>)`, at the calling line.
 */
export function expectUnwrapped<T extends handle>(
  handle: T | undefined,
  typeName: string,
  detail = "",
): T {
  if (handle === undefined) {
    const suffix = detail === "" ? "" : ` (${detail})`;
    error(`${LIBRARY}: failed to create ${typeName}${suffix}`, 2);
  }
  return handle;
}

/**
 * The creation step, shared by every Wrapper and the one place its errors
 * are raised: the Wrapper for `handle`, or the error naming `cls` and
 * `detail` when `handle` is undefined. Reached only through tail calls (from
 * `expect`, `expectFound`, `fromAllocated` or `expectWrapper`, themselves
 * tail-called by the
 * member), so level 2 names the frame that called the member.
 *
 * It is the one place a creation-time Guard goes, behind one read of Dev
 * mode; no Wrapper method carries one. In Dev mode, for a `creation` (not
 * the non-null lookup of `expectFound`): a creation before the globals Init
 * stage was entered raises, naming `Init.onGlobals` (a Handle created at
 * module top level runs before the game is set up, and desyncs), and so does
 * one inside `MapPlayer.runLocal` (a Handle id allocated on one client
 * desyncs); otherwise the Wrapper is counted created for `Reforged.debug`.
 */
function wrapExpected<C extends Handle<handle>>(
  cls: WrapperClass<C>,
  handle: C["handle"] | undefined,
  detail: string,
  creation: boolean,
  init?: (wrapper: Initialising<C>) => void,
): C {
  if (handle === undefined) {
    const suffix = detail === "" ? "" : ` (${detail})`;
    error(`${LIBRARY}: failed to create ${cls.name}${suffix}`, 2);
  }
  if (creation && configuration.devMode) {
    if (!hasRun("globals")) {
      error(
        `${LIBRARY}: ${cls.name} created before the globals Init stage: create Handles in Init.onGlobals or a later stage, not at module top level`,
        2,
      );
    }
    assertNotLocal(`creating a ${cls.name}`, 2);
    countCreated(cls.name, handle);
  }
  const wrapper = wrap(cls, handle);
  init?.(wrapper);
  return wrapper;
}

/**
 * Identity and upgrade, the one place a Wrapper object is made: the cached
 * object when it is an instance of `cls` (the same class or a subclass),
 * otherwise a new `cls` for the Handle, registered and returned. The cast
 * that calls the protected constructor is the only place that bypasses it.
 */
function wrap<C extends Handle<handle>>(
  cls: WrapperClass<C>,
  handle: C["handle"],
): C {
  const cached = registry.get(handle);
  if (cached instanceof (cls as unknown as abstract new () => C)) {
    return cached;
  }
  const wrapper = new (cls as unknown as new (handle: C["handle"]) => C)(
    handle,
  );
  registry.set(handle, wrapper);
  return wrapper;
}
