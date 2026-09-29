/** @noSelfInFile */

import { protect } from "../reforged/protect";
import { filterOf } from "./boolexpr";
import { Handle } from "./handle";
import { Point } from "./point";

/**
 * A rectangular area of the map, aligned with its axes.
 * @remarks
 * Named `Rectangle` because the Native type name, `rect`, collides with the
 * Native function `Rect`.
 * @example Enumerating the units and items inside
 * {@includeCode ../../examples/harness/rectangle-enum.ts}
 * @native rect
 */
export class Rectangle extends Handle<rect> {
  /**
   * Creates a rectangle from its minimum and maximum coordinates.
   * @remarks
   * The game keeps the bounds inside the map's; a rectangle cannot match the
   * world bounds exactly, its maximum coordinates staying 32 short of them.
   * @param minX - The left edge's x-coordinate, in world units.
   * @param minY - The bottom edge's y-coordinate, in world units.
   * @param maxX - The right edge's x-coordinate, in world units.
   * @param maxY - The top edge's y-coordinate, in world units.
   * @returns The new rectangle.
   * @throws When the game returns no handle:
   * `reforged-ts: failed to create Rectangle`, at the calling line. In Dev
   * mode, also when called before the globals Init stage or inside
   * `MapPlayer.runLocal`.
   * @native Rect
   */
  public static create(
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
  ): Rectangle {
    return this.expect(Rect(minX, minY, maxX, maxY));
  }

  /**
   * Gets the x-coordinate of the rectangle's center.
   * @returns The x-coordinate, in world units.
   * @native GetRectCenterX
   */
  public get centerX() {
    return GetRectCenterX(this.handle);
  }

  /**
   * Gets the y-coordinate of the rectangle's center.
   * @returns The y-coordinate, in world units.
   * @native GetRectCenterY
   */
  public get centerY() {
    return GetRectCenterY(this.handle);
  }

  /**
   * Gets the x-coordinate of the rectangle's right edge.
   * @returns The x-coordinate, in world units.
   * @native GetRectMaxX
   */
  public get maxX() {
    return GetRectMaxX(this.handle);
  }

  /**
   * Gets the y-coordinate of the rectangle's top edge.
   * @returns The y-coordinate, in world units.
   * @native GetRectMaxY
   */
  public get maxY() {
    return GetRectMaxY(this.handle);
  }

  /**
   * Gets the x-coordinate of the rectangle's left edge.
   * @returns The x-coordinate, in world units.
   * @native GetRectMinX
   */
  public get minX() {
    return GetRectMinX(this.handle);
  }

  /**
   * Gets the y-coordinate of the rectangle's bottom edge.
   * @returns The y-coordinate, in world units.
   * @native GetRectMinY
   */
  public get minY() {
    return GetRectMinY(this.handle);
  }

  /**
   * Makes the rect a camera blocker, through `AddCameraBlocker` (3.0.0).
   * @native AddCameraBlocker
   */
  public addCameraBlocker() {
    AddCameraBlocker(this.handle);
  }

  /**
   * Destroys the Rectangle through its Native.
   * @remarks
   * In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
   * a second `destroy()` included, raises
   * `reforged-ts: used after destroy: <Class>#<id>`, and
   * `Reforged.debug.report()` counts it destroyed.
   * @example Handles made for one computation
   * {@includeCode ../../examples/game/destroy-scratch.ts}
   * @throws In Dev mode, when called inside `MapPlayer.runLocal`: a Handle
   * freed on one client desyncs the game.
   * @native RemoveRect
   */
  public destroy() {
    RemoveRect(this.handle);
    this.release();
  }

  /**
   * Turns the rect's camera blocker on or off, through `EnableCameraBlocker`
   * (3.0.0).
   * @param flag - True to turn it on, false to turn it off.
   * @native EnableCameraBlocker
   */
  public enableCameraBlocker(flag: boolean) {
    EnableCameraBlocker(this.handle, flag);
  }

  /**
   * Runs `actionFunc` once for each destructable inside the rectangle that
   * `filter` keeps.
   * @remarks
   * In Dev mode each function runs under `pcall`: a call that throws is
   * reported and the enumeration continues with the next destructable.
   * @param filter - Keeps a destructable when it returns true; inside it,
   * `Destructable.fromFilter()` gives the destructable. A plain function is
   * wrapped in a `Filter` for the call.
   * @param actionFunc - Runs once per destructable kept, before the method
   * returns; inside it, `Destructable.fromEnum()` gives the destructable.
   * @native EnumDestructablesInRect
   * @native Filter
   */
  public enumDestructables(
    filter: boolexpr | (() => boolean),
    actionFunc: () => void,
  ) {
    EnumDestructablesInRect(
      this.handle,
      filterOf(this, "Rectangle.enumDestructables", filter),
      protect(this, "Rectangle.enumDestructables", actionFunc),
    );
  }

  /**
   * Runs `actionFunc` once for each item inside the rectangle that `filter`
   * keeps.
   * @remarks
   * In Dev mode each function runs under `pcall`: a call that throws is
   * reported and the enumeration continues with the next item.
   * @param filter - Keeps an item when it returns true; inside it,
   * `Item.fromFilter()` gives the item. A plain function is wrapped in a
   * `Filter` for the call.
   * @param actionFunc - Runs once per item kept, before the method returns;
   * inside it, `Item.fromEnum()` gives the item.
   * @native EnumItemsInRect
   * @native Filter
   */
  public enumItems(filter: boolexpr | (() => boolean), actionFunc: () => void) {
    EnumItemsInRect(
      this.handle,
      filterOf(this, "Rectangle.enumItems", filter),
      protect(this, "Rectangle.enumItems", actionFunc),
    );
  }

  /**
   * Moves the rectangle, keeping its size, so that it is centered on the
   * given coordinates.
   * @remarks
   * Unlike `setRect`, it does not keep the rectangle inside the map's
   * bounds.
   * @param newCenterX - The new center's x-coordinate, in world units.
   * @param newCenterY - The new center's y-coordinate, in world units.
   * @native MoveRectTo
   */
  public move(newCenterX: number, newCenterY: number) {
    MoveRectTo(this.handle, newCenterX, newCenterY);
  }

  /**
   * Moves the rectangle, keeping its size, so that it is centered on a
   * Point.
   * @param newCenterPoint - The Point the rectangle's center moves to.
   * @native MoveRectToLoc
   */
  public movePoint(newCenterPoint: Point) {
    MoveRectToLoc(this.handle, newCenterPoint.handle);
  }

  /**
   * Sets the animation of every doodad of type `doodadId` in the rect,
   * through `SetDoodadAnimationRect`.
   * @param doodadId - The doodad type's rawcode, such as `FourCC("LTlt")`.
   * @param animName - The animation's name, such as `"death"`.
   * @param animRandom - Plays a random animation of that name.
   * @native SetDoodadAnimationRect
   */
  public setDoodadAnimation(
    doodadId: number,
    animName: string,
    animRandom: boolean,
  ) {
    SetDoodadAnimationRect(this.handle, doodadId, animName, animRandom);
  }

  /**
   * Sets the player color of every doodad of type `doodadId` in the rect,
   * through `SetDoodadColorRect` (3.0.0).
   * @param doodadId - The doodad type's rawcode, such as `FourCC("LTlt")`.
   * @param color - The player colour to tint them with.
   * @native SetDoodadColorRect
   */
  public setDoodadColor(doodadId: number, color: playercolor) {
    SetDoodadColorRect(this.handle, doodadId, color);
  }

  /**
   * Moves the rectangle's edges to the given coordinates.
   * @remarks
   * The game keeps the bounds inside the map's; a rectangle cannot match the
   * world bounds exactly, its maximum coordinates staying 32 short of them.
   * @param minX - The left edge's x-coordinate, in world units.
   * @param minY - The bottom edge's y-coordinate, in world units.
   * @param maxX - The right edge's x-coordinate, in world units.
   * @param maxY - The top edge's y-coordinate, in world units.
   * @native SetRect
   */
  public setRect(minX: number, minY: number, maxX: number, maxY: number) {
    SetRect(this.handle, minX, minY, maxX, maxY);
  }

  /**
   * Moves the rectangle's corners to two Points.
   * @remarks
   * The game keeps the bounds inside the map's; a rectangle cannot match the
   * world bounds exactly, its maximum coordinates staying 32 short of them.
   * @param min - The bottom-left corner.
   * @param max - The top-right corner.
   * @native SetRectFromLoc
   */
  public setRectFromPoint(min: Point, max: Point) {
    SetRectFromLoc(this.handle, min.handle, max.handle);
  }

  /**
   * Creates a rectangle from two Points, its corners.
   * @remarks
   * The game keeps the bounds inside the map's; a rectangle cannot match the
   * world bounds exactly, its maximum coordinates staying 32 short of them.
   * @param min - The bottom-left corner.
   * @param max - The top-right corner.
   * @returns The new rectangle.
   * @throws When the game returns no handle:
   * `reforged-ts: failed to create Rectangle`, at the calling line. In Dev
   * mode, also when called before the globals Init stage or inside
   * `MapPlayer.runLocal`.
   * @native RectFromLoc
   */
  public static fromPoint(min: Point, max: Point): Rectangle {
    return this.expect(RectFromLoc(min.handle, max.handle));
  }

  /**
   * Creates a rectangle spanning the whole map, its unplayable borders
   * included.
   * @remarks
   * The game allocates a new rect on each call: `destroy()` the result when
   * done with it.
   * @returns The new rectangle.
   * @throws When the game returns no handle:
   * `reforged-ts: failed to create Rectangle`, at the calling line. In Dev
   * mode, also when called before the globals Init stage or inside
   * `MapPlayer.runLocal`.
   * @native GetWorldBounds
   */
  public static getWorldBounds(): Rectangle {
    return this.expect(GetWorldBounds());
  }
}
