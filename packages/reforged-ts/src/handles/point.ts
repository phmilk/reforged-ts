/** @noSelfInFile */

import { expectUnwrapped, Handle } from "./handle";

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
   * @remarks Reasons for returning different values might be terrain-deformations caused by spells/abilities and different graphic settings.
   * Other reasons could be the rendering state of destructables and visibility differences.
   * @async
   */
  public get z(): number {
    return GetLocationZ(this.handle);
  }

  /**
   * Creates a minimap icon at the location, through `CreateMinimapIconAtLoc`,
   * and returns the game's `minimapicon`, which the library does not wrap.
   * Throws `reforged-ts: failed to create minimapicon (<pingPath>)` when the
   * game creates none.
   * @param red An integer from 0-255 determining the amount of red color.
   * @param green An integer from 0-255 determining the amount of green color.
   * @param blue An integer from 0-255 determining the amount of blue color.
   * @param pingPath The model of the icon.
   * @param fogVisibility The fog state in which the icon is visible.
   */
  public createMinimapIcon(
    red: number,
    green: number,
    blue: number,
    pingPath: string,
    fogVisibility: fogstate,
  ): minimapicon {
    return expectUnwrapped(
      CreateMinimapIconAtLoc(
        this.handle,
        red,
        green,
        blue,
        pingPath,
        fogVisibility,
      ),
      "minimapicon",
      pingPath,
    );
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

  /**
   * The mouse position of a player mouse event, or undefined outside one,
   * through `BlzGetTriggerPlayerMousePosition`. The Native takes no handle
   * and returns a location, so `Point` owns it through the coverage rule's
   * creation exception, and the game allocates a new location on each call;
   * the member is typed `| undefined` rather than throwing, because outside
   * the event the game has nothing to give.
   * @remarks Each call returns a new Point for a new location, and nothing
   * destroys it for you: `destroy()` it. Dev mode counts it as created and,
   * inside `MapPlayer.runLocal`, raises as for any creation.
   */
  public static fromMousePosition(): Point | undefined {
    return this.fromAllocated(BlzGetTriggerPlayerMousePosition());
  }

  /**
   * The target point of a point order, or undefined outside one, through
   * `GetOrderPointLoc`. The Native takes no handle and returns a location, so
   * `Point` owns it through the coverage rule's creation exception, and the
   * game allocates a new location on each call; the member is typed
   * `| undefined` rather than throwing, because outside a point order the
   * game has nothing to give.
   * @remarks Each call returns a new Point for a new location, and nothing
   * destroys it for you: `destroy()` it. Dev mode counts it as created and,
   * inside `MapPlayer.runLocal`, raises as for any creation.
   */
  public static fromOrderPoint(): Point | undefined {
    return this.fromAllocated(GetOrderPointLoc());
  }

  /**
   * The spell's target point, or undefined when the spell targets none,
   * through `GetSpellTargetLoc`. The Native takes no handle and returns a
   * location, so `Point` owns it through the coverage rule's creation
   * exception, and the game allocates a new location on each call; the
   * member is typed `| undefined` rather than throwing, because a spell
   * without a target point gives nothing.
   * @remarks Each call returns a new Point for a new location, and nothing
   * destroys it for you: `destroy()` it. Dev mode counts it as created and,
   * inside `MapPlayer.runLocal`, raises as for any creation.
   */
  public static fromSpellTarget(): Point | undefined {
    return this.fromAllocated(GetSpellTargetLoc());
  }
}
