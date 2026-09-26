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
  /** The rawcode of the destructable type. */
  readonly typeId: number;
  /** The x-coordinate. */
  readonly x: number;
  /** The y-coordinate. */
  readonly y: number;
  /** The z-coordinate; left out, the game places it on the ground. */
  readonly z?: number;
  /** The facing, in degrees; 0 by default. */
  readonly face?: number;
  /** The X-Y-Z scale; 1 by default. */
  readonly scale?: number;
  /** The model variation; 0 by default. */
  readonly variation?: number;
  /** The pitch, in radians; 0 when only `roll` is given. */
  readonly pitch?: number;
  /** The roll, in radians; 0 when only `pitch` is given. */
  readonly roll?: number;
  /** The skin's rawcode; left out, the type's own model. */
  readonly skin?: number;
  /** The team colour of the model. */
  readonly color?: playercolor;
  /** Creates the destructable dead when true; alive by default. */
  readonly dead?: boolean;
}

export class Destructable extends Widget {
  declare public readonly handle: destructable;

  /** The skin the Destructable was created with, when one was given. */
  public readonly skin?: number;

  /**
   * Creates a destructable. The options name one of the 32 creation Natives,
   * on five independent axes: `dead` true creates a dead one, `z` places it
   * at that height, `pitch` or `roll` tilts it (the absent one 0), `skin`
   * gives it a skin and `color` a team colour.
   * Throws `reforged-ts: failed to create Destructable (<rawcode>)` at the
   * calling line when the game creates nothing.
   * @example
   * {@includeCode ../../examples/destructable-create.ts}
   * @param options - The rawcode and the position, and the optional axes.
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

  /**
   * Destroys the Destructable through its Native.
   * @remarks
   * In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
   * a second `destroy()` included, raises
   * `reforged-ts: used after destroy: <Class>#<id>`, and
   * `Reforged.debug.report()` counts it destroyed.
   */
  public destroy() {
    RemoveDestructable(this.handle);
    this.release();
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

  /**
   * Sets the team colour of the model, through `SetDestructableColor`
   * (3.0.0).
   * @param color - The player colour to tint it with.
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
   */
  public setVertexColor(
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ) {
    SetDestructableVertexColor(this.handle, red, green, blue, alpha);
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
