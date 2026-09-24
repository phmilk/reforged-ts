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
