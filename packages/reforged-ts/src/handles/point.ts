/** @noSelfInFile */

import { Handle } from "./handle";

export class Point extends Handle<location> {
  /**
   * Creates a new location handle. Generally, raw coordinates should be used instead.
   * @param x
   * @param y
   */
  public static create(x: number, y: number): Point {
    return this.expect(Location(x, y));
  }

  public get x(): number {
    return GetLocationX(this.handle);
  }

  public set x(value: number) {
    MoveLocation(this.handle, value, this.y);
  }

  public get y(): number {
    return GetLocationY(this.handle);
  }

  public set y(value: number) {
    MoveLocation(this.handle, this.x, value);
  }

  /**
   * This function is asynchronous. The values it returns are not guaranteed synchronous between each player.
   * If you attempt to use it in a synchronous manner, it may cause a desync.
   * @note Reasons for returning different values might be terrain-deformations caused by spells/abilities and different graphic settings.
   * Other reasons could be the rendering state of destructables and visibility differences.
   * @async
   */
  public get z(): number {
    return GetLocationZ(this.handle);
  }

  /**
   * Destroys the Point through its Native.
   * @remarks
   * In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
   * a second `destroy()` included, raises
   * `reforged-ts: used after destroy: <Class>#<id>`, and
   * `Reforged.debug.report()` counts it destroyed.
   */
  public destroy() {
    RemoveLocation(this.handle);
    this.release();
  }

  public setPosition(x: number, y: number) {
    MoveLocation(this.handle, x, y);
  }
}
