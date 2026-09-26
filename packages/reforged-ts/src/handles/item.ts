/** @noSelfInFile */

import { rawcodeToString } from "../utils/rawcode";
import {
  EquipmentType,
  equipmentTypeOf,
  ItemTag,
  itemTagOf,
} from "./equipment";
import { fieldTypeOf } from "./fields";
import { MapPlayer } from "./player";
import { Point } from "./point";
import { Widget } from "./widget";

export class Item extends Widget {
  declare public readonly handle: item;

  /**
   * Creates an item object at the specified coordinates.
   * @param itemId The rawcode of the item.
   * @param x The x-coordinate of the item
   * @param y The y-coordinate of the item
   * @param skinId  The skin ID of the item.
   */
  public static create(
    itemId: number,
    x: number,
    y: number,
    skinId?: number,
  ): Item {
    return this.expect(
      skinId === undefined
        ? CreateItem(itemId, x, y)
        : BlzCreateItemWithSkin(itemId, x, y, skinId),
      rawcodeToString(itemId),
    );
  }

  public get charges() {
    return GetItemCharges(this.handle);
  }

  public set charges(value: number) {
    SetItemCharges(this.handle, value);
  }

  /**
   * The item's colour, set like `MapPlayer.color`. Write-only: the game has
   * no Native that reads it back.
   */
  public set color(color: playercolor) {
    SetItemColor(this.handle, color);
  }

  public get equipmentType() {
    return equipmentTypeOf(
      GetItemEquipmentType(this.handle),
      "GetItemEquipmentType",
    );
  }

  public set invulnerable(flag: boolean) {
    SetItemInvulnerable(this.handle, true);
  }

  public get invulnerable() {
    return IsItemInvulnerable(this.handle);
  }

  public get isEquipped() {
    return IsItemEquipped(this.handle);
  }

  public get isInBag() {
    return IsItemInBag(this.handle);
  }

  public get level() {
    return GetItemLevel(this.handle);
  }

  /**
   * @async
   */
  get description() {
    return BlzGetItemDescription(this.handle) ?? "";
  }

  set description(description: string) {
    BlzSetItemDescription(this.handle, description);
  }

  /**
   * @async
   */
  get extendedTooltip() {
    return BlzGetItemExtendedTooltip(this.handle) ?? "";
  }

  set extendedTooltip(tooltip: string) {
    BlzSetItemExtendedTooltip(this.handle, tooltip);
  }

  /**
   * @async
   */
  get icon() {
    return BlzGetItemIconPath(this.handle) ?? "";
  }

  set icon(path: string) {
    BlzSetItemIconPath(this.handle, path);
  }

  /**
   * @async
   */
  get name() {
    return GetItemName(this.handle) ?? "";
  }

  set name(value: string) {
    BlzSetItemName(this.handle, value);
  }

  /**
   * @async
   */
  get tooltip() {
    return BlzGetItemTooltip(this.handle) ?? "";
  }

  set tooltip(tooltip: string) {
    BlzSetItemTooltip(this.handle, tooltip);
  }

  public get pawnable() {
    return IsItemPawnable(this.handle);
  }

  public set pawnable(flag: boolean) {
    SetItemPawnable(this.handle, flag);
  }

  public get player() {
    return GetItemPlayer(this.handle);
  }

  public get type() {
    return GetItemType(this.handle);
  }

  public get tag() {
    return itemTagOf(GetItemTag(this.handle), "GetItemTag");
  }

  public get typeId() {
    return GetItemTypeId(this.handle);
  }

  public get userData() {
    return GetItemUserData(this.handle);
  }

  public set userData(value: number) {
    SetItemUserData(this.handle, value);
  }

  public get visible() {
    return IsItemVisible(this.handle);
  }

  public set visible(flag: boolean) {
    SetItemVisible(this.handle, flag);
  }

  public get skin() {
    return BlzGetItemSkin(this.handle);
  }

  public set skin(skinId: number) {
    BlzSetItemSkin(this.handle, skinId);
  }

  public override get x() {
    return GetItemX(this.handle);
  }

  public override set x(value: number) {
    SetItemPosition(this.handle, value, this.y);
  }

  public override get y() {
    return GetItemY(this.handle);
  }

  public override set y(value: number) {
    SetItemPosition(this.handle, this.x, value);
  }

  public addAbility(abilCode: number) {
    BlzItemAddAbility(this.handle, abilCode);
  }

  public getAbility(abilCode: number) {
    return BlzGetItemAbility(this.handle, abilCode);
  }

  public getAbilityByIndex(index: number) {
    return BlzGetItemAbilityByIndex(this.handle, index);
  }

  public removeAbility(abilCode: number) {
    BlzItemRemoveAbility(this.handle, abilCode);
  }

  /**
   * Destroys the Item through its Native.
   * @remarks
   * In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
   * a second `destroy()` included, raises
   * `reforged-ts: used after destroy: <Class>#<id>`, and
   * `Reforged.debug.report()` counts it destroyed.
   */
  public destroy() {
    RemoveItem(this.handle);
    this.release();
  }

  public getField(
    field:
      itembooleanfield | itemintegerfield | itemrealfield | itemstringfield,
  ) {
    const fieldType = fieldTypeOf(field);

    switch (fieldType) {
      case "itembooleanfield":
        return BlzGetItemBooleanField(this.handle, field as itembooleanfield);
      case "itemintegerfield":
        return BlzGetItemIntegerField(this.handle, field as itemintegerfield);
      case "itemrealfield":
        return BlzGetItemRealField(this.handle, field as itemrealfield);
      case "itemstringfield":
        return BlzGetItemStringField(this.handle, field as itemstringfield);
      default:
        return 0;
    }
  }

  public isOwned() {
    return IsItemOwned(this.handle);
  }

  public isPawnable() {
    return IsItemPawnable(this.handle);
  }

  public isPowerup() {
    return IsItemPowerup(this.handle);
  }

  public isSellable() {
    return IsItemSellable(this.handle);
  }

  public setDropId(unitId: number) {
    SetItemDropID(this.handle, unitId);
  }

  public setDropOnDeath(flag: boolean) {
    SetItemDropOnDeath(this.handle, flag);
  }

  public setDroppable(flag: boolean) {
    SetItemDroppable(this.handle, flag);
  }

  public setField(
    field:
      itembooleanfield | itemintegerfield | itemrealfield | itemstringfield,
    value: boolean | number | string,
  ) {
    const fieldType = fieldTypeOf(field);

    if (fieldType === "itembooleanfield" && typeof value === "boolean") {
      return BlzSetItemBooleanField(
        this.handle,
        field as itembooleanfield,
        value,
      );
    }
    if (fieldType === "itemintegerfield" && typeof value === "number") {
      return BlzSetItemIntegerField(
        this.handle,
        field as itemintegerfield,
        value,
      );
    }
    if (fieldType === "itemrealfield" && typeof value === "number") {
      return BlzSetItemRealField(this.handle, field as itemrealfield, value);
    }
    if (fieldType === "itemstringfield" && typeof value === "string") {
      return BlzSetItemStringField(
        this.handle,
        field as itemstringfield,
        value,
      );
    }

    return false;
  }

  public setOwner(whichPlayer: MapPlayer, changeColor: boolean) {
    SetItemPlayer(this.handle, whichPlayer.handle, changeColor);
  }

  public setPoint(whichPoint: Point) {
    SetItemPosition(this.handle, whichPoint.x, whichPoint.y);
  }

  public setPosition(x: number, y: number) {
    SetItemPosition(this.handle, x, y);
  }

  /**
   * A random item type of the level, item type, equipment type and tag
   * given: its id, or 0 when the game finds none (an id, not a Handle, so
   * not a lookup).
   */
  public static chooseRandomWithFilter(
    type: itemtype,
    level: number,
    equipmentType: EquipmentType,
    tag: ItemTag,
  ): number {
    return ChooseRandomItemExWithFilter(
      type,
      level,
      ConvertEquipmentType(equipmentType),
      ConvertItemTag(tag),
    );
  }

  /**
   * The stacking item that absorbs a picked-up item, or undefined outside a
   * pickup event or when the picked-up item stacks with none, through
   * `BlzGetAbsorbingItem`.
   */
  public static fromAbsorbing(): Item | undefined {
    return this.fromHandle(BlzGetAbsorbingItem());
  }

  /**
   * The item an enumeration is at, or undefined outside one, through
   * `GetEnumItem`.
   */
  public static fromEnum(): Item | undefined {
    return this.fromHandle(GetEnumItem());
  }

  /** The item a unit equips, or undefined outside an equip event. */
  public static fromEquipped(): Item | undefined {
    return this.fromHandle(GetEquippedItem());
  }

  public static override fromEvent(): Item | undefined {
    return this.fromHandle(GetManipulatedItem());
  }

  /**
   * The item an enumeration's filter is at, or undefined outside one,
   * through `GetFilterItem`.
   */
  public static fromFilter(): Item | undefined {
    return this.fromHandle(GetFilterItem());
  }

  /**
   * The item a target order targets, or undefined outside a target order or
   * when the target is not an item, through `GetOrderTargetItem`.
   */
  public static fromOrderTarget(): Item | undefined {
    return this.fromHandle(GetOrderTargetItem());
  }

  /** The spell's target item, or undefined when the spell targets none. */
  public static fromSpellTarget(): Item | undefined {
    return this.fromHandle(GetSpellTargetItem());
  }

  /** The item a shop sells or a unit pawns, or undefined outside those events. */
  public static fromSold(): Item | undefined {
    return this.fromHandle(GetSoldItem());
  }

  /**
   * The item losing charges to another when items stack, or undefined
   * outside a stack event, through `BlzGetStackingItemSource`.
   */
  public static fromStackingSource(): Item | undefined {
    return this.fromHandle(BlzGetStackingItemSource());
  }

  /**
   * The item gaining the charges when items stack, or undefined outside a
   * stack event, through `BlzGetStackingItemTarget`.
   */
  public static fromStackingTarget(): Item | undefined {
    return this.fromHandle(BlzGetStackingItemTarget());
  }

  /** The item a unit unequips, or undefined outside an unequip event. */
  public static fromUnequipped(): Item | undefined {
    return this.fromHandle(GetUnequippedItem());
  }

  public static isIdPawnable(itemId: number) {
    return IsItemIdPawnable(itemId);
  }

  public static isIdPowerup(itemId: number) {
    return IsItemIdPowerup(itemId);
  }

  public static isIdSellable(itemId: number) {
    return IsItemIdSellable(itemId);
  }
}
