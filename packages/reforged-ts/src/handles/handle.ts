/** @noSelfInFile */

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the registry holds any; step 3 (#51) removes it
const map: WeakMap<handle, any> = new WeakMap<handle>();

export class Handle<T extends handle> {
  public readonly handle: T;

  private static initHandle: handle | undefined;

  protected constructor(handle?: T) {
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- the rewrite changes the emitted Lua; step 3 (#51) removes it
    this.handle = handle === undefined ? (Handle.initHandle as T) : handle;
    map.set(this.handle, this);
  }

  /**
   * Get the unique ID of the handle. The ID is recycled once you destroy the object.
   * @returns The unique ID of a handle object.
   */
  public get id() {
    return GetHandleId(this.handle);
  }

  protected static initFromHandle(): boolean {
    return Handle.initHandle !== undefined;
  }

  protected static getObject(handle: handle) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- the registry holds any; step 3 (#51) removes it
    const obj = map.get(handle);
    if (obj !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- getObject returns the registry's any; step 3 (#51) removes it
      return obj;
    }
    Handle.initHandle = handle;
    const newObj = new this();
    Handle.initHandle = undefined;
    return newObj;
  }
}

/** A Wrapper class as its static members see it: `this` inside a static. */
interface WrapperClass<C> {
  readonly prototype: C;
  readonly name: string;
}

/** A fresh Wrapper as the creation helper's `init` sees it: fields writable. */
type Initialising<C> = { -readonly [K in keyof C]: C[K] };

/**
 * The Handle base the Wrappers move onto during build step 3 (#51): creation
 * throws, lookup returns undefined, and one Wrapper object per Handle.
 *
 * A Wrapper on this base declares no public constructor (a protected one
 * taking the Handle and calling `super`, only if it adds fields). Its lookups
 * return `this.fromHandle(Native(...))`, typed `X | undefined`; its creation
 * members return `this.expect(Native(...), detail)`, typed `X`. It never calls
 * `getObject` and never overrides `fromHandle`.
 *
 * It extends the old `Handle` only while the Wrappers still on the old path
 * (`getObject` and the `initHandle` slot) override `fromHandle` with their own
 * signatures, which a generic `fromHandle` on `Handle` itself would reject;
 * the two share one registry. When every Wrapper is on this base, #81 folds
 * it into `Handle` and deletes the old path.
 */
export abstract class HandleBase<T extends handle> extends Handle<T> {
  protected constructor(handle: T) {
    super(handle);
  }

  /**
   * The Wrapper for `handle`, or undefined for an undefined Handle. The same
   * Handle always gives the same object; when the object cached for it is of
   * a less specific class than the one asked for (a `Timer` cached,
   * `MyTimer.fromHandle` asked), a new object of the class asked for replaces
   * it. `Unit.fromHandle(h)` is typed `Unit | undefined`.
   */
  public static fromHandle<C extends HandleBase<handle>>(
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
  protected static expect<C extends HandleBase<handle>>(
    this: WrapperClass<C>,
    handle: C["handle"] | undefined,
    detail = "",
    init?: (wrapper: Initialising<C>) => void,
  ): C {
    if (handle === undefined) {
      const suffix = detail === "" ? "" : ` (${detail})`;
      error(`reforged-ts: failed to create ${this.name}${suffix}`, 2);
    }
    const wrapper = wrap(this, handle);
    init?.(wrapper);
    return wrapper;
  }
}

/**
 * Identity and upgrade, the one place a Wrapper object is made: the cached
 * object when it is an instance of `cls` (the same class or a subclass),
 * otherwise a new `cls` for the Handle, registered and returned. The cast
 * that calls the protected constructor is the only place that bypasses it.
 */
function wrap<C extends HandleBase<handle>>(
  cls: WrapperClass<C>,
  handle: C["handle"],
): C {
  const cached: unknown = map.get(handle);
  if (cached instanceof (cls as unknown as abstract new () => C)) {
    return cached;
  }
  const wrapper = new (cls as unknown as new (handle: C["handle"]) => C)(
    handle,
  );
  map.set(handle, wrapper);
  return wrapper;
}
