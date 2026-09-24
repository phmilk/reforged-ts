/** @noSelfInFile */

/** The registry: the one Wrapper object for each Handle. */
const registry = new WeakMap<handle, Handle<handle>>();

/**
 * A Wrapper class as its static members see it: `this` inside a static. The
 * abstract base itself is not one: `typeof Handle` has a `Handle<any>`
 * prototype, and `0 extends 1 & H` holds only when `H` is `any`, so
 * `Handle.fromHandle(h)` asks for a property `typeof Handle` lacks and does
 * not compile. Package-internal: `handles/index.ts` re-exports only `Handle`.
 */
export type WrapperClass<C extends Handle<handle>> = {
  readonly prototype: C;
  readonly name: string;
} & (0 extends 1 & C["handle"]
  ? { readonly "the abstract Handle base wraps nothing": never }
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
 * takes the Handle and only stores it; a Wrapper that adds fields declares a
 * protected constructor taking the Handle and calling `super(handle)`,
 * otherwise none. Its lookups return `this.fromHandle(Native(...))`, typed
 * `X | undefined`; its creation members return
 * `this.expect(Native(...), detail)`, typed `X`. It never overrides
 * `fromHandle`, except `Frame`, whose "not found" frame has handle id 0.
 *
 * Naming rule: a Wrapper class is named after its Native type, capitalised
 * (`timer` is `Timer`, `unit` is `Unit`), unless that name collides with a
 * Native function; then it takes a descriptive noun instead (`rect` is
 * `Rectangle`, because `Rect` is a Native; `player` is `MapPlayer`, because
 * `Player` is one).
 */
export abstract class Handle<T extends handle> {
  public readonly handle: T;

  protected constructor(handle: T) {
    this.handle = handle;
  }

  /**
   * Get the unique ID of the handle. IDs are not recycled immediately when
   * the object is destroyed (a new Handle created right after gets the next
   * ID), and they are allocated deterministically from map start.
   * @returns The unique ID of a handle object.
   */
  public get id() {
    return GetHandleId(this.handle);
  }

  /**
   * The Wrapper for `handle`, or undefined for an undefined Handle. The same
   * Handle always gives the same object; when the object cached for it is of
   * a less specific class than the one asked for (a `Timer` cached,
   * `MyTimer.fromHandle` asked), a new object of the class asked for replaces
   * it. `Unit.fromHandle(h)` is typed `Unit | undefined`.
   */
  public static fromHandle<C extends Handle<handle>>(
    this: WrapperClass<C>,
    handle: C["handle"] | undefined,
  ): C | undefined {
    return handle === undefined ? undefined : wrap(this, handle);
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
    return created(this, handle, detail, init);
  }
}

/**
 * The creation helper for library code that is not a Wrapper and so cannot
 * call the protected `expect`: `Camera`, a static namespace, whose
 * `eyePoint` and `targetPoint` allocate a location. Same message, same
 * error level, same tail-position rule as `expect`:
 * `return expectWrapper(Point, GetCameraEyePositionLoc())`.
 *
 * Package-internal: `handles/index.ts` re-exports only `Handle` from this
 * module, so the library's entry file does not reach it.
 */
export function expectWrapper<C extends Handle<handle>>(
  cls: WrapperClass<C>,
  handle: C["handle"] | undefined,
  detail = "",
): C {
  return created(cls, handle, detail);
}

/**
 * Creation, the one place its error is raised: the Wrapper for `handle`, or
 * the error naming `cls` and `detail` when `handle` is undefined. Reached
 * only through tail calls (from `expect` or `expectWrapper`, themselves
 * tail-called by the creation member), so level 2 names the frame that
 * called the creation member.
 */
function created<C extends Handle<handle>>(
  cls: WrapperClass<C>,
  handle: C["handle"] | undefined,
  detail: string,
  init?: (wrapper: Initialising<C>) => void,
): C {
  if (handle === undefined) {
    const suffix = detail === "" ? "" : ` (${detail})`;
    error(`reforged-ts: failed to create ${cls.name}${suffix}`, 2);
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
