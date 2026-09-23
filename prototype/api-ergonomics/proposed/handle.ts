/** @noSelfInFile */
// PROTOTYPE: the new Handle base (design review P2 + P3 + registry class-awareness).
//
// Rules this sketch embodies:
//   1. A constructor only STORES the Handle. It never calls a creation Native.
//      Creating a game object is the job of a static `create` on the subclass.
//   2. One generic `fromHandle` on the base; no per-class copies; no `initHandle` trick.
//   3. Error mode: CREATION THROWS (typed non-null), LOOKUP RETURNS undefined.
//   4. The registry is class-aware: asking for a more specific Wrapper of a cached
//      Handle upgrades the entry instead of returning the less specific object.

/** One Wrapper per live Handle. Weak keys: no unregister needed on destroy. */
const registry = new WeakMap<handle, Handle<handle>>();

/** What a static factory needs to know about its class: the instance shape. */
type Class<C> = { readonly prototype: C };

export abstract class Handle<T extends handle> {
  public readonly handle: T;

  /** Stores the Handle. Subclasses inherit this and add nothing to it. */
  protected constructor(handle: T) {
    this.handle = handle;
  }

  /** The Handle's numeric id. Recycled by the game once the object is destroyed. */
  public get id(): number {
    return GetHandleId(this.handle);
  }

  /**
   * Lookup. `undefined` in, `undefined` out; otherwise the one Wrapper for this Handle.
   * `Unit.fromHandle(h)` is typed `Unit | undefined` without any per-class override.
   */
  public static fromHandle<C extends Handle<handle>>(
    this: Class<C>,
    handle: C["handle"] | undefined
  ): C | undefined {
    return handle === undefined ? undefined : wrap(this, handle);
  }

  /**
   * Creation-side helper: the Native returned nothing, so the caller's request was
   * invalid (bad rawcode, missing FDF). Throws with the caller as the error frame.
   */
  protected static expect<C extends Handle<handle>>(
    this: Class<C>,
    handle: C["handle"] | undefined,
    what: string
  ): C {
    if (handle === undefined) error(`reforged-ts: failed to create ${what}.`, 3);
    return wrap(this, handle);
  }
}

function wrap<C extends Handle<handle>>(cls: Class<C>, handle: C["handle"]): C {
  const cached = registry.get(handle);
  // Same class or a subclass of it: identity preserved.
  if (cached !== undefined && cached instanceof (cls as unknown as Function)) return cached as C;
  // Nothing cached, or a LESS specific Wrapper (Widget) cached for a Unit: (re)wrap.
  // Constructors are protected; this internal cast is the only place that bypasses it.
  const obj = new (cls as unknown as new (h: C["handle"]) => C)(handle);
  registry.set(handle, obj);
  return obj;
}
