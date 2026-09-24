/** @noSelfInFile */

import { HandleBase } from "./handle";
import { Point } from "./point";

export class Rectangle extends HandleBase<rect> {
  public static create(
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
  ): Rectangle {
    return this.expect(Rect(minX, minY, maxX, maxY));
  }

  public get centerX() {
    return GetRectCenterX(this.handle);
  }

  public get centerY() {
    return GetRectCenterY(this.handle);
  }

  public get maxX() {
    return GetRectMaxX(this.handle);
  }

  public get maxY() {
    return GetRectMaxY(this.handle);
  }

  public get minX() {
    return GetRectMinX(this.handle);
  }

  public get minY() {
    return GetRectMinY(this.handle);
  }

  public destroy() {
    RemoveRect(this.handle);
  }

  public enumDestructables(
    filter: boolexpr | (() => boolean),
    actionFunc: () => void,
  ) {
    EnumDestructablesInRect(
      this.handle,
      typeof filter === "function" ? Filter(filter) : filter,
      actionFunc,
    );
  }

  public enumItems(filter: boolexpr | (() => boolean), actionFunc: () => void) {
    EnumItemsInRect(
      this.handle,
      typeof filter === "function" ? Filter(filter) : filter,
      actionFunc,
    );
  }

  public move(newCenterX: number, newCenterY: number) {
    MoveRectTo(this.handle, newCenterX, newCenterY);
  }

  public movePoint(newCenterPoint: Point) {
    MoveRectToLoc(this.handle, newCenterPoint.handle);
  }

  public setRect(minX: number, minY: number, maxX: number, maxY: number) {
    SetRect(this.handle, minX, minY, maxX, maxY);
  }

  public setRectFromPoint(min: Point, max: Point) {
    SetRectFromLoc(this.handle, min.handle, max.handle);
  }

  public static fromPoint(min: Point, max: Point): Rectangle {
    return this.expect(RectFromLoc(min.handle, max.handle));
  }

  // Returns full map bounds, including unplayable borders, in world coordinates
  public static getWorldBounds(): Rectangle {
    return this.expect(GetWorldBounds());
  }
}
