/** @noSelfInFile */

import { expectUnwrapped, Handle } from "./handle";

/**
 * A point of the map, for the Natives that take or return a location rather
 * than coordinates.
 * @remarks
 * - Named `Point` because the Native type name, `location`, collides with the
 *   Native function `Location`.
 * - Most Natives take raw coordinates, which allocate nothing: use a Point
 *   only where a Native needs one. Every Point is a Handle the game keeps
 *   until `destroy()`, including the ones an event lookup such as
 *   `fromSpellTarget` returns.
 * @example A spell's target point, read and freed
 * {@includeCode ../../examples/harness/point-spell-target.ts}
 * @native location
 */
export class Point extends Handle<location> {
  /**
   * Creates a point at the given coordinates.
   * @remarks
   * - Prefer raw coordinates where a Native takes them: a Point is kept until
   *   `destroy()`.
   * - The error message names the Point. In w3ts 3.x it read
   *   `w3ts failed to create player handle.`, naming the wrong Handle type.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @returns The new point.
   * @throws When the game returns no handle:
   * `reforged-ts: failed to create Point`, at the calling line. In Dev mode,
   * also when called before the globals Init stage or inside
   * `MapPlayer.runLocal`.
   * @native Location
   */
  public static create(x: number, y: number): Point {
    return this.expect(Location(x, y));
  }

  /**
   * Gets the point's x-coordinate.
   * @returns The x-coordinate, in world units.
   * @native GetLocationX
   */
  public get x(): number {
    return GetLocationX(this.handle);
  }

  /**
   * The point's x-coordinate, in world units; the y-coordinate stays.
   * @native MoveLocation
   * @native GetLocationY
   */
  public set x(value: number) {
    MoveLocation(this.handle, value, this.y);
  }

  /**
   * Gets the point's y-coordinate.
   * @returns The y-coordinate, in world units.
   * @native GetLocationY
   */
  public get y(): number {
    return GetLocationY(this.handle);
  }

  /**
   * The point's y-coordinate, in world units; the x-coordinate stays.
   * @native MoveLocation
   * @native GetLocationX
   */
  public set y(value: number) {
    MoveLocation(this.handle, this.x, value);
  }

  /**
   * Gets the height of the terrain at the point.
   * @remarks
   * The value can differ between clients: never let it decide game state.
   * Terrain deformed by spells or abilities, the graphics settings, whether
   * destructables are rendered, and what each client sees can all change the
   * value.
   * @example Placing visuals from local heights
   * {@includeCode ../../examples/harness/local-heights.ts}
   * @returns The terrain height, in world units.
   * @native GetLocationZ
   * @async
   */
  public get z(): number {
    return GetLocationZ(this.handle);
  }

  /**
   * Creates a minimap icon at the point.
   * @remarks
   * The library does not wrap the `minimapicon` Native type: pass the result
   * to its Natives, such as `DestroyMinimapIcon`.
   * @param red - The red channel, from 0 to 255.
   * @param green - The green channel, from 0 to 255.
   * @param blue - The blue channel, from 0 to 255.
   * @param pingPath - The model of the icon.
   * @param fogVisibility - The fog state in which the icon is visible.
   * @returns The game's new minimap icon.
   * @throws When the game returns no handle, for example a missing model:
   * `reforged-ts: failed to create minimapicon (<pingPath>)`, at the calling line.
   * @native CreateMinimapIconAtLoc
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
   * @example Handles made for one computation
   * {@includeCode ../../examples/game/destroy-scratch.ts}
   * @throws In Dev mode, when called inside `MapPlayer.runLocal`: a Handle
   * freed on one client desyncs the game.
   * @native RemoveLocation
   */
  public destroy() {
    RemoveLocation(this.handle);
    this.release();
  }

  /**
   * Moves the point to the given coordinates.
   * @param x - The new x-coordinate, in world units.
   * @param y - The new y-coordinate, in world units.
   * @native MoveLocation
   */
  public setPosition(x: number, y: number) {
    MoveLocation(this.handle, x, y);
  }

  /**
   * Gets the mouse position of the player mouse event being handled.
   * @remarks
   * The Native takes no handle and returns a location, so `Point` owns it
   * through the coverage rule's creation exception, and the game allocates a
   * new location on each call: each call returns a new Point, and nothing
   * destroys it for you, so `destroy()` it. Dev mode counts it as created
   * and, inside `MapPlayer.runLocal`, raises as for any creation. It returns
   * `undefined` rather than throwing, because outside the event the game has
   * nothing to give.
   * @returns A new point at the mouse position, or `undefined` outside a
   * player mouse event.
   * @throws In Dev mode, when called inside `MapPlayer.runLocal`, as any
   * creation does.
   * @native BlzGetTriggerPlayerMousePosition
   */
  public static fromMousePosition(): Point | undefined {
    return this.fromAllocated(BlzGetTriggerPlayerMousePosition());
  }

  /**
   * Gets the target point of the point order being issued.
   * @remarks
   * The Native takes no handle and returns a location, so `Point` owns it
   * through the coverage rule's creation exception, and the game allocates a
   * new location on each call: each call returns a new Point, and nothing
   * destroys it for you, so `destroy()` it. Dev mode counts it as created
   * and, inside `MapPlayer.runLocal`, raises as for any creation. It returns
   * `undefined` rather than throwing, because outside a point order the game
   * has nothing to give.
   * @returns A new point at the order's target, or `undefined` outside a
   * point order.
   * @throws In Dev mode, when called inside `MapPlayer.runLocal`, as any
   * creation does.
   * @native GetOrderPointLoc
   */
  public static fromOrderPoint(): Point | undefined {
    return this.fromAllocated(GetOrderPointLoc());
  }

  /**
   * Gets the target point of the spell event being handled.
   * @remarks
   * The Native takes no handle and returns a location, so `Point` owns it
   * through the coverage rule's creation exception, and the game allocates a
   * new location on each call: each call returns a new Point, and nothing
   * destroys it for you, so `destroy()` it. Dev mode counts it as created
   * and, inside `MapPlayer.runLocal`, raises as for any creation. It returns
   * `undefined` rather than throwing, because a spell without a target point
   * gives nothing.
   * @returns A new point at the spell's target, or `undefined` outside a
   * spell event or when the spell targets no point.
   * @throws In Dev mode, when called inside `MapPlayer.runLocal`, as any
   * creation does.
   * @native GetSpellTargetLoc
   */
  public static fromSpellTarget(): Point | undefined {
    return this.fromAllocated(GetSpellTargetLoc());
  }
}
