/** @noSelfInFile */

import { protect } from "../reforged/protect";
import { filterOf } from "./boolexpr";
import { Handle } from "./handle";
import { MapPlayer } from "./player";
import { Point } from "./point";
import { Rectangle } from "./rect";
import { Unit } from "./unit";
import { Widget } from "./widget";

export class Group extends Handle<group> {
  public static create(): Group {
    return this.expect(CreateGroup());
  }

  public addGroupFast(addGroup: Group): number {
    return BlzGroupAddGroupFast(this.handle, addGroup.handle);
  }

  public addUnit(whichUnit: Unit): boolean {
    return GroupAddUnit(this.handle, whichUnit.handle);
  }

  public clear() {
    GroupClear(this.handle);
  }

  /**
   * Destroys the Group through its Native.
   * @remarks
   * In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
   * a second `destroy()` included, raises
   * `reforged-ts: used after destroy: <Class>#<id>`, and
   * `Reforged.debug.report()` counts it destroyed.
   */
  public destroy() {
    DestroyGroup(this.handle);
    this.release();
  }

  public enumUnitsInRange(
    x: number,
    y: number,
    radius: number,
    filter: boolexpr | (() => boolean),
  ) {
    GroupEnumUnitsInRange(
      this.handle,
      x,
      y,
      radius,
      filterOf(this, "Group.enumUnitsInRange", filter),
    );
  }

  /**
   * @bug Causes irregular behavior when used with large numbers
   */
  public enumUnitsInRangeCounted(
    x: number,
    y: number,
    radius: number,
    filter: boolexpr | (() => boolean),
    countLimit: number,
  ) {
    GroupEnumUnitsInRangeCounted(
      this.handle,
      x,
      y,
      radius,
      filterOf(this, "Group.enumUnitsInRangeCounted", filter),
      countLimit,
    );
  }

  public enumUnitsInRangeOfPoint(
    whichPoint: Point,
    radius: number,
    filter: boolexpr | (() => boolean),
  ) {
    GroupEnumUnitsInRangeOfLoc(
      this.handle,
      whichPoint.handle,
      radius,
      filterOf(this, "Group.enumUnitsInRangeOfPoint", filter),
    );
  }

  /**
   * @bug Causes irregular behavior when used with large numbers
   */
  public enumUnitsInRangeOfPointCounted(
    whichPoint: Point,
    radius: number,
    filter: boolexpr | (() => boolean),
    countLimit: number,
  ) {
    GroupEnumUnitsInRangeOfLocCounted(
      this.handle,
      whichPoint.handle,
      radius,
      filterOf(this, "Group.enumUnitsInRangeOfPointCounted", filter),
      countLimit,
    );
  }

  public enumUnitsInRect(r: Rectangle, filter: boolexpr | (() => boolean)) {
    GroupEnumUnitsInRect(
      this.handle,
      r.handle,
      filterOf(this, "Group.enumUnitsInRect", filter),
    );
  }

  /**
   * @bug Causes irregular behavior when used with large numbers
   */
  public enumUnitsInRectCounted(
    r: Rectangle,
    filter: boolexpr | (() => boolean),
    countLimit: number,
  ) {
    GroupEnumUnitsInRectCounted(
      this.handle,
      r.handle,
      filterOf(this, "Group.enumUnitsInRectCounted", filter),
      countLimit,
    );
  }

  /**
   * @note In contrast to other Enum-functions this function enumarates units with locust.
   */
  public enumUnitsOfPlayer(
    whichPlayer: MapPlayer,
    filter: boolexpr | (() => boolean),
  ) {
    GroupEnumUnitsOfPlayer(
      this.handle,
      whichPlayer.handle,
      filterOf(this, "Group.enumUnitsOfPlayer", filter),
    );
  }

  public enumUnitsOfType(unitName: string, filter: boolexpr | (() => boolean)) {
    GroupEnumUnitsOfType(
      this.handle,
      unitName,
      filterOf(this, "Group.enumUnitsOfType", filter),
    );
  }

  /**
   * @bug Causes irregular behavior when used with large numbers
   */
  public enumUnitsOfTypeCounted(
    unitName: string,
    filter: boolexpr | (() => boolean),
    countLimit: number,
  ) {
    GroupEnumUnitsOfTypeCounted(
      this.handle,
      unitName,
      filterOf(this, "Group.enumUnitsOfTypeCounted", filter),
      countLimit,
    );
  }

  public enumUnitsSelected(
    whichPlayer: MapPlayer,
    filter: boolexpr | (() => boolean),
  ) {
    GroupEnumUnitsSelected(
      this.handle,
      whichPlayer.handle,
      filterOf(this, "Group.enumUnitsSelected", filter),
    );
  }

  /**
   * Runs `callback` once per unit of the group, `Unit.fromEnum()` answering
   * that unit.
   * @remarks In Dev mode the callback runs under `pcall`: a call that throws
   * is reported as `Group#<id> Group.for` and the enumeration continues with
   * the next unit. With Dev mode off `ForGroup` receives `callback` itself.
   */
  public for(callback: () => void) {
    ForGroup(this.handle, protect(this, "Group.for", callback));
  }

  /**
   * @bug May return `null` even if there are still units in the group.
   * This happens when a unit in the group dies and decays since the group still
   * holds a reference to that unit but that unit is pretty much null.
   * See http://wc3c.net/showthread.php?t=104464.
   */
  public get first(): Unit | undefined {
    return Unit.fromHandle(FirstOfGroup(this.handle));
  }

  public get size(): number {
    return BlzGroupGetSize(this.handle);
  }

  public getUnits(): Unit[] {
    const units: Unit[] = [];
    this.for(() => {
      const u = Unit.fromEnum();
      if (u) {
        units.push(u);
      }
    });
    return units;
  }

  public getUnitAt(index: number): Unit | undefined {
    return Unit.fromHandle(BlzGroupUnitAt(this.handle, index));
  }

  public hasUnit(whichUnit: Unit) {
    return IsUnitInGroup(whichUnit.handle, this.handle);
  }

  public orderCoords(order: string | number, x: number, y: number) {
    if (typeof order === "string") {
      GroupPointOrder(this.handle, order, x, y);
    } else {
      GroupPointOrderById(this.handle, order, x, y);
    }
  }

  public orderImmediate(order: string | number) {
    if (typeof order === "string") {
      GroupImmediateOrder(this.handle, order);
    } else {
      GroupImmediateOrderById(this.handle, order);
    }
  }

  public orderPoint(order: string | number, whichPoint: Point) {
    if (typeof order === "string") {
      GroupPointOrderLoc(this.handle, order, whichPoint.handle);
    } else {
      GroupPointOrderByIdLoc(this.handle, order, whichPoint.handle);
    }
  }

  public orderTarget(order: string | number, targetWidget: Widget | Unit) {
    if (typeof order === "string") {
      GroupTargetOrder(this.handle, order, targetWidget.handle);
    } else {
      GroupTargetOrderById(this.handle, order, targetWidget.handle);
    }
  }

  public removeGroupFast(removeGroup: Group): number {
    return BlzGroupRemoveGroupFast(this.handle, removeGroup.handle);
  }

  public removeUnit(whichUnit: Unit): boolean {
    return GroupRemoveUnit(this.handle, whichUnit.handle);
  }
}
