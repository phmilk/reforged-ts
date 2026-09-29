/** @noSelfInFile */

import { rawcodeToString } from "../utils/rawcode";
import {
  EquipmentType,
  equipmentTypeOf,
  ItemTag,
  itemTagOf,
} from "./equipment";
import { handleTypeOf } from "./handle-type";
import { MapPlayer } from "./player";
import { Point } from "./point";
import { Widget } from "./widget";

/**
 * An item, lying on the map or carried in a unit's inventory.
 * @example Creating items on the map
 * {@includeCode ../../examples/harness/item-create.ts}
 * @native item
 */
export class Item extends Widget {
  /** The game's `item` Handle this Wrapper owns. */
  declare public readonly handle: item;

  /**
   * Creates an item on the map at the given point.
   * @param itemId - The item type's rawcode, such as `FourCC("ratf")`.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @param skinId - The skin's rawcode; the item type's own model when left
   * out.
   * @returns The new item.
   * @throws When the game returns no handle, for example an unknown rawcode:
   * `reforged-ts: failed to create Item (<rawcode>)`, at the calling line.
   * @native CreateItem
   * @native BlzCreateItemWithSkin
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

  /**
   * Gets the item's charges, the uses a charged item has left.
   * @returns The charges; 0 for an item with none.
   * @native GetItemCharges
   */
  public get charges() {
    return GetItemCharges(this.handle);
  }

  /**
   * The item's charges, the uses a charged item has left.
   * @native SetItemCharges
   */
  public set charges(value: number) {
    SetItemCharges(this.handle, value);
  }

  /**
   * The item's colour, set like `MapPlayer.color`. Write-only: the game has
   * no Native that reads it back.
   * @native SetItemColor
   */
  public set color(color: playercolor) {
    SetItemColor(this.handle, color);
  }

  /**
   * Gets the equipment type of the item, the loadout slots it can be
   * equipped in.
   * @returns The equipment type; `EquipmentType.None` for an item that cannot
   * be equipped.
   * @throws When the game returns an equipment type no member names, such as
   * one a later Patch adds:
   * `reforged-ts: GetItemEquipmentType returned a value EquipmentType does not name`,
   * at the line that read it.
   * @native GetItemEquipmentType
   */
  public get equipmentType() {
    return equipmentTypeOf(
      GetItemEquipmentType(this.handle),
      "GetItemEquipmentType",
    );
  }

  /**
   * Whether the item cannot be attacked or destroyed.
   * @remarks
   * The setter passes `true` to the Native whatever the value: it makes an
   * item invulnerable, but cannot make one vulnerable again.
   * @native SetItemInvulnerable
   */
  public set invulnerable(flag: boolean) {
    SetItemInvulnerable(this.handle, true);
  }

  /**
   * Tells whether the item cannot be attacked or destroyed.
   * @returns `true` when the item is invulnerable.
   * @native IsItemInvulnerable
   */
  public get invulnerable() {
    return IsItemInvulnerable(this.handle);
  }

  /**
   * Tells whether a unit has the item equipped in one of its loadout slots.
   * @returns `true` when the item is equipped.
   * @native IsItemEquipped
   */
  public get isEquipped() {
    return IsItemEquipped(this.handle);
  }

  /**
   * Tells whether the item lies in a unit's bag.
   * @returns `true` when the item is in a bag.
   * @native IsItemInBag
   */
  public get isInBag() {
    return IsItemInBag(this.handle);
  }

  /**
   * Gets the item's level, as its item type sets it in the object editor.
   * @returns The level, the one {@link Item.chooseRandomWithFilter} filters
   * item types by.
   * @native GetItemLevel
   */
  public get level() {
    return GetItemLevel(this.handle);
  }

  /**
   * Gets the item's description, in the local client's language.
   * @remarks
   * The value can differ between clients: never let it decide game state.
   * @example Showing names in the local language
   * {@includeCode ../../examples/game/local-names.ts}
   * @returns The description; an empty string when the game gives none.
   * @native BlzGetItemDescription
   * @async
   */
  get description() {
    return BlzGetItemDescription(this.handle) ?? "";
  }

  /**
   * The item's description, the text of its item type's Description field
   * in the object editor, for this item only.
   * @native BlzSetItemDescription
   */
  set description(description: string) {
    BlzSetItemDescription(this.handle, description);
  }

  /**
   * Gets the item's extended tooltip, in the local client's language.
   * @remarks
   * The value can differ between clients: never let it decide game state.
   * @example Showing names in the local language
   * {@includeCode ../../examples/game/local-names.ts}
   * @returns The extended tooltip; an empty string when the game gives none.
   * @native BlzGetItemExtendedTooltip
   * @async
   */
  get extendedTooltip() {
    return BlzGetItemExtendedTooltip(this.handle) ?? "";
  }

  /**
   * The item's extended tooltip, the body text shown under its tooltip.
   * @native BlzSetItemExtendedTooltip
   */
  set extendedTooltip(tooltip: string) {
    BlzSetItemExtendedTooltip(this.handle, tooltip);
  }

  /**
   * Gets the path of the item's icon.
   * @returns The icon's texture path; an empty string when the game gives
   * none.
   * @native BlzGetItemIconPath
   */
  get icon() {
    return BlzGetItemIconPath(this.handle) ?? "";
  }

  /**
   * The path of the item's icon, a `.blp` texture of the game or the map.
   * @native BlzSetItemIconPath
   */
  set icon(path: string) {
    BlzSetItemIconPath(this.handle, path);
  }

  /**
   * Gets the item's name, in the local client's language.
   * @remarks
   * The value can differ between clients: never let it decide game state.
   * @example Showing names in the local language
   * {@includeCode ../../examples/game/local-names.ts}
   * @returns The name; an empty string when the game gives none.
   * @native GetItemName
   * @async
   */
  get name() {
    return GetItemName(this.handle) ?? "";
  }

  /**
   * The item's name, for this item only: other items of its type keep
   * theirs.
   * @native BlzSetItemName
   */
  set name(value: string) {
    BlzSetItemName(this.handle, value);
  }

  /**
   * Gets the item's tooltip, in the local client's language.
   * @remarks
   * The value can differ between clients: never let it decide game state.
   * @example Showing names in the local language
   * {@includeCode ../../examples/game/local-names.ts}
   * @returns The tooltip; an empty string when the game gives none.
   * @native BlzGetItemTooltip
   * @async
   */
  get tooltip() {
    return BlzGetItemTooltip(this.handle) ?? "";
  }

  /**
   * The item's tooltip, the title line shown when the cursor is over its
   * icon.
   * @native BlzSetItemTooltip
   */
  set tooltip(tooltip: string) {
    BlzSetItemTooltip(this.handle, tooltip);
  }

  /**
   * Tells whether a unit can sell the item to a shop (pawn it).
   * @returns `true` when the item can be pawned.
   * @native IsItemPawnable
   */
  public get pawnable() {
    return IsItemPawnable(this.handle);
  }

  /**
   * Whether a unit can sell the item to a shop (pawn it).
   * @native SetItemPawnable
   */
  public set pawnable(flag: boolean) {
    SetItemPawnable(this.handle, flag);
  }

  /**
   * Gets the player who owns the item.
   * @remarks
   * In w3ts 3.x this returned the raw `player` Handle, which the caller
   * wrapped with `MapPlayer.fromHandle`; it now returns that `MapPlayer`.
   * @returns The owner, or `undefined` when the game gives none.
   * @native GetItemPlayer
   */
  public get player(): MapPlayer | undefined {
    return MapPlayer.fromHandle(GetItemPlayer(this.handle));
  }

  /**
   * Gets the item's classification, such as `ITEM_TYPE_PERMANENT` or
   * `ITEM_TYPE_CHARGED`.
   * @returns The game's `itemtype` value, or `undefined` when the game gives
   * none.
   * @native GetItemType
   */
  public get type() {
    return GetItemType(this.handle);
  }

  /**
   * Gets the item's tag, the {@link ItemTag} category its item type puts it
   * in, such as a quest reward, a boss drop or a shop item.
   * @returns The tag; `ItemTag.Undefined` for an item with none.
   * @throws When the game returns a tag no member names, such as one a later
   * Patch adds: `reforged-ts: GetItemTag returned a value ItemTag does not name`,
   * at the line that read it.
   * @native GetItemTag
   */
  public get tag() {
    return itemTagOf(GetItemTag(this.handle), "GetItemTag");
  }

  /**
   * Gets the rawcode of the item's type.
   * @returns The rawcode, such as `FourCC("ratf")`.
   * @native GetItemTypeId
   */
  public get typeId() {
    return GetItemTypeId(this.handle);
  }

  /**
   * Gets the number the Map project attached to the item.
   * @returns The number; 0 until one is set.
   * @native GetItemUserData
   */
  public get userData() {
    return GetItemUserData(this.handle);
  }

  /**
   * A number the Map project attaches to the item, which the game never
   * reads.
   * @native SetItemUserData
   */
  public set userData(value: number) {
    SetItemUserData(this.handle, value);
  }

  /**
   * Tells whether the item is shown on the map.
   * @returns `true` when the item is visible.
   * @native IsItemVisible
   */
  public get visible() {
    return IsItemVisible(this.handle);
  }

  /**
   * Whether the item is shown on the map; a hidden item cannot be seen or
   * picked up.
   * @native SetItemVisible
   */
  public set visible(flag: boolean) {
    SetItemVisible(this.handle, flag);
  }

  /**
   * Gets the rawcode of the skin the item shows.
   * @returns The skin's rawcode; the item type's own when no skin was set.
   * @native BlzGetItemSkin
   */
  public get skin() {
    return BlzGetItemSkin(this.handle);
  }

  /**
   * The rawcode of the skin the item shows, the model of another item type.
   * @native BlzSetItemSkin
   */
  public set skin(skinId: number) {
    BlzSetItemSkin(this.handle, skinId);
  }

  /**
   * Gets the item's x-coordinate on the map.
   * @returns The x-coordinate, in world units.
   * @native GetItemX
   */
  public override get x() {
    return GetItemX(this.handle);
  }

  /**
   * The item's x-coordinate on the map, in world units; moving the item keeps
   * its y-coordinate.
   * @native SetItemPosition
   * @native GetItemY
   */
  public override set x(value: number) {
    SetItemPosition(this.handle, value, this.y);
  }

  /**
   * Gets the item's y-coordinate on the map.
   * @returns The y-coordinate, in world units.
   * @native GetItemY
   */
  public override get y() {
    return GetItemY(this.handle);
  }

  /**
   * The item's y-coordinate on the map, in world units; moving the item keeps
   * its x-coordinate.
   * @native SetItemPosition
   * @native GetItemX
   */
  public override set y(value: number) {
    SetItemPosition(this.handle, this.x, value);
  }

  /**
   * Adds an ability to the item, which the unit carrying it gains.
   * @remarks
   * It works only on an item that a unit carries.
   * @param abilCode - The ability's rawcode, such as `FourCC("AIat")`.
   * @native BlzItemAddAbility
   */
  public addAbility(abilCode: number) {
    BlzItemAddAbility(this.handle, abilCode);
  }

  /**
   * Gets one of the item's abilities by its rawcode.
   * @param abilCode - The ability's rawcode, such as `FourCC("AIat")`.
   * @returns The game's `ability` Handle, or `undefined` when the item has no
   * ability of that rawcode.
   * @native BlzGetItemAbility
   */
  public getAbility(abilCode: number) {
    return BlzGetItemAbility(this.handle, abilCode);
  }

  /**
   * Gets one of the item's abilities by its position on the item.
   * @remarks
   * Which of two active abilities the game casts first is unspecified, and
   * their order can change, for example when the carrying unit dies and
   * revives.
   * @param index - The ability's index, from 0.
   * @returns The game's `ability` Handle, or `undefined` when the index is
   * past the item's last ability.
   * @native BlzGetItemAbilityByIndex
   */
  public getAbilityByIndex(index: number) {
    return BlzGetItemAbilityByIndex(this.handle, index);
  }

  /**
   * Removes an ability from the item.
   * @param abilCode - The ability's rawcode, such as `FourCC("AIat")`.
   * @native BlzItemRemoveAbility
   */
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
   * @example Removing game objects without a death
   * {@includeCode ../../examples/game/destroy-units.ts}
   * @native RemoveItem
   */
  public destroy() {
    RemoveItem(this.handle);
    this.release();
  }

  /**
   * Reads one of the item's object-editor fields, through the Native for the
   * field's type.
   * @remarks
   * w3ts 3.x compared the field's type with the unit field type names, so it
   * returned 0 for every item field without calling a Native; this reads
   * the item field.
   * @param field - The field, an `ITEM_BF_`, `ITEM_IF_`, `ITEM_RF_` or
   * `ITEM_SF_` constant.
   * @returns The field's value: a boolean, an integer, a real or a string,
   * as the field's type is; 0 for a field of no item field type.
   * @native BlzGetItemBooleanField
   * @native BlzGetItemIntegerField
   * @native BlzGetItemRealField
   * @native BlzGetItemStringField
   */
  public getField(
    field:
      itembooleanfield | itemintegerfield | itemrealfield | itemstringfield,
  ) {
    const fieldType = handleTypeOf(field);

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

  /**
   * Tells whether a unit carries the item in its inventory.
   * @returns `true` when the item is carried.
   * @native IsItemOwned
   */
  public isOwned() {
    return IsItemOwned(this.handle);
  }

  /**
   * Tells whether a unit can sell the item to a shop (pawn it), as the
   * `pawnable` getter does.
   * @returns `true` when the item can be pawned.
   * @native IsItemPawnable
   */
  public isPawnable() {
    return IsItemPawnable(this.handle);
  }

  /**
   * Tells whether the item is a power-up, used at once when picked up, such
   * as a tome.
   * @returns `true` when the item is a power-up.
   * @native IsItemPowerup
   */
  public isPowerup() {
    return IsItemPowerup(this.handle);
  }

  /**
   * Tells whether a shop can sell the item, as a marketplace's random stock.
   * @returns `true` when the item is sellable.
   * @native IsItemSellable
   */
  public isSellable() {
    return IsItemSellable(this.handle);
  }

  /**
   * Records the unit type the item counts as dropped by, as the game does
   * for an item a creep drops.
   * @param unitId - The unit type's rawcode, such as `FourCC("nfor")`.
   * @native SetItemDropID
   */
  public setDropId(unitId: number) {
    SetItemDropID(this.handle, unitId);
  }

  /**
   * Sets whether a unit carrying the item drops it when the unit dies.
   * @param flag - `true` to drop it on death.
   * @native SetItemDropOnDeath
   */
  public setDropOnDeath(flag: boolean) {
    SetItemDropOnDeath(this.handle, flag);
  }

  /**
   * Sets whether a unit carrying the item can drop it from its inventory.
   * @param flag - `false` to make the item undroppable.
   * @native SetItemDroppable
   */
  public setDroppable(flag: boolean) {
    SetItemDroppable(this.handle, flag);
  }

  /**
   * Writes one of the item's object-editor fields, through the Native for
   * the field's type.
   * @remarks
   * w3ts 3.x compared the field's type with the unit field type names, so it
   * returned `false` for every item field without calling a Native; this
   * writes the item field.
   * @param field - The field, an `ITEM_BF_`, `ITEM_IF_`, `ITEM_RF_` or
   * `ITEM_SF_` constant.
   * @param value - The new value: a boolean for a boolean field, a number
   * for an integer or real field, a string for a string field.
   * @returns What the Native returns, `true` when the game set the field;
   * `false` when `value` does not match the field's type, without calling a
   * Native.
   * @native BlzSetItemBooleanField
   * @native BlzSetItemIntegerField
   * @native BlzSetItemRealField
   * @native BlzSetItemStringField
   */
  public setField(
    field:
      itembooleanfield | itemintegerfield | itemrealfield | itemstringfield,
    value: boolean | number | string,
  ) {
    const fieldType = handleTypeOf(field);

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

  /**
   * Gives the item to a player.
   * @param whichPlayer - The new owner.
   * @param changeColor - `true` to show the item in the new owner's colour.
   * @native SetItemPlayer
   */
  public setOwner(whichPlayer: MapPlayer, changeColor: boolean) {
    SetItemPlayer(this.handle, whichPlayer.handle, changeColor);
  }

  /**
   * Moves the item to a point of the map.
   * @param whichPoint - The point to move it to; its z-coordinate is ignored.
   * @native SetItemPosition
   */
  public setPoint(whichPoint: Point) {
    SetItemPosition(this.handle, whichPoint.x, whichPoint.y);
  }

  /**
   * Moves the item to the given coordinates.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @native SetItemPosition
   */
  public setPosition(x: number, y: number) {
    SetItemPosition(this.handle, x, y);
  }

  /**
   * Picks a random item type that matches every filter given.
   * @remarks
   * It returns an id, not a Handle, so it is not a lookup: it creates
   * nothing, and chooses among every item type of the map, not among the
   * items placed on it.
   * @param type - The classification, such as `ITEM_TYPE_PERMANENT`, or
   * `ITEM_TYPE_ANY` for every one.
   * @param level - The item level; -1 for any level.
   * @param equipmentType - The equipment type, or `EquipmentType.Any` for
   * every one.
   * @param tag - The tag, or `ItemTag.Any` for every one.
   * @returns The rawcode of the item type chosen, or 0 when no item type
   * matches.
   * @native ChooseRandomItemExWithFilter
   * @native ConvertEquipmentType
   * @native ConvertItemTag
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
   * Gets the stacking item that absorbs a picked-up item.
   * @returns The absorbing item, or `undefined` outside a pickup event or
   * when the picked-up item stacks with none.
   * @native BlzGetAbsorbingItem
   */
  public static fromAbsorbing(): Item | undefined {
    return this.fromHandle(BlzGetAbsorbingItem());
  }

  /**
   * Gets the item an item enumeration is at.
   * @returns The item, or `undefined` outside an enumeration.
   * @native GetEnumItem
   */
  public static fromEnum(): Item | undefined {
    return this.fromHandle(GetEnumItem());
  }

  /**
   * Gets the item a unit equips.
   * @returns The item, or `undefined` outside an equip event.
   * @native GetEquippedItem
   */
  public static fromEquipped(): Item | undefined {
    return this.fromHandle(GetEquippedItem());
  }

  /**
   * Gets the item a unit picks up, drops or uses.
   * @returns The item, or `undefined` outside a pickup, drop or use event.
   * @native GetManipulatedItem
   */
  public static override fromEvent(): Item | undefined {
    return this.fromHandle(GetManipulatedItem());
  }

  /**
   * Gets the item an item enumeration's filter is testing.
   * @returns The item, or `undefined` outside a filter.
   * @native GetFilterItem
   */
  public static fromFilter(): Item | undefined {
    return this.fromHandle(GetFilterItem());
  }

  /**
   * Gets the item a target order targets.
   * @returns The item, or `undefined` outside a target order or when the
   * target is not an item.
   * @native GetOrderTargetItem
   */
  public static override fromOrderTarget(): Item | undefined {
    return this.fromHandle(GetOrderTargetItem());
  }

  /**
   * Gets the item a spell targets.
   * @returns The item, or `undefined` outside a spell event or when the
   * spell targets no item.
   * @native GetSpellTargetItem
   */
  public static fromSpellTarget(): Item | undefined {
    return this.fromHandle(GetSpellTargetItem());
  }

  /**
   * Gets the item a shop sells or a unit pawns.
   * @returns The item, or `undefined` outside a sell or pawn event.
   * @native GetSoldItem
   */
  public static fromSold(): Item | undefined {
    return this.fromHandle(GetSoldItem());
  }

  /**
   * Gets the item that loses its charges to another when items stack.
   * @returns The item, or `undefined` outside a stack event.
   * @native BlzGetStackingItemSource
   */
  public static fromStackingSource(): Item | undefined {
    return this.fromHandle(BlzGetStackingItemSource());
  }

  /**
   * Gets the item that gains the charges when items stack.
   * @returns The item, or `undefined` outside a stack event.
   * @native BlzGetStackingItemTarget
   */
  public static fromStackingTarget(): Item | undefined {
    return this.fromHandle(BlzGetStackingItemTarget());
  }

  /**
   * Gets the item a unit unequips.
   * @returns The item, or `undefined` outside an unequip event.
   * @native GetUnequippedItem
   */
  public static fromUnequipped(): Item | undefined {
    return this.fromHandle(GetUnequippedItem());
  }

  /**
   * Tells whether a unit can sell items of a type to a shop (pawn them).
   * @param itemId - The item type's rawcode, such as `FourCC("ratf")`.
   * @returns `true` when items of that type can be pawned.
   * @native IsItemIdPawnable
   */
  public static isIdPawnable(itemId: number) {
    return IsItemIdPawnable(itemId);
  }

  /**
   * Tells whether items of a type are power-ups, used at once when picked up.
   * @param itemId - The item type's rawcode, such as `FourCC("tdex")`.
   * @returns `true` when items of that type are power-ups.
   * @native IsItemIdPowerup
   */
  public static isIdPowerup(itemId: number) {
    return IsItemIdPowerup(itemId);
  }

  /**
   * Tells whether a shop can sell items of a type, as a marketplace's random
   * stock.
   * @param itemId - The item type's rawcode, such as `FourCC("ratf")`.
   * @returns `true` when items of that type are sellable.
   * @native IsItemIdSellable
   */
  public static isIdSellable(itemId: number) {
    return IsItemIdSellable(itemId);
  }
}
