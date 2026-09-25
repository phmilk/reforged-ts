/** @noSelfInFile */

import { rawcodeToString } from "../utils/rawcode";
import { Widget } from "./widget";

export class Destructable extends Widget {
  declare public readonly handle: destructable;

  public readonly skin?: number;

  /**
   * Creates a destructable at the specified x-y coordinates.
   * @param objectId The rawcode of the destructable to be created.
   * @param x The x-coordinate of the Destructable.
   * @param y The y-coordinate of the Destructable.
   * @param face The facing of the Destructable.
   * @param scale The X-Y-Z scaling value of the Destructable.
   * @param variation The integer representing the variation of the Destructable to be created.
   * @param skinId The integer representing the skin of the Destructable to be created.
   */
  public static create(
    objectId: number,
    x: number,
    y: number,
    face?: number,
    scale?: number,
    variation?: number,
    skinId?: number,
  ): Destructable {
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- a create default; Destructable.create(options) replaces create and createZ in step 7 (#54)
    if (face === undefined) face = 0;
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- a create default; Destructable.create(options) replaces create and createZ in step 7 (#54)
    if (scale === undefined) scale = 1;
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- a create default; Destructable.create(options) replaces create and createZ in step 7 (#54)
    if (variation === undefined) variation = 0;

    return this.expect(
      skinId === undefined
        ? CreateDestructable(objectId, x, y, face, scale, variation)
        : BlzCreateDestructableWithSkin(
            objectId,
            x,
            y,
            face,
            scale,
            variation,
            skinId,
          ),
      rawcodeToString(objectId),
      (destructable) => {
        destructable.skin = skinId;
      },
    );
  }

  /**
   * Creates a destructable at the specified x-y-z coordinates.
   * @param objectId The rawcode of the destructable to be created.
   * @param x The x-coordinate of the Destructable.
   * @param y The y-coordinate of the Destructable.
   * @param z The z-coordinate of the Destructable.
   * @param face The facing of the Destructable.
   * @param scale The X-Y-Z scaling value of the Destructable.
   * @param variation The integer representing the variation of the Destructable to be created.
   * @param skinId The integer representing the skin of the Destructable to be created.
   */
  public static createZ(
    objectId: number,
    x: number,
    y: number,
    z: number,
    face?: number,
    scale?: number,
    variation?: number,
    skinId?: number,
  ): Destructable {
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- a create default; Destructable.create(options) replaces create and createZ in step 7 (#54)
    if (face === undefined) face = 0;
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- a create default; Destructable.create(options) replaces create and createZ in step 7 (#54)
    if (scale === undefined) scale = 1;
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- a create default; Destructable.create(options) replaces create and createZ in step 7 (#54)
    if (variation === undefined) variation = 0;

    return this.expect(
      skinId === undefined
        ? CreateDestructableZ(objectId, x, y, z, face, scale, variation)
        : BlzCreateDestructableZWithSkin(
            objectId,
            x,
            y,
            z,
            face,
            scale,
            variation,
            skinId,
          ),
      rawcodeToString(objectId),
      (destructable) => {
        destructable.skin = skinId;
      },
    );
  }

  public set invulnerable(flag: boolean) {
    SetDestructableInvulnerable(this.handle, flag);
  }

  public get invulnerable() {
    return IsDestructableInvulnerable(this.handle);
  }

  public override get life() {
    return GetDestructableLife(this.handle);
  }

  public override set life(value: number) {
    SetDestructableLife(this.handle, value);
  }

  public get maxLife() {
    return GetDestructableMaxLife(this.handle);
  }

  public set maxLife(value: number) {
    SetDestructableMaxLife(this.handle, value);
  }

  /**
   * This will return different values depending on the locale.
   */
  public get name() {
    return GetDestructableName(this.handle);
  }

  public get occluderHeight() {
    return GetDestructableOccluderHeight(this.handle);
  }

  public set occluderHeight(value: number) {
    SetDestructableOccluderHeight(this.handle, value);
  }

  public get typeId() {
    return GetDestructableTypeId(this.handle);
  }

  public override get x() {
    return GetDestructableX(this.handle);
  }

  public override get y() {
    return GetDestructableY(this.handle);
  }

  public destroy() {
    RemoveDestructable(this.handle);
  }

  /**
   * Resurrects a Destructable with the specified hit points.
   * @param life The amount of hit points the Destructable will have when it is
   * resurrected. A value of 0, or any value above the Destructable's maximum HP,
   * will give the Destructable its maximum HP (as defined in the object editor).
   * Any value below 0.5 will give the Destructable 0.5 hit points.
   * @param birth If true, the Destructable will play its birth animation upon resurrection.
   */
  public heal(life: number, birth: boolean) {
    DestructableRestoreLife(this.handle, life, birth);
  }

  public kill() {
    KillDestructable(this.handle);
  }

  public queueAnim(whichAnimation: string) {
    QueueDestructableAnimation(this.handle, whichAnimation);
  }

  public setAnim(whichAnimation: string) {
    SetDestructableAnimation(this.handle, whichAnimation);
  }

  public setAnimSpeed(speedFactor: number) {
    SetDestructableAnimationSpeed(this.handle, speedFactor);
  }

  public show(flag: boolean) {
    ShowDestructable(this.handle, flag);
  }

  public static override fromEvent(): Destructable | undefined {
    return this.fromHandle(GetTriggerDestructable());
  }

  /**
   * The spell's target destructable, or undefined when the spell targets
   * none.
   */
  public static fromSpellTarget(): Destructable | undefined {
    return this.fromHandle(GetSpellTargetDestructable());
  }
}
