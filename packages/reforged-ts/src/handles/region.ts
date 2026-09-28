/** @noSelfInFile */

import { Handle } from "./handle";
import { Point } from "./point";
import { Rectangle } from "./rect";
import { Unit } from "./unit";

/**
 * An area of the map made of 32-by-32 cells, of any shape: what the enter
 * and leave events of `RegionEvents` watch.
 * @remarks
 * A Rectangle is only a shape; to watch units cross one, add it to a Region
 * with `addRect`.
 * @example Watching units enter an area
 * {@includeCode ../../examples/game/region-enter.ts}
 * @native region
 */
export class Region extends Handle<region> {
  /**
   * Creates a region that holds no cell yet.
   * @remarks
   * The error message names the Region. In w3ts 3.x it read
   * `w3ts failed to create rect handle.`, naming the wrong Handle type.
   * @returns The new region.
   * @throws When the game returns no handle:
   * `reforged-ts: failed to create Region`, at the calling line. In Dev
   * mode, also when called before the globals Init stage or inside
   * `MapPlayer.runLocal`.
   * @native CreateRegion
   */
  public static create(): Region {
    return this.expect(CreateRegion());
  }

  /**
   * Adds the cell holding the given coordinates to the region.
   * @remarks
   * Cells form a grid of squares 32 world units wide, whose lines lie on
   * the multiples of 32: the point (70, 10) is in the cell from (64, 0) to
   * (96, 32).
   * @param x - An x-coordinate inside the cell, in world units.
   * @param y - A y-coordinate inside the cell, in world units.
   * @native RegionAddCell
   */
  public addCell(x: number, y: number) {
    RegionAddCell(this.handle, x, y);
  }

  /**
   * Adds the cell holding a Point to the region.
   * @remarks
   * Cells form a grid of squares 32 world units wide, whose lines lie on
   * the multiples of 32: the point (70, 10) is in the cell from (64, 0) to
   * (96, 32).
   * @param whichPoint - A point inside the cell.
   * @native RegionAddCellAtLoc
   */
  public addCellPoint(whichPoint: Point) {
    RegionAddCellAtLoc(this.handle, whichPoint.handle);
  }

  /**
   * Adds the cells a Rectangle covers to the region.
   * @param r - The area to add.
   * @native RegionAddRect
   */
  public addRect(r: Rectangle) {
    RegionAddRect(this.handle, r.handle);
  }

  /**
   * Removes the cell holding the given coordinates from the region.
   * @remarks
   * Cells form a grid of squares 32 world units wide, whose lines lie on
   * the multiples of 32: the point (70, 10) is in the cell from (64, 0) to
   * (96, 32).
   * @param x - An x-coordinate inside the cell, in world units.
   * @param y - A y-coordinate inside the cell, in world units.
   * @native RegionClearCell
   */
  public clearCell(x: number, y: number) {
    RegionClearCell(this.handle, x, y);
  }

  /**
   * Removes the cell holding a Point from the region.
   * @remarks
   * Cells form a grid of squares 32 world units wide, whose lines lie on
   * the multiples of 32: the point (70, 10) is in the cell from (64, 0) to
   * (96, 32).
   * @param whichPoint - A point inside the cell.
   * @native RegionClearCellAtLoc
   */
  public clearCellPoint(whichPoint: Point) {
    RegionClearCellAtLoc(this.handle, whichPoint.handle);
  }

  /**
   * Removes the cells a Rectangle covers from the region.
   * @param r - The area to remove.
   * @native RegionClearRect
   */
  public clearRect(r: Rectangle) {
    RegionClearRect(this.handle, r.handle);
  }

  /**
   * Tests whether the cell holding the given coordinates is in the region.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @returns True when the region holds the cell.
   * @native IsPointInRegion
   */
  public containsCoords(x: number, y: number) {
    return IsPointInRegion(this.handle, x, y);
  }

  /**
   * Asks the game whether the cell holding a Point is in the region, and
   * discards the answer.
   * @remarks
   * The method does not return the Native's result: it returns nothing. Use
   * `containsCoords(whichPoint.x, whichPoint.y)` to get the answer.
   * @param whichPoint - The point to test.
   * @native IsLocationInRegion
   */
  public containsPoint(whichPoint: Point) {
    IsLocationInRegion(this.handle, whichPoint.handle);
  }

  /**
   * Tests whether a unit stands in the region.
   * @remarks
   * Only the unit's origin counts, not its collision size.
   * @param whichUnit - The unit to test.
   * @returns True when the unit's position is in one of the region's cells.
   * @native IsUnitInRegion
   */
  public containsUnit(whichUnit: Unit) {
    return IsUnitInRegion(this.handle, whichUnit.handle);
  }

  /**
   * Destroys the Region through its Native.
   * @remarks
   * In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
   * a second `destroy()` included, raises
   * `reforged-ts: used after destroy: <Class>#<id>`, and
   * `Reforged.debug.report()` counts it destroyed.
   * @throws In Dev mode, when called inside `MapPlayer.runLocal`: a Handle
   * freed on one client desyncs the game.
   * @native RemoveRegion
   */
  public destroy() {
    RemoveRegion(this.handle);
    this.release();
  }

  /**
   * Gets the region of the enter or leave event being handled.
   * @returns The region the unit crossed, or `undefined` outside a region
   * event.
   * @native GetTriggeringRegion
   */
  public static fromEvent(): Region | undefined {
    return this.fromHandle(GetTriggeringRegion());
  }
}
