/** @noSelfInFile */

import { assertNotLocal } from "../reforged/local";
import { protect } from "../reforged/protect";
import { filterOf } from "./boolexpr";
import { Handle } from "./handle";
import { MapPlayer } from "./player";
import { Point } from "./point";
import { Rectangle } from "./rect";
import { Unit } from "./unit";
import { Widget } from "./widget";

/**
 * A set of units: the result of an enumeration, by area, owner or type, and
 * a way to order its units together.
 * @remarks
 * A group keeps holding a unit that was removed from the game, such as a
 * decayed corpse, until the group is cleared or refilled.
 * @example Collecting units and ordering them together
 * {@includeCode ../../examples/harness/group-units.ts}
 * @native group
 */
export class Group extends Handle<group> {
  /**
   * Creates an empty group.
   * @returns The new group.
   * @throws When the game returns no handle:
   * `reforged-ts: failed to create Group`, at the calling line. In Dev mode,
   * also when called before the globals Init stage or inside
   * `MapPlayer.runLocal`.
   * @native CreateGroup
   */
  public static create(): Group {
    return this.expect(CreateGroup());
  }

  /**
   * Adds every unit of `source` to this group, in one Native call; `source`
   * is left as it was.
   * @remarks
   * The Native adds the units of its first group to its second, so the
   * member passes `source` first. In w3ts 3.x it passed this group first:
   * `a.addGroupFast(b)` added the units of `a` to `b`.
   * @param source - The group whose units are added.
   * @returns The number of units added, or 0 on an error.
   * @native BlzGroupAddGroupFast
   */
  public addGroupFast(source: Group): number {
    return BlzGroupAddGroupFast(source.handle, this.handle);
  }

  /**
   * Adds a unit at the end of the group.
   * @param whichUnit - The unit to add.
   * @returns True when the group gained the unit; false when the unit was in
   * it already, or the group is destroyed.
   * @native GroupAddUnit
   */
  public addUnit(whichUnit: Unit): boolean {
    return GroupAddUnit(this.handle, whichUnit.handle);
  }

  /**
   * Removes every unit from the group.
   * @native GroupClear
   */
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
   * @example Handles made for one computation
   * {@includeCode ../../examples/game/destroy-scratch.ts}
   * @throws In Dev mode, when called inside `MapPlayer.runLocal`: a Handle
   * freed on one client desyncs the game.
   * @native DestroyGroup
   */
  public destroy() {
    DestroyGroup(this.handle);
    this.release();
  }

  /**
   * Fills the group with the units within `radius` of a point.
   * @remarks
   * Clears the group first: it holds only the units found afterwards.
   * @param x - The x-coordinate of the center, in world units.
   * @param y - The y-coordinate of the center, in world units.
   * @param radius - The radius, in world units.
   * @param filter - Keeps a unit when it returns true; inside it,
   * `Unit.fromFilter()` gives the unit. A plain function is wrapped in a
   * `Filter` for the call.
   * @native GroupEnumUnitsInRange
   * @native Filter
   */
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
   * Fills the group with at most `countLimit` of the units within `radius`
   * of a point.
   * @remarks
   * Clears the group first: it holds only the units found afterwards.
   * @param x - The x-coordinate of the center, in world units.
   * @param y - The y-coordinate of the center, in world units.
   * @param radius - The radius, in world units.
   * @param filter - Keeps a unit when it returns true; inside it,
   * `Unit.fromFilter()` gives the unit. A plain function is wrapped in a
   * `Filter` for the call.
   * @param countLimit - The most units the group receives.
   * @native GroupEnumUnitsInRangeCounted
   * @native Filter
   * @bug Its behaviour turns erratic with large numbers.
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

  /**
   * Fills the group with the units within `radius` of a Point.
   * @remarks
   * Clears the group first: it holds only the units found afterwards.
   * @param whichPoint - The center of the circle searched.
   * @param radius - The radius, in world units.
   * @param filter - Keeps a unit when it returns true; inside it,
   * `Unit.fromFilter()` gives the unit. A plain function is wrapped in a
   * `Filter` for the call.
   * @native GroupEnumUnitsInRangeOfLoc
   * @native Filter
   */
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
   * Fills the group with at most `countLimit` of the units within `radius`
   * of a Point.
   * @remarks
   * Clears the group first: it holds only the units found afterwards.
   * @param whichPoint - The center of the circle searched.
   * @param radius - The radius, in world units.
   * @param filter - Keeps a unit when it returns true; inside it,
   * `Unit.fromFilter()` gives the unit. A plain function is wrapped in a
   * `Filter` for the call.
   * @param countLimit - The most units the group receives.
   * @native GroupEnumUnitsInRangeOfLocCounted
   * @native Filter
   * @bug Its behaviour turns erratic with large numbers.
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

  /**
   * Fills the group with the units inside a Rectangle.
   * @remarks
   * Clears the group first: it holds only the units found afterwards.
   * @param r - The area to search.
   * @param filter - Keeps a unit when it returns true; inside it,
   * `Unit.fromFilter()` gives the unit. A plain function is wrapped in a
   * `Filter` for the call.
   * @native GroupEnumUnitsInRect
   * @native Filter
   */
  public enumUnitsInRect(r: Rectangle, filter: boolexpr | (() => boolean)) {
    GroupEnumUnitsInRect(
      this.handle,
      r.handle,
      filterOf(this, "Group.enumUnitsInRect", filter),
    );
  }

  /**
   * Fills the group with at most `countLimit` of the units inside a
   * Rectangle.
   * @remarks
   * Clears the group first: it holds only the units found afterwards.
   * @param r - The area to search.
   * @param filter - Keeps a unit when it returns true; inside it,
   * `Unit.fromFilter()` gives the unit. A plain function is wrapped in a
   * `Filter` for the call.
   * @param countLimit - The most units the group receives.
   * @native GroupEnumUnitsInRectCounted
   * @native Filter
   * @bug Its behaviour turns erratic with large numbers.
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
   * Fills the group with the units a player owns.
   * @remarks Units with the Locust ability are included, unlike the
   * enumerations by area.
   * @param whichPlayer - The player whose units to collect.
   * @param filter - Keeps a unit when it returns true; inside it,
   * `Unit.fromFilter()` gives the unit. A plain function is wrapped in a
   * `Filter` for the call.
   * @native GroupEnumUnitsOfPlayer
   * @native Filter
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

  /**
   * Fills the group with the units of one unit type, found by its internal
   * name.
   * @remarks
   * - Clears the group first: it holds only the units found afterwards.
   * - Units with the Locust ability are included, unlike the enumerations by
   *   area.
   * @param unitName - The type's internal name, such as `"footman"`; a
   * custom type's is `"custom_"` followed by its rawcode, such as
   * `"custom_h000"`.
   * @param filter - Keeps a unit when it returns true; inside it,
   * `Unit.fromFilter()` gives the unit. A plain function is wrapped in a
   * `Filter` for the call.
   * @native GroupEnumUnitsOfType
   * @native Filter
   */
  public enumUnitsOfType(unitName: string, filter: boolexpr | (() => boolean)) {
    GroupEnumUnitsOfType(
      this.handle,
      unitName,
      filterOf(this, "Group.enumUnitsOfType", filter),
    );
  }

  /**
   * Fills the group with at most `countLimit` of the units of one unit type,
   * found by its internal name.
   * @remarks
   * - Clears the group first: it holds only the units found afterwards.
   * - Units with the Locust ability are included, unlike the enumerations by
   *   area.
   * @param unitName - The type's internal name, such as `"footman"`; a
   * custom type's is `"custom_"` followed by its rawcode, such as
   * `"custom_h000"`.
   * @param filter - Keeps a unit when it returns true; inside it,
   * `Unit.fromFilter()` gives the unit. A plain function is wrapped in a
   * `Filter` for the call.
   * @param countLimit - The most units the group receives.
   * @native GroupEnumUnitsOfTypeCounted
   * @native Filter
   * @bug Its behaviour turns erratic with large numbers.
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

  /**
   * Fills the group with the units a player has selected.
   * @remarks
   * The game knows another client's selection only as last synchronized:
   * call `SyncSelections` first for an up-to-date one.
   * @param whichPlayer - The player whose selection is read.
   * @param filter - Keeps a unit when it returns true; inside it,
   * `Unit.fromFilter()` gives the unit. A plain function is wrapped in a
   * `Filter` for the call.
   * @native GroupEnumUnitsSelected
   * @native Filter
   */
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
   * @param callback - Runs once per unit, before `for` returns.
   * @throws In Dev mode, when called inside `MapPlayer.runLocal`:
   * `reforged-ts: Group.for inside MapPlayer.runLocal changes game state for one client, which desyncs the game: only visuals belong inside runLocal`.
   * @native ForGroup
   */
  public for(callback: () => void) {
    assertNotLocal("Group.for", 2);
    ForGroup(this.handle, protect(this, "Group.for", callback));
  }

  /**
   * Gets the unit at the head of the group.
   * @returns The first unit, or `undefined` when the group is empty.
   * @native FirstOfGroup
   * @bug Gives `undefined` while the group still holds units when its head
   * is a unit removed from the game, such as a decayed corpse: the group
   * keeps that dead entry until it is cleared. The GroupUtils thread on wc3c
   * covers it: http://wc3c.net/showthread.php?t=104464.
   */
  public get first(): Unit | undefined {
    return Unit.fromHandle(FirstOfGroup(this.handle));
  }

  /**
   * Counts the units the group holds.
   * @returns The unit count, 0 for an empty group; `getUnitAt` takes the
   * positions 0 to `size - 1`.
   * @native BlzGroupGetSize
   */
  public get size(): number {
    return BlzGroupGetSize(this.handle);
  }

  /**
   * Gets the units of the group, in the group's order.
   * @returns A new array, which later changes to the group do not affect.
   * @throws In Dev mode, when called inside `MapPlayer.runLocal`, as `for`
   * does.
   * @native ForGroup
   * @native GetEnumUnit
   */
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

  /**
   * Gets the unit at one position of the group.
   * @param index - The position, from 0 to `size - 1`.
   * @returns The unit, or `undefined` when `index` is out of range or the
   * unit there was removed from the game.
   * @native BlzGroupUnitAt
   */
  public getUnitAt(index: number): Unit | undefined {
    return Unit.fromHandle(BlzGroupUnitAt(this.handle, index));
  }

  /**
   * Tests whether a unit is in the group.
   * @param whichUnit - The unit to look for.
   * @returns True when the group holds the unit.
   * @native IsUnitInGroup
   */
  public hasUnit(whichUnit: Unit) {
    return IsUnitInGroup(whichUnit.handle, this.handle);
  }

  /**
   * Orders every unit of the group to a point given by its coordinates.
   * @param order - The order's name, such as `"move"`, or its id, such as
   * one of `tsGlobals.OrderId`.
   * @param x - The target's x-coordinate, in world units.
   * @param y - The target's y-coordinate, in world units.
   * @native GroupPointOrder
   * @native GroupPointOrderById
   */
  public orderCoords(order: string | number, x: number, y: number) {
    if (typeof order === "string") {
      GroupPointOrder(this.handle, order, x, y);
    } else {
      GroupPointOrderById(this.handle, order, x, y);
    }
  }

  /**
   * Gives every unit of the group an order that takes no target, such as
   * `"stop"`.
   * @param order - The order's name, such as `"move"`, or its id, such as
   * one of `tsGlobals.OrderId`.
   * @native GroupImmediateOrder
   * @native GroupImmediateOrderById
   */
  public orderImmediate(order: string | number) {
    if (typeof order === "string") {
      GroupImmediateOrder(this.handle, order);
    } else {
      GroupImmediateOrderById(this.handle, order);
    }
  }

  /**
   * Orders every unit of the group to a Point.
   * @param order - The order's name, such as `"move"`, or its id, such as
   * one of `tsGlobals.OrderId`.
   * @param whichPoint - The point the order targets.
   * @native GroupPointOrderLoc
   * @native GroupPointOrderByIdLoc
   */
  public orderPoint(order: string | number, whichPoint: Point) {
    if (typeof order === "string") {
      GroupPointOrderLoc(this.handle, order, whichPoint.handle);
    } else {
      GroupPointOrderByIdLoc(this.handle, order, whichPoint.handle);
    }
  }

  /**
   * Orders every unit of the group to target a unit, an item or a
   * destructable.
   * @param order - The order's name, such as `"move"`, or its id, such as
   * one of `tsGlobals.OrderId`.
   * @param targetWidget - The unit, item or destructable the order targets.
   * @native GroupTargetOrder
   * @native GroupTargetOrderById
   */
  public orderTarget(order: string | number, targetWidget: Widget | Unit) {
    if (typeof order === "string") {
      GroupTargetOrder(this.handle, order, targetWidget.handle);
    } else {
      GroupTargetOrderById(this.handle, order, targetWidget.handle);
    }
  }

  /**
   * Removes every unit of `source` from this group, in one Native call;
   * `source` is left as it was.
   * @remarks
   * The Native removes the units of its first group from its second, so the
   * member passes `source` first. In w3ts 3.x it passed this group first:
   * `a.removeGroupFast(b)` removed the units of `a` from `b`.
   * @param source - The group whose units are removed.
   * @returns The number of units removed, or 0 on an error.
   * @native BlzGroupRemoveGroupFast
   */
  public removeGroupFast(source: Group): number {
    return BlzGroupRemoveGroupFast(source.handle, this.handle);
  }

  /**
   * Removes a unit from the group.
   * @param whichUnit - The unit to remove.
   * @returns True when the unit was removed; false when it was not in the
   * group.
   * @native GroupRemoveUnit
   */
  public removeUnit(whichUnit: Unit): boolean {
    return GroupRemoveUnit(this.handle, whichUnit.handle);
  }
}
