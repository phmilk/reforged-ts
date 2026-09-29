/** @noSelfInFile */

import type { OrderId } from "../globals/order";
import { configuration } from "../reforged/configuration";
import { assertDamageDepth } from "../reforged/damage";
import { rawcodeToString } from "../utils/rawcode";
import { Destructable } from "./destructable";
import type { EquipmentType, LoadoutSlot } from "./equipment";
import { Force } from "./force";
import { handleTypeOf } from "./handle-type";
import { expectUnwrapped } from "./handle";
import type { Group } from "./group";
import { Item } from "./item";
import { MapPlayer } from "./player";
import { Point } from "./point";
import { Sound } from "./sound";
import { Widget } from "./widget";

/**
 * A unit on the map: a soldier, a hero, a structure, a worker or a critter.
 * @remarks
 * A unit is a widget: its `life` comes from `Widget`, and `Unit.fromHandle`
 * upgrades the Wrapper that a widget lookup made earlier for it. The
 * hero members (`agility`, `experience`, `setHeroLevel` and the like) act on
 * heroes only: on another unit they read 0 and change nothing.
 * @example Creating units, reading an inventory slot and the owner
 * {@includeCode ../../examples/harness/unit-create.ts}
 * @native unit
 */
export class Unit extends Widget {
  /** The game's `unit` Handle this Wrapper owns. */
  declare public readonly handle: unit;

  /**
   * Creates a unit for `owner` at the given point, facing `face`.
   * @param owner - The player who owns the unit.
   * @param unitId - The unit type's rawcode, such as `FourCC("hfoo")`.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @param face - The facing, in degrees; 270 (`bj_UNIT_FACING`) when left out.
   * @param skinId - The skin's rawcode; the unit type's own model when left out.
   * @returns The new unit.
   * @throws When the game returns no handle, for example an unknown rawcode:
   * `reforged-ts: failed to create Unit (<rawcode>)`, at the calling line. In Dev
   * mode, also before the globals Init stage and inside `MapPlayer.runLocal`.
   * @native CreateUnit
   * @native BlzCreateUnitWithSkin
   */
  public static create(
    owner: MapPlayer,
    unitId: number,
    x: number,
    y: number,
    face: number = bj_UNIT_FACING,
    skinId?: number,
  ): Unit {
    return this.expect(
      skinId === undefined
        ? CreateUnit(owner.handle, unitId, x, y, face)
        : BlzCreateUnitWithSkin(owner.handle, unitId, x, y, face, skinId),
      rawcodeToString(unitId),
    );
  }

  /**
   * Creates a unit for `owner` at a point, facing `face`.
   * @param owner - The player who owns the unit.
   * @param unitId - The unit type's rawcode, such as `FourCC("hfoo")`.
   * @param where - Where the unit stands.
   * @param face - The facing, in degrees; 270 (`bj_UNIT_FACING`) when left out.
   * @returns The new unit.
   * @throws When the game returns no handle, for example an unknown rawcode:
   * `reforged-ts: failed to create Unit (<rawcode>)`, at the calling line. In Dev
   * mode, also before the globals Init stage and inside `MapPlayer.runLocal`.
   * @native CreateUnitAtLoc
   */
  public static createAtPoint(
    owner: MapPlayer,
    unitId: number,
    where: Point,
    face: number = bj_UNIT_FACING,
  ): Unit {
    return this.expect(
      CreateUnitAtLoc(owner.handle, unitId, where.handle, face),
      rawcodeToString(unitId),
    );
  }

  /**
   * Creates a unit for `owner` at a point from the unit type's order name.
   * @param owner - The player who owns the unit.
   * @param unitName - The unit type's order name, such as `"footman"`.
   * @param where - Where the unit stands.
   * @param face - The facing, in degrees; 270 (`bj_UNIT_FACING`) when left out.
   * @returns The new unit.
   * @throws When the game returns no handle, for example an unknown name:
   * `reforged-ts: failed to create Unit (<unitName>)`, at the calling line. In Dev
   * mode, also before the globals Init stage and inside `MapPlayer.runLocal`.
   * @native CreateUnitAtLocByName
   */
  public static createAtPointByName(
    owner: MapPlayer,
    unitName: string,
    where: Point,
    face: number = bj_UNIT_FACING,
  ): Unit {
    return this.expect(
      CreateUnitAtLocByName(owner.handle, unitName, where.handle, face),
      unitName,
    );
  }

  /**
   * Creates an undead haunted gold mine, which spreads blight around it.
   * @remarks
   * The mine holds the gold that the Gold Mine ability (`'Agld'`) sets, and it
   * turns back into a normal gold mine when it is destroyed.
   * @param owner - The player who owns the gold mine.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @param face - The facing, in degrees; 270 (`bj_UNIT_FACING`) when left out.
   * @returns The new gold mine.
   * @throws When the game returns no handle: `reforged-ts: failed to create Unit`,
   * at the calling line. In Dev mode, also before the globals Init stage and
   * inside `MapPlayer.runLocal`.
   * @native CreateBlightedGoldmine
   */
  public static createBlightedGoldmine(
    owner: MapPlayer,
    x: number,
    y: number,
    face: number = bj_UNIT_FACING,
  ): Unit {
    return this.expect(CreateBlightedGoldmine(owner.handle, x, y, face));
  }

  /**
   * Creates a unit for `owner` from the unit type's order name.
   * @param owner - The player who owns the unit.
   * @param unitName - The unit type's order name, such as `"footman"`.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @param face - The facing, in degrees; 270 (`bj_UNIT_FACING`) when left out.
   * @returns The new unit.
   * @throws When the game returns no handle, for example an unknown name:
   * `reforged-ts: failed to create Unit (<unitName>)`, at the calling line. In Dev
   * mode, also before the globals Init stage and inside `MapPlayer.runLocal`.
   * @native CreateUnitByName
   */
  public static createByName(
    owner: MapPlayer,
    unitName: string,
    x: number,
    y: number,
    face: number = bj_UNIT_FACING,
  ): Unit {
    return this.expect(
      CreateUnitByName(owner.handle, unitName, x, y, face),
      unitName,
    );
  }

  /**
   * Creates the corpse of a unit type for `owner`.
   * @remarks
   * The unit dies as it spawns and plays its decay animation, so it becomes a
   * corpse only once that animation has run.
   * @param owner - The player who owns the corpse.
   * @param unitId - The unit type's rawcode, such as `FourCC("hfoo")`.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @param face - The facing, in degrees; 270 (`bj_UNIT_FACING`) when left out.
   * @returns The new corpse.
   * @throws When the game returns no handle, for example an unknown rawcode or a
   * unit type that leaves no corpse: `reforged-ts: failed to create Unit (<rawcode>)`,
   * at the calling line. In Dev mode, also before the globals Init stage and inside
   * `MapPlayer.runLocal`.
   * @native CreateCorpse
   */
  public static createCorpse(
    owner: MapPlayer,
    unitId: number,
    x: number,
    y: number,
    face: number = bj_UNIT_FACING,
  ): Unit {
    return this.expect(
      CreateCorpse(owner.handle, unitId, x, y, face),
      rawcodeToString(unitId),
    );
  }

  /**
   * The range within which the unit picks targets to engage, in world units;
   * it is not the attack range.
   * @remarks
   * - A unit whose acquire range exceeds its attack range walks up to the
   *   targets it picks, then attacks them.
   * - In the object editor, an acquire range below the attack range caps the
   *   attack range. This setter does not: the attack range, and the value
   *   the UI shows, stay as they were, whatever is often claimed.
   * @native SetUnitAcquireRange
   */
  public set acquireRange(value: number) {
    SetUnitAcquireRange(this.handle, value);
  }

  /**
   * Gets the range within which the unit picks targets to engage, in world units.
   * @returns The current acquire range.
   * @native GetUnitAcquireRange
   */
  public get acquireRange() {
    return GetUnitAcquireRange(this.handle);
  }

  /**
   * Gets the hero's agility without the bonuses of items and buffs.
   * @returns The base agility; 0 for a unit that is not a hero.
   * @native GetHeroAgi
   */
  public get agility() {
    return GetHeroAgi(this.handle, false);
  }

  /**
   * The hero's base agility; the change is permanent.
   * @native SetHeroAgi
   */
  public set agility(value: number) {
    SetHeroAgi(this.handle, value, true);
  }

  /**
   * Gets the unit's armor as it stands, the bonus armor of agility, auras,
   * buffs and items counted in.
   * @returns The total armor.
   * @native BlzGetUnitArmor
   */
  public get armor() {
    return BlzGetUnitArmor(this.handle);
  }

  /**
   * The unit's total armor, which may be negative: the game changes the base armor
   * so that base and bonus armor add up to the value.
   * @native BlzSetUnitArmor
   */
  public set armor(armorAmount: number) {
    BlzSetUnitArmor(this.handle, armorAmount);
  }

  /**
   * Gets the size of the unit's bag, its extended inventory.
   * @returns The number of bag slots.
   * @native UnitExtendedInventorySize
   */
  public get bagSize() {
    return UnitExtendedInventorySize(this.handle);
  }

  /**
   * Whether the unit may sleep at night, as creeps do.
   * @native UnitAddSleep
   */
  public set canSleep(flag: boolean) {
    UnitAddSleep(this.handle, flag);
  }

  /**
   * Gets whether the unit may sleep at night.
   * @returns True when the unit may sleep.
   * @native UnitCanSleep
   */
  public get canSleep() {
    return UnitCanSleep(this.handle);
  }

  /**
   * Gets the radius the unit occupies for collision, in world units: 16 for a
   * Peasant, 48 for a Mountain Giant.
   * @returns The collision size.
   * @native BlzGetUnitCollisionSize
   */
  public get collisionSize() {
    return BlzGetUnitCollisionSize(this.handle);
  }

  /**
   * The team colour accent of the unit's model, such as `PLAYER_COLOR_RED`; the
   * effects attached to the unit take it too.
   * @native SetUnitColor
   */
  public set color(whichColor: playercolor) {
    SetUnitColor(this.handle, whichColor);
  }

  /**
   * Gets the id of the order the unit is carrying out.
   * @returns The order id, or 0 when the unit has no order.
   * @native GetUnitCurrentOrder
   */
  public get currentOrder() {
    return GetUnitCurrentOrder(this.handle);
  }

  /**
   * Gets the acquire range the unit type defines, in world units.
   * @returns The default acquire range.
   * @native GetUnitDefaultAcquireRange
   */
  public get defaultAcquireRange() {
    return GetUnitDefaultAcquireRange(this.handle);
  }

  /**
   * Gets the flying height the unit type defines, in world units.
   * @returns The default flying height.
   * @native GetUnitDefaultFlyHeight
   */
  public get defaultFlyHeight() {
    return GetUnitDefaultFlyHeight(this.handle);
  }

  /**
   * Gets the movement speed the unit type defines, in world units per second.
   * @returns The default movement speed.
   * @native GetUnitDefaultMoveSpeed
   */
  public get defaultMoveSpeed() {
    return GetUnitDefaultMoveSpeed(this.handle);
  }

  /**
   * Gets the unit type's default propulsion window, in degrees.
   * @remarks Unlike the other propulsion window Natives, which take and give
   * radians, this one gives degrees.
   * @returns The default propulsion window, in degrees.
   * @native GetUnitDefaultPropWindow
   */
  public get defaultPropWindow() {
    return GetUnitDefaultPropWindow(this.handle);
  }

  /**
   * Gets the turn rate the unit type defines, its object editor field
   * Movement - Turn Rate.
   * @returns The default turn rate, whatever `turnSpeed` was set to since.
   * @native GetUnitDefaultTurnSpeed
   */
  public get defaultTurnSpeed() {
    return GetUnitDefaultTurnSpeed(this.handle);
  }

  /**
   * Gets the hero's experience points.
   * @returns The experience; 0 for a unit that is not a hero.
   * @native GetHeroXP
   */
  public get experience() {
    return GetHeroXP(this.handle);
  }

  /**
   * The hero's experience points; a level gained this way shows its effects.
   * @native SetHeroXP
   */
  public set experience(newXpVal: number) {
    SetHeroXP(this.handle, newXpVal, true);
  }

  /**
   * The direction the unit turns to face, in degrees (0 east, 90 north); it turns
   * at its turn rate, and a moving unit ignores the change.
   * @native SetUnitFacing
   */
  public set facing(value: number) {
    SetUnitFacing(this.handle, value);
  }

  /**
   * Gets the direction the unit faces, in degrees.
   * @returns The facing, in degrees (0 east, 90 north).
   * @native GetUnitFacing
   */
  public get facing() {
    return GetUnitFacing(this.handle);
  }

  /**
   * Gets the food the unit provides to its owner, such as a farm's.
   * @returns The food provided.
   * @native GetUnitFoodMade
   */
  public get foodMade() {
    return GetUnitFoodMade(this.handle);
  }

  /**
   * Gets the food the unit costs its owner.
   * @returns The food used.
   * @native GetUnitFoodUsed
   */
  public get foodUsed() {
    return GetUnitFoodUsed(this.handle);
  }

  /**
   * Gets whether the unit raises no alarm, the "under attack" warning, when it is attacked.
   * @returns True when the unit raises no alarm.
   * @native UnitIgnoreAlarmToggled
   */
  public get ignoreAlarmToggled() {
    return UnitIgnoreAlarmToggled(this.handle);
  }

  /**
   * Gets the hero's intelligence without the bonuses of items and buffs.
   * @returns The base intelligence; 0 for a unit that is not a hero.
   * @native GetHeroInt
   */
  public get intelligence() {
    return GetHeroInt(this.handle, false);
  }

  /**
   * The hero's base intelligence; the change is permanent.
   * @native SetHeroInt
   */
  public set intelligence(value: number) {
    SetHeroInt(this.handle, value, true);
  }

  /**
   * Gets the number of slots of the unit's inventory.
   * @returns The slot count, from 0 to 6; 0 for a unit with no inventory.
   * @native UnitInventorySize
   */
  public get inventorySize() {
    return UnitInventorySize(this.handle);
  }

  /**
   * Whether the unit is invulnerable; `false` removes only the invulnerability
   * this setter gave.
   * @remarks The Native appears to work through the `'Avul'` ability of the
   * default AbilityData.slk: when a map lacks `'Avul'`, it crashes the game.
   * @native SetUnitInvulnerable
   */
  public set invulnerable(flag: boolean) {
    SetUnitInvulnerable(this.handle, flag);
  }

  /**
   * Gets whether the unit is invulnerable.
   * @returns True when the unit is invulnerable.
   * @native BlzIsUnitInvulnerable
   */
  public get invulnerable() {
    return BlzIsUnitInvulnerable(this.handle);
  }

  /**
   * Gets whether the hero glow may show on the unit.
   * @returns True when the hero glow is allowed.
   * @native HeroGlowIsAllowedOnUnit
   */
  public get isHeroGlowAllowed() {
    return HeroGlowIsAllowedOnUnit(this.handle);
  }

  /**
   * Gets the unit's level: the level its type defines, or a hero's current level.
   * @returns The level.
   * @native GetUnitLevel
   */
  public get level() {
    return GetUnitLevel(this.handle);
  }

  /**
   * Gets the height of the unit's position, as the local client sees it.
   * @remarks
   * The value can differ between clients: never let it decide game state. It is
   * the same value as `z` today.
   * @returns The height, in world units.
   * @native BlzGetLocalUnitZ
   * @async
   */
  public get localZ() {
    return BlzGetLocalUnitZ(this.handle);
  }

  /**
   * Gets the mana the unit has left to cast its abilities with, from 0 up to
   * `maxMana`.
   * @returns The current mana; 0 for a unit without mana.
   * @native GetUnitState
   */
  public get mana() {
    return this.getState(UNIT_STATE_MANA);
  }

  /**
   * The mana the unit has left to cast its abilities with; the game keeps
   * the value between 0 and `maxMana`.
   * @native SetUnitState
   */
  public set mana(value: number) {
    this.setState(UNIT_STATE_MANA, value);
  }

  /**
   * Gets the most life the unit can have, the full length of its health bar.
   * @returns The maximum life, a whole number of hit points.
   * @native BlzGetUnitMaxHP
   */
  public get maxLife() {
    return BlzGetUnitMaxHP(this.handle);
  }

  /**
   * The most life the unit can have, the full length of its health bar, as a
   * whole number of hit points.
   * @native BlzSetUnitMaxHP
   */
  public set maxLife(value: number) {
    BlzSetUnitMaxHP(this.handle, value);
  }

  /**
   * Gets the most mana the unit can have, the full length of its mana bar.
   * @returns The maximum mana, a whole number; 0 for a unit without mana.
   * @native BlzGetUnitMaxMana
   */
  public get maxMana() {
    return BlzGetUnitMaxMana(this.handle);
  }

  /**
   * The most mana the unit can have, the full length of its mana bar, as a
   * whole number.
   * @native BlzSetUnitMaxMana
   */
  public set maxMana(value: number) {
    BlzSetUnitMaxMana(this.handle, value);
  }

  /**
   * The unit's movement speed, in world units per second.
   * @native SetUnitMoveSpeed
   */
  public set moveSpeed(value: number) {
    SetUnitMoveSpeed(this.handle, value);
  }

  /**
   * Gets the unit's movement speed, in world units per second.
   * @returns The movement speed.
   * @native GetUnitMoveSpeed
   */
  public get moveSpeed() {
    return GetUnitMoveSpeed(this.handle);
  }

  /**
   * Gets the unit's name as the local client's language shows it.
   * @remarks
   * The value can differ between clients: never let it decide game state.
   * @returns The localized name, or an empty string when the game returns none.
   * @native GetUnitName
   * @async
   */
  get name() {
    return GetUnitName(this.handle) ?? "";
  }

  /**
   * The unit's own name, which replaces its type's name at once.
   * @native BlzSetUnitName
   * @bug Setting an empty name crashes the game.
   */
  set name(value: string) {
    BlzSetUnitName(this.handle, value);
  }

  /**
   * The hero's proper name, the name shown above its experience bar.
   * @native BlzSetHeroProperName
   */
  public set nameProper(value: string) {
    BlzSetHeroProperName(this.handle, value);
  }

  /**
   * Gets the hero's proper name, the name shown above its experience bar.
   * @remarks
   * The Native gives `null` for a unit that is not a hero, and for an
   * illusion.
   * @returns The proper name, or an empty string for a unit that is not a hero or an illusion.
   * @native GetHeroProperName
   */
  public get nameProper() {
    return GetHeroProperName(this.handle) ?? "";
  }

  /**
   * Gets the number of orders the unit has, the current one and the queued ones.
   * @returns The order count.
   * @native BlzGetUnitOrderCount
   */
  public get orderCount() {
    return BlzGetUnitOrderCount(this.handle);
  }

  /**
   * Whether the unit is paused.
   * @remarks
   * While paused, a unit:
   * - has its buffs and effects on hold;
   * - keeps the orders it is given and carries them out once unpaused;
   * - takes no powerups: `addItem` returns true, yet the item stays where
   *   it was.
   * @native PauseUnit
   */
  public set paused(flag: boolean) {
    PauseUnit(this.handle, flag);
  }

  /**
   * Gets whether the unit is paused.
   * @returns True when the `paused` setter paused the unit; `pauseEx` leaves it false.
   * @native IsUnitPaused
   */
  public get paused() {
    return IsUnitPaused(this.handle);
  }

  /**
   * Gets the point value the unit type defines, which the score screen counts.
   * @returns The point value.
   * @native GetUnitPointValue
   */
  public get pointValue() {
    return GetUnitPointValue(this.handle);
  }

  /**
   * The unit's propulsion window, in radians: how far its facing may be from
   * the direction of an order's target (move, attack, patrol, smart) for it
   * to start moving at once; further off, it turns without moving first.
   * @remarks
   * - At 0 the unit cannot move at all, so it cannot attack either. At the
   *   full 180 degrees it moves off as soon as it gets an order that needs
   *   movement.
   * - Source: http://www.hiveworkshop.com/forums/2391397-post20.html
   * @native SetUnitPropWindow
   */
  public set propWindow(newPropWindowAngle: number) {
    SetUnitPropWindow(this.handle, newPropWindowAngle);
  }

  /**
   * Gets the unit's propulsion window, in radians.
   * @returns The propulsion window, in radians.
   * @native GetUnitPropWindow
   */
  public get propWindow() {
    return GetUnitPropWindow(this.handle);
  }

  /**
   * Gets the race of the unit's type.
   * @returns The race, such as `RACE_HUMAN`.
   * @native GetUnitRace
   */
  public get race() {
    return GetUnitRace(this.handle);
  }

  /**
   * Gets the destructable the unit's rally point is set on.
   * @returns The destructable, or `undefined` when the rally point is not on a destructable.
   * @native GetUnitRallyDestructable
   */
  public get rallyDestructable(): Destructable | undefined {
    return Destructable.fromHandle(GetUnitRallyDestructable(this.handle));
  }

  /**
   * The unit's rally point, or undefined for a unit that has none: a lookup,
   * although the game allocates a new location each time it returns one.
   * @returns The rally point, or `undefined` when the unit has none.
   * @native GetUnitRallyPoint
   */
  public get rallyPoint(): Point | undefined {
    return Point.fromHandle(GetUnitRallyPoint(this.handle));
  }

  /**
   * Gets the unit the unit's rally point is set on.
   * @returns The unit, or `undefined` when the rally point is not on a unit.
   * @native GetUnitRallyUnit
   */
  public get rallyUnit(): Unit | undefined {
    return Unit.fromHandle(GetUnitRallyUnit(this.handle));
  }

  /**
   * The gold left in the gold mine; a negative amount counts as 0.
   * @native SetResourceAmount
   */
  public set resourceAmount(amount: number) {
    SetResourceAmount(this.handle, amount);
  }

  /**
   * Gets the gold left in the gold mine.
   * @returns The gold amount; 0 for a unit that is not a gold mine.
   * @native GetResourceAmount
   */
  public get resourceAmount() {
    return GetResourceAmount(this.handle);
  }

  /**
   * Gets whether a player can select the unit.
   * @returns True when the unit is selectable.
   * @native BlzIsUnitSelectable
   */
  public get selectable() {
    return BlzIsUnitSelectable(this.handle);
  }

  /**
   * The scale of the unit's selection circle, where 1 is its type's size.
   * @native BlzSetUnitRealField
   */
  public set selectionScale(scale: number) {
    this.setField(UNIT_RF_SELECTION_SCALE, scale);
  }

  /**
   * Gets the scale of the unit's selection circle.
   * @returns The selection scale, or 0 when the game returns none.
   * @native BlzGetUnitRealField
   */
  public get selectionScale() {
    const result = this.getField(UNIT_RF_SELECTION_SCALE);
    return typeof result === "number" ? result : 0;
  }

  /**
   * Whether the unit is shown; a hidden unit is not drawn, cannot be selected and
   * takes no part in the game until it is shown again.
   * @native ShowUnit
   */
  public set show(flag: boolean) {
    ShowUnit(this.handle, flag);
  }

  /**
   * Gets whether the unit is shown.
   * @returns True when the unit is shown, false when it is hidden.
   * @native IsUnitHidden
   */
  public get show() {
    return !IsUnitHidden(this.handle);
  }

  /**
   * Gets the rawcode of the unit type whose model the unit uses.
   * @returns The skin's rawcode.
   * @native BlzGetUnitSkin
   */
  public get skin() {
    return BlzGetUnitSkin(this.handle);
  }

  /**
   * The rawcode of the unit type whose model, scale and sounds the unit uses; a
   * change removes every effect attached to the unit.
   * @native BlzSetUnitSkin
   */
  public set skin(skinId: number) {
    BlzSetUnitSkin(this.handle, skinId);
  }

  /**
   * Gets the hero's unspent skill points.
   * @returns The unspent skill points; 0 for a unit that is not a hero.
   * @native GetHeroSkillPoints
   */
  public get skillPoints() {
    return GetHeroSkillPoints(this.handle);
  }

  /**
   * Adds `skillPointDelta` to the hero's unspent skill points; a negative
   * delta takes that many away.
   * @remarks
   * - The hero gains no more points than it has left to spend: 9 at most
   *   for three abilities of 3 levels each.
   * - The Native reports false when the hero has no unspent point and the
   *   delta is 0 or less, and true otherwise; the setter drops that result.
   * @native UnitModifySkillPoints
   */
  public set skillPoints(skillPointDelta: number) {
    UnitModifySkillPoints(this.handle, skillPointDelta);
  }

  /**
   * Gets whether the unit is asleep.
   * @returns True when the unit sleeps.
   * @native UnitIsSleeping
   */
  public get sleeping() {
    return UnitIsSleeping(this.handle);
  }

  /**
   * Gets the hero's strength without the bonuses of items and buffs.
   * @returns The base strength; 0 for a unit that is not a hero.
   * @native GetHeroStr
   */
  public get strength() {
    return GetHeroStr(this.handle, false);
  }

  /**
   * The hero's base strength; the change is permanent, and lowering it lowers the
   * hero's life.
   * @native SetHeroStr
   */
  public set strength(value: number) {
    SetHeroStr(this.handle, value, true);
  }

  /**
   * How fast the unit turns to a new facing, on the scale of the object
   * editor field Movement - Turn Rate: a higher value turns faster.
   * @native SetUnitTurnSpeed
   */
  public set turnSpeed(value: number) {
    SetUnitTurnSpeed(this.handle, value);
  }

  /**
   * Gets how fast the unit turns to a new facing: a higher value turns
   * faster.
   * @returns The turn rate, on the scale of the object editor field
   * Movement - Turn Rate.
   * @native GetUnitTurnSpeed
   */
  public get turnSpeed() {
    return GetUnitTurnSpeed(this.handle);
  }

  /**
   * Gets the rawcode of the unit's type.
   * @returns The rawcode, such as `FourCC("hfoo")`.
   * @native GetUnitTypeId
   */
  public get typeId() {
    return GetUnitTypeId(this.handle);
  }

  /**
   * Gets the custom integer stored on the unit.
   * @returns The value, 0 until one is set.
   * @native GetUnitUserData
   */
  public get userData() {
    return GetUnitUserData(this.handle);
  }

  /**
   * A custom integer the unit carries for the map's own use.
   * @remarks No mechanism of the game reads it.
   * @native SetUnitUserData
   */
  public set userData(value: number) {
    SetUnitUserData(this.handle, value);
  }

  /**
   * Whether the unit works as a waygate; it needs the Waygate ability (`'Awrp'`).
   * @native WaygateActivate
   */
  public set waygateActive(flag: boolean) {
    WaygateActivate(this.handle, flag);
  }

  /**
   * Gets whether the unit works as a waygate.
   * @returns True when the unit has the Waygate ability and is activated.
   * @native WaygateIsActive
   */
  public get waygateActive() {
    return WaygateIsActive(this.handle);
  }

  /**
   * Gets the unit's x-coordinate, alive or dead.
   * @returns The x-coordinate, in world units.
   * @native GetUnitX
   * @bug For a unit loaded into a zeppelin, it returns where the unit boarded,
   * not the zeppelin's position.
   */
  public override get x() {
    return GetUnitX(this.handle);
  }

  /**
   * The unit's x-coordinate: the unit moves at once, ignoring pathing.
   * @remarks
   * - A unit with a movement speed of 0 is moved, but its model stays where
   *   it was.
   * - The unit keeps its orders; `setPosition` cancels them.
   * @native SetUnitX
   */
  public override set x(value: number) {
    SetUnitX(this.handle, value);
  }

  /**
   * Gets the unit's y-coordinate, alive or dead.
   * @returns The y-coordinate, in world units.
   * @native GetUnitY
   * @bug For a unit loaded into a zeppelin, it returns where the unit boarded,
   * not the zeppelin's position.
   */
  public override get y() {
    return GetUnitY(this.handle);
  }

  /**
   * The unit's y-coordinate: the unit moves at once, ignoring pathing.
   * @remarks
   * - A unit with a movement speed of 0 is moved, but its model stays where
   *   it was.
   * - The unit keeps its orders; `setPosition` cancels them.
   * @native SetUnitY
   */
  public override set y(value: number) {
    SetUnitY(this.handle, value);
  }

  /**
   * Gets the height of the unit's position: the ground, water or walkable
   * destructable below it plus the unit's own height.
   * @remarks
   * The value can differ between clients: never let it decide game state.
   * @returns The height, in world units.
   * @native BlzGetUnitZ
   * @async
   */
  public get z() {
    return BlzGetUnitZ(this.handle);
  }

  /**
   * Adds an ability to the unit, at level 1 and off cooldown.
   * @param abilityId - The ability's rawcode, such as `FourCC("AHbz")`.
   * @returns True when the ability was added, false when the unit already has it.
   * @native UnitAddAbility
   */
  public addAbility(abilityId: number) {
    return UnitAddAbility(this.handle, abilityId);
  }

  /**
   * Adjusts the remaining cooldown of one of the unit's abilities by a share of its full cooldown.
   * @param abilId - The ability's rawcode.
   * @param delta - The share of the full cooldown to add; negative to shorten the cooldown.
   * @native BlzAdjustUnitAbilityCooldownPercent
   */
  public adjustAbilityCooldownPercent(abilId: number, delta: number) {
    BlzAdjustUnitAbilityCooldownPercent(this.handle, abilId, delta);
  }

  /**
   * Adjusts the remaining cooldown of one of the unit's abilities by a number of seconds.
   * @param abilId - The ability's rawcode.
   * @param delta - The seconds to add; negative to shorten the cooldown.
   * @native BlzAdjustUnitAbilityCooldownRemaining
   */
  public adjustAbilityCooldownRemaining(abilId: number, delta: number) {
    BlzAdjustUnitAbilityCooldownRemaining(this.handle, abilId, delta);
  }

  /**
   * Adds or removes animation tags, such as `"alternate"` or `"defend"`, that the
   * game adds to every animation the unit plays.
   * @param animProperties - The tags, separated by spaces.
   * @param add - True to add the tags, false to remove them.
   * @native AddUnitAnimationProperties
   */
  public addAnimationProps(animProperties: string, add: boolean) {
    AddUnitAnimationProperties(this.handle, animProperties, add);
  }

  /**
   * Gives the hero experience; beyond what a level needs, the hero gains that
   * level and the rest carries over to the next one.
   * @param xpToAdd - The experience points to add, a whole number.
   * @param showEyeCandy - `true` to show the level-up effect when the hero
   * gains a level.
   * @native AddHeroXP
   * @bug A negative amount takes that much experience away, but the hero
   * keeps its level, even with less experience than the level needs.
   * @bug Experience does not go below zero: a result under zero wraps around
   * to `4294967296` plus that negative result.
   */
  public addExperience(xpToAdd: number, showEyeCandy: boolean) {
    AddHeroXP(this.handle, xpToAdd, showEyeCandy);
  }

  /**
   * Flashes a coloured indicator on the unit, as the game does on a unit that is attacked.
   * @param red - The red component, from 0 to 255.
   * @param green - The green component, from 0 to 255.
   * @param blue - The blue component, from 0 to 255.
   * @param alpha - The opacity, from 0 (invisible) to 255 (opaque).
   * @native UnitAddIndicator
   */
  public override addIndicator(
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ) {
    UnitAddIndicator(this.handle, red, green, blue, alpha);
  }

  /**
   * Puts an item in the unit's inventory.
   * @param whichItem - The item to put in the inventory.
   * @returns True when the item is now in the inventory, it was already there
   * included; false when the unit has no inventory or no free slot.
   * @native UnitAddItem
   */
  public addItem(whichItem: Item) {
    return UnitAddItem(this.handle, whichItem.handle);
  }

  /**
   * Creates an item of a type in the unit's inventory.
   * @remarks
   * When the inventory is full or the unit cannot carry items, the game drops the
   * new item at the unit's feet and returns nothing, so this throws although an
   * item was created.
   * @param itemId - The item type's rawcode, such as `FourCC("rde1")`.
   * @returns The new item.
   * @throws When the game returns no handle, for example an unknown rawcode or a
   * full inventory: `reforged-ts: failed to create Item (<rawcode>)`, at the calling
   * line. In Dev mode, also before the globals Init stage and inside
   * `MapPlayer.runLocal`.
   * @native UnitAddItemById
   */
  public addItemById(itemId: number): Item {
    return Item.expect(
      UnitAddItemById(this.handle, itemId),
      rawcodeToString(itemId),
    );
  }

  /**
   * Creates an item of a type in one slot of the unit's inventory.
   * @remarks
   * When the slot is taken or does not exist, the game drops the new item at the
   * unit's feet.
   * @param itemId - The item type's rawcode, such as `FourCC("rde1")`.
   * @param itemSlot - The slot, from 0 to 5.
   * @returns True when the item landed in the slot.
   * @native UnitAddItemToSlotById
   */
  public addItemToSlotById(itemId: number, itemSlot: number) {
    return UnitAddItemToSlotById(this.handle, itemId, itemSlot);
  }

  /**
   * Adds an item type to the stock of the shop.
   * @param itemId - The item type's rawcode.
   * @param currentStock - The number of items in stock now.
   * @param stockMax - The most items the stock holds.
   * @native AddItemToStock
   */
  public addItemToStock(
    itemId: number,
    currentStock: number,
    stockMax: number,
  ) {
    AddItemToStock(this.handle, itemId, currentStock, stockMax);
  }

  /**
   * Adds gold to the gold mine; a negative amount takes gold away.
   * @param amount - The gold to add, a whole number.
   * @native AddResourceAmount
   * @bug A total under zero shows as a negative amount, but a worker who then
   * gathers from the mine brings back no gold, and the mine is destroyed.
   */
  public addResourceAmount(amount: number) {
    AddResourceAmount(this.handle, amount);
  }

  /**
   * Sets whether the unit sleeps at all times, by day as well as at night.
   * @param add - True to make the unit sleep at all times.
   * @native UnitAddSleepPerm
   */
  public addSleepPerm(add: boolean) {
    UnitAddSleepPerm(this.handle, add);
  }

  /**
   * Adds a classification to the unit, such as `UNIT_TYPE_UNDEAD`.
   * @param whichUnitType - The classification to add.
   * @returns True when the game added it.
   * @native UnitAddType
   */
  public addType(whichUnitType: unittype) {
    return UnitAddType(this.handle, whichUnitType);
  }

  /**
   * Adds a unit type to the stock of the shop.
   * @param unitId - The unit type's rawcode.
   * @param currentStock - The number of units in stock now.
   * @param stockMax - The most units the stock holds.
   * @native AddUnitToStock
   */
  public addUnitToStock(
    unitId: number,
    currentStock: number,
    stockMax: number,
  ) {
    AddUnitToStock(this.handle, unitId, currentStock, stockMax);
  }

  /**
   * Allows or disallows the hero glow on the unit.
   * @param allow - True to allow the glow, false to disallow it.
   * @native AllowHeroGlowOnUnit
   * @native DisallowHeroGlowOnUnit
   */
  public allowHeroGlow(allow: boolean) {
    if (allow) {
      AllowHeroGlowOnUnit(this.handle);
    } else {
      DisallowHeroGlowOnUnit(this.handle);
    }
  }

  /**
   * Gives the unit a timed life: it dies once the duration has passed, and its
   * interface shows the time left.
   * @param buffId - The timed-life buff's rawcode, such as `FourCC("BTLF")` (the
   * generic one); an unknown buff falls back to it.
   * @param duration - The time left to live, in seconds.
   * @native UnitApplyTimedLife
   */
  public applyTimedLife(buffId: number, duration: number) {
    UnitApplyTimedLife(this.handle, buffId, duration);
  }

  /**
   * Attaches a 3D sound to the unit, so that it plays from the unit's position.
   * @param sound - The sound, which must have been created as a 3D sound.
   * @native AttachSoundToUnit
   */
  public attachSound(sound: Sound) {
    AttachSoundToUnit(sound.handle, this.handle);
  }

  /**
   * Gets the item in one slot of the unit's bag, its extended inventory.
   * @param index - The bag slot, from 0.
   * @returns The item, or `undefined` when the slot is empty.
   * @native UnitItemInBagSlot
   */
  public bagItem(index: number): Item | undefined {
    return Item.fromHandle(UnitItemInBagSlot(this.handle, index));
  }

  /**
   * Removes the unit's timed life, which kills it; does nothing to a unit without one.
   * @native BlzUnitCancelTimedLife
   */
  public cancelTimedLife() {
    BlzUnitCancelTimedLife(this.handle);
  }

  /**
   * Checks whether the unit can equip items of an equipment type.
   * @param equipmentType - The equipment type.
   * @returns True when the unit can equip such items.
   * @native UnitCanEquipItemOfEquipmentType
   * @native ConvertEquipmentType
   */
  public canEquip(equipmentType: EquipmentType) {
    return UnitCanEquipItemOfEquipmentType(
      this.handle,
      ConvertEquipmentType(equipmentType),
    );
  }

  /**
   * Checks whether the unit sleeps at all times, by day as well as at night.
   * @returns True when the unit sleeps at all times.
   * @native UnitCanSleepPerm
   */
  public canSleepPerm() {
    return UnitCanSleepPerm(this.handle);
  }

  /**
   * Counts the buffs on the unit that match the filters.
   * @remarks
   * The filters combine differently here than in `removeBuffsEx`: see
   * [the Native's reference](https://lep.duckdns.org/jassbot/doc/UnitCountBuffsEx).
   * @param removePositive - Counts positive buffs; with `removeNegative`, both
   * false counts positive and negative buffs.
   * @param removeNegative - Counts negative buffs.
   * @param magic - Counts only magical buffs, unless `physical` is true too, which
   * matches none; both false counts magical and physical buffs.
   * @param physical - Counts only physical buffs, unless `magic` is true too.
   * @param timedLife - Includes timed-life buffs; false leaves them out.
   * @param aura - Includes aura buffs; false leaves them out.
   * @param autoDispel - Counts only the buffs that dispelling removes.
   * @returns The number of matching buffs.
   * @native UnitCountBuffsEx
   */
  public countBuffs(
    removePositive: boolean,
    removeNegative: boolean,
    magic: boolean,
    physical: boolean,
    timedLife: boolean,
    aura: boolean,
    autoDispel: boolean,
  ) {
    return UnitCountBuffsEx(
      this.handle,
      removePositive,
      removeNegative,
      magic,
      physical,
      timedLife,
      aura,
      autoDispel,
    );
  }

  /**
   * Deals damage from the unit to everything in a circle, after a delay.
   * @param delay - The delay before the damage, in seconds.
   * @param radius - The circle's radius, in world units.
   * @param x - The x-coordinate of the circle's centre, in world units.
   * @param y - The y-coordinate of the circle's centre, in world units.
   * @param amount - The damage dealt to each target.
   * @param attack - Deals the damage as an attack.
   * @param ranged - Deals the damage as a ranged one.
   * @param attackType - The attack type, such as `ATTACK_TYPE_NORMAL`.
   * @param damageType - The damage type, such as `DAMAGE_TYPE_NORMAL`.
   * @param weaponType - The weapon type, which picks the impact sound, such as
   * `WEAPON_TYPE_WHOKNOWS`.
   * @returns True when the game scheduled the damage.
   * @native UnitDamagePoint
   */
  public damageAt(
    delay: number,
    radius: number,
    x: number,
    y: number,
    amount: number,
    attack: boolean,
    ranged: boolean,
    attackType: attacktype,
    damageType: damagetype,
    weaponType: weapontype,
  ) {
    return UnitDamagePoint(
      this.handle,
      delay,
      radius,
      x,
      y,
      amount,
      attack,
      ranged,
      attackType,
      damageType,
      weaponType,
    );
  }

  /**
   * Makes the unit deal damage to a widget.
   * @remarks
   * Dealing damage inside a damage handler fires the damage events again, so
   * a handler that damages back without a stop loops until the client
   * crashes. In Dev mode every action and condition of a Trigger carrying a
   * damage event (an `on()` damage subscription included) runs one level
   * deeper in a shared damage depth, and this member raises
   * `reforged-ts: Unit#<id> Unit.damageTarget at damage depth <depth>, past the limit of <limit>: ...`
   * when the depth exceeds the limit: eight nested dispatches by default,
   * `Reforged.configure({ damageDepthLimit })` to change it. A single bounce
   * (reflect damage) passes. With Dev mode off nothing is counted and nothing
   * raises.
   *
   * How the attack, damage and weapon types combine is explained in
   * [this wc3c post](http://www.wc3c.net/showpost.php?p=1030046&postcount=19).
   * @param target - The unit, item or destructable that takes the damage.
   * @param amount - The damage to deal, before the target's armor and the
   * attack and damage types change it.
   * @param attack - `true` to count the damage as an attack.
   * @param ranged - `true` to count the damage as coming from range.
   * @param attackType - The attack type, such as `ATTACK_TYPE_NORMAL`.
   * @param damageType - The damage type, such as `DAMAGE_TYPE_NORMAL`.
   * @param weaponType - The weapon type, which picks the impact sound, such as
   * `WEAPON_TYPE_WHOKNOWS`.
   * @returns True when the game dealt the damage.
   * @throws In Dev mode, past the damage depth limit:
   * `reforged-ts: Unit#<id> Unit.damageTarget at damage depth <depth>, past the limit of <limit>: ...`
   * @native UnitDamageTarget
   */
  public damageTarget(
    target: widget,
    amount: number,
    attack: boolean,
    ranged: boolean,
    attackType: attacktype,
    damageType: damagetype,
    weaponType: weapontype,
  ) {
    if (configuration.devMode) {
      assertDamageDepth(this, 2);
    }
    return UnitDamageTarget(
      this.handle,
      target,
      amount,
      attack,
      ranged,
      attackType,
      damageType,
      weaponType,
    );
  }

  /**
   * Lowers one of the unit's abilities by one level, down to level 1 at
   * least.
   * @param abilCode - The ability's rawcode, such as `FourCC("AHbz")`.
   * @returns The new ability level.
   * @native DecUnitAbilityLevel
   */
  public decAbilityLevel(abilCode: number) {
    return DecUnitAbilityLevel(this.handle, abilCode);
  }

  /**
   * Instantly removes the unit from the game.
   * @remarks
   * In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
   * a second `destroy()` included, raises
   * `reforged-ts: used after destroy: <Class>#<id>`, and
   * `Reforged.debug.report()` counts it destroyed.
   * @throws In Dev mode, inside `MapPlayer.runLocal`:
   * `reforged-ts: destroying Unit#<id> inside MapPlayer.runLocal changes game state for one client, which desyncs the game: only visuals belong inside runLocal`
   * @native RemoveUnit
   */
  public destroy() {
    RemoveUnit(this.handle);
    this.release();
  }

  /**
   * Disables or enables one of the unit's abilities, and hides or shows its icon.
   * @remarks
   * A disabled ability that stays visible shows its disabled icon.
   * @param abilId - The ability's rawcode.
   * @param flag - True to disable the ability, false to enable it.
   * @param hideUI - True to hide the ability's icon, false to show it.
   * @native BlzUnitDisableAbility
   * @bug The game counts the calls instead of storing the flags: after hiding an
   * icon several times, as many calls are needed to show it again
   * ([report](https://www.hiveworkshop.com/threads/blzunithideability-and-blzunitdisableability-dont-work.312477/)).
   */
  public disableAbility(abilId: number, flag: boolean, hideUI: boolean) {
    BlzUnitDisableAbility(this.handle, abilId, flag, hideUI);
  }

  /**
   * Orders the unit to walk to a point and drop one of its items there.
   * @remarks
   * A unit that cannot reach the point stops as close as it gets and keeps the item.
   * @param whichItem - The item, in the unit's inventory.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @returns True when the unit carries the item and took the order.
   * @native UnitDropItemPoint
   */
  public dropItem(whichItem: Item, x: number, y: number) {
    return UnitDropItemPoint(this.handle, whichItem.handle, x, y);
  }

  /**
   * Moves one of the unit's items to another slot of its inventory, swapping it
   * with the item already there.
   * @param whichItem - The item, in the unit's inventory.
   * @param slot - The slot to move it to, from 0 to 5.
   * @returns True when the item was moved, or was already in that slot.
   * @native UnitDropItemSlot
   */
  public dropItemFromSlot(whichItem: Item, slot: number) {
    return UnitDropItemSlot(this.handle, whichItem.handle, slot);
  }

  /**
   * Orders the unit to walk to a target and give it one of its items.
   * @remarks
   * A target with no free inventory slot gets the item dropped at its feet. A unit
   * that cannot reach the target stops as close as it gets and keeps the item.
   * @param whichItem - The item, in the unit's inventory.
   * @param target - The widget to give the item to, usually a unit.
   * @returns True when the unit carries the item and took the order.
   * @native UnitDropItemTarget
   */
  public dropItemTarget(
    whichItem: Item,
    target: Widget /* | Unit | Item | Destructable */,
  ) {
    return UnitDropItemTarget(this.handle, whichItem.handle, target.handle);
  }

  /**
   * Enables or disables the unit's auras.
   * @param enable - True to enable the auras, false to disable them.
   * @param affectsUI - Whether the change also shows in the unit's interface.
   * @native BlzUnitEnableAuras
   */
  public enableAuras(enable: boolean, affectsUI: boolean) {
    BlzUnitEnableAuras(this.handle, enable, affectsUI);
  }

  /**
   * Ends the cooldown of one of the unit's abilities at once.
   * @param abilCode - The ability's rawcode.
   * @native BlzEndUnitAbilityCooldown
   */
  public endAbilityCooldown(abilCode: number) {
    BlzEndUnitAbilityCooldown(this.handle, abilCode);
  }

  /**
   * Equips an item on the unit.
   * @param whichItem - The item to equip.
   * @returns True when the item was equipped.
   * @native UnitEquipItem
   */
  public equip(whichItem: Item): boolean {
    return UnitEquipItem(this.handle, whichItem.handle);
  }

  /**
   * Gets the item equipped in one of the unit's loadout slots.
   * @param slot - The loadout slot.
   * @returns The item, or `undefined` when the slot is empty.
   * @native UnitItemInEquipmentSlot
   * @native ConvertLoadoutSlot
   */
  public equippedItem(slot: LoadoutSlot): Item | undefined {
    return Item.fromHandle(
      UnitItemInEquipmentSlot(this.handle, ConvertLoadoutSlot(slot)),
    );
  }

  /**
   * Gets the unit's instance of an ability, for the ability Natives.
   * @param abilId - The ability's rawcode.
   * @returns The game's `ability` Handle, or `undefined` when the unit lacks the ability.
   * @native BlzGetUnitAbility
   */
  public getAbility(abilId: number) {
    return BlzGetUnitAbility(this.handle, abilId);
  }

  /**
   * Gets one of the unit's ability instances by its index, buffs included.
   * @param index - The index, from 0: the ability added last is at 0.
   * @returns The game's `ability` Handle, or `undefined` past the last index.
   * @native BlzGetUnitAbilityByIndex
   */
  public getAbilityByIndex(index: number) {
    return BlzGetUnitAbilityByIndex(this.handle, index);
  }

  /**
   * Gets the full cooldown of one of the unit's abilities at a level, not the time remaining.
   * @param abilId - The ability's rawcode.
   * @param level - The ability level, counted from 0 (level 1 is 0).
   * @returns The cooldown, in seconds.
   * @native BlzGetUnitAbilityCooldown
   */
  public getAbilityCooldown(abilId: number, level: number) {
    return BlzGetUnitAbilityCooldown(this.handle, abilId, level);
  }

  /**
   * Gets the remaining cooldown of one of the unit's abilities as a share of its full cooldown.
   * @param abilId - The ability's rawcode.
   * @returns The share of the cooldown left.
   * @native BlzGetUnitAbilityCooldownPercent
   */
  public getAbilityCooldownPercent(abilId: number) {
    return BlzGetUnitAbilityCooldownPercent(this.handle, abilId);
  }

  /**
   * Gets the remaining cooldown of one of the unit's abilities.
   * @param abilId - The ability's rawcode.
   * @returns The time left, in seconds; 0 when the ability is ready.
   * @native BlzGetUnitAbilityCooldownRemaining
   * @bug During the cooldown of an ability built on Channel, it sometimes
   * gives 0.
   */
  public getAbilityCooldownRemaining(abilId: number) {
    return BlzGetUnitAbilityCooldownRemaining(this.handle, abilId);
  }

  /**
   * Gets the level the unit has in one of its abilities.
   * @remarks Levels count from 1, not from 0.
   * @param abilCode - The ability's rawcode.
   * @returns The level, from 1; 0 when the unit lacks the ability.
   * @native GetUnitAbilityLevel
   */
  public getAbilityLevel(abilCode: number) {
    return GetUnitAbilityLevel(this.handle, abilCode);
  }

  /**
   * Gets the mana cost of one of the unit's abilities at a level.
   * @param abilId - The ability's rawcode.
   * @param level - The ability level, counted from 0 (level 1 is 0).
   * @returns The mana cost.
   * @native BlzGetUnitAbilityManaCost
   */
  public getAbilityManaCost(abilId: number, level: number) {
    return BlzGetUnitAbilityManaCost(this.handle, abilId, level);
  }

  /**
   * Gets the hero's agility.
   * @param includeBonuses - True to add the bonuses of items and buffs.
   * @returns The agility; 0 for a unit that is not a hero.
   * @native GetHeroAgi
   */
  public getAgility(includeBonuses: boolean) {
    return GetHeroAgi(this.handle, includeBonuses);
  }

  /**
   * Gets the duration of one of the animations of the unit's model.
   * @param animation - The animation's name, or its index in the model.
   * @returns The duration, in seconds.
   * @native BlzGetUnitAnimationDuration
   * @native BlzGetUnitAnimationDurationByIndex
   */
  public getAnimationDuration(animation: string | number) {
    if (typeof animation === "string") {
      return BlzGetUnitAnimationDuration(this.handle, animation);
    }
    return BlzGetUnitAnimationDurationByIndex(this.handle, animation);
  }

  /**
   * Gets the base cooldown of one of the unit's attacks, without the bonuses of
   * items, agility and buffs.
   * @param weaponIndex - The attack, 0 or 1.
   * @returns The cooldown, in seconds.
   * @native BlzGetUnitAttackCooldown
   */
  public getAttackCooldown(weaponIndex: number) {
    return BlzGetUnitAttackCooldown(this.handle, weaponIndex);
  }

  /**
   * Gets the base damage of one of the unit's attacks, added to the dice roll.
   * @param weaponIndex - The attack, 0 or 1.
   * @returns The base damage.
   * @native BlzGetUnitBaseDamage
   */
  public getBaseDamage(weaponIndex: number) {
    return BlzGetUnitBaseDamage(this.handle, weaponIndex);
  }

  /**
   * Gets the number of dice one of the unit's attacks rolls for its damage.
   * @param weaponIndex - The attack, 0 or 1.
   * @returns The number of dice.
   * @native BlzGetUnitDiceNumber
   */
  public getDiceNumber(weaponIndex: number) {
    return BlzGetUnitDiceNumber(this.handle, weaponIndex);
  }

  /**
   * Gets the number of sides of the dice one of the unit's attacks rolls for its damage.
   * @param weaponIndex - The attack, 0 or 1.
   * @returns The number of sides.
   * @native BlzGetUnitDiceSides
   */
  public getDiceSides(weaponIndex: number) {
    return BlzGetUnitDiceSides(this.handle, weaponIndex);
  }

  /**
   * Reads one of the unit's fields, through the Native of the field's type.
   * @remarks
   * Many fields do not work: the game ignores them.
   * @param field - A field constant of any of the four types, such as `UNIT_RF_SELECTION_SCALE`.
   * @returns The field's value, as a boolean, a number or a string, or 0 for a
   * constant of no known field type.
   * @native BlzGetUnitBooleanField
   * @native BlzGetUnitIntegerField
   * @native BlzGetUnitRealField
   * @native BlzGetUnitStringField
   */
  public getField(
    field:
      unitbooleanfield | unitintegerfield | unitrealfield | unitstringfield,
  ) {
    const fieldType = handleTypeOf(field);

    switch (fieldType) {
      case "unitbooleanfield": {
        const fieldBool: unitbooleanfield = field as unitbooleanfield;

        return BlzGetUnitBooleanField(this.handle, fieldBool);
      }
      case "unitintegerfield": {
        const fieldInt: unitintegerfield = field as unitintegerfield;

        return BlzGetUnitIntegerField(this.handle, fieldInt);
      }
      case "unitrealfield": {
        const fieldReal: unitrealfield = field as unitrealfield;

        return BlzGetUnitRealField(this.handle, fieldReal);
      }
      case "unitstringfield": {
        const fieldString: unitstringfield = field as unitstringfield;

        return BlzGetUnitStringField(this.handle, fieldString);
      }
      default:
        return 0;
    }
  }

  /**
   * Gets the unit's flying height above the ground.
   * @returns The height, in world units.
   * @native GetUnitFlyHeight
   */
  public getflyHeight() {
    return GetUnitFlyHeight(this.handle);
  }

  /**
   * Gets the hero's level.
   * @returns The level; 0 for a unit that is not a hero.
   * @native GetHeroLevel
   */
  public getHeroLevel() {
    return GetHeroLevel(this.handle);
  }

  /**
   * Sets whether the unit raises no alarm, the "under attack" warning, when it is
   * attacked; despite its name it changes the setting, which `ignoreAlarmToggled` reads.
   * @param flag - True for no alarm, false for the usual one.
   * @returns The boolean the game returns for the call.
   * @native UnitIgnoreAlarm
   */
  public getIgnoreAlarm(flag: boolean) {
    return UnitIgnoreAlarm(this.handle, flag);
  }

  /**
   * Gets the hero's intelligence.
   * @param includeBonuses - True to add the bonuses of items and buffs.
   * @returns The intelligence; 0 for a unit that is not a hero.
   * @native GetHeroInt
   */
  public getIntelligence(includeBonuses: boolean) {
    return GetHeroInt(this.handle, includeBonuses);
  }

  /**
   * Gets the item in one of the unit's inventory slots.
   * @param slot - The slot, from 0 to 5.
   * @returns The item, or `undefined` when the slot is empty or the unit has no such slot.
   * @native UnitItemInSlot
   */
  public getItemInSlot(slot: number): Item | undefined {
    return Item.fromHandle(UnitItemInSlot(this.handle, slot));
  }

  /**
   * Gets one of the unit's states, such as its life or mana.
   * @param whichUnitState - The state, such as `UNIT_STATE_LIFE` or `UNIT_STATE_MAX_MANA`.
   * @returns The value, in the state's own unit: hit points for
   * `UNIT_STATE_LIFE`, mana for `UNIT_STATE_MANA`.
   * @native GetUnitState
   */
  public getState(whichUnitState: unitstate) {
    return GetUnitState(this.handle, whichUnitState);
  }

  /**
   * Gets the hero's strength.
   * @param includeBonuses - True to add the bonuses of items and buffs.
   * @returns The strength; 0 for a unit that is not a hero.
   * @native GetHeroStr
   */
  public getStrength(includeBonuses: boolean) {
    return GetHeroStr(this.handle, includeBonuses);
  }

  /**
   * Checks whether the unit has any item equipped.
   * @remarks
   * The Native's name is misspelt: `UnitHasAnyItemEquiped`.
   * @returns True when an item is equipped.
   * @native UnitHasAnyItemEquiped
   */
  public hasAnyEquipped() {
    return UnitHasAnyItemEquiped(this.handle);
  }

  /**
   * Checks whether an item is in the unit's bag.
   * @param whichItem - The item to look for in the bag.
   * @returns True when the item is in the bag.
   * @native UnitHasItemBagged
   */
  public hasBagged(whichItem: Item) {
    return UnitHasItemBagged(this.handle, whichItem.handle);
  }

  /**
   * Checks whether the unit has any buff that matches the filters.
   * @remarks
   * The filters combine as in `countBuffs`.
   * @param removePositive - Matches positive buffs; with `removeNegative`, both
   * false matches positive and negative buffs.
   * @param removeNegative - Matches negative buffs.
   * @param magic - Matches only magical buffs, unless `physical` is true too, which
   * matches none; both false matches magical and physical buffs.
   * @param physical - Matches only physical buffs, unless `magic` is true too.
   * @param timedLife - Includes timed-life buffs; false leaves them out.
   * @param aura - Includes aura buffs; false leaves them out.
   * @param autoDispel - Matches only the buffs that dispelling removes.
   * @returns True when a buff matches.
   * @native UnitHasBuffsEx
   */
  public hasBuffs(
    removePositive: boolean,
    removeNegative: boolean,
    magic: boolean,
    physical: boolean,
    timedLife: boolean,
    aura: boolean,
    autoDispel: boolean,
  ) {
    return UnitHasBuffsEx(
      this.handle,
      removePositive,
      removeNegative,
      magic,
      physical,
      timedLife,
      aura,
      autoDispel,
    );
  }

  /**
   * Checks whether one of the unit's loadout slots is empty.
   * @param slot - The loadout slot.
   * @returns True when the slot is empty.
   * @native UnitHasLoadoutSlotEmpty
   * @native ConvertLoadoutSlot
   */
  public hasEmptySlot(slot: LoadoutSlot) {
    return UnitHasLoadoutSlotEmpty(this.handle, ConvertLoadoutSlot(slot));
  }

  /**
   * Checks whether the unit has an item of an equipment type equipped.
   * @param equipmentType - The equipment type.
   * @returns True when such an item is equipped.
   * @native UnitHasItemEquipmentOfType
   * @native ConvertEquipmentType
   */
  public hasEquipmentOfType(equipmentType: EquipmentType) {
    return UnitHasItemEquipmentOfType(
      this.handle,
      ConvertEquipmentType(equipmentType),
    );
  }

  /**
   * Checks whether the unit has an item equipped.
   * @param whichItem - The item to look for among the equipped ones.
   * @returns True when the item is equipped.
   * @native UnitHasItemEquipped
   */
  public hasEquipped(whichItem: Item) {
    return UnitHasItemEquipped(this.handle, whichItem.handle);
  }

  /**
   * Checks whether an item is in the unit's inventory.
   * @param whichItem - The item to look for in the inventory's slots.
   * @returns True when the unit carries the item.
   * @native UnitHasItem
   */
  public hasItem(whichItem: Item) {
    return UnitHasItem(this.handle, whichItem.handle);
  }

  /**
   * Hides or shows the icon of one of the unit's abilities.
   * @param abilId - The ability's rawcode.
   * @param flag - True to hide the icon, false to show it.
   * @native BlzUnitHideAbility
   * @bug The game counts the calls instead of storing the flag: after hiding an
   * icon several times, as many calls are needed to show it again.
   */
  public hideAbility(abilId: number, flag: boolean) {
    BlzUnitHideAbility(this.handle, abilId, flag);
  }

  /**
   * Raises one of the unit's abilities by one level.
   * @remarks It can take an ability one level past its maximum, where every
   * field of the ability is 0. Sources:
   * http://www.wc3c.net/showthread.php?p=1029039#post1029039 and
   * http://www.hiveworkshop.com/forums/lab-715/silenceex-everything-you-dont-know-about-silence-274351/.
   * @param abilCode - The ability's rawcode, such as `FourCC("AHbz")`.
   * @returns The new ability level.
   * @native IncUnitAbilityLevel
   */
  public incAbilityLevel(abilCode: number) {
    return IncUnitAbilityLevel(this.handle, abilCode);
  }

  /**
   * Checks whether the unit's owner is in a force.
   * @param whichForce - The force to look for the unit's owner in.
   * @returns True when the unit's owner belongs to the force.
   * @native IsUnitInForce
   */
  public inForce(whichForce: Force) {
    return IsUnitInForce(this.handle, whichForce.handle);
  }

  /**
   * Checks whether the unit is in a group.
   * @param whichGroup - The group to look for the unit in.
   * @returns True when the group holds the unit.
   * @native IsUnitInGroup
   */
  public inGroup(whichGroup: Group) {
    return IsUnitInGroup(this.handle, whichGroup.handle);
  }

  /**
   * Checks whether the unit is within a distance of a point, counting its collision size.
   * @param x - The point's x-coordinate, in world units.
   * @param y - The point's y-coordinate, in world units.
   * @param distance - The distance, in world units.
   * @returns True when the unit is in range.
   * @native IsUnitInRangeXY
   */
  public inRange(x: number, y: number, distance: number) {
    return IsUnitInRangeXY(this.handle, x, y, distance);
  }

  /**
   * Checks whether the unit is within a distance of a point, counting its collision size.
   * @param whichPoint - The point to measure the distance from.
   * @param distance - The distance, in world units.
   * @returns True when the unit is in range.
   * @native IsUnitInRangeLoc
   */
  public inRangeOfPoint(whichPoint: Point, distance: number) {
    return IsUnitInRangeLoc(this.handle, whichPoint.handle, distance);
  }

  /**
   * Checks whether the unit is within a distance of another unit, counting its collision size.
   * @param otherUnit - The unit to measure the distance from.
   * @param distance - The distance, in world units.
   * @returns True when the unit is in range.
   * @native IsUnitInRange
   */
  public inRangeOfUnit(otherUnit: Unit, distance: number) {
    return IsUnitInRange(this.handle, otherUnit.handle, distance);
  }

  /**
   * Interrupts the attack the unit is winding up.
   * @native BlzUnitInterruptAttack
   */
  public interruptAttack() {
    BlzUnitInterruptAttack(this.handle);
  }

  /**
   * Checks whether the unit is loaded into a transport.
   * @param whichTransport - The transport to look in, such as a Goblin
   * Zeppelin.
   * @returns True when the unit is loaded into that transport.
   * @native IsUnitInTransport
   */
  public inTransport(whichTransport: Unit) {
    return IsUnitInTransport(this.handle, whichTransport.handle);
  }

  /**
   * Checks whether the unit is alive.
   * @returns True when the unit is alive; false once it died or was removed.
   * @native UnitAlive
   */
  public isAlive(): boolean {
    return UnitAlive(this.handle);
  }

  /**
   * Checks whether the unit's owner is an ally of a player.
   * @param whichPlayer - The player to compare the unit's owner with.
   * @returns True when the unit is the player's ally.
   * @native IsUnitAlly
   */
  public isAlly(whichPlayer: MapPlayer) {
    return IsUnitAlly(this.handle, whichPlayer.handle);
  }

  /**
   * Checks whether the unit's owner is an enemy of a player.
   * @param whichPlayer - The player to compare the unit's owner with.
   * @returns True when the unit is the player's enemy.
   * @native IsUnitEnemy
   */
  public isEnemy(whichPlayer: MapPlayer) {
    return IsUnitEnemy(this.handle, whichPlayer.handle);
  }

  /**
   * Checks whether the hero gains no experience, as `suspendExperience` sets.
   * @returns True when the hero's experience is suspended.
   * @native IsSuspendedXP
   */
  public isExperienceSuspended() {
    return IsSuspendedXP(this.handle);
  }

  /**
   * Checks whether the unit stands in the fog of war for a player.
   * @param whichPlayer - The player whose view of the map decides.
   * @returns True when the unit is fogged for the player.
   * @native IsUnitFogged
   */
  public isFogged(whichPlayer: MapPlayer) {
    return IsUnitFogged(this.handle, whichPlayer.handle);
  }

  /**
   * Checks whether the unit's type is a hero type.
   * @returns True when the unit is a hero.
   * @native GetUnitTypeId
   * @native IsHeroUnitId
   */
  public isHero() {
    return IsHeroUnitId(this.typeId);
  }

  /**
   * Checks whether the unit is an illusion.
   * @returns True when the unit is an illusion.
   * @native IsUnitIllusion
   */
  public isIllusion() {
    return IsUnitIllusion(this.handle);
  }

  /**
   * Checks whether the unit is loaded into a transport.
   * @returns True when the unit is loaded.
   * @native IsUnitLoaded
   */
  public isLoaded() {
    return IsUnitLoaded(this.handle);
  }

  /**
   * Checks whether the unit stands under the black mask for a player, in the part
   * of the map that player has never explored.
   * @param whichPlayer - The player whose view of the map decides.
   * @returns True when the unit is masked for the player.
   * @native IsUnitMasked
   */
  public isMasked(whichPlayer: MapPlayer) {
    return IsUnitMasked(this.handle, whichPlayer.handle);
  }

  /**
   * Checks whether a player has the unit selected.
   * @param whichPlayer - The player whose selection is read.
   * @returns True when the unit is in the player's selection.
   * @native IsUnitSelected
   */
  public isSelected(whichPlayer: MapPlayer) {
    return IsUnitSelected(this.handle, whichPlayer.handle);
  }

  /**
   * Orders the unit to build a structure at a point.
   * @param unit - The structure's order name, or its unit type's rawcode.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @returns True when the unit took the order.
   * @native IssueBuildOrder
   * @native IssueBuildOrderById
   * @bug It returns true for a structure the unit can build on a free spot, even
   * when the player cannot afford it.
   */
  public issueBuildOrder(unit: string | number, x: number, y: number) {
    return typeof unit === "string"
      ? IssueBuildOrder(this.handle, unit, x, y)
      : IssueBuildOrderById(this.handle, unit, x, y);
  }

  /**
   * Orders the unit to carry out an order that takes no target, such as `"stop"`.
   * @param order - The order's name, or its id.
   * @returns True when the unit took the order.
   * @native IssueImmediateOrder
   * @native IssueImmediateOrderById
   */
  public issueImmediateOrder(order: string | OrderId) {
    return typeof order === "string"
      ? IssueImmediateOrder(this.handle, order)
      : IssueImmediateOrderById(this.handle, order);
  }

  /**
   * Orders the unit to carry out an order at a point, with a widget as its instant target.
   * @param order - The order's name, or its id.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @param instantTargetWidget - The instant target.
   * @returns True when the unit took the order.
   * @native IssueInstantPointOrder
   * @native IssueInstantPointOrderById
   */
  public issueInstantOrderAt(
    order: string | OrderId,
    x: number,
    y: number,
    instantTargetWidget: Widget,
  ) {
    return typeof order === "string"
      ? IssueInstantPointOrder(
          this.handle,
          order,
          x,
          y,
          instantTargetWidget.handle,
        )
      : IssueInstantPointOrderById(
          this.handle,
          order,
          x,
          y,
          instantTargetWidget.handle,
        );
  }

  /**
   * Orders the unit to carry out an order on a target, with another widget as its instant target.
   * @param order - The order's name, or its id.
   * @param targetWidget - The order's target.
   * @param instantTargetWidget - The instant target.
   * @returns True when the unit took the order.
   * @native IssueInstantTargetOrder
   * @native IssueInstantTargetOrderById
   */
  public issueInstantTargetOrder(
    order: string | OrderId,
    targetWidget: Widget,
    instantTargetWidget: Widget,
  ) {
    return typeof order === "string"
      ? IssueInstantTargetOrder(
          this.handle,
          order,
          targetWidget.handle,
          instantTargetWidget.handle,
        )
      : IssueInstantTargetOrderById(
          this.handle,
          order,
          targetWidget.handle,
          instantTargetWidget.handle,
        );
  }

  /**
   * Orders this neutral structure (a shop, a tavern) to sell or train `unit` for
   * `forPlayer`.
   * @param forPlayer - The player who buys.
   * @param unit - The order name of what is bought, or its rawcode.
   * @returns True when the structure took the order.
   * @native IssueNeutralImmediateOrder
   * @native IssueNeutralImmediateOrderById
   */
  public issueNeutralImmediateOrder(
    forPlayer: MapPlayer,
    unit: string | number,
  ) {
    return typeof unit === "string"
      ? IssueNeutralImmediateOrder(forPlayer.handle, this.handle, unit)
      : IssueNeutralImmediateOrderById(forPlayer.handle, this.handle, unit);
  }

  /**
   * Orders this neutral structure to use `unit` for `forPlayer` at a point.
   * @param forPlayer - The player the structure acts for.
   * @param unit - The order's name, or its id.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @returns True when the structure took the order.
   * @native IssueNeutralPointOrder
   * @native IssueNeutralPointOrderById
   */
  public issueNeutralPointOrder(
    forPlayer: MapPlayer,
    unit: string | number,
    x: number,
    y: number,
  ) {
    return typeof unit === "string"
      ? IssueNeutralPointOrder(forPlayer.handle, this.handle, unit, x, y)
      : IssueNeutralPointOrderById(forPlayer.handle, this.handle, unit, x, y);
  }

  /**
   * Orders this neutral structure to use `unit` for `forPlayer` on `target`.
   * @param forPlayer - The player the structure acts for.
   * @param unit - The order's name, or its id.
   * @param target - The order's target.
   * @returns True when the structure took the order.
   * @native IssueNeutralTargetOrder
   * @native IssueNeutralTargetOrderById
   */
  public issueNeutralTargetOrder(
    forPlayer: MapPlayer,
    unit: string | number,
    target: Widget,
  ) {
    return typeof unit === "string"
      ? IssueNeutralTargetOrder(
          forPlayer.handle,
          this.handle,
          unit,
          target.handle,
        )
      : IssueNeutralTargetOrderById(
          forPlayer.handle,
          this.handle,
          unit,
          target.handle,
        );
  }

  /**
   * Orders the unit to carry out an order at a point, such as `"move"`.
   * @param order - The order's name, or its id.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @returns True when the unit took the order.
   * @native IssuePointOrder
   * @native IssuePointOrderById
   * @bug For a build order it returns false, whether or not the unit obeys.
   */
  public issueOrderAt(order: string | OrderId, x: number, y: number) {
    return typeof order === "string"
      ? IssuePointOrder(this.handle, order, x, y)
      : IssuePointOrderById(this.handle, order, x, y);
  }

  /**
   * Orders the unit to carry out an order at a point, such as `"move"`.
   * @param order - The order's name, or its id.
   * @param whichPoint - The point the order targets.
   * @returns True when the unit took the order.
   * @native IssuePointOrderLoc
   * @native IssuePointOrderByIdLoc
   * @bug For a build order it returns false, whether or not the unit obeys.
   */
  public issuePointOrder(order: string | OrderId, whichPoint: Point) {
    return typeof order === "string"
      ? IssuePointOrderLoc(this.handle, order, whichPoint.handle)
      : IssuePointOrderByIdLoc(this.handle, order, whichPoint.handle);
  }

  /**
   * Orders the unit to carry out an order on a target, such as `"attack"`.
   * @param order - The order's name, or its id.
   * @param targetWidget - The order's target.
   * @returns True when the unit took the order.
   * @native IssueTargetOrder
   * @native IssueTargetOrderById
   */
  public issueTargetOrder(order: string | OrderId, targetWidget: Widget) {
    return typeof order === "string"
      ? IssueTargetOrder(this.handle, order, targetWidget.handle)
      : IssueTargetOrderById(this.handle, order, targetWidget.handle);
  }

  /**
   * Checks whether another Wrapper wraps the same unit.
   * @remarks Useless. Use operator == instead.
   * @param whichSpecifiedUnit - The other unit.
   * @returns True when both are the same unit.
   * @native IsUnit
   */
  public isUnit(whichSpecifiedUnit: Unit) {
    return IsUnit(this.handle, whichSpecifiedUnit.handle);
  }

  /**
   * Checks whether the unit has a classification, such as `UNIT_TYPE_STRUCTURE`.
   * @remarks
   * - Read as an integer, the boolean the Native returns can be above 1,
   *   likely because the game keeps the classifications in a bit set.
   * - On older patches it misbehaved inside condition functions, which a
   *   comparison with `true` worked around; the fault does not reproduce on
   *   patch 1.27.
   * @param whichUnitType - The classification.
   * @returns True when the unit has it.
   * @native IsUnitType
   */
  public isUnitType(whichUnitType: unittype) {
    return IsUnitType(this.handle, whichUnitType);
  }

  /**
   * Checks whether a player can see the unit.
   * @param whichPlayer - The player whose view of the map decides.
   * @returns True when the unit is visible to the player.
   * @native IsUnitVisible
   */
  public isVisible(whichPlayer: MapPlayer) {
    return IsUnitVisible(this.handle, whichPlayer.handle);
  }

  /**
   * Kills the unit with no killer: it plays its death animation and fires the
   * death events, as a unit killed in combat does.
   * @native KillUnit
   */
  public kill() {
    KillUnit(this.handle);
  }

  /**
   * Turns one of the unit's bones to face a point offset from another unit,
   * until `resetLookAt` releases it.
   * @remarks
   * - One bone at a time faces the target: the head or the chest, never
   *   both.
   * - Only the head and chest bones turn; any other choice turns the head.
   *   The game finds them by the helpers named `"Bone_Head"` and
   *   `"Bone_Chest"` in the model, so a helper renamed to one of those turns
   *   its own set of bones instead.
   * - The animation speed and the blend time affect the turn.
   * - Setting a unit's facing at once, on wc3c:
   *   http://www.wc3c.net/showthread.php?t=105830
   * @param whichBone - Which bone turns: a string starting with
   * `"bone_chest"` picks the chest, any other string that is not null the
   * head. Leading spaces are skipped, case does not matter, and the string
   * ends at its first space after them.
   * @param lookAtTarget - The unit the bone faces.
   * @param offsetX - The x-offset of the point faced, from the target's
   * origin.
   * @param offsetY - The y-offset of the point faced, from the target's
   * origin.
   * @param offsetZ - The z-offset of the point faced, from the target's
   * origin; the terrain's height is already counted in.
   * @native SetUnitLookAt
   */
  public lookAt(
    whichBone: string,
    lookAtTarget: Unit,
    offsetX: number,
    offsetY: number,
    offsetZ: number,
  ) {
    SetUnitLookAt(
      this.handle,
      whichBone,
      lookAtTarget.handle,
      offsetX,
      offsetY,
      offsetZ,
    );
  }

  /**
   * Makes one of the unit's abilities survive a morph, or lets a morph
   * remove it.
   * @param permanent - True to keep the ability through a morph, false to let the morph remove it.
   * @param abilityId - The ability's rawcode.
   * @native UnitMakeAbilityPermanent
   */
  public makeAbilityPermanent(permanent: boolean, abilityId: number) {
    UnitMakeAbilityPermanent(this.handle, permanent, abilityId);
  }

  /**
   * Adds skill points to the hero, or removes them with a negative delta, down to 0.
   * @remarks
   * The hero never gets more points than it can still spend on its abilities.
   * @param skillPointDelta - The points to add; negative to remove.
   * @returns False when nothing could change: a delta of 0, a unit that is not a
   * hero, or points to remove from a hero that has none; true otherwise.
   * @native UnitModifySkillPoints
   */
  public modifySkillPoints(skillPointDelta: number) {
    return UnitModifySkillPoints(this.handle, skillPointDelta);
  }

  /**
   * Pauses or unpauses the unit as the `paused` setter does, but keeps its command
   * card visible and leaves the `paused` getter false.
   * @param flag - True to pause the unit, false to unpause it.
   * @native BlzPauseUnitEx
   */
  public pauseEx(flag: boolean) {
    BlzPauseUnitEx(this.handle, flag);
  }

  /**
   * Pauses or resumes the countdown of the unit's timed life.
   * @param flag - True to pause the countdown, false to resume it.
   * @native UnitPauseTimedLife
   */
  public pauseTimedLife(flag: boolean) {
    UnitPauseTimedLife(this.handle, flag);
  }

  /**
   * Queues an animation to play once the current one ends, for a smooth transition.
   * @param whichAnimation - The animation's name, such as `"stand"`, in any case.
   * @native QueueUnitAnimation
   */
  public queueAnimation(whichAnimation: string) {
    QueueUnitAnimation(this.handle, whichAnimation);
  }

  /**
   * Queues an order on this neutral structure to sell or train `unitId` for
   * `forPlayer`, after its current orders.
   * @param forPlayer - The player who buys.
   * @param unitId - The rawcode of what is bought.
   * @returns True when the structure took the order.
   * @native BlzQueueNeutralImmediateOrderById
   */
  public queueNeutralImmediateOrder(forPlayer: MapPlayer, unitId: number) {
    return BlzQueueNeutralImmediateOrderById(
      forPlayer.handle,
      this.handle,
      unitId,
    );
  }

  /**
   * Queues an order on this neutral structure to use `unitId` for
   * `forPlayer` at a point, after its current orders.
   * @param forPlayer - The player the structure acts for.
   * @param unitId - The order's id.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @returns True when the structure took the order.
   * @native BlzQueueNeutralPointOrderById
   */
  public queueNeutralPointOrder(
    forPlayer: MapPlayer,
    unitId: number,
    x: number,
    y: number,
  ) {
    return BlzQueueNeutralPointOrderById(
      forPlayer.handle,
      this.handle,
      unitId,
      x,
      y,
    );
  }

  /**
   * Queues an order on this neutral structure to use `unitId` for
   * `forPlayer` on `target`, after its current orders.
   * @param forPlayer - The player the structure acts for.
   * @param unitId - The order's id.
   * @param target - The order's target.
   * @returns True when the structure took the order.
   * @native BlzQueueNeutralTargetOrderById
   */
  public queueNeutralTargetOrder(
    forPlayer: MapPlayer,
    unitId: number,
    target: Widget,
  ) {
    return BlzQueueNeutralTargetOrderById(
      forPlayer.handle,
      this.handle,
      unitId,
      target.handle,
    );
  }

  /**
   * Releases the unit's guard position, the spot the computer player's AI keeps it at, for the AI to reuse.
   * @native RecycleGuardPosition
   */
  public recycleGuardPosition() {
    RecycleGuardPosition(this.handle);
  }

  /**
   * Removes an ability from the unit.
   * @param abilityId - The ability's rawcode.
   * @returns True when the ability was removed, false when the unit lacks it.
   * @native UnitRemoveAbility
   */
  public removeAbility(abilityId: number) {
    return UnitRemoveAbility(this.handle, abilityId);
  }

  /**
   * Removes the unit's positive buffs, negative buffs or both, timed-life and aura buffs included.
   * @param removePositive - Removes the positive buffs.
   * @param removeNegative - Removes the negative buffs.
   * @native UnitRemoveBuffs
   */
  public removeBuffs(removePositive: boolean, removeNegative: boolean) {
    UnitRemoveBuffs(this.handle, removePositive, removeNegative);
  }

  /**
   * Removes the buffs on the unit that match the filters.
   * @remarks
   * The filters combine differently here than in `countBuffs`: see
   * [the Native's reference](https://lep.duckdns.org/jassbot/doc/UnitRemoveBuffsEx).
   * @param removePositive - Removes positive buffs.
   * @param removeNegative - Removes negative buffs.
   * @param magic - Removes only magical buffs, unless `physical` is true too, which
   * matches none; both false removes magical, physical and other buffs.
   * @param physical - Removes only physical buffs, unless `magic` is true too.
   * @param timedLife - Includes timed-life buffs; false leaves them out.
   * @param aura - Includes aura buffs; false leaves them out.
   * @param autoDispel - Removes only the buffs that dispelling removes.
   * @native UnitRemoveBuffsEx
   */
  public removeBuffsEx(
    removePositive: boolean,
    removeNegative: boolean,
    magic: boolean,
    physical: boolean,
    timedLife: boolean,
    aura: boolean,
    autoDispel: boolean,
  ) {
    UnitRemoveBuffsEx(
      this.handle,
      removePositive,
      removeNegative,
      magic,
      physical,
      timedLife,
      aura,
      autoDispel,
    );
  }

  /**
   * Makes the computer player's AI ignore the unit's guard position, the spot the unit returns to.
   * @native RemoveGuardPosition
   */
  public removeGuardPosition() {
    RemoveGuardPosition(this.handle);
  }

  /**
   * Drops an item the unit carries onto the ground where the unit stands.
   * @param whichItem - The item, in the unit's inventory.
   * @native UnitRemoveItem
   */
  public removeItem(whichItem: Item) {
    UnitRemoveItem(this.handle, whichItem.handle);
  }

  /**
   * Drops the item in one of the unit's inventory slots onto the ground where
   * the unit stands.
   * @param itemSlot - The slot, from 0 to 5.
   * @returns The dropped item, or `undefined` when the slot is empty or does not exist.
   * @native UnitRemoveItemFromSlot
   */
  public removeItemFromSlot(itemSlot: number): Item | undefined {
    return Item.fromHandle(UnitRemoveItemFromSlot(this.handle, itemSlot));
  }

  /**
   * Removes an item type from the stock of the shop.
   * @param itemId - The item type's rawcode.
   * @native RemoveItemFromStock
   */
  public removeItemFromStock(itemId: number) {
    RemoveItemFromStock(this.handle, itemId);
  }

  /**
   * Removes a classification from the unit, such as `UNIT_TYPE_UNDEAD`.
   * @param whichUnitType - The classification to remove.
   * @returns True when the game removed it.
   * @native UnitRemoveType
   */
  public removeType(whichUnitType: unittype) {
    return UnitRemoveType(this.handle, whichUnitType);
  }

  /**
   * Removes a unit type from the stock of the shop.
   * @param itemId - The unit type's rawcode.
   * @native RemoveUnitFromStock
   */
  public removeUnitFromStock(itemId: number) {
    RemoveUnitFromStock(this.handle, itemId);
  }

  /**
   * Resets one of the unit's attacks.
   * @param weaponIndex - The attack, 0 or 1.
   * @native BlzResetUnitAttack
   */
  public resetAttack(weaponIndex: number) {
    BlzResetUnitAttack(this.handle, weaponIndex);
  }

  /**
   * Ends the cooldowns of all of the unit's abilities.
   * @native UnitResetCooldown
   */
  public resetCooldown() {
    UnitResetCooldown(this.handle);
  }

  /**
   * Releases the bone that `lookAt` turned, so that the unit's animations
   * move it again.
   * @native ResetUnitLookAt
   */
  public resetLookAt() {
    ResetUnitLookAt(this.handle);
  }

  /**
   * Revives the dead hero at a point.
   * @remarks
   * A hero with a food cost revives only when its owner has the food for it.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @param doEyecandy - True to play the revival effect and sound.
   * @returns True when the hero was dead and revived.
   * @native ReviveHero
   */
  public revive(x: number, y: number, doEyecandy: boolean) {
    return ReviveHero(this.handle, x, y, doEyecandy);
  }

  /**
   * Revives the dead hero at a point.
   * @remarks
   * A hero with a food cost revives only when its owner has the food for it.
   * @param whichPoint - Where the hero revives.
   * @param doEyecandy - True to play the revival effect and sound.
   * @returns True when the hero was dead and revived.
   * @native ReviveHeroLoc
   */
  public reviveAtPoint(whichPoint: Point, doEyecandy: boolean) {
    return ReviveHeroLoc(this.handle, whichPoint.handle, doEyecandy);
  }

  /**
   * Adds the unit to the selection, or removes it, on every client: to change one
   * player's selection, call it for that player's client only.
   * @param flag - True to select the unit, false to deselect it.
   * @native SelectUnit
   */
  public select(flag: boolean) {
    SelectUnit(this.handle, flag);
  }

  /**
   * Spends one of the hero's skill points to learn or level an ability; does
   * nothing when the hero has no point or cannot learn it yet.
   * @param abilCode - The ability's rawcode.
   * @native SelectHeroSkill
   */
  public selectSkill(abilCode: number) {
    SelectHeroSkill(this.handle, abilCode);
  }

  /**
   * Sets the full cooldown of one of the unit's abilities at a level.
   * @remarks
   * A cooldown that is running keeps its length: the new one applies from the next use.
   * @param abilId - The ability's rawcode.
   * @param level - The ability level, counted from 0 (level 1 is 0).
   * @param cooldown - The cooldown, in seconds.
   * @native BlzSetUnitAbilityCooldown
   */
  public setAbilityCooldown(abilId: number, level: number, cooldown: number) {
    BlzSetUnitAbilityCooldown(this.handle, abilId, level, cooldown);
  }

  /**
   * Sets the remaining cooldown of one of the unit's abilities as a share of its full cooldown.
   * @param abilId - The ability's rawcode.
   * @param percent - The share of the full cooldown left.
   * @native BlzSetUnitAbilityCooldownPercent
   */
  public setAbilityCooldownPercent(abilId: number, percent: number) {
    BlzSetUnitAbilityCooldownPercent(this.handle, abilId, percent);
  }

  /**
   * Sets the remaining cooldown of one of the unit's abilities.
   * @param abilId - The ability's rawcode.
   * @param seconds - The time left, in seconds.
   * @native BlzSetUnitAbilityCooldownRemaining
   */
  public setAbilityCooldownRemaining(abilId: number, seconds: number) {
    BlzSetUnitAbilityCooldownRemaining(this.handle, abilId, seconds);
  }

  /**
   * Sets the level of an ability the unit has, without spending or refunding skill points.
   * @remarks
   * A level below 1 sets level 1, and one above the ability's highest sets the highest.
   * @param abilCode - The ability's rawcode.
   * @param level - The new level, from 1.
   * @returns The new level, or 0 when the unit lacks the ability.
   * @native SetUnitAbilityLevel
   */
  public setAbilityLevel(abilCode: number, level: number) {
    return SetUnitAbilityLevel(this.handle, abilCode, level);
  }

  /**
   * Sets the mana cost of one of the unit's abilities at a level.
   * @param abilId - The ability's rawcode.
   * @param level - The ability level, counted from 0 (level 1 is 0).
   * @param manaCost - The mana the ability costs to cast at that level, a
   * whole number.
   * @native BlzSetUnitAbilityManaCost
   */
  public setAbilityManaCost(abilId: number, level: number, manaCost: number) {
    BlzSetUnitAbilityManaCost(this.handle, abilId, level, manaCost);
  }

  /**
   * Sets the hero's base agility.
   * @param value - The new base agility, without the bonuses of items and
   * buffs.
   * @param permanent - True for a permanent change, as the `agility` setter makes.
   * @native SetHeroAgi
   */
  public setAgility(value: number, permanent: boolean) {
    SetHeroAgi(this.handle, value, permanent);
  }

  /**
   * Plays one of the animations of the unit's model at once, cutting the current one.
   * @param whichAnimation - The animation's name, such as `"attack slam"`, in any
   * case; or its index in the model.
   * @native SetUnitAnimation
   * @native SetUnitAnimationByIndex
   */
  public setAnimation(whichAnimation: string | number) {
    if (typeof whichAnimation === "string") {
      SetUnitAnimation(this.handle, whichAnimation);
    } else {
      SetUnitAnimationByIndex(this.handle, whichAnimation);
    }
  }

  /**
   * Plays one of the animations of the unit's model, picking among its variations by rarity.
   * @param whichAnimation - The animation's name, in any case.
   * @param rarity - The variations to pick from, `RARITY_FREQUENT` or `RARITY_RARE`.
   * @native SetUnitAnimationWithRarity
   */
  public setAnimationWithRarity(whichAnimation: string, rarity: raritycontrol) {
    SetUnitAnimationWithRarity(this.handle, whichAnimation, rarity);
  }

  /**
   * Sets the base cooldown of one of the unit's attacks.
   * @param cooldown - The cooldown, in seconds.
   * @param weaponIndex - The attack, 0 or 1.
   * @native BlzSetUnitAttackCooldown
   */
  public setAttackCooldown(cooldown: number, weaponIndex: number) {
    BlzSetUnitAttackCooldown(this.handle, cooldown, weaponIndex);
  }

  /**
   * Sets the base damage of one of the unit's attacks, added to the dice roll.
   * @param baseDamage - The damage added to every roll, a whole number.
   * @param weaponIndex - The attack, 0 or 1.
   * @native BlzSetUnitBaseDamage
   */
  public setBaseDamage(baseDamage: number, weaponIndex: number) {
    BlzSetUnitBaseDamage(this.handle, baseDamage, weaponIndex);
  }

  /**
   * Sets the time the unit's model takes to blend from one animation into the next.
   * @param timeScale - The blend time, in seconds.
   * @native SetUnitBlendTime
   */
  public setBlendTime(timeScale: number) {
    SetUnitBlendTime(this.handle, timeScale);
  }

  /**
   * Sets how far the construction of the structure has progressed.
   * @param constructionPercentage - The progress, from 0 to 100.
   * @native UnitSetConstructionProgress
   */
  public setConstructionProgress(constructionPercentage: number) {
    UnitSetConstructionProgress(this.handle, constructionPercentage);
  }

  /**
   * Sets whether the unit keeps to its guard position, as creeps do.
   * @param creepGuard - True to keep the unit at its guard position.
   * @native SetUnitCreepGuard
   */
  public setCreepGuard(creepGuard: boolean) {
    SetUnitCreepGuard(this.handle, creepGuard);
  }

  /**
   * Sets the number of dice one of the unit's attacks rolls for its damage.
   * @param diceNumber - The number of dice rolled on each hit, a whole
   * number.
   * @param weaponIndex - The attack, 0 or 1.
   * @native BlzSetUnitDiceNumber
   */
  public setDiceNumber(diceNumber: number, weaponIndex: number) {
    BlzSetUnitDiceNumber(this.handle, diceNumber, weaponIndex);
  }

  /**
   * Sets the number of sides of the dice one of the unit's attacks rolls for its damage.
   * @param diceSides - The number of sides of each die: a die rolls from 1
   * to this number.
   * @param weaponIndex - The attack, 0 or 1.
   * @native BlzSetUnitDiceSides
   */
  public setDiceSides(diceSides: number, weaponIndex: number) {
    BlzSetUnitDiceSides(this.handle, diceSides, weaponIndex);
  }

  /**
   * Sets the hero's experience points; reaching the experience a level needs
   * gains that level.
   * @param newXpVal - The new experience total, a whole number.
   * @param showEyeCandy - True to show the effects of a level gained this way.
   * @native SetHeroXP
   */
  public setExperience(newXpVal: number, showEyeCandy: boolean) {
    SetHeroXP(this.handle, newXpVal, showEyeCandy);
  }

  /**
   * Sets whether the unit explodes when it dies, leaving no corpse.
   * @param exploded - True to make the unit explode on death.
   * @native SetUnitExploded
   */
  public setExploded(exploded: boolean) {
    SetUnitExploded(this.handle, exploded);
  }

  /**
   * Turns the unit to face an angle at once, where the `facing` setter turns it gradually.
   * @param facingAngle - The facing, in degrees (0 east, 90 north).
   * @native BlzSetUnitFacingEx
   */
  public setFacingEx(facingAngle: number) {
    BlzSetUnitFacingEx(this.handle, facingAngle);
  }

  /**
   * Writes one of the unit's fields, through the Native of the field's type.
   * @remarks
   * Many fields do not work: the game can report a write that changes nothing.
   * @param field - A field constant of any of the four types, such as `UNIT_RF_SELECTION_SCALE`.
   * @param value - The value, of the field's type: a boolean, a number or a string.
   * @returns True when the game wrote the field; false when the value is not of
   * the field's type.
   * @native BlzSetUnitBooleanField
   * @native BlzSetUnitIntegerField
   * @native BlzSetUnitRealField
   * @native BlzSetUnitStringField
   */
  public setField(
    field:
      unitbooleanfield | unitintegerfield | unitrealfield | unitstringfield,
    value: boolean | number | string,
  ) {
    const fieldType = handleTypeOf(field);

    if (fieldType === "unitbooleanfield" && typeof value === "boolean") {
      return BlzSetUnitBooleanField(
        this.handle,
        field as unitbooleanfield,
        value,
      );
    }
    if (fieldType === "unitintegerfield" && typeof value === "number") {
      return BlzSetUnitIntegerField(
        this.handle,
        field as unitintegerfield,
        value,
      );
    }
    if (fieldType === "unitrealfield" && typeof value === "number") {
      return BlzSetUnitRealField(this.handle, field as unitrealfield, value);
    }
    if (fieldType === "unitstringfield" && typeof value === "string") {
      return BlzSetUnitStringField(
        this.handle,
        field as unitstringfield,
        value,
      );
    }

    return false;
  }

  /**
   * Changes the unit's flying height above the ground.
   * @param value - The height, in world units.
   * @param rate - The speed of the change, in world units per second; 0 changes it at once.
   * @native SetUnitFlyHeight
   */
  public setflyHeight(value: number, rate: number) {
    SetUnitFlyHeight(this.handle, value, rate);
  }

  /**
   * Raises the hero to a level; a lower level than the current one does nothing.
   * @remarks
   * The level stops at the hero's maximum level.
   * @param level - The level to raise the hero to.
   * @param showEyeCandy - True to show the level-up text, sound and effect.
   * @native SetHeroLevel
   */
  public setHeroLevel(level: number, showEyeCandy: boolean) {
    SetHeroLevel(this.handle, level, showEyeCandy);
  }

  /**
   * Sets the hero's base intelligence.
   * @param value - The new base intelligence, without the bonuses of items
   * and buffs.
   * @param permanent - True for a permanent change, as the `intelligence` setter makes.
   * @native SetHeroInt
   */
  public setIntelligence(value: number, permanent: boolean) {
    SetHeroInt(this.handle, value, permanent);
  }

  /**
   * Sets the number of item types the shop can offer.
   * @param slots - How many different item types the shop lists at once.
   * @native SetItemTypeSlots
   */
  public setItemTypeSlots(slots: number) {
    SetItemTypeSlots(this.handle, slots);
  }

  /**
   * Gives the unit to another player.
   * @param whichPlayer - The new owner.
   * @param changeColor - True to give the unit the new owner's colour, when the
   * owner changes; true when left out.
   * @native SetUnitOwner
   */
  public setOwner(whichPlayer: MapPlayer, changeColor = true) {
    SetUnitOwner(this.handle, whichPlayer.handle, changeColor);
  }

  /**
   * Gets the player who owns the unit.
   * @remarks
   * A live unit always has an owner, which the Typings cannot express for the
   * Wrapper, so this goes through the non-null lookup helper: typed non-null,
   * and not counted as a creation.
   * @returns The owner, never `undefined`.
   * @throws Should the game ever break that invariant:
   * `reforged-ts: failed to create MapPlayer`, at the calling line.
   * @native GetOwningPlayer
   */
  public getOwner(): MapPlayer {
    return MapPlayer.expectFound(GetOwningPlayer(this.handle));
  }

  /**
   * Moves the unit to a point, to the nearest spot its pathing allows, cancelling its orders.
   * @param point - The point to move the unit to.
   * @native SetUnitPositionLoc
   */
  public setPoint(point: Point) {
    SetUnitPositionLoc(this.handle, point.handle);
  }

  /**
   * Gets the unit's position as a new point, which the caller destroys.
   * @returns A new point at the unit's position.
   * @throws When the game returns no handle: `reforged-ts: failed to create Point`,
   * at the calling line. In Dev mode, also before the globals Init stage and
   * inside `MapPlayer.runLocal`.
   * @native GetUnitLoc
   * @bug For a unit loaded into a zeppelin, it returns where the unit boarded,
   * not the zeppelin's position.
   */
  public getPoint(): Point {
    return Point.expect(GetUnitLoc(this.handle));
  }

  /**
   * Sets whether the unit follows pathing, or walks through anything.
   * @param flag - True to follow pathing, false to ignore it.
   * @native SetUnitPathing
   */
  public setPathing(flag: boolean) {
    SetUnitPathing(this.handle, flag);
  }

  /**
   * Moves the unit to a point, to the nearest spot its pathing allows.
   * @remarks It cancels the unit's orders; setting `x` and `y` moves the unit
   * and keeps them.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @native SetUnitPosition
   */
  public setPosition(x: number, y: number) {
    SetUnitPosition(this.handle, x, y);
  }

  /**
   * Sets whether a player can rescue the unit, taking it over by coming near it.
   * @param byWhichPlayer - The player who can, or no longer can, rescue the
   * unit.
   * @param flag - True to make the unit rescuable by that player.
   * @native SetUnitRescuable
   */
  public setRescuable(byWhichPlayer: MapPlayer, flag: boolean) {
    SetUnitRescuable(this.handle, byWhichPlayer.handle, flag);
  }

  /**
   * Sets how near a rescuing unit must come to rescue the unit.
   * @param range - The range, in world units.
   * @native SetUnitRescueRange
   */
  public setRescueRange(range: number) {
    SetUnitRescueRange(this.handle, range);
  }

  /**
   * Scales the unit's model.
   * @param scaleX - The scale, which the game applies on all three axes.
   * @param scaleY - Ignored.
   * @param scaleZ - Ignored.
   * @native SetUnitScale
   * @bug The game reads `scaleX` alone and scales every axis by it.
   */
  public setScale(scaleX: number, scaleY: number, scaleZ: number) {
    SetUnitScale(this.handle, scaleX, scaleY, scaleZ);
  }

  /**
   * Sets one of the unit's states, such as its life or mana.
   * @param whichUnitState - The state, such as `UNIT_STATE_LIFE` or `UNIT_STATE_MAX_MANA`.
   * @param newVal - The new value, in the state's own unit: hit points for
   * `UNIT_STATE_LIFE`, mana for `UNIT_STATE_MANA`.
   * @native SetUnitState
   */
  public setState(whichUnitState: unitstate, newVal: number) {
    SetUnitState(this.handle, whichUnitState, newVal);
  }

  /**
   * Sets the hero's base strength; lowering it lowers the hero's life.
   * @param value - The new base strength, without the bonuses of items and
   * buffs.
   * @param permanent - True for a permanent change, as the `strength` setter makes.
   * @native SetHeroStr
   */
  public setStrength(value: number, permanent: boolean) {
    SetHeroStr(this.handle, value, permanent);
  }

  /**
   * Sets the speed of the unit's animations.
   * @param timeScale - The speed factor: 1 for the normal speed, 2 for twice as fast.
   * @native SetUnitTimeScale
   */
  public setTimeScale(timeScale: number) {
    SetUnitTimeScale(this.handle, timeScale);
  }

  /**
   * Sets the base cooldown of one of the unit's attacks, as `setAttackCooldown` does.
   * @param cooldown - The cooldown, in seconds.
   * @param weaponIndex - The attack, 0 or 1.
   * @native BlzSetUnitAttackCooldown
   */
  public setUnitAttackCooldown(cooldown: number, weaponIndex: number) {
    BlzSetUnitAttackCooldown(this.handle, cooldown, weaponIndex);
  }

  /**
   * Sets the number of unit types the shop can offer.
   * @param slots - How many different unit types the shop lists at once.
   * @native SetUnitTypeSlots
   */
  public setUnitTypeSlots(slots: number) {
    SetUnitTypeSlots(this.handle, slots);
  }

  /**
   * Sets how far the upgrade of the structure has progressed.
   * @param upgradePercentage - The progress, from 0 to 100.
   * @native UnitSetUpgradeProgress
   */
  public setUpgradeProgress(upgradePercentage: number) {
    UnitSetUpgradeProgress(this.handle, upgradePercentage);
  }

  /**
   * Sets whether the minimap shows the unit with the alternate icon.
   * @param flag - True to use the alternate icon.
   * @native UnitSetUsesAltIcon
   */
  public setUseAltIcon(flag: boolean) {
    UnitSetUsesAltIcon(this.handle, flag);
  }

  /**
   * Sets whether the unit counts in its owner's food.
   * @param useFood - True to count the unit's food.
   * @native SetUnitUseFood
   */
  public setUseFood(useFood: boolean) {
    SetUnitUseFood(this.handle, useFood);
  }

  /**
   * Tints the unit's model with a colour and sets its transparency.
   * @param red - The red channel, from 0 to 255.
   * @param green - The green channel, from 0 to 255.
   * @param blue - The blue channel, from 0 to 255.
   * @param alpha - The alpha channel, from 0 to 255.
   * @native SetUnitVertexColor
   */
  public setVertexColor(
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ) {
    SetUnitVertexColor(this.handle, red, green, blue, alpha);
  }

  /**
   * Shares, or stops sharing, the unit's vision with a player.
   * @param whichPlayer - The player who sees, or stops seeing, what the unit
   * sees.
   * @param share - True to share the vision, false to stop.
   * @native UnitShareVision
   */
  public shareVision(whichPlayer: MapPlayer, share: boolean) {
    UnitShareVision(this.handle, whichPlayer.handle, share);
  }

  /**
   * Shows or hides the team-coloured glow of the unit, a hero's glow included.
   * @param show - True to show the glow, false to hide it.
   * @native BlzShowUnitTeamGlow
   */
  public showTeamGlow(show: boolean) {
    BlzShowUnitTeamGlow(this.handle, show);
  }

  /**
   * Starts the cooldown of one of the unit's abilities.
   * @param abilCode - The ability's rawcode.
   * @param cooldown - The cooldown, in seconds.
   * @native BlzStartUnitAbilityCooldown
   */
  public startAbilityCooldown(abilCode: number, cooldown: number) {
    BlzStartUnitAbilityCooldown(this.handle, abilCode, cooldown);
  }

  /**
   * Takes levels away from the hero, down to level 1, with the attributes and
   * skill points they gave.
   * @param howManyLevels - The number of levels to take away.
   * @returns True when a level was taken away.
   * @native UnitStripHeroLevel
   */
  public stripLevels(howManyLevels: number) {
    return UnitStripHeroLevel(this.handle, howManyLevels);
  }

  /**
   * Stops, or resumes, the decay of the unit's corpse.
   * @param suspend - True to stop the decay.
   * @native UnitSuspendDecay
   */
  public suspendDecay(suspend: boolean) {
    UnitSuspendDecay(this.handle, suspend);
  }

  /**
   * Stops, or resumes, the hero's experience gain.
   * @param flag - True to stop the gain.
   * @native SuspendHeroXP
   */
  public suspendExperience(flag: boolean) {
    SuspendHeroXP(this.handle, flag);
  }

  /**
   * Unequips an item from the unit.
   * @param whichItem - The item to unequip.
   * @native UnitUnequipItem
   */
  public unequip(whichItem: Item) {
    UnitUnequipItem(this.handle, whichItem.handle);
  }

  /**
   * Unequips the item in one of the unit's loadout slots.
   * @param slot - The loadout slot.
   * @returns The unequipped item, or `undefined` when the slot is empty.
   * @native UnitUnequipItemFromSlot
   * @native ConvertLoadoutSlot
   */
  public unequipSlot(slot: LoadoutSlot): Item | undefined {
    return Item.fromHandle(
      UnitUnequipItemFromSlot(this.handle, ConvertLoadoutSlot(slot)),
    );
  }

  /**
   * Orders the unit to use one of its items, as a click on it in the inventory does.
   * @param whichItem - The item, in the unit's inventory.
   * @returns True when the unit took the order.
   * @native UnitUseItem
   */
  public useItem(whichItem: Item) {
    return UnitUseItem(this.handle, whichItem.handle);
  }

  /**
   * Orders the unit to use one of its items at a point.
   * @param whichItem - The item, in the unit's inventory.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @returns The boolean the game returns.
   * @native UnitUseItemPoint
   * @bug The game returns false even when the unit uses the item.
   */
  public useItemAt(whichItem: Item, x: number, y: number) {
    return UnitUseItemPoint(this.handle, whichItem.handle, x, y);
  }

  /**
   * Orders the unit to use one of its items on a target.
   * @param whichItem - The item, in the unit's inventory.
   * @param target - The widget the item is used on.
   * @returns True when the unit took the order.
   * @native UnitUseItemTarget
   */
  public useItemTarget(whichItem: Item, target: Widget) {
    return UnitUseItemTarget(this.handle, whichItem.handle, target.handle);
  }

  /**
   * Wakes the unit up.
   * @native UnitWakeUp
   */
  public wakeUp() {
    UnitWakeUp(this.handle);
  }

  /**
   * Gets the x-coordinate the waygate sends units to.
   * @returns The x-coordinate, in world units; 0 for a unit without the Waygate ability.
   * @native WaygateGetDestinationX
   */
  public waygateGetDestinationX() {
    return WaygateGetDestinationX(this.handle);
  }

  /**
   * Gets the y-coordinate the waygate sends units to.
   * @returns The y-coordinate, in world units; 0 for a unit without the Waygate ability.
   * @native WaygateGetDestinationY
   */
  public waygateGetDestinationY() {
    return WaygateGetDestinationY(this.handle);
  }

  /**
   * Sets the point the waygate sends units to; the unit needs the Waygate ability (`'Awrp'`).
   * @remarks
   * The game rounds each coordinate to the grid of 64 offset by 32: 0 becomes 32,
   * 64 becomes 96.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @native WaygateSetDestination
   */
  public waygateSetDestination(x: number, y: number) {
    WaygateSetDestination(this.handle, x, y);
  }

  /**
   * Clears the unit's orders, through `BlzUnitClearOrders`.
   * @param onlyQueued - Clears only the queued orders, keeping the current one.
   * @native BlzUnitClearOrders
   */
  public clearOrders(onlyQueued: boolean) {
    BlzUnitClearOrders(this.handle, onlyQueued);
  }

  /**
   * Creates a minimap icon at the unit's position, and returns the game's
   * `minimapicon`, which the library does not wrap.
   * @param red - The red channel, from 0 to 255.
   * @param green - The green channel, from 0 to 255.
   * @param blue - The blue channel, from 0 to 255.
   * @param pingPath - The model of the icon.
   * @param fogVisibility - The fog state in which the icon is visible.
   * @returns The new minimap icon.
   * @throws When the game creates none:
   * `reforged-ts: failed to create minimapicon (<pingPath>)`, at the calling line.
   * @native CreateMinimapIconOnUnit
   */
  public createMinimapIcon(
    red: number,
    green: number,
    blue: number,
    pingPath: string,
    fogVisibility: fogstate,
  ): minimapicon {
    return expectUnwrapped(
      CreateMinimapIconOnUnit(
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
   * Stops the unit's current order, through `BlzUnitForceStopOrder`.
   * @param clearQueue - Also clears the queued orders.
   * @native BlzUnitForceStopOrder
   */
  public forceStopOrder(clearQueue: boolean) {
    BlzUnitForceStopOrder(this.handle, clearQueue);
  }

  /**
   * Reads a field of one of the unit's weapons, through the
   * `BlzGetUnitWeapon*Field` Native of the field's type.
   * @param field - A weapon field constant of any of the four field types.
   * @param index - The weapon's index.
   * @returns The field's value, as a boolean, a number or a string, or 0 for a
   * constant of no known field type.
   * @native BlzGetUnitWeaponBooleanField
   * @native BlzGetUnitWeaponIntegerField
   * @native BlzGetUnitWeaponRealField
   * @native BlzGetUnitWeaponStringField
   * @bug A unit without any attack can make it crash the game.
   */
  public getWeaponField(
    field:
      | unitweaponbooleanfield
      | unitweaponintegerfield
      | unitweaponrealfield
      | unitweaponstringfield,
    index: number,
  ) {
    const fieldType = handleTypeOf(field);

    switch (fieldType) {
      case "unitweaponbooleanfield":
        return BlzGetUnitWeaponBooleanField(
          this.handle,
          field as unitweaponbooleanfield,
          index,
        );
      case "unitweaponintegerfield":
        return BlzGetUnitWeaponIntegerField(
          this.handle,
          field as unitweaponintegerfield,
          index,
        );
      case "unitweaponrealfield":
        return BlzGetUnitWeaponRealField(
          this.handle,
          field as unitweaponrealfield,
          index,
        );
      case "unitweaponstringfield":
        return BlzGetUnitWeaponStringField(
          this.handle,
          field as unitweaponstringfield,
          index,
        );
      default:
        return 0;
    }
  }

  /**
   * Checks whether a player detects the unit, as a detector reveals an invisible unit.
   * @param whichPlayer - The player whose detection decides.
   * @returns True when the player detects the unit.
   * @native IsUnitDetected
   */
  public isDetected(whichPlayer: MapPlayer) {
    return IsUnitDetected(this.handle, whichPlayer.handle);
  }

  /**
   * Checks whether the unit is invisible to a player.
   * @param whichPlayer - The player whose view of the map decides.
   * @returns True when the unit is invisible to the player.
   * @native IsUnitInvisible
   */
  public isInvisible(whichPlayer: MapPlayer) {
    return IsUnitInvisible(this.handle, whichPlayer.handle);
  }

  /**
   * Checks whether a player owns the unit.
   * @param whichPlayer - The player to compare with the unit's owner.
   * @returns True when the player owns the unit.
   * @native IsUnitOwnedByPlayer
   */
  public isOwnedByPlayer(whichPlayer: MapPlayer) {
    return IsUnitOwnedByPlayer(this.handle, whichPlayer.handle);
  }

  /**
   * Checks whether the unit's type is of a race.
   * @param whichRace - The race, such as `RACE_HUMAN`.
   * @returns True when the unit is of the race.
   * @native IsUnitRace
   */
  public isRace(whichRace: race) {
    return IsUnitRace(this.handle, whichRace);
  }

  /**
   * Queues an order to build a structure at a point, after the unit's current orders.
   * @param unitId - The structure's unit type rawcode.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @returns True when the unit took the order.
   * @native BlzQueueBuildOrderById
   * @bug It returns true for a structure the unit can build on a free spot, even
   * when the player cannot afford it.
   */
  public queueBuildOrder(unitId: number, x: number, y: number) {
    return BlzQueueBuildOrderById(this.handle, unitId, x, y);
  }

  /**
   * Queues an order that takes no target, after the unit's current orders.
   * @param order - The order's id.
   * @returns True when the unit took the order.
   * @native BlzQueueImmediateOrderById
   */
  public queueImmediateOrder(order: OrderId) {
    return BlzQueueImmediateOrderById(this.handle, order);
  }

  /**
   * Queues an order at a point, with a widget as its instant target, after the unit's current orders.
   * @param order - The order's id.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @param instantTargetWidget - The instant target.
   * @returns True when the unit took the order.
   * @native BlzQueueInstantPointOrderById
   */
  public queueInstantOrderAt(
    order: OrderId,
    x: number,
    y: number,
    instantTargetWidget: Widget,
  ) {
    return BlzQueueInstantPointOrderById(
      this.handle,
      order,
      x,
      y,
      instantTargetWidget.handle,
    );
  }

  /**
   * Queues an order on a target, with another widget as its instant target, after
   * the unit's current orders.
   * @param order - The order's id.
   * @param targetWidget - The order's target.
   * @param instantTargetWidget - The instant target.
   * @returns True when the unit took the order.
   * @native BlzQueueInstantTargetOrderById
   */
  public queueInstantTargetOrder(
    order: OrderId,
    targetWidget: Widget,
    instantTargetWidget: Widget,
  ) {
    return BlzQueueInstantTargetOrderById(
      this.handle,
      order,
      targetWidget.handle,
      instantTargetWidget.handle,
    );
  }

  /**
   * Queues an order at a point, after the unit's current orders.
   * @param order - The order's id.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @returns True when the unit took the order.
   * @native BlzQueuePointOrderById
   * @bug For a build order it returns false, whether or not the unit obeys.
   */
  public queueOrderAt(order: OrderId, x: number, y: number) {
    return BlzQueuePointOrderById(this.handle, order, x, y);
  }

  /**
   * Queues an order on a target, after the unit's current orders.
   * @param order - The order's id.
   * @param targetWidget - The order's target.
   * @returns True when the unit took the order.
   * @native BlzQueueTargetOrderById
   */
  public queueTargetOrder(order: OrderId, targetWidget: Widget) {
    return BlzQueueTargetOrderById(this.handle, order, targetWidget.handle);
  }

  /**
   * Turns the unit to face an angle, at a speed that `duration` can slow down.
   * @remarks
   * The turn ignores the unit's turn rate (`turnSpeed`).
   * @param facingAngle - The facing, in degrees (0 east, 90 north).
   * @param duration - Below 1, the usual turn speed; from 1, a factor that slows the turn down.
   * @native SetUnitFacingTimed
   * @bug With a duration other than 0, the unit ends a few degrees off the angle asked for.
   */
  public setFacingTimed(facingAngle: number, duration: number) {
    SetUnitFacingTimed(this.handle, facingAngle, duration);
  }

  /**
   * Writes a field of one of the unit's weapons, through the
   * `BlzSetUnitWeapon*Field` Native of the field's type.
   * @remarks
   * Some fields do not work: the game can report a write that changes nothing.
   * @param field - A weapon field constant of any of the four field types.
   * @param index - The weapon's index.
   * @param value - The value, of the field's type: a boolean, a number or a string.
   * @returns True when the game wrote the field; false when the value is not of
   * the field's type.
   * @native BlzSetUnitWeaponBooleanField
   * @native BlzSetUnitWeaponIntegerField
   * @native BlzSetUnitWeaponRealField
   * @native BlzSetUnitWeaponStringField
   */
  public setWeaponField(
    field:
      | unitweaponbooleanfield
      | unitweaponintegerfield
      | unitweaponrealfield
      | unitweaponstringfield,
    index: number,
    value: boolean | number | string,
  ) {
    const fieldType = handleTypeOf(field);

    if (fieldType === "unitweaponbooleanfield" && typeof value === "boolean") {
      return BlzSetUnitWeaponBooleanField(
        this.handle,
        field as unitweaponbooleanfield,
        index,
        value,
      );
    }
    if (fieldType === "unitweaponintegerfield" && typeof value === "number") {
      return BlzSetUnitWeaponIntegerField(
        this.handle,
        field as unitweaponintegerfield,
        index,
        value,
      );
    }
    if (fieldType === "unitweaponrealfield" && typeof value === "number") {
      return BlzSetUnitWeaponRealField(
        this.handle,
        field as unitweaponrealfield,
        index,
        value,
      );
    }
    if (fieldType === "unitweaponstringfield" && typeof value === "string") {
      return BlzSetUnitWeaponStringField(
        this.handle,
        field as unitweaponstringfield,
        index,
        value,
      );
    }

    return false;
  }

  /**
   * Gets the food a unit type provides to its owner, such as a farm's.
   * @param unitId - The unit type's rawcode.
   * @returns The food provided.
   * @native GetFoodMade
   */
  public static foodMadeByType(unitId: number) {
    return GetFoodMade(unitId);
  }

  /**
   * Gets the food a unit type costs its owner.
   * @param unitId - The unit type's rawcode.
   * @returns The food used.
   * @native GetFoodUsed
   */
  public static foodUsedByType(unitId: number) {
    return GetFoodUsed(unitId);
  }

  /**
   * Gets the attacking unit of an attacked event.
   * @returns The attacker, or `undefined` outside an attacked event.
   * @native GetAttacker
   */
  public static fromAttacker(): Unit | undefined {
    return this.fromHandle(GetAttacker());
  }

  /**
   * Gets the unit changing owner in an ownership change event.
   * @returns The unit, or `undefined` outside an ownership change.
   * @native GetChangingUnit
   */
  public static fromChanging(): Unit | undefined {
    return this.fromHandle(GetChangingUnit());
  }

  /**
   * Gets the finished structure of a construction finish event.
   * @returns The structure, or `undefined` outside a construction finish.
   * @native GetConstructedStructure
   */
  public static fromConstructed(): Unit | undefined {
    return this.fromHandle(GetConstructedStructure());
  }

  /**
   * Gets the unit dealing the damage in a damage event.
   * @returns The source, or `undefined` outside a damage event or when no unit deals the damage.
   * @native GetEventDamageSource
   */
  public static fromDamageSource(): Unit | undefined {
    return this.fromHandle(GetEventDamageSource());
  }

  /**
   * Gets the unit taking the damage in a damage event.
   * @returns The target, or `undefined` outside a damage event.
   * @native BlzGetEventDamageTarget
   */
  public static fromDamageTarget(): Unit | undefined {
    return this.fromHandle(BlzGetEventDamageTarget());
  }

  /**
   * Gets the unit entering the region in a region event.
   * @returns The unit, or `undefined` outside a region event.
   * @native GetEnteringUnit
   */
  public static fromEntering(): Unit | undefined {
    return this.fromHandle(GetEnteringUnit());
  }

  /**
   * Gets the unit a group loop is at, inside the callback of `Group.for`.
   * @returns The unit, or `undefined` outside a group loop.
   * @native GetEnumUnit
   */
  public static fromEnum(): Unit | undefined {
    return this.fromHandle(GetEnumUnit());
  }

  /**
   * Gets the unit of the unit event that fired the running Trigger.
   * @returns The unit, or `undefined` outside a unit event.
   * @native GetTriggerUnit
   */
  public static override fromEvent(): Unit | undefined {
    return this.fromHandle(GetTriggerUnit());
  }

  /**
   * Gets the unit a group enumeration is testing, inside its filter.
   * @returns The unit, or `undefined` outside an enumeration filter.
   * @native GetFilterUnit
   */
  public static fromFilter(): Unit | undefined {
    return this.fromHandle(GetFilterUnit());
  }

  /**
   * Gets the unit that killed the dying unit in a death event.
   * @returns The killer, or `undefined` outside a death event or when no unit killed it.
   * @native GetKillingUnit
   */
  public static fromKilling(): Unit | undefined {
    return this.fromHandle(GetKillingUnit());
  }

  /**
   * Gets the unit leaving the region in a region event.
   * @returns The unit, or `undefined` outside a region event.
   * @native GetLeavingUnit
   */
  public static fromLeaving(): Unit | undefined {
    return this.fromHandle(GetLeavingUnit());
  }

  /**
   * Gets the hero gaining a level in a hero level event.
   * @returns The hero, or `undefined` outside a hero level event.
   * @native GetLevelingUnit
   */
  public static fromLeveling(): Unit | undefined {
    return this.fromHandle(GetLevelingUnit());
  }

  /**
   * Gets the unit loaded into a transport in a load event.
   * @returns The unit, or `undefined` outside a load event.
   * @native GetLoadedUnit
   */
  public static fromLoaded(): Unit | undefined {
    return this.fromHandle(GetLoadedUnit());
  }

  /**
   * Gets the unit given an order in an order event.
   * @returns The unit, or `undefined` outside an order event.
   * @native GetOrderedUnit
   */
  public static fromOrdered(): Unit | undefined {
    return this.fromHandle(GetOrderedUnit());
  }

  /**
   * Gets the unit a target order targets in an order event.
   * @returns The target, or `undefined` outside a target order or when the target
   * is not a unit.
   * @native GetOrderTargetUnit
   */
  public static override fromOrderTarget(): Unit | undefined {
    return this.fromHandle(GetOrderTargetUnit());
  }

  /**
   * Gets the target unit of the spell in a spell event.
   * @returns The target, or `undefined` outside a spell event or when the spell
   * targets no unit.
   * @native GetSpellTargetUnit
   */
  public static fromSpellTarget(): Unit | undefined {
    return this.fromHandle(GetSpellTargetUnit());
  }

  /**
   * Gets the summoned unit of a summon event.
   * @returns The summoned unit, or `undefined` outside a summon event.
   * @native GetSummonedUnit
   */
  public static fromSummoned(): Unit | undefined {
    return this.fromHandle(GetSummonedUnit());
  }

  /**
   * Gets the unit that summons in a summon event.
   * @returns The summoner, or `undefined` outside a summon event.
   * @native GetSummoningUnit
   */
  public static fromSummoning(): Unit | undefined {
    return this.fromHandle(GetSummoningUnit());
  }

  /**
   * Gets the trained unit of a training finish event.
   * @returns The unit, or `undefined` outside a training finish.
   * @native GetTrainedUnit
   */
  public static fromTrained(): Unit | undefined {
    return this.fromHandle(GetTrainedUnit());
  }

  /**
   * Gets the transport a unit is loaded into in a load event.
   * @returns The transport, or `undefined` outside a load event.
   * @native GetTransportUnit
   */
  public static fromTransport(): Unit | undefined {
    return this.fromHandle(GetTransportUnit());
  }

  /**
   * Gets the unit buying from a shop in a sell event.
   * @returns The buyer, or `undefined` outside a sell event.
   * @native GetBuyingUnit
   */
  public static fromBuying(): Unit | undefined {
    return this.fromHandle(GetBuyingUnit());
  }

  /**
   * Gets the structure whose construction is cancelled in a construction cancel event.
   * @returns The structure, or `undefined` outside a construction cancel.
   * @native GetCancelledStructure
   */
  public static fromCancelled(): Unit | undefined {
    return this.fromHandle(GetCancelledStructure());
  }

  /**
   * Gets the structure being built in a construction start event.
   * @returns The structure, or `undefined` outside a construction start.
   * @native GetConstructingStructure
   */
  public static fromConstructing(): Unit | undefined {
    return this.fromHandle(GetConstructingStructure());
  }

  /**
   * Gets the decaying unit of a decay event.
   * @returns The unit, or `undefined` outside a decay event.
   * @native GetDecayingUnit
   */
  public static fromDecaying(): Unit | undefined {
    return this.fromHandle(GetDecayingUnit());
  }

  /**
   * Gets the detected unit of a detection event.
   * @returns The unit, or `undefined` outside a detection event.
   * @native GetDetectedUnit
   */
  public static fromDetected(): Unit | undefined {
    return this.fromHandle(GetDetectedUnit());
  }

  /**
   * Gets the dying unit of a death event.
   * @returns The unit, or `undefined` outside a death event.
   * @native GetDyingUnit
   */
  public static fromDying(): Unit | undefined {
    return this.fromHandle(GetDyingUnit());
  }

  /**
   * Gets the target unit of a target acquired or target in range event.
   * @returns The target, or `undefined` when the event has none.
   * @native GetEventTargetUnit
   */
  public static fromEventTarget(): Unit | undefined {
    return this.fromHandle(GetEventTargetUnit());
  }

  /**
   * Gets the hero learning a skill in a skill event.
   * @returns The hero, or `undefined` outside a skill event.
   * @native GetLearningUnit
   */
  public static fromLearning(): Unit | undefined {
    return this.fromHandle(GetLearningUnit());
  }

  /**
   * Gets the unit picking up, dropping or using an item in an item event.
   * @returns The unit, or `undefined` outside an item event.
   * @native GetManipulatingUnit
   */
  public static fromManipulating(): Unit | undefined {
    return this.fromHandle(GetManipulatingUnit());
  }

  /**
   * Gets the unit under the local player's mouse cursor.
   * @remarks
   * The value differs between clients: never let it decide game state.
   * @returns The unit, or `undefined` when the cursor is over none.
   * @native BlzGetMouseFocusUnit
   * @async
   */
  public static fromMouseFocus(): Unit | undefined {
    return this.fromHandle(BlzGetMouseFocusUnit());
  }

  /**
   * Gets the unit researching in a research event.
   * @returns The unit, or `undefined` outside a research event.
   * @native GetResearchingUnit
   */
  public static fromResearching(): Unit | undefined {
    return this.fromHandle(GetResearchingUnit());
  }

  /**
   * Gets the unit rescuing in a rescue event.
   * @returns The rescuer, or `undefined` outside a rescue event.
   * @native GetRescuer
   */
  public static fromRescuer(): Unit | undefined {
    return this.fromHandle(GetRescuer());
  }

  /**
   * Gets the hero that became revivable in a revivable event.
   * @returns The hero, or `undefined` outside a revivable event.
   * @native GetRevivableUnit
   */
  public static fromRevivable(): Unit | undefined {
    return this.fromHandle(GetRevivableUnit());
  }

  /**
   * Gets the reviving hero of a revive event.
   * @returns The hero, or `undefined` outside a revive event.
   * @native GetRevivingUnit
   */
  public static fromReviving(): Unit | undefined {
    return this.fromHandle(GetRevivingUnit());
  }

  /**
   * Gets the shop selling in a sell event.
   * @returns The shop, or `undefined` outside a sell event.
   * @native GetSellingUnit
   */
  public static fromSelling(): Unit | undefined {
    return this.fromHandle(GetSellingUnit());
  }

  /**
   * Gets the unit sold in a unit sell event.
   * @returns The unit, or `undefined` outside a unit sell event.
   * @native GetSoldUnit
   */
  public static fromSold(): Unit | undefined {
    return this.fromHandle(GetSoldUnit());
  }

  /**
   * Gets the unit casting the spell in a spell event.
   * @returns The caster, or `undefined` outside a spell event.
   * @native GetSpellAbilityUnit
   */
  public static fromSpellAbility(): Unit | undefined {
    return this.fromHandle(GetSpellAbilityUnit());
  }

  /**
   * Gets the point value a unit type defines, which the score screen counts.
   * @param unitType - The unit type's rawcode.
   * @returns The point value.
   * @native GetUnitPointValueByType
   */
  public static getPointValueByType(unitType: number) {
    return GetUnitPointValueByType(unitType);
  }

  /**
   * Checks whether a unit type is a hero type.
   * @param unitId - The unit type's rawcode.
   * @returns True when the type is a hero type.
   * @native IsHeroUnitId
   */
  public static isUnitIdHero(unitId: number) {
    return IsHeroUnitId(unitId);
  }

  /**
   * Checks whether a unit type has a classification, such as `UNIT_TYPE_STRUCTURE`.
   * @param unitId - The unit type's rawcode.
   * @param whichUnitType - The classification.
   * @returns True when the type has it.
   * @native IsUnitIdType
   */
  public static isUnitIdType(unitId: number, whichUnitType: unittype) {
    return IsUnitIdType(unitId, whichUnitType);
  }
}
