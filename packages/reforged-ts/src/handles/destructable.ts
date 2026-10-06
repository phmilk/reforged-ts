/** @noSelfInFile */

import { rawcodeToString } from "../utils/rawcode";
import { Widget } from "./widget";

/**
 * The options of `Destructable.create`. `typeId`, `x` and `y` are required;
 * each other option left out keeps its default, and each of `dead`, `z`,
 * `pitch` or `roll`, `skin` and `color` given picks the creation Native that
 * takes it.
 */
export interface DestructableOptions {
  /**
   * The destructable type's rawcode, such as the Summer Tree Wall's,
   * `FourCC("LTlt")`.
   */
  readonly typeId: Rawcode<"destructable">;
  /** The x-coordinate, in world units. */
  readonly x: number;
  /** The y-coordinate, in world units. */
  readonly y: number;
  /** The z-coordinate; left out, the game places it on the ground. */
  readonly z?: number;
  /** The facing, in degrees; 0 by default. */
  readonly face?: number;
  /** The X-Y-Z scale; 1 by default. */
  readonly scale?: number;
  /** The model variation; 0 by default. */
  readonly variation?: number;
  /** The pitch; 0 when only `roll` is given. */
  readonly pitch?: number;
  /** The roll; 0 when only `pitch` is given. */
  readonly roll?: number;
  /**
   * The skin's rawcode, a destructable type's, such as the Summer Tree
   * Wall's, `FourCC("LTlt")`; left out, the type's own model.
   */
  readonly skin?: Rawcode<"destructable">;
  /** The team colour of the model. */
  readonly color?: playercolor;
  /** Creates the destructable dead when true; alive by default. */
  readonly dead?: boolean;
}

/**
 * A destructable: a tree, a gate, a bridge or another object placed on the
 * map that has hit points and can die, but is not a unit.
 * @example A tree that grows back a minute after it falls
 * {@includeCode ../../examples/harness/destructable-regrow.ts}
 * @native destructable
 */
export class Destructable extends Widget {
  /**
   * The Handle this Wrapper owns, to pass to a Native the library does not
   * wrap.
   */
  declare public readonly handle: destructable;

  /** The skin the Destructable was created with, when one was given. */
  public readonly skin?: Rawcode<"destructable">;

  /**
   * Creates a destructable. The options name one of the 32 creation Natives,
   * on five independent axes: `dead` true creates a dead one, `z` places it
   * at that height, `pitch` or `roll` tilts it (the absent one 0), `skin`
   * gives it a skin and `color` a team colour.
   * @example
   * {@includeCode ../../examples/harness/destructable-create.ts}
   * @param options - The type's rawcode, such as the Summer Tree Wall's,
   * `FourCC("LTlt")`, the position, and the optional axes.
   * @returns The new destructable.
   * @throws When the game returns no handle, for example an unknown rawcode:
   * `reforged-ts: failed to create Destructable (<rawcode>)`, at the calling line.
   * In Dev mode, also when called before the globals Init stage or inside
   * `MapPlayer.runLocal`.
   * @native CreateDeadDestructable
   * @native CreateDestructable
   * @native CreateDeadDestructableZ
   * @native CreateDestructableZ
   * @native BlzCreateDeadDestructablePitchRoll
   * @native BlzCreateDestructablePitchRoll
   * @native BlzCreateDeadDestructableZPitchRoll
   * @native BlzCreateDestructableZPitchRoll
   * @native BlzCreateDeadDestructableWithSkin
   * @native BlzCreateDestructableWithSkin
   * @native BlzCreateDeadDestructableZWithSkin
   * @native BlzCreateDestructableZWithSkin
   * @native BlzCreateDeadDestructableWithSkinPitchRoll
   * @native BlzCreateDestructableWithSkinPitchRoll
   * @native BlzCreateDeadDestructableZWithSkinPitchRoll
   * @native BlzCreateDestructableZWithSkinPitchRoll
   * @native BlzCreateDeadDestructableWithColor
   * @native BlzCreateDestructableWithColor
   * @native BlzCreateDeadDestructableZWithColor
   * @native BlzCreateDestructableZWithColor
   * @native BlzCreateDeadDestructablePitchRollWithColor
   * @native BlzCreateDestructablePitchRollWithColor
   * @native BlzCreateDeadDestructableZPitchRollWithColor
   * @native BlzCreateDestructableZPitchRollWithColor
   * @native BlzCreateDeadDestructableWithSkinColor
   * @native BlzCreateDestructableWithSkinColor
   * @native BlzCreateDeadDestructableZWithSkinColor
   * @native BlzCreateDestructableZWithSkinColor
   * @native BlzCreateDeadDestructableWithSkinPitchRollColor
   * @native BlzCreateDestructableWithSkinPitchRollColor
   * @native BlzCreateDeadDestructableZWithSkinPitchRollColor
   * @native BlzCreateDestructableZWithSkinPitchRollColor
   */
  public static create(options: DestructableOptions): Destructable {
    return this.expect(
      Destructable.createHandle(options),
      rawcodeToString(options.typeId),
      (destructable) => {
        destructable.skin = options.skin;
      },
    );
  }

  /**
   * The handle of the creation Native `options` name, or nothing when the
   * game creates none: the family is picked by the colour, the skin and the
   * tilt, then the height and whether it is dead.
   */
  private static createHandle(
    options: DestructableOptions,
  ): destructable | undefined {
    const { typeId, x, y, z, skin, color, dead = false } = options;
    const face = options.face ?? 0;
    const scale = options.scale ?? 1;
    const variation = options.variation ?? 0;
    const tilted = options.pitch !== undefined || options.roll !== undefined;
    const pitch = options.pitch ?? 0;
    const roll = options.roll ?? 0;

    if (color === undefined) {
      if (skin === undefined) {
        if (!tilted) {
          if (z === undefined) {
            return dead
              ? CreateDeadDestructable(typeId, x, y, face, scale, variation)
              : CreateDestructable(typeId, x, y, face, scale, variation);
          }
          return dead
            ? CreateDeadDestructableZ(typeId, x, y, z, face, scale, variation)
            : CreateDestructableZ(typeId, x, y, z, face, scale, variation);
        }
        if (z === undefined) {
          return dead
            ? BlzCreateDeadDestructablePitchRoll(
                typeId,
                x,
                y,
                face,
                roll,
                pitch,
                scale,
                variation,
              )
            : BlzCreateDestructablePitchRoll(
                typeId,
                x,
                y,
                face,
                roll,
                pitch,
                scale,
                variation,
              );
        }
        return dead
          ? BlzCreateDeadDestructableZPitchRoll(
              typeId,
              x,
              y,
              z,
              face,
              roll,
              pitch,
              scale,
              variation,
            )
          : BlzCreateDestructableZPitchRoll(
              typeId,
              x,
              y,
              z,
              face,
              roll,
              pitch,
              scale,
              variation,
            );
      }
      if (!tilted) {
        if (z === undefined) {
          return dead
            ? BlzCreateDeadDestructableWithSkin(
                typeId,
                x,
                y,
                face,
                scale,
                variation,
                skin,
              )
            : BlzCreateDestructableWithSkin(
                typeId,
                x,
                y,
                face,
                scale,
                variation,
                skin,
              );
        }
        return dead
          ? BlzCreateDeadDestructableZWithSkin(
              typeId,
              x,
              y,
              z,
              face,
              scale,
              variation,
              skin,
            )
          : BlzCreateDestructableZWithSkin(
              typeId,
              x,
              y,
              z,
              face,
              scale,
              variation,
              skin,
            );
      }
      if (z === undefined) {
        return dead
          ? BlzCreateDeadDestructableWithSkinPitchRoll(
              typeId,
              x,
              y,
              face,
              roll,
              pitch,
              scale,
              variation,
              skin,
            )
          : BlzCreateDestructableWithSkinPitchRoll(
              typeId,
              x,
              y,
              face,
              roll,
              pitch,
              scale,
              variation,
              skin,
            );
      }
      return dead
        ? BlzCreateDeadDestructableZWithSkinPitchRoll(
            typeId,
            x,
            y,
            z,
            face,
            roll,
            pitch,
            scale,
            variation,
            skin,
          )
        : BlzCreateDestructableZWithSkinPitchRoll(
            typeId,
            x,
            y,
            z,
            face,
            roll,
            pitch,
            scale,
            variation,
            skin,
          );
    }
    if (skin === undefined) {
      if (!tilted) {
        if (z === undefined) {
          return dead
            ? BlzCreateDeadDestructableWithColor(
                typeId,
                x,
                y,
                face,
                scale,
                variation,
                color,
              )
            : BlzCreateDestructableWithColor(
                typeId,
                x,
                y,
                face,
                scale,
                variation,
                color,
              );
        }
        return dead
          ? BlzCreateDeadDestructableZWithColor(
              typeId,
              x,
              y,
              z,
              face,
              scale,
              variation,
              color,
            )
          : BlzCreateDestructableZWithColor(
              typeId,
              x,
              y,
              z,
              face,
              scale,
              variation,
              color,
            );
      }
      if (z === undefined) {
        return dead
          ? BlzCreateDeadDestructablePitchRollWithColor(
              typeId,
              x,
              y,
              face,
              roll,
              pitch,
              scale,
              variation,
              color,
            )
          : BlzCreateDestructablePitchRollWithColor(
              typeId,
              x,
              y,
              face,
              roll,
              pitch,
              scale,
              variation,
              color,
            );
      }
      return dead
        ? BlzCreateDeadDestructableZPitchRollWithColor(
            typeId,
            x,
            y,
            z,
            face,
            roll,
            pitch,
            scale,
            variation,
            color,
          )
        : BlzCreateDestructableZPitchRollWithColor(
            typeId,
            x,
            y,
            z,
            face,
            roll,
            pitch,
            scale,
            variation,
            color,
          );
    }
    if (!tilted) {
      if (z === undefined) {
        return dead
          ? BlzCreateDeadDestructableWithSkinColor(
              typeId,
              x,
              y,
              face,
              scale,
              variation,
              skin,
              color,
            )
          : BlzCreateDestructableWithSkinColor(
              typeId,
              x,
              y,
              face,
              scale,
              variation,
              skin,
              color,
            );
      }
      return dead
        ? BlzCreateDeadDestructableZWithSkinColor(
            typeId,
            x,
            y,
            z,
            face,
            scale,
            variation,
            skin,
            color,
          )
        : BlzCreateDestructableZWithSkinColor(
            typeId,
            x,
            y,
            z,
            face,
            scale,
            variation,
            skin,
            color,
          );
    }
    if (z === undefined) {
      return dead
        ? BlzCreateDeadDestructableWithSkinPitchRollColor(
            typeId,
            x,
            y,
            face,
            roll,
            pitch,
            scale,
            variation,
            skin,
            color,
          )
        : BlzCreateDestructableWithSkinPitchRollColor(
            typeId,
            x,
            y,
            face,
            roll,
            pitch,
            scale,
            variation,
            skin,
            color,
          );
    }
    return dead
      ? BlzCreateDeadDestructableZWithSkinPitchRollColor(
          typeId,
          x,
          y,
          z,
          face,
          roll,
          pitch,
          scale,
          variation,
          skin,
          color,
        )
      : BlzCreateDestructableZWithSkinPitchRollColor(
          typeId,
          x,
          y,
          z,
          face,
          roll,
          pitch,
          scale,
          variation,
          skin,
          color,
        );
  }

  /**
   * Whether the destructable ignores damage: true makes it invulnerable.
   * @native SetDestructableInvulnerable
   */
  public set invulnerable(flag: boolean) {
    SetDestructableInvulnerable(this.handle, flag);
  }

  /**
   * Gets whether the destructable ignores damage.
   * @returns True when it is invulnerable.
   * @native IsDestructableInvulnerable
   */
  public get invulnerable() {
    return IsDestructableInvulnerable(this.handle);
  }

  /**
   * Gets how many hit points the destructable has left.
   * @returns The hit points left, an amount rather than a percentage; 0 once
   * it is dead.
   * @native GetDestructableLife
   */
  public override get life() {
    return GetDestructableLife(this.handle);
  }

  /**
   * The destructable's current hit points, an amount rather than a
   * percentage.
   * @native SetDestructableLife
   */
  public override set life(value: number) {
    SetDestructableLife(this.handle, value);
  }

  /**
   * Gets the most hit points the destructable can have.
   * @returns The maximum, its type's Hit Points field until the `maxLife`
   * setter changes it for this destructable.
   * @native GetDestructableMaxLife
   */
  public get maxLife() {
    return GetDestructableMaxLife(this.handle);
  }

  /**
   * The most hit points the destructable can have, for this destructable
   * only: others of its type keep the maximum their object data gives.
   * @native SetDestructableMaxLife
   */
  public set maxLife(value: number) {
    SetDestructableMaxLife(this.handle, value);
  }

  /**
   * Gets the name of the destructable's type, in the local client's
   * language.
   * @remarks
   * The value can differ between clients: never let it decide game state.
   * @example Showing names in the local language
   * {@includeCode ../../examples/game/local-names.ts}
   * @returns The localized name.
   * @native GetDestructableName
   * @async
   */
  public get name() {
    return GetDestructableName(this.handle);
  }

  /**
   * Gets how high the destructable blocks line of sight.
   * @returns The height, in world units; its type's Occlusion Height field
   * until the `occluderHeight` setter changes it.
   * @native GetDestructableOccluderHeight
   */
  public get occluderHeight() {
    return GetDestructableOccluderHeight(this.handle);
  }

  /**
   * The height, in world units, up to which the destructable blocks line of
   * sight; 0 blocks none.
   * @native SetDestructableOccluderHeight
   */
  public set occluderHeight(value: number) {
    SetDestructableOccluderHeight(this.handle, value);
  }

  /**
   * Gets the rawcode of the destructable's type.
   * @returns The type's rawcode, such as the Summer Tree Wall's,
   * `FourCC("LTlt")`.
   * @native GetDestructableTypeId
   */
  public get typeId() {
    return GetDestructableTypeId(this.handle);
  }

  /**
   * Gets the x-coordinate of the destructable's position.
   * @returns The x-coordinate, in world units.
   * @native GetDestructableX
   */
  public override get x() {
    return GetDestructableX(this.handle);
  }

  /**
   * Gets the y-coordinate of the destructable's position.
   * @returns The y-coordinate, in world units.
   * @native GetDestructableY
   */
  public override get y() {
    return GetDestructableY(this.handle);
  }

  /**
   * Destroys the Destructable through its Native.
   * @remarks
   * In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
   * a second `destroy()` included, raises
   * `reforged-ts: used after destroy: <Class>#<id>`, and
   * `Reforged.debug.report()` counts it destroyed.
   * @example Removing game objects without a death
   * {@includeCode ../../examples/game/destroy-units.ts}
   * @throws In Dev mode, when called inside `MapPlayer.runLocal`: a Handle
   * freed on one client desyncs the game.
   * @native RemoveDestructable
   */
  public destroy() {
    RemoveDestructable(this.handle);
    this.release();
  }

  /**
   * Brings a dead destructable back to life with the given hit points; a live
   * one is left as it is.
   * @param life - The hit points it comes back with. 0, or more than its
   * maximum, gives it the maximum its object data sets; less than 0.5 gives
   * it 0.5.
   * @param birth - `true` to play its birth animation as it comes back.
   * @native DestructableRestoreLife
   */
  public heal(life: number, birth: boolean) {
    DestructableRestoreLife(this.handle, life, birth);
  }

  /**
   * Kills the destructable, which plays its death animation.
   * @native KillDestructable
   */
  public kill() {
    KillDestructable(this.handle);
  }

  /**
   * Queues an animation to play after the current one.
   * @param whichAnimation - The animation's name, such as `"stand"`.
   * @native QueueDestructableAnimation
   */
  public queueAnim(whichAnimation: string) {
    QueueDestructableAnimation(this.handle, whichAnimation);
  }

  /**
   * Plays an animation at once.
   * @param whichAnimation - The animation's name, such as `"death"`.
   * @native SetDestructableAnimation
   */
  public setAnim(whichAnimation: string) {
    SetDestructableAnimation(this.handle, whichAnimation);
  }

  /**
   * Sets the speed of the destructable's animations.
   * @param speedFactor - The multiplier of the normal speed: 1 is normal, 2
   * twice as fast, 0.5 half as fast.
   * @native SetDestructableAnimationSpeed
   */
  public setAnimSpeed(speedFactor: number) {
    SetDestructableAnimationSpeed(this.handle, speedFactor);
  }

  /**
   * Sets the team colour of the model, through `SetDestructableColor`
   * (3.0.0).
   * @param color - The player colour to tint it with.
   * @native SetDestructableColor
   */
  public setColor(color: playercolor) {
    SetDestructableColor(this.handle, color);
  }

  /**
   * Tints the model, through `SetDestructableVertexColor` (3.0.0). Each
   * channel is 0 to 255.
   * @param red - The red channel.
   * @param green - The green channel.
   * @param blue - The blue channel.
   * @param alpha - The opacity, 0 transparent and 255 opaque.
   * @native SetDestructableVertexColor
   */
  public setVertexColor(
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ) {
    SetDestructableVertexColor(this.handle, red, green, blue, alpha);
  }

  /**
   * Shows or hides the destructable.
   * @param flag - True to show it, false to hide it.
   * @native ShowDestructable
   */
  public show(flag: boolean) {
    ShowDestructable(this.handle, flag);
  }

  /**
   * Gets the destructable an enumeration's action is running for, such as
   * `Rectangle.enumDestructables`.
   * @returns The destructable, or `undefined` outside an enumeration's
   * action.
   * @native GetEnumDestructable
   */
  public static fromEnum(): Destructable | undefined {
    return this.fromHandle(GetEnumDestructable());
  }

  /**
   * Gets the destructable a trigger event is about, such as the one that
   * died in a death event (`Trigger.registerDeathEvent`).
   * @returns The destructable, or `undefined` outside an event about one.
   * @native GetTriggerDestructable
   */
  public static override fromEvent(): Destructable | undefined {
    return this.fromHandle(GetTriggerDestructable());
  }

  /**
   * Gets the destructable an enumeration's filter is testing, such as the
   * filter of `Rectangle.enumDestructables`.
   * @returns The destructable, or `undefined` outside an enumeration's
   * filter.
   * @native GetFilterDestructable
   */
  public static fromFilter(): Destructable | undefined {
    return this.fromHandle(GetFilterDestructable());
  }

  /**
   * Gets the destructable targeted by the order being issued.
   * @returns The destructable, or `undefined` outside a target order or when
   * the target is not a destructable.
   * @native GetOrderTargetDestructable
   */
  public static override fromOrderTarget(): Destructable | undefined {
    return this.fromHandle(GetOrderTargetDestructable());
  }

  /**
   * Gets the destructable targeted by the spell event being handled.
   * @returns The destructable, or `undefined` outside a spell event or when
   * the spell targets none.
   * @native GetSpellTargetDestructable
   */
  public static fromSpellTarget(): Destructable | undefined {
    return this.fromHandle(GetSpellTargetDestructable());
  }
}
