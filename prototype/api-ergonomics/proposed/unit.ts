/** @noSelfInFile */
// PROTOTYPE: minimal Widget / Unit / Item on the new base.

import { Handle } from "./handle";
import { MapPlayer } from "./player";

export class Widget extends Handle<widget> {
  public get life(): number {
    return GetWidgetLife(this.handle);
  }

  public static fromEvent(): Widget | undefined {
    return this.fromHandle(GetTriggerWidget());
  }
}

export class Unit extends Widget {
  public declare readonly handle: unit;

  /** Creation: throws when the Native returns nothing (bad rawcode). Typed non-null. */
  public static create(
    owner: MapPlayer,
    unitId: number,
    x: number,
    y: number,
    face: number = bj_UNIT_FACING
  ): Unit {
    return this.expect(CreateUnit(owner.handle, unitId, x, y, face), `unit ${unitId}`);
  }

  // Lookups: undefined when the trigger context has nothing to give.
  public static override fromEvent(): Unit | undefined {
    return this.fromHandle(GetTriggerUnit());
  }

  public static fromKilling(): Unit | undefined {
    return this.fromHandle(GetKillingUnit());
  }

  public static fromFilter(): Unit | undefined {
    return this.fromHandle(GetFilterUnit());
  }

  public get name(): string {
    return GetUnitName(this.handle) ?? "";
  }

  /** A live unit always has an owner; the Typings cannot express that invariant. */
  public get owner(): MapPlayer {
    return MapPlayer.fromHandle(GetOwningPlayer(this.handle))!;
  }

  public kill(): void {
    KillUnit(this.handle);
  }

  public destroy(): void {
    RemoveUnit(this.handle);
  }

  /** 3.0.0: equipment system. */
  public equip(item: Item): boolean {
    return UnitEquipItem(this.handle, item.handle);
  }
}

export class Item extends Widget {
  public declare readonly handle: item;

  public static create(itemId: number, x: number, y: number): Item {
    return this.expect(CreateItem(itemId, x, y), `item ${itemId}`);
  }

  /** Pickup/drop/use events. */
  public static fromManipulated(): Item | undefined {
    return this.fromHandle(GetManipulatedItem());
  }

  /** 3.0.0 equip/unequip events (accessor name assumed, see the stub). */
  public static fromEquipped(): Item | undefined {
    return this.fromHandle(GetEquippedItem());
  }

  public get name(): string {
    return GetItemName(this.handle) ?? "";
  }
}
