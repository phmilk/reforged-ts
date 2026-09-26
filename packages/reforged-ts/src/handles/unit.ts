/** @noSelfInFile */

import type { OrderId } from "../globals/order";
import { configuration } from "../reforged/configuration";
import { assertDamageDepth } from "../reforged/damage";
import { rawcodeToString } from "../utils/rawcode";
import { Destructable } from "./destructable";
import type { EquipmentType, LoadoutSlot } from "./equipment";
import { Force } from "./force";
import { fieldTypeOf } from "./fields";
import type { Group } from "./group";
import { Item } from "./item";
import { MapPlayer } from "./player";
import { Point } from "./point";
import { Sound } from "./sound";
import { Widget } from "./widget";

export class Unit extends Widget {
  declare public readonly handle: unit;

  /**
   * Creates a unit.
   * @param owner The owner of the unit.
   * @param unitId The rawcode of the unit.
   * @param x The x-coordinate of the unit.
   * @param y The y-coordinate of the unit.
   * @param face The direction that the unit will be facing in degrees.
   * @param skinId The skin of the unit.
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
   * Sets a unit's acquire range.  This is the value that a unit uses to choose targets to
   * engage with.  Note that this is not the attack range.  When acquisition range is
   * greater than attack range, the unit will attempt to move towards acquired targets, and then attack.
   * Setting acquisition range lower than attack range in the object editor limits the
   * unit's attack range to the acquisition range, but changing a unit's acquisition range
   * with this native does not change its attack range, nor the value displayed in the UI.
   *
   * @note It is a myth that reducing acquire range with this native can limit a unit's attack range.
   */
  public set acquireRange(value: number) {
    SetUnitAcquireRange(this.handle, value);
  }

  public get acquireRange() {
    return GetUnitAcquireRange(this.handle);
  }

  public get agility() {
    return GetHeroAgi(this.handle, false);
  }

  public set agility(value: number) {
    SetHeroAgi(this.handle, value, true);
  }

  public get armor() {
    return BlzGetUnitArmor(this.handle);
  }

  public set armor(armorAmount: number) {
    BlzSetUnitArmor(this.handle, armorAmount);
  }

  /**
   * The size of the unit's bag, its extended inventory, through
   * `UnitExtendedInventorySize` (3.0.0).
   */
  public get bagSize() {
    return UnitExtendedInventorySize(this.handle);
  }

  public set canSleep(flag: boolean) {
    UnitAddSleep(this.handle, flag);
  }

  public get canSleep() {
    return UnitCanSleep(this.handle);
  }

  public get collisionSize() {
    return BlzGetUnitCollisionSize(this.handle);
  }

  public set color(whichColor: playercolor) {
    SetUnitColor(this.handle, whichColor);
  }

  public get currentOrder() {
    return GetUnitCurrentOrder(this.handle);
  }

  public get defaultAcquireRange() {
    return GetUnitDefaultAcquireRange(this.handle);
  }

  public get defaultFlyHeight() {
    return GetUnitDefaultFlyHeight(this.handle);
  }

  public get defaultMoveSpeed() {
    return GetUnitDefaultMoveSpeed(this.handle);
  }

  /**
   * Returns a unit's default propulsion window angle in degrees.
   * @note This function is the odd case in the asymmetric prop window API, since the
   * other prop window natives use radians.
   */
  public get defaultPropWindow() {
    return GetUnitDefaultPropWindow(this.handle);
  }

  public get defaultTurnSpeed() {
    return GetUnitDefaultTurnSpeed(this.handle);
  }

  public get experience() {
    return GetHeroXP(this.handle);
  }

  public set experience(newXpVal: number) {
    SetHeroXP(this.handle, newXpVal, true);
  }

  public set facing(value: number) {
    SetUnitFacing(this.handle, value);
  }

  /**
   * @returns The units facing in degrees.
   */
  public get facing() {
    return GetUnitFacing(this.handle);
  }

  public get foodMade() {
    return GetUnitFoodMade(this.handle);
  }

  public get foodUsed() {
    return GetUnitFoodUsed(this.handle);
  }

  public get ignoreAlarmToggled() {
    return UnitIgnoreAlarmToggled(this.handle);
  }

  public get intelligence() {
    return GetHeroInt(this.handle, false);
  }

  public set intelligence(value: number) {
    SetHeroInt(this.handle, value, true);
  }

  public get inventorySize() {
    return UnitInventorySize(this.handle);
  }

  /**
   * Renders a unit invulnerable/lifts that specific invulnerability.
   *
   * @note The native seems to employ the `'Avul'` ability, which is defined in the default AbilityData.slk.
   * If there is no `'Avul'` defined, this will crash the game.
   */
  public set invulnerable(flag: boolean) {
    SetUnitInvulnerable(this.handle, flag);
  }

  public get invulnerable() {
    return BlzIsUnitInvulnerable(this.handle);
  }

  /** Whether the hero glow is allowed on the unit, through `HeroGlowIsAllowedOnUnit` (3.0.0). */
  public get isHeroGlowAllowed() {
    return HeroGlowIsAllowedOnUnit(this.handle);
  }

  public get level() {
    return GetUnitLevel(this.handle);
  }

  public get localZ() {
    return BlzGetLocalUnitZ(this.handle);
  }

  public get mana() {
    return this.getState(UNIT_STATE_MANA);
  }

  public set mana(value: number) {
    this.setState(UNIT_STATE_MANA, value);
  }

  public get maxLife() {
    return BlzGetUnitMaxHP(this.handle);
  }

  public set maxLife(value: number) {
    BlzSetUnitMaxHP(this.handle, value);
  }

  public get maxMana() {
    return BlzGetUnitMaxMana(this.handle);
  }

  public set maxMana(value: number) {
    BlzSetUnitMaxMana(this.handle, value);
  }

  public set moveSpeed(value: number) {
    SetUnitMoveSpeed(this.handle, value);
  }

  public get moveSpeed() {
    return GetUnitMoveSpeed(this.handle);
  }

  /**
   * @async
   */
  get name() {
    return GetUnitName(this.handle) ?? "";
  }

  set name(value: string) {
    BlzSetUnitName(this.handle, value);
  }

  public set nameProper(value: string) {
    BlzSetHeroProperName(this.handle, value);
  }

  /**
   * Returns the hero's "Proper Name", which is the name displayed above the level bar.
   *
   * @note Will return 'null' on non-hero units.
   * @note Will return 'null' on illusions.
   */
  public get nameProper() {
    return GetHeroProperName(this.handle) ?? "";
  }

  /**
   * The number of orders the unit has, the current one and the queued ones,
   * through `BlzGetUnitOrderCount`.
   */
  public get orderCount() {
    return BlzGetUnitOrderCount(this.handle);
  }

  /**
   * Pauses a unit. A paused unit has the following properties:
   * 1. Buffs/effects are suspended
   * 2. Orders are stored when paused and fired on unpause
   * 3. The paused unit does not accept powerups. `addItem` returns true but the item is not picked up
   */
  public set paused(flag: boolean) {
    PauseUnit(this.handle, flag);
  }

  /**
   * @returns true if the unit is paused
   */
  public get paused() {
    return IsUnitPaused(this.handle);
  }

  public get pointValue() {
    return GetUnitPointValue(this.handle);
  }

  /**
   * Sets a unit's propulsion window to the specified angle (in radians).
   * The propulsion window determines at which facing angle difference to the target
   * command's location (move, attack, patrol, smart) a unit will begin to move if
   * movement is required to fulfil the command, or if it will turn without movement.
   * A propulsion window of 0 makes the unit unable to move at all.
   * A propulsion window of 180 will force it to start moving as soon as the command
   * is given (if movement is required). In practice, this means that setting a
   * unit's prop window to 0 will prevent it from attacking.
   *
   * http://www.hiveworkshop.com/forums/2391397-post20.html

   * @param newPropWindowAngle The propulsion window angle to assign. Should be in radians.
   */
  public set propWindow(newPropWindowAngle: number) {
    SetUnitPropWindow(this.handle, newPropWindowAngle);
  }

  /**
   * Returns a unit's propulsion window angle in radians.
   */
  public get propWindow() {
    return GetUnitPropWindow(this.handle);
  }

  public get race() {
    return GetUnitRace(this.handle);
  }

  public get rallyDestructable(): Destructable | undefined {
    return Destructable.fromHandle(GetUnitRallyDestructable(this.handle));
  }

  /**
   * The unit's rally point, or undefined for a unit that has none: a lookup,
   * although the game allocates a new location each time it returns one.
   */
  public get rallyPoint(): Point | undefined {
    return Point.fromHandle(GetUnitRallyPoint(this.handle));
  }

  public get rallyUnit(): Unit | undefined {
    return Unit.fromHandle(GetUnitRallyUnit(this.handle));
  }

  public set resourceAmount(amount: number) {
    SetResourceAmount(this.handle, amount);
  }

  public get resourceAmount() {
    return GetResourceAmount(this.handle);
  }

  public get selectable() {
    return BlzIsUnitSelectable(this.handle);
  }

  public set selectionScale(scale: number) {
    this.setField(UNIT_RF_SELECTION_SCALE, scale);
  }

  public get selectionScale() {
    const result = this.getField(UNIT_RF_SELECTION_SCALE);
    return typeof result === "number" ? result : 0;
  }

  public set show(flag: boolean) {
    ShowUnit(this.handle, flag);
  }

  public get show() {
    return !IsUnitHidden(this.handle);
  }

  public get skin() {
    return BlzGetUnitSkin(this.handle);
  }

  public set skin(skinId: number) {
    BlzSetUnitSkin(this.handle, skinId);
  }

  /**
   * Returns the units available skill points.
   */
  public get skillPoints() {
    return GetHeroSkillPoints(this.handle);
  }

  /**
   * Adds the amount to the units available skill points. Calling with a negative
   * number reduces the skill points by that amount.
   * Returns false if the amount of available skill points is already zero and
   * if it's called with any non-positive number.
   * Returns true in any other case.
   * @note If `skillPointDelta` is greater than the amount of skillpoints the hero
   * actually can spend (like 9 for three 3-level abilities) only that amount will
   * be added. Negative `skillPointDelta` works as expected.
   */
  public set skillPoints(skillPointDelta: number) {
    UnitModifySkillPoints(this.handle, skillPointDelta);
  }

  public get sleeping() {
    return UnitIsSleeping(this.handle);
  }

  public get strength() {
    return GetHeroStr(this.handle, false);
  }

  public set strength(value: number) {
    SetHeroStr(this.handle, value, true);
  }

  public set turnSpeed(value: number) {
    SetUnitTurnSpeed(this.handle, value);
  }

  public get turnSpeed() {
    return GetUnitTurnSpeed(this.handle);
  }

  public get typeId() {
    return GetUnitTypeId(this.handle);
  }

  public get userData() {
    return GetUnitUserData(this.handle);
  }

  /**
   * Sets a single custom integer for a unit.
   *
   * @note This value is not used by any standard mechanisms in Warcraft III.
   */
  public set userData(value: number) {
    SetUnitUserData(this.handle, value);
  }

  public set waygateActive(flag: boolean) {
    WaygateActivate(this.handle, flag);
  }

  public get waygateActive() {
    return WaygateIsActive(this.handle);
  }

  /**
   * @bug If the unit is loaded into a zeppelin this will not return the position
   * of the zeppelin but the last position of the unit before it was loaded into
   * the zeppelin.
   */
  public override get x() {
    return GetUnitX(this.handle);
  }

  /**
   * @note If the unit has movementspeed of zero the unit will be moved but the model of the unit will not move.
   * @note This does not cancel orders of the unit. `setPosition` does cancel orders.
   */
  public override set x(value: number) {
    SetUnitX(this.handle, value);
  }

  public override get y() {
    return GetUnitY(this.handle);
  }

  /**
   * @note If the unit has movementspeed of zero the unit will be moved but the model of the unit will not move.
   * @note This does not cancel orders of the unit. `setPosition` does cancel orders.
   */
  public override set y(value: number) {
    SetUnitY(this.handle, value);
  }

  /**
   * @async
   */
  public get z() {
    return BlzGetUnitZ(this.handle);
  }

  public addAbility(abilityId: number) {
    return UnitAddAbility(this.handle, abilityId);
  }

  /**
   * Adjusts the remaining cooldown of the ability by `delta`, a percentage of
   * its full cooldown, through `BlzAdjustUnitAbilityCooldownPercent` (3.0.0).
   */
  public adjustAbilityCooldownPercent(abilId: number, delta: number) {
    BlzAdjustUnitAbilityCooldownPercent(this.handle, abilId, delta);
  }

  /**
   * Adjusts the remaining cooldown of the ability by `delta` seconds, through
   * `BlzAdjustUnitAbilityCooldownRemaining` (3.0.0).
   */
  public adjustAbilityCooldownRemaining(abilId: number, delta: number) {
    BlzAdjustUnitAbilityCooldownRemaining(this.handle, abilId, delta);
  }

  public addAnimationProps(animProperties: string, add: boolean) {
    AddUnitAnimationProperties(this.handle, animProperties, add);
  }

  /**
   * Adds the input value of experience to the hero unit specified.
   *
   * If the experience added exceeds the amount required for the hero to gain a level,
   * then it will force the unit to gain a level and the remaining experience will spill over for the next level.
   *
   * @bug Adding negative value to experience will decrease it
   * by the stated value, but won't lower the level even if the experience value
   * after deduction is lower than the lower bound of the experience required to get
   * the stated level.
   * @bug If the value will become lower than zero, the experience won't be negative, instead of it it'll be equal
   * to `4294967296+(supposed_negative_experience_value)`.
   * @param xpToAdd The amount of experience to add to the hero unit.
   * @param showEyeCandy If the boolean input is true, then the hero-level-gain
   * effect will be shown if the hero gains a level from the added experience.
   */
  public addExperience(xpToAdd: number, showEyeCandy: boolean) {
    AddHeroXP(this.handle, xpToAdd, showEyeCandy);
  }

  public override addIndicator(
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ) {
    UnitAddIndicator(this.handle, red, green, blue, alpha);
  }

  public addItem(whichItem: Item) {
    return UnitAddItem(this.handle, whichItem.handle);
  }

  public addItemById(itemId: number): Item {
    return Item.expect(
      UnitAddItemById(this.handle, itemId),
      rawcodeToString(itemId),
    );
  }

  public addItemToSlotById(itemId: number, itemSlot: number) {
    return UnitAddItemToSlotById(this.handle, itemId, itemSlot);
  }

  public addItemToStock(
    itemId: number,
    currentStock: number,
    stockMax: number,
  ) {
    AddItemToStock(this.handle, itemId, currentStock, stockMax);
  }

  /**
   * Adds the amount more gold to the whichUnit gold mine.
   *
   * @bug If the value after adding negative amount will be less than zero, then it
   * will display negative resource amount, but if some peasant or peon will try to
   * gather resources from such a mine, he will bring back 0 gold and the mine will
   * be auto-destroyed.
   * @param amount The amount of resources to add to the unit.
   */
  public addResourceAmount(amount: number) {
    AddResourceAmount(this.handle, amount);
  }

  public addSleepPerm(add: boolean) {
    UnitAddSleepPerm(this.handle, add);
  }

  public addType(whichUnitType: unittype) {
    return UnitAddType(this.handle, whichUnitType);
  }

  public addUnitToStock(
    unitId: number,
    currentStock: number,
    stockMax: number,
  ) {
    AddUnitToStock(this.handle, unitId, currentStock, stockMax);
  }

  /**
   * Allows or disallows the hero glow on the unit, through
   * `AllowHeroGlowOnUnit` or `DisallowHeroGlowOnUnit` (3.0.0).
   */
  public allowHeroGlow(allow: boolean) {
    if (allow) {
      AllowHeroGlowOnUnit(this.handle);
    } else {
      DisallowHeroGlowOnUnit(this.handle);
    }
  }

  public applyTimedLife(buffId: number, duration: number) {
    UnitApplyTimedLife(this.handle, buffId, duration);
  }

  public attachSound(sound: Sound) {
    AttachSoundToUnit(sound.handle, this.handle);
  }

  /**
   * The item at `index` in the unit's bag, or undefined for an empty index,
   * through `UnitItemInBagSlot` (3.0.0).
   */
  public bagItem(index: number): Item | undefined {
    return Item.fromHandle(UnitItemInBagSlot(this.handle, index));
  }

  public cancelTimedLife() {
    BlzUnitCancelTimedLife(this.handle);
  }

  /**
   * Whether the unit can equip items of the equipment type, through
   * `UnitCanEquipItemOfEquipmentType` (3.0.0).
   */
  public canEquip(equipmentType: EquipmentType) {
    return UnitCanEquipItemOfEquipmentType(
      this.handle,
      ConvertEquipmentType(equipmentType),
    );
  }

  public canSleepPerm() {
    return UnitCanSleepPerm(this.handle);
  }

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
   * Deals damage to target widget from a source unit.
   *
   * @note For some insight about the different configurations of the different types see [this post](http://www.wc3c.net/showpost.php?p=1030046&postcount=19).
   * @param target The target being damaged.
   * @param amount How much damage is being dealt.
   * @param attack Consider the damage dealt as being an attack.
   * @param ranged Consider the damage dealt as being from a ranged source.
   * @param attackType
   * @param damageType
   * @param weaponType
   * @remarks
   * Dealing damage inside a damage handler fires the damage events again, so
   * a handler that damages back without a stop loops until the client
   * crashes. In Dev mode every action and condition of a Trigger carrying a
   * damage event (an `on()` damage subscription included) runs one level
   * deeper in a shared damage depth, and this member raises
   * `reforged-ts: Unit#<id> Unit.damageTarget at damage depth <depth>, past
   * the limit of <limit>: ...` when the depth exceeds the limit: eight
   * nested dispatches by default, `Reforged.configure({ damageDepthLimit })`
   * to change it. A single bounce (reflect damage) passes. With Dev mode off
   * nothing is counted and nothing raises.
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
   * Decreases the level of a unit's ability by 1. The level will not go below 1.
   * @param abilCode The four digit rawcode representation of the ability.
   * @returns The new ability level.
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
   */
  public destroy() {
    RemoveUnit(this.handle);
    this.release();
  }

  public disableAbility(abilId: number, flag: boolean, hideUI: boolean) {
    BlzUnitDisableAbility(this.handle, abilId, flag, hideUI);
  }

  public dropItem(whichItem: Item, x: number, y: number) {
    return UnitDropItemPoint(this.handle, whichItem.handle, x, y);
  }

  public dropItemFromSlot(whichItem: Item, slot: number) {
    return UnitDropItemSlot(this.handle, whichItem.handle, slot);
  }

  public dropItemTarget(
    whichItem: Item,
    target: Widget /* | Unit | Item | Destructable */,
  ) {
    return UnitDropItemTarget(this.handle, whichItem.handle, target.handle);
  }

  /**
   * Enables or disables the unit's auras, through `BlzUnitEnableAuras`
   * (3.0.0).
   */
  public enableAuras(enable: boolean, affectsUI: boolean) {
    BlzUnitEnableAuras(this.handle, enable, affectsUI);
  }

  public endAbilityCooldown(abilCode: number) {
    BlzEndUnitAbilityCooldown(this.handle, abilCode);
  }

  /**
   * Equips the item on the unit and returns whether it was equipped, through
   * `UnitEquipItem` (3.0.0).
   */
  public equip(whichItem: Item): boolean {
    return UnitEquipItem(this.handle, whichItem.handle);
  }

  /**
   * The item equipped in the loadout slot, or undefined for an empty slot,
   * through `UnitItemInEquipmentSlot` (3.0.0).
   */
  public equippedItem(slot: LoadoutSlot): Item | undefined {
    return Item.fromHandle(
      UnitItemInEquipmentSlot(this.handle, ConvertLoadoutSlot(slot)),
    );
  }

  public getAbility(abilId: number) {
    return BlzGetUnitAbility(this.handle, abilId);
  }

  public getAbilityByIndex(index: number) {
    return BlzGetUnitAbilityByIndex(this.handle, index);
  }

  public getAbilityCooldown(abilId: number, level: number) {
    return BlzGetUnitAbilityCooldown(this.handle, abilId, level);
  }

  /**
   * The remaining cooldown of the ability as a percentage of its full
   * cooldown, through `BlzGetUnitAbilityCooldownPercent` (3.0.0).
   */
  public getAbilityCooldownPercent(abilId: number) {
    return BlzGetUnitAbilityCooldownPercent(this.handle, abilId);
  }

  public getAbilityCooldownRemaining(abilId: number) {
    return BlzGetUnitAbilityCooldownRemaining(this.handle, abilId);
  }

  /**
   * Returns the level of the ability for the unit.
   * @note This function is **not** zero indexed.
   */
  public getAbilityLevel(abilCode: number) {
    return GetUnitAbilityLevel(this.handle, abilCode);
  }

  public getAbilityManaCost(abilId: number, level: number) {
    return BlzGetUnitAbilityManaCost(this.handle, abilId, level);
  }

  public getAgility(includeBonuses: boolean) {
    return GetHeroAgi(this.handle, includeBonuses);
  }

  /**
   * The duration of an animation of the unit's model, by name or by index,
   * through `BlzGetUnitAnimationDuration` or
   * `BlzGetUnitAnimationDurationByIndex` (3.0.0).
   */
  public getAnimationDuration(animation: string | number) {
    if (typeof animation === "string") {
      return BlzGetUnitAnimationDuration(this.handle, animation);
    }
    return BlzGetUnitAnimationDurationByIndex(this.handle, animation);
  }

  public getAttackCooldown(weaponIndex: number) {
    return BlzGetUnitAttackCooldown(this.handle, weaponIndex);
  }

  public getBaseDamage(weaponIndex: number) {
    return BlzGetUnitBaseDamage(this.handle, weaponIndex);
  }

  public getDiceNumber(weaponIndex: number) {
    return BlzGetUnitDiceNumber(this.handle, weaponIndex);
  }

  public getDiceSides(weaponIndex: number) {
    return BlzGetUnitDiceSides(this.handle, weaponIndex);
  }

  public getField(
    field:
      unitbooleanfield | unitintegerfield | unitrealfield | unitstringfield,
  ) {
    const fieldType = fieldTypeOf(field);

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

  public getflyHeight() {
    return GetUnitFlyHeight(this.handle);
  }

  public getHeroLevel() {
    return GetHeroLevel(this.handle);
  }

  public getIgnoreAlarm(flag: boolean) {
    return UnitIgnoreAlarm(this.handle, flag);
  }

  public getIntelligence(includeBonuses: boolean) {
    return GetHeroInt(this.handle, includeBonuses);
  }

  public getItemInSlot(slot: number): Item | undefined {
    return Item.fromHandle(UnitItemInSlot(this.handle, slot));
  }

  public getState(whichUnitState: unitstate) {
    return GetUnitState(this.handle, whichUnitState);
  }

  public getStrength(includeBonuses: boolean) {
    return GetHeroStr(this.handle, includeBonuses);
  }

  /**
   * Whether the unit has any item equipped, through `UnitHasAnyItemEquiped`
   * (3.0.0). The Native's name is misspelt.
   */
  public hasAnyEquipped() {
    return UnitHasAnyItemEquiped(this.handle);
  }

  /** Whether the item is in the unit's bag, through `UnitHasItemBagged` (3.0.0). */
  public hasBagged(whichItem: Item) {
    return UnitHasItemBagged(this.handle, whichItem.handle);
  }

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
   * Whether the unit's loadout slot is empty, through
   * `UnitHasLoadoutSlotEmpty` (3.0.0).
   */
  public hasEmptySlot(slot: LoadoutSlot) {
    return UnitHasLoadoutSlotEmpty(this.handle, ConvertLoadoutSlot(slot));
  }

  /**
   * Whether the unit has an item of the equipment type equipped, through
   * `UnitHasItemEquipmentOfType` (3.0.0).
   */
  public hasEquipmentOfType(equipmentType: EquipmentType) {
    return UnitHasItemEquipmentOfType(
      this.handle,
      ConvertEquipmentType(equipmentType),
    );
  }

  /** Whether the unit has the item equipped, through `UnitHasItemEquipped` (3.0.0). */
  public hasEquipped(whichItem: Item) {
    return UnitHasItemEquipped(this.handle, whichItem.handle);
  }

  public hasItem(whichItem: Item) {
    return UnitHasItem(this.handle, whichItem.handle);
  }

  public hideAbility(abilId: number, flag: boolean) {
    BlzUnitHideAbility(this.handle, abilId, flag);
  }

  /**
   * Increases the level of a unit's ability by 1.
   * @param abilCode The four digit rawcode representation of the ability.
   * @returns The new ability level.
   *
   * @note `incAbilityLevel` can increase an abilities level to maxlevel+1. On maxlevel+1 all ability fields are 0.
   *
   * http://www.wc3c.net/showthread.php?p=1029039#post1029039
   * http://www.hiveworkshop.com/forums/lab-715/silenceex-everything-you-dont-know-about-silence-274351/.
   */
  public incAbilityLevel(abilCode: number) {
    return IncUnitAbilityLevel(this.handle, abilCode);
  }

  public inForce(whichForce: Force) {
    return IsUnitInForce(this.handle, whichForce.handle);
  }

  public inGroup(whichGroup: Group) {
    return IsUnitInGroup(this.handle, whichGroup.handle);
  }

  /**
   * Check if a unit is within range of a point. Collision size is taken into account.
   */
  public inRange(x: number, y: number, distance: number) {
    return IsUnitInRangeXY(this.handle, x, y, distance);
  }

  /**
   * Check if a unit is within range of a point. Collision size is taken into account.
   */
  public inRangeOfPoint(whichPoint: Point, distance: number) {
    return IsUnitInRangeLoc(this.handle, whichPoint.handle, distance);
  }

  /**
   * Check if a unit is within range of a another unit. Collision size is taken into account.
   */
  public inRangeOfUnit(otherUnit: Unit, distance: number) {
    return IsUnitInRange(this.handle, otherUnit.handle, distance);
  }

  public interruptAttack() {
    BlzUnitInterruptAttack(this.handle);
  }

  public inTransport(whichTransport: Unit) {
    return IsUnitInTransport(this.handle, whichTransport.handle);
  }

  public isAlive(): boolean {
    return UnitAlive(this.handle);
  }

  public isAlly(whichPlayer: MapPlayer) {
    return IsUnitAlly(this.handle, whichPlayer.handle);
  }

  public isEnemy(whichPlayer: MapPlayer) {
    return IsUnitEnemy(this.handle, whichPlayer.handle);
  }

  public isExperienceSuspended() {
    return IsSuspendedXP(this.handle);
  }

  public isFogged(whichPlayer: MapPlayer) {
    return IsUnitFogged(this.handle, whichPlayer.handle);
  }

  public isHero() {
    return IsHeroUnitId(this.typeId);
  }

  public isIllusion() {
    return IsUnitIllusion(this.handle);
  }

  public isLoaded() {
    return IsUnitLoaded(this.handle);
  }

  public isMasked(whichPlayer: MapPlayer) {
    return IsUnitMasked(this.handle, whichPlayer.handle);
  }

  public isSelected(whichPlayer: MapPlayer) {
    return IsUnitSelected(this.handle, whichPlayer.handle);
  }

  public issueBuildOrder(unit: string | number, x: number, y: number) {
    return typeof unit === "string"
      ? IssueBuildOrder(this.handle, unit, x, y)
      : IssueBuildOrderById(this.handle, unit, x, y);
  }

  public issueImmediateOrder(order: string | OrderId) {
    return typeof order === "string"
      ? IssueImmediateOrder(this.handle, order)
      : IssueImmediateOrderById(this.handle, order);
  }

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

  public issueOrderAt(order: string | OrderId, x: number, y: number) {
    return typeof order === "string"
      ? IssuePointOrder(this.handle, order, x, y)
      : IssuePointOrderById(this.handle, order, x, y);
  }

  public issuePointOrder(order: string | OrderId, whichPoint: Point) {
    return typeof order === "string"
      ? IssuePointOrderLoc(this.handle, order, whichPoint.handle)
      : IssuePointOrderByIdLoc(this.handle, order, whichPoint.handle);
  }

  public issueTargetOrder(order: string | OrderId, targetWidget: Widget) {
    return typeof order === "string"
      ? IssueTargetOrder(this.handle, order, targetWidget.handle)
      : IssueTargetOrderById(this.handle, order, targetWidget.handle);
  }

  /**
   * @note Useless. Use operator == instead.
   */
  public isUnit(whichSpecifiedUnit: Unit) {
    return IsUnit(this.handle, whichSpecifiedUnit.handle);
  }

  /**
   * @note This native returns a boolean, which when typecasted to integer might be greater than 1. It's probably implemented via a bitset.
   * @note In past patches this native bugged when used in conditionfuncs.
   * The fix back then was to compare with true (`==true`).
   * I cannot reproduce the faulty behaviour in patch 1.27 so this is only a note.
   * @param whichUnitType
   */
  public isUnitType(whichUnitType: unittype) {
    return IsUnitType(this.handle, whichUnitType);
  }

  public isVisible(whichPlayer: MapPlayer) {
    return IsUnitVisible(this.handle, whichPlayer.handle);
  }

  /**
   * Kills the unit.
   */
  public kill() {
    KillUnit(this.handle);
  }

  /**
   * Locks a unit's bone to face the target until ResetUnitLookAt is called.
   *
   * The offset coordinates ( X, Y, Z ) are taken from the target's origin.
   * The bones will lock to the lookAtTarget, offset by those coordinates. You can't
   * have both the head and the chest locked to the target at the same time.
   * @param whichBone The bone to lock onto the target. The engine only supports
   * locking the head and the chest. To lock the head, you can put in any input
   * except a null string. To lock the chest, the string must start with `"bone_chest"`.
   * All leading spaces are ignored, it is case insensitive, and anything after the
   * first non-leading space will be ignored.
   * @param lookAtTargetThe bone will be locked to face this unit.
   * @param offsetX The x-offset from lookAtTarget's origin point.
   * @param offsetY The y-offset from lookAtTarget's origin point.
   * @param offsetZ The z-offset from lookAtTarget's origin point (this already factors in the terrain Z).
   * @note The parameter `whichBone` can only move the head bones and the chest bones.
   * All other input will default to the head bone. However, the function only looks
   * for the helper named `"Bone_Head"` (or `"Bone_Chest"`) in the MDL, so you can just
   * rename a helper so that it will move that set of bones instead.
   * @note SetUnitLookAt is affected by animation speed and blend time.
   * @note [How to instantly set a unit's facing](http://www.wc3c.net/showthread.php?t=105830)
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
   * This native is used to keep abilities when morphing units
   */
  public makeAbilityPermanent(permanent: boolean, abilityId: number) {
    UnitMakeAbilityPermanent(this.handle, permanent, abilityId);
  }

  public modifySkillPoints(skillPointDelta: number) {
    return UnitModifySkillPoints(this.handle, skillPointDelta);
  }

  public pauseEx(flag: boolean) {
    BlzPauseUnitEx(this.handle, flag);
  }

  public pauseTimedLife(flag: boolean) {
    UnitPauseTimedLife(this.handle, flag);
  }

  public queueAnimation(whichAnimation: string) {
    QueueUnitAnimation(this.handle, whichAnimation);
  }

  public recycleGuardPosition() {
    RecycleGuardPosition(this.handle);
  }

  public removeAbility(abilityId: number) {
    return UnitRemoveAbility(this.handle, abilityId);
  }

  public removeBuffs(removePositive: boolean, removeNegative: boolean) {
    UnitRemoveBuffs(this.handle, removePositive, removeNegative);
  }

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

  public removeGuardPosition() {
    RemoveGuardPosition(this.handle);
  }

  /**
   * The item is removed from the Hero and placed on the ground at the Hero's feet.
   * @param whichItem The item to remove.
   */
  public removeItem(whichItem: Item) {
    UnitRemoveItem(this.handle, whichItem.handle);
  }

  /**
   * If an item exists in the given slot, it is removed from the Hero and placed on
   * the ground at the Hero's feed
   * @param itemSlot
   */
  public removeItemFromSlot(itemSlot: number): Item | undefined {
    return Item.fromHandle(UnitRemoveItemFromSlot(this.handle, itemSlot));
  }

  public removeItemFromStock(itemId: number) {
    RemoveItemFromStock(this.handle, itemId);
  }

  public removeType(whichUnitType: unittype) {
    return UnitRemoveType(this.handle, whichUnitType);
  }

  public removeUnitFromStock(itemId: number) {
    RemoveUnitFromStock(this.handle, itemId);
  }

  /**
   * Resets the attack of the unit's weapon, through `BlzResetUnitAttack`
   * (3.0.0).
   */
  public resetAttack(weaponIndex: number) {
    BlzResetUnitAttack(this.handle, weaponIndex);
  }

  public resetCooldown() {
    UnitResetCooldown(this.handle);
  }

  /**
   * Unlocks the bone oriented by `lookAt`, allowing it to move in accordance to the unit's regular animations.
   */
  public resetLookAt() {
    ResetUnitLookAt(this.handle);
  }

  public revive(x: number, y: number, doEyecandy: boolean) {
    return ReviveHero(this.handle, x, y, doEyecandy);
  }

  public reviveAtPoint(whichPoint: Point, doEyecandy: boolean) {
    return ReviveHeroLoc(this.handle, whichPoint.handle, doEyecandy);
  }

  public select(flag: boolean) {
    SelectUnit(this.handle, flag);
  }

  public selectSkill(abilCode: number) {
    SelectHeroSkill(this.handle, abilCode);
  }

  public setAbilityCooldown(abilId: number, level: number, cooldown: number) {
    BlzSetUnitAbilityCooldown(this.handle, abilId, level, cooldown);
  }

  /**
   * Sets the remaining cooldown of the ability as a percentage of its full
   * cooldown, through `BlzSetUnitAbilityCooldownPercent` (3.0.0).
   */
  public setAbilityCooldownPercent(abilId: number, percent: number) {
    BlzSetUnitAbilityCooldownPercent(this.handle, abilId, percent);
  }

  /**
   * Sets the remaining cooldown of the ability in seconds, through
   * `BlzSetUnitAbilityCooldownRemaining` (3.0.0).
   */
  public setAbilityCooldownRemaining(abilId: number, seconds: number) {
    BlzSetUnitAbilityCooldownRemaining(this.handle, abilId, seconds);
  }

  public setAbilityLevel(abilCode: number, level: number) {
    return SetUnitAbilityLevel(this.handle, abilCode, level);
  }

  public setAbilityManaCost(abilId: number, level: number, manaCost: number) {
    BlzSetUnitAbilityManaCost(this.handle, abilId, level, manaCost);
  }

  public setAgility(value: number, permanent: boolean) {
    SetHeroAgi(this.handle, value, permanent);
  }

  public setAnimation(whichAnimation: string | number) {
    if (typeof whichAnimation === "string") {
      SetUnitAnimation(this.handle, whichAnimation);
    } else {
      SetUnitAnimationByIndex(this.handle, whichAnimation);
    }
  }

  public setAnimationWithRarity(whichAnimation: string, rarity: raritycontrol) {
    SetUnitAnimationWithRarity(this.handle, whichAnimation, rarity);
  }

  public setAttackCooldown(cooldown: number, weaponIndex: number) {
    BlzSetUnitAttackCooldown(this.handle, cooldown, weaponIndex);
  }

  public setBaseDamage(baseDamage: number, weaponIndex: number) {
    BlzSetUnitBaseDamage(this.handle, baseDamage, weaponIndex);
  }

  public setBlendTime(timeScale: number) {
    SetUnitBlendTime(this.handle, timeScale);
  }

  public setConstructionProgress(constructionPercentage: number) {
    UnitSetConstructionProgress(this.handle, constructionPercentage);
  }

  public setCreepGuard(creepGuard: boolean) {
    SetUnitCreepGuard(this.handle, creepGuard);
  }

  public setDiceNumber(diceNumber: number, weaponIndex: number) {
    BlzSetUnitDiceNumber(this.handle, diceNumber, weaponIndex);
  }

  public setDiceSides(diceSides: number, weaponIndex: number) {
    BlzSetUnitDiceSides(this.handle, diceSides, weaponIndex);
  }

  public setExperience(newXpVal: number, showEyeCandy: boolean) {
    SetHeroXP(this.handle, newXpVal, showEyeCandy);
  }

  public setExploded(exploded: boolean) {
    SetUnitExploded(this.handle, exploded);
  }

  public setFacingEx(facingAngle: number) {
    BlzSetUnitFacingEx(this.handle, facingAngle);
  }

  public setField(
    field:
      unitbooleanfield | unitintegerfield | unitrealfield | unitstringfield,
    value: boolean | number | string,
  ) {
    const fieldType = fieldTypeOf(field);

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

  public setflyHeight(value: number, rate: number) {
    SetUnitFlyHeight(this.handle, value, rate);
  }

  public setHeroLevel(level: number, showEyeCandy: boolean) {
    SetHeroLevel(this.handle, level, showEyeCandy);
  }

  public setIntelligence(value: number, permanent: boolean) {
    SetHeroInt(this.handle, value, permanent);
  }

  public setItemTypeSlots(slots: number) {
    SetItemTypeSlots(this.handle, slots);
  }

  public setOwner(whichPlayer: MapPlayer, changeColor = true) {
    SetUnitOwner(this.handle, whichPlayer.handle, changeColor);
  }

  /**
   * The unit's owner. A live unit always has one, which the Typings cannot
   * express for the Wrapper, so this goes through the non-null lookup helper:
   * typed non-null, and should the game ever break that invariant it throws
   * `reforged-ts: failed to create MapPlayer` instead of returning undefined.
   */
  public getOwner(): MapPlayer {
    return MapPlayer.expectFound(GetOwningPlayer(this.handle));
  }

  public setPoint(point: Point) {
    SetUnitPositionLoc(this.handle, point.handle);
  }

  /**
   * @bug If the unit is loaded into a zeppelin this will not return the position
   * of the zeppelin but the last position of the unit before it was loaded into
   * the zeppelin.
   */
  public getPoint(): Point {
    return Point.expect(GetUnitLoc(this.handle));
  }

  public setPathing(flag: boolean) {
    SetUnitPathing(this.handle, flag);
  }

  /**
   * @note This cancels the orders of the unit. If you want to move a unit without canceling its orders set `x`/`y`.
   */
  public setPosition(x: number, y: number) {
    SetUnitPosition(this.handle, x, y);
  }

  public setRescuable(byWhichPlayer: MapPlayer, flag: boolean) {
    SetUnitRescuable(this.handle, byWhichPlayer.handle, flag);
  }

  public setRescueRange(range: number) {
    SetUnitRescueRange(this.handle, range);
  }

  /**
   * @bug Only takes scaleX into account and uses scaleX for all three dimensions.
   * @param scaleX This is actually the scale for *all* dimensions
   * @param scaleY This parameter is not taken into account
   * @param scaleZ This parameter is not taken into account
   */
  public setScale(scaleX: number, scaleY: number, scaleZ: number) {
    SetUnitScale(this.handle, scaleX, scaleY, scaleZ);
  }

  public setState(whichUnitState: unitstate, newVal: number) {
    SetUnitState(this.handle, whichUnitState, newVal);
  }

  public setStrength(value: number, permanent: boolean) {
    SetHeroStr(this.handle, value, permanent);
  }

  public setTimeScale(timeScale: number) {
    SetUnitTimeScale(this.handle, timeScale);
  }

  public setUnitAttackCooldown(cooldown: number, weaponIndex: number) {
    BlzSetUnitAttackCooldown(this.handle, cooldown, weaponIndex);
  }

  public setUnitTypeSlots(slots: number) {
    SetUnitTypeSlots(this.handle, slots);
  }

  public setUpgradeProgress(upgradePercentage: number) {
    UnitSetUpgradeProgress(this.handle, upgradePercentage);
  }

  public setUseAltIcon(flag: boolean) {
    UnitSetUsesAltIcon(this.handle, flag);
  }

  public setUseFood(useFood: boolean) {
    SetUnitUseFood(this.handle, useFood);
  }

  /**
   * Sets the unit's color to the color defined by (red,green,blue,alpha).
   * @param red An integer from 0-255 determining the amount of red color.
   * @param green An integer from 0-255 determining the amount of green color.
   * @param blue An integer from 0-255 determining the amount of blue color.
   * @param alpha An integer from 0-255 determining the amount of alpha color.
   */
  public setVertexColor(
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ) {
    SetUnitVertexColor(this.handle, red, green, blue, alpha);
  }

  public shareVision(whichPlayer: MapPlayer, share: boolean) {
    UnitShareVision(this.handle, whichPlayer.handle, share);
  }

  public showTeamGlow(show: boolean) {
    BlzShowUnitTeamGlow(this.handle, show);
  }

  public startAbilityCooldown(abilCode: number, cooldown: number) {
    BlzStartUnitAbilityCooldown(this.handle, abilCode, cooldown);
  }

  public stripLevels(howManyLevels: number) {
    return UnitStripHeroLevel(this.handle, howManyLevels);
  }

  public suspendDecay(suspend: boolean) {
    UnitSuspendDecay(this.handle, suspend);
  }

  public suspendExperience(flag: boolean) {
    SuspendHeroXP(this.handle, flag);
  }

  /** Unequips the item from the unit, through `UnitUnequipItem` (3.0.0). */
  public unequip(whichItem: Item) {
    UnitUnequipItem(this.handle, whichItem.handle);
  }

  /**
   * Unequips the item in the loadout slot and returns it, or undefined for an
   * empty slot, through `UnitUnequipItemFromSlot` (3.0.0).
   */
  public unequipSlot(slot: LoadoutSlot): Item | undefined {
    return Item.fromHandle(
      UnitUnequipItemFromSlot(this.handle, ConvertLoadoutSlot(slot)),
    );
  }

  public useItem(whichItem: Item) {
    return UnitUseItem(this.handle, whichItem.handle);
  }

  public useItemAt(whichItem: Item, x: number, y: number) {
    return UnitUseItemPoint(this.handle, whichItem.handle, x, y);
  }

  public useItemTarget(whichItem: Item, target: Widget) {
    return UnitUseItemTarget(this.handle, whichItem.handle, target.handle);
  }

  public wakeUp() {
    UnitWakeUp(this.handle);
  }

  public waygateGetDestinationX() {
    return WaygateGetDestinationX(this.handle);
  }

  public waygateGetDestinationY() {
    return WaygateGetDestinationY(this.handle);
  }

  public waygateSetDestination(x: number, y: number) {
    WaygateSetDestination(this.handle, x, y);
  }

  /**
   * Clears the unit's orders, through `BlzUnitClearOrders`.
   * @param onlyQueued Clears only the queued orders, keeping the current one.
   */
  public clearOrders(onlyQueued: boolean) {
    BlzUnitClearOrders(this.handle, onlyQueued);
  }

  /**
   * Creates a minimap icon over the unit, through `CreateMinimapIconOnUnit`,
   * and returns the game's `minimapicon`, which the library does not wrap, or
   * undefined when the game creates none.
   * @param red An integer from 0-255 determining the amount of red color.
   * @param green An integer from 0-255 determining the amount of green color.
   * @param blue An integer from 0-255 determining the amount of blue color.
   * @param pingPath The model of the icon.
   * @param fogVisibility The fog state in which the icon is visible.
   */
  public createMinimapIcon(
    red: number,
    green: number,
    blue: number,
    pingPath: string,
    fogVisibility: fogstate,
  ) {
    return CreateMinimapIconOnUnit(
      this.handle,
      red,
      green,
      blue,
      pingPath,
      fogVisibility,
    );
  }

  /**
   * Stops the unit's current order, through `BlzUnitForceStopOrder`.
   * @param clearQueue Also clears the queued orders.
   */
  public forceStopOrder(clearQueue: boolean) {
    BlzUnitForceStopOrder(this.handle, clearQueue);
  }

  /**
   * Reads a field of one of the unit's weapons, through the
   * `BlzGetUnitWeapon*Field` Native of the field's type.
   * @param field A weapon field constant of any of the four field types.
   * @param index The weapon's index.
   */
  public getWeaponField(
    field:
      | unitweaponbooleanfield
      | unitweaponintegerfield
      | unitweaponrealfield
      | unitweaponstringfield,
    index: number,
  ) {
    const fieldType = fieldTypeOf(field);

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

  /** Whether the player detects the unit, through `IsUnitDetected`. */
  public isDetected(whichPlayer: MapPlayer) {
    return IsUnitDetected(this.handle, whichPlayer.handle);
  }

  /** Whether the unit is invisible to the player, through `IsUnitInvisible`. */
  public isInvisible(whichPlayer: MapPlayer) {
    return IsUnitInvisible(this.handle, whichPlayer.handle);
  }

  /** Whether the player owns the unit, through `IsUnitOwnedByPlayer`. */
  public isOwnedByPlayer(whichPlayer: MapPlayer) {
    return IsUnitOwnedByPlayer(this.handle, whichPlayer.handle);
  }

  /** Whether the unit is of the race, through `IsUnitRace`. */
  public isRace(whichRace: race) {
    return IsUnitRace(this.handle, whichRace);
  }

  /**
   * Queues a build order, by unit type id, after the unit's current orders,
   * through `BlzQueueBuildOrderById`.
   */
  public queueBuildOrder(unitId: number, x: number, y: number) {
    return BlzQueueBuildOrderById(this.handle, unitId, x, y);
  }

  /**
   * Queues an order with no target, by order id, after the unit's current
   * orders, through `BlzQueueImmediateOrderById`.
   */
  public queueImmediateOrder(order: OrderId) {
    return BlzQueueImmediateOrderById(this.handle, order);
  }

  /**
   * Queues an order to a point, by order id, with an instant target, after the
   * unit's current orders, through `BlzQueueInstantPointOrderById`.
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
   * Queues an order on a target, by order id, with an instant target, after
   * the unit's current orders, through `BlzQueueInstantTargetOrderById`.
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
   * Queues an order to a point, by order id, after the unit's current orders,
   * through `BlzQueuePointOrderById`.
   */
  public queueOrderAt(order: OrderId, x: number, y: number) {
    return BlzQueuePointOrderById(this.handle, order, x, y);
  }

  /**
   * Queues an order on a target, by order id, after the unit's current orders,
   * through `BlzQueueTargetOrderById`.
   */
  public queueTargetOrder(order: OrderId, targetWidget: Widget) {
    return BlzQueueTargetOrderById(this.handle, order, targetWidget.handle);
  }

  /**
   * Turns the unit to face the angle, in degrees, over `duration` seconds,
   * through `SetUnitFacingTimed`.
   */
  public setFacingTimed(facingAngle: number, duration: number) {
    SetUnitFacingTimed(this.handle, facingAngle, duration);
  }

  /**
   * Writes a field of one of the unit's weapons, through the
   * `BlzSetUnitWeapon*Field` Native of the field's type, and returns whether
   * it was written: false when the value is not of the field's type.
   * @param field A weapon field constant of any of the four field types.
   * @param index The weapon's index.
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
    const fieldType = fieldTypeOf(field);

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

  public static foodMadeByType(unitId: number) {
    return GetFoodMade(unitId);
  }

  public static foodUsedByType(unitId: number) {
    return GetFoodUsed(unitId);
  }

  /** The attacking unit, or undefined outside an attacked event. */
  public static fromAttacker(): Unit | undefined {
    return this.fromHandle(GetAttacker());
  }

  /** The unit changing owner, or undefined outside an ownership change. */
  public static fromChanging(): Unit | undefined {
    return this.fromHandle(GetChangingUnit());
  }

  /** The finished structure, or undefined outside a construction finish. */
  public static fromConstructed(): Unit | undefined {
    return this.fromHandle(GetConstructedStructure());
  }

  /** The unit dealing the damage, or undefined when no unit deals it. */
  public static fromDamageSource(): Unit | undefined {
    return this.fromHandle(GetEventDamageSource());
  }

  /** The unit taking the damage, or undefined outside a damage event. */
  public static fromDamageTarget(): Unit | undefined {
    return this.fromHandle(BlzGetEventDamageTarget());
  }

  /** The unit entering the region, or undefined outside a region event. */
  public static fromEntering(): Unit | undefined {
    return this.fromHandle(GetEnteringUnit());
  }

  public static fromEnum(): Unit | undefined {
    return this.fromHandle(GetEnumUnit());
  }

  public static override fromEvent(): Unit | undefined {
    return this.fromHandle(GetTriggerUnit());
  }

  public static fromFilter(): Unit | undefined {
    return this.fromHandle(GetFilterUnit());
  }

  /** The unit that killed the dying unit, or undefined when none did. */
  public static fromKilling(): Unit | undefined {
    return this.fromHandle(GetKillingUnit());
  }

  /** The unit leaving the region, or undefined outside a region event. */
  public static fromLeaving(): Unit | undefined {
    return this.fromHandle(GetLeavingUnit());
  }

  /** The hero gaining a level, or undefined outside a hero level event. */
  public static fromLeveling(): Unit | undefined {
    return this.fromHandle(GetLevelingUnit());
  }

  /** The unit loaded into a transport, or undefined outside a load event. */
  public static fromLoaded(): Unit | undefined {
    return this.fromHandle(GetLoadedUnit());
  }

  /** The unit given an order, or undefined outside an order event. */
  public static fromOrdered(): Unit | undefined {
    return this.fromHandle(GetOrderedUnit());
  }

  /**
   * The unit a target order targets, or undefined outside a target order or
   * when the target is not a unit.
   */
  public static override fromOrderTarget(): Unit | undefined {
    return this.fromHandle(GetOrderTargetUnit());
  }

  /** The spell's target unit, or undefined when the spell targets none. */
  public static fromSpellTarget(): Unit | undefined {
    return this.fromHandle(GetSpellTargetUnit());
  }

  /** The summoned unit, or undefined outside a summon event. */
  public static fromSummoned(): Unit | undefined {
    return this.fromHandle(GetSummonedUnit());
  }

  /** The unit that summons, or undefined outside a summon event. */
  public static fromSummoning(): Unit | undefined {
    return this.fromHandle(GetSummoningUnit());
  }

  /** The trained unit, or undefined outside a training finish. */
  public static fromTrained(): Unit | undefined {
    return this.fromHandle(GetTrainedUnit());
  }

  /** The transport a unit is loaded into, or undefined outside a load event. */
  public static fromTransport(): Unit | undefined {
    return this.fromHandle(GetTransportUnit());
  }

  /** The unit buying from a shop, or undefined outside a sell event. */
  public static fromBuying(): Unit | undefined {
    return this.fromHandle(GetBuyingUnit());
  }

  /**
   * The structure whose construction is cancelled, or undefined outside a
   * construction cancel.
   */
  public static fromCancelled(): Unit | undefined {
    return this.fromHandle(GetCancelledStructure());
  }

  /** The structure being built, or undefined outside a construction start. */
  public static fromConstructing(): Unit | undefined {
    return this.fromHandle(GetConstructingStructure());
  }

  /** The decaying unit, or undefined outside a decay event. */
  public static fromDecaying(): Unit | undefined {
    return this.fromHandle(GetDecayingUnit());
  }

  /** The detected unit, or undefined outside a detection event. */
  public static fromDetected(): Unit | undefined {
    return this.fromHandle(GetDetectedUnit());
  }

  /** The dying unit, or undefined outside a death event. */
  public static fromDying(): Unit | undefined {
    return this.fromHandle(GetDyingUnit());
  }

  /** The target unit of the event, or undefined when the event has none. */
  public static fromEventTarget(): Unit | undefined {
    return this.fromHandle(GetEventTargetUnit());
  }

  /** The hero learning a skill, or undefined outside a skill event. */
  public static fromLearning(): Unit | undefined {
    return this.fromHandle(GetLearningUnit());
  }

  /** The unit manipulating an item, or undefined outside an item event. */
  public static fromManipulating(): Unit | undefined {
    return this.fromHandle(GetManipulatingUnit());
  }

  /**
   * The unit under the local player's mouse, or undefined when there is none.
   * @async
   */
  public static fromMouseFocus(): Unit | undefined {
    return this.fromHandle(BlzGetMouseFocusUnit());
  }

  /** The unit researching, or undefined outside a research event. */
  public static fromResearching(): Unit | undefined {
    return this.fromHandle(GetResearchingUnit());
  }

  /** The unit rescuing, or undefined outside a rescue event. */
  public static fromRescuer(): Unit | undefined {
    return this.fromHandle(GetRescuer());
  }

  /** The hero that became revivable, or undefined outside a revivable event. */
  public static fromRevivable(): Unit | undefined {
    return this.fromHandle(GetRevivableUnit());
  }

  /** The reviving hero, or undefined outside a revive event. */
  public static fromReviving(): Unit | undefined {
    return this.fromHandle(GetRevivingUnit());
  }

  /** The shop selling, or undefined outside a sell event. */
  public static fromSelling(): Unit | undefined {
    return this.fromHandle(GetSellingUnit());
  }

  /** The unit sold, or undefined outside a unit sell event. */
  public static fromSold(): Unit | undefined {
    return this.fromHandle(GetSoldUnit());
  }

  /** The unit casting the spell, or undefined outside a spell event. */
  public static fromSpellAbility(): Unit | undefined {
    return this.fromHandle(GetSpellAbilityUnit());
  }

  public static getPointValueByType(unitType: number) {
    return GetUnitPointValueByType(unitType);
  }

  public static isUnitIdHero(unitId: number) {
    return IsHeroUnitId(unitId);
  }

  public static isUnitIdType(unitId: number, whichUnitType: unittype) {
    return IsUnitIdType(unitId, whichUnitType);
  }
}
