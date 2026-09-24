/** @noSelfInFile */

import { Handle } from "./handle";
import { Point } from "./point";
import { Rectangle } from "./rect";
import { Unit } from "./unit";

export class Region extends Handle<region> {
  /**
   * @deprecated use `Region.create` instead.
   */
  constructor() {
    if (Handle.initFromHandle()) {
      super();
      return;
    }
    const handle = CreateRegion();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- the Typings type this Native result non-null; creation and lookups get one error rule; step 3 (#51) removes it
    if (handle === undefined) {
      error("w3ts failed to create rect handle.", 3);
    }
    super(handle);
  }

  public static create(): Region {
    const handle = CreateRegion();
    const obj = this.getObject(handle) as Region;

    const values: Record<string, unknown> = {};
    values.handle = handle;

    return Object.assign(obj, values);
  }

  public addCell(x: number, y: number) {
    RegionAddCell(this.handle, x, y);
  }

  public addCellPoint(whichPoint: Point) {
    RegionAddCellAtLoc(this.handle, whichPoint.handle);
  }

  public addRect(r: Rectangle) {
    RegionAddRect(this.handle, r.handle);
  }

  public clearCell(x: number, y: number) {
    RegionClearCell(this.handle, x, y);
  }

  public clearCellPoint(whichPoint: Point) {
    RegionClearCellAtLoc(this.handle, whichPoint.handle);
  }

  public clearRect(r: Rectangle) {
    RegionClearRect(this.handle, r.handle);
  }

  public containsCoords(x: number, y: number) {
    return IsPointInRegion(this.handle, x, y);
  }

  public containsPoint(whichPoint: Point) {
    IsLocationInRegion(this.handle, whichPoint.handle);
  }

  public containsUnit(whichUnit: Unit) {
    return IsUnitInRegion(this.handle, whichUnit.handle);
  }

  public destroy() {
    RemoveRegion(this.handle);
  }

  public static fromEvent() {
    return this.fromHandle(GetTriggeringRegion());
  }

  public static fromHandle(handle: region | undefined): Region | undefined {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- getObject returns the registry's any; step 3 (#51) removes it
    return handle ? this.getObject(handle) : undefined;
  }
}
