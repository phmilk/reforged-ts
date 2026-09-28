/** @noSelfInFile */

import { rawcodeToString } from "../utils/rawcode";
import { Handle } from "./handle";
import { MapPlayer } from "./player";
import { Point } from "./point";
import { Widget } from "./widget";

/** The creation error's detail for a spell effect: the ability it names. */
function spellDetail(ability: number | string): string {
  return typeof ability === "number" ? rawcodeToString(ability) : ability;
}

/**
 * A special effect: a model shown on the map, standing at a point or attached
 * to a widget.
 * @remarks
 * - Destroying an effect plays its model's death animation, so an effect
 *   destroyed right after its creation is still seen once:
 *   `Effect.create(model, x, y).destroy()` is the usual one-shot.
 * - The position and orientation members act on a free effect only: an effect
 *   attached to a widget follows the widget's attachment point.
 * - The `x`, `y` and `z` getters read the local client's value: see `x`.
 * @example One-shot and attached effects
 * {@includeCode ../../examples/harness/effect-create.ts}
 * @native effect
 */
export class Effect extends Handle<effect> {
  /** The widget the effect was attached to, when it was created attached. */
  public readonly attachWidget?: Widget;

  /** The attachment point it was attached to, when it was created attached. */
  public readonly attachPointName?: string;

  /**
   * Creates a special effect standing on the ground at the given point.
   * @param modelName - The path of the model that the effect will use.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @returns The new effect.
   * @throws When the game returns no handle:
   * `reforged-ts: failed to create Effect (<modelName>)`, at the calling line.
   * In Dev mode, also when called before the globals Init stage or inside
   * `MapPlayer.runLocal`.
   * @native AddSpecialEffect
   */
  public static create(modelName: string, x: number, y: number): Effect {
    return this.expect(AddSpecialEffect(modelName, x, y), modelName);
  }

  /**
   * Creates a special effect at `where`, through `AddSpecialEffectLoc`.
   * @param modelName - The path of the model that the effect will use.
   * @param where - The point to stand the effect on.
   * @returns The new effect.
   * @throws When the game returns no handle:
   * `reforged-ts: failed to create Effect (<modelName>)`, at the calling line.
   * In Dev mode, also when called before the globals Init stage or inside
   * `MapPlayer.runLocal`.
   * @native AddSpecialEffectLoc
   */
  public static createAtPoint(modelName: string, where: Point): Effect {
    return this.expect(AddSpecialEffectLoc(modelName, where.handle), modelName);
  }

  /**
   * Creates a special effect attached to a widget.
   * @param modelName - The path of the model that the effect will use.
   * @param targetWidget - The widget to attach the effect to.
   * @param attachPointName - The attachment point of the widget where the effect will
   * be placed. Attachment points are points in a model that can be referenced to as
   * areas for effects to be attached, whether it be from a spell or this function.
   * If the attachment point does not exist, it will attach the effect to the model's origin.
   * @returns The new effect, which keeps `targetWidget` and `attachPointName`
   * in its `attachWidget` and `attachPointName`.
   * @throws When the game returns no handle:
   * `reforged-ts: failed to create Effect (<modelName>)`, at the calling line.
   * In Dev mode, also when called before the globals Init stage or inside
   * `MapPlayer.runLocal`.
   * @native AddSpecialEffectTarget
   */
  public static createAttachment(
    modelName: string,
    targetWidget: Widget,
    attachPointName: string,
  ): Effect {
    return this.expect(
      AddSpecialEffectTarget(modelName, targetWidget.handle, attachPointName),
      modelName,
      (effect) => {
        effect.attachWidget = targetWidget;
        effect.attachPointName = attachPointName;
      },
    );
  }

  /**
   * Creates a spell visual effect at position, through `AddSpellEffectById`
   * for an ability id and `AddSpellEffect` for an ability string.
   * @example
   * {@includeCode ../../examples/harness/effect-create-spell.ts}
   * @param ability - The ability whose art to show: its rawcode, such as
   * `FourCC("AHtc")`, or an ability string (see the bug below).
   * @param effectType - Which of the ability's art fields to use, such as
   * `EFFECT_TYPE_CASTER` or `EFFECT_TYPE_TARGET`.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @returns The new effect.
   * @throws When the game returns no handle:
   * `reforged-ts: failed to create Effect (<ability>)`, at the calling line,
   * the ability as its rawcode string or as given. In Dev mode, also when
   * called before the globals Init stage or inside `MapPlayer.runLocal`.
   * @native AddSpellEffectById
   * @native AddSpellEffect
   * @bug jassdoc documents `AddSpellEffect` as doing nothing, because no one
   * knows what its ability string is: pass the ability id.
   */
  public static createSpell(
    ability: number | string,
    effectType: effecttype,
    x: number,
    y: number,
  ): Effect {
    return this.expect(
      typeof ability === "number"
        ? AddSpellEffectById(ability, effectType, x, y)
        : AddSpellEffect(ability, effectType, x, y),
      spellDetail(ability),
    );
  }

  /**
   * Creates a spell visual effect at `where`, through `AddSpellEffectByIdLoc`
   * for an ability id and `AddSpellEffectLoc` for an ability string.
   * @param ability - The ability whose art to show: its rawcode, such as
   * `FourCC("AHtc")`, or an ability string (see the bug below).
   * @param effectType - Which of the ability's art fields to use, such as
   * `EFFECT_TYPE_CASTER` or `EFFECT_TYPE_TARGET`.
   * @param where - The point to stand the effect on.
   * @returns The new effect.
   * @throws When the game returns no handle:
   * `reforged-ts: failed to create Effect (<ability>)`, at the calling line,
   * the ability as its rawcode string or as given. In Dev mode, also when
   * called before the globals Init stage or inside `MapPlayer.runLocal`.
   * @native AddSpellEffectByIdLoc
   * @native AddSpellEffectLoc
   * @bug jassdoc documents `AddSpellEffect` as doing nothing, because no one
   * knows what its ability string is; `AddSpellEffectLoc` takes the same
   * string. Pass the ability id.
   */
  public static createSpellAtPoint(
    ability: number | string,
    effectType: effecttype,
    where: Point,
  ): Effect {
    return this.expect(
      typeof ability === "number"
        ? AddSpellEffectByIdLoc(ability, effectType, where.handle)
        : AddSpellEffectLoc(ability, effectType, where.handle),
      spellDetail(ability),
    );
  }

  /**
   * Creates a spell visual effect attached to a widget, through
   * `AddSpellEffectTargetById` for an ability id and `AddSpellEffectTarget`
   * for a string.
   * @remarks
   * common.j names that string `modelName`, and jassdoc does not say what it
   * is: pass the ability id.
   * @example
   * {@includeCode ../../examples/harness/effect-create-spell-attachment.ts}
   * @param ability - The ability whose art to show: its rawcode, such as
   * `FourCC("AHtc")`, or a string (see the remarks).
   * @param effectType - Which of the ability's art fields to use, such as
   * `EFFECT_TYPE_CASTER` or `EFFECT_TYPE_TARGET`.
   * @param targetWidget - The widget to attach the effect to.
   * @param attachPointName - The attachment point of the widget's model, such
   * as `"origin"` or `"overhead"`.
   * @returns The new effect, which keeps `targetWidget` and `attachPointName`
   * in its `attachWidget` and `attachPointName`.
   * @throws When the game returns no handle:
   * `reforged-ts: failed to create Effect (<ability>)`, at the calling line,
   * the ability as its rawcode string or as given. In Dev mode, also when
   * called before the globals Init stage or inside `MapPlayer.runLocal`.
   * @native AddSpellEffectTargetById
   * @native AddSpellEffectTarget
   */
  public static createSpellAttachment(
    ability: number | string,
    effectType: effecttype,
    targetWidget: Widget,
    attachPointName: string,
  ): Effect {
    return this.expect(
      typeof ability === "number"
        ? AddSpellEffectTargetById(
            ability,
            effectType,
            targetWidget.handle,
            attachPointName,
          )
        : AddSpellEffectTarget(
            ability,
            effectType,
            targetWidget.handle,
            attachPointName,
          ),
      spellDetail(ability),
      (effect) => {
        effect.attachWidget = targetWidget;
        effect.attachPointName = attachPointName;
      },
    );
  }

  /**
   * Gets the scale of the whole model, a ratio where 1 is the model's own
   * size.
   * @returns The scale ratio.
   * @native BlzGetSpecialEffectScale
   */
  public get scale() {
    return BlzGetSpecialEffectScale(this.handle);
  }

  /**
   * The scale of the whole model, a ratio where 1 is the model's own size; a
   * negative scale mirrors the model on every axis. It multiplies the scale
   * matrix of `setScaleMatrix`.
   * @native BlzSetSpecialEffectScale
   */
  public set scale(scale: number) {
    BlzSetSpecialEffectScale(this.handle, scale);
  }

  /**
   * Gets the effect's x-coordinate as the local client sees it.
   * @remarks
   * The value can differ between clients: never let it decide game state.
   * An attached effect reports 0.
   * @returns The x-coordinate, in world units.
   * @native BlzGetLocalSpecialEffectX
   * @async
   */
  public get x() {
    return BlzGetLocalSpecialEffectX(this.handle);
  }

  /**
   * The effect's x-coordinate, in world units, on every client. Setting it
   * moves a free effect and does nothing to an attached one.
   * @native BlzSetSpecialEffectX
   */
  public set x(x: number) {
    BlzSetSpecialEffectX(this.handle, x);
  }

  /**
   * Gets the effect's y-coordinate as the local client sees it.
   * @remarks
   * The value can differ between clients: never let it decide game state.
   * An attached effect reports 0.
   * @returns The y-coordinate, in world units.
   * @native BlzGetLocalSpecialEffectY
   * @async
   */
  public get y() {
    return BlzGetLocalSpecialEffectY(this.handle);
  }

  /**
   * The effect's y-coordinate, in world units, on every client. Setting it
   * moves a free effect and does nothing to an attached one.
   * @native BlzSetSpecialEffectY
   */
  public set y(y: number) {
    BlzSetSpecialEffectY(this.handle, y);
  }

  /**
   * Gets the effect's height as the local client sees it.
   * @remarks
   * The value can differ between clients: never let it decide game state.
   * An attached effect reports 0.
   * @returns The z-coordinate, in world units above the map's zero level,
   * not above the ground.
   * @native BlzGetLocalSpecialEffectZ
   * @async
   */
  public get z() {
    return BlzGetLocalSpecialEffectZ(this.handle);
  }

  /**
   * The effect's z-coordinate, in world units above the map's zero level, on
   * every client. Setting it moves a free effect and does nothing to an
   * attached one.
   * @native BlzSetSpecialEffectZ
   */
  public set z(z: number) {
    BlzSetSpecialEffectZ(this.handle, z);
  }

  /**
   * Adds a subanimation tag, such as `SUBANIM_TYPE_SLAM`, to the animations
   * the effect plays next: with it, `playAnimation(ANIM_TYPE_ATTACK)` plays
   * the model's "attack slam".
   * @param subAnim - The subanimation tag to add.
   * @native BlzSpecialEffectAddSubAnimation
   */
  public addSubAnimation(subAnim: subanimtype) {
    BlzSpecialEffectAddSubAnimation(this.handle, subAnim);
  }

  /**
   * Removes every subanimation tag that `addSubAnimation` added; the
   * animation types are left as they are.
   * @native BlzSpecialEffectClearSubAnimations
   */
  public clearSubAnimations() {
    BlzSpecialEffectClearSubAnimations(this.handle);
  }

  /**
   * Destroys the effect, which plays its model's death animation first.
   * @remarks
   * In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
   * a second `destroy()` included, raises
   * `reforged-ts: used after destroy: <Class>#<id>`, and
   * `Reforged.debug.report()` counts it destroyed.
   * @native DestroyEffect
   */
  public destroy() {
    DestroyEffect(this.handle);
    this.release();
  }

  /**
   * Plays the model's animation of the given type, with the subanimation tags
   * the effect has, replacing the one it plays.
   * @param animType - The animation type, such as `ANIM_TYPE_SPELL`.
   * @native BlzPlaySpecialEffect
   */
  public playAnimation(animType: animtype) {
    BlzPlaySpecialEffect(this.handle, animType);
  }

  /**
   * Plays the model's animation of the given type at a given speed, replacing
   * the one it plays.
   * @param animType - The animation type, such as `ANIM_TYPE_SPELL`.
   * @param timeScale - The speed, where 1 is the animation's own.
   * @native BlzPlaySpecialEffectWithTimeScale
   */
  public playWithTimeScale(animType: animtype, timeScale: number) {
    BlzPlaySpecialEffectWithTimeScale(this.handle, animType, timeScale);
  }

  /**
   * Queues the named animation after the current one, through
   * `BlzQueueSpecialEffectAnimation` (3.0.0).
   * @param name - The animation's name in the model, such as `"stand"`.
   * @native BlzQueueSpecialEffectAnimation
   */
  public queueAnimation(name: string) {
    BlzQueueSpecialEffectAnimation(this.handle, name);
  }

  /**
   * Removes one subanimation tag that `addSubAnimation` added.
   * @param subAnim - The subanimation tag to remove.
   * @native BlzSpecialEffectRemoveSubAnimation
   */
  public removeSubAnimation(subAnim: subanimtype) {
    BlzSpecialEffectRemoveSubAnimation(this.handle, subAnim);
  }

  /**
   * Resets the scale matrix of `setScaleMatrix` to 1 on every axis; the
   * `scale` is left as it is.
   * @native BlzResetSpecialEffectMatrix
   * @bug Reported on patch 1.36.2 to reset the yaw, pitch and roll too: set
   * the orientation again after it.
   */
  public resetScaleMatrix() {
    BlzResetSpecialEffectMatrix(this.handle);
  }

  /**
   * Sets the transparency of the effect's main model; an attached effect
   * keeps the transparency of what it is attached to.
   * @param alpha - From 0 (invisible) to 255 (opaque); a value outside that
   * range does nothing.
   * @native BlzSetSpecialEffectAlpha
   */
  public setAlpha(alpha: number) {
    BlzSetSpecialEffectAlpha(this.handle, alpha);
  }

  /**
   * Plays the named animation, through `BlzSetSpecialEffectAnimation`
   * (3.0.0).
   * @param name - The animation's name in the model, such as `"stand"`.
   * @native BlzSetSpecialEffectAnimation
   */
  public setAnimation(name: string) {
    BlzSetSpecialEffectAnimation(this.handle, name);
  }

  /**
   * Sets the time in seconds the effect takes to blend into its next
   * animation, through `BlzSetSpecialEffectAnimationBlendTime` (3.0.0).
   * @param seconds - The blend time, in seconds.
   * @native BlzSetSpecialEffectAnimationBlendTime
   */
  public setAnimationBlendTime(seconds: number) {
    BlzSetSpecialEffectAnimationBlendTime(this.handle, seconds);
  }

  /**
   * Tints the whole model by scaling its colour channels, as a unit's vertex
   * colour does; 255 on each keeps the model's own colours.
   * @param red - The red channel, from 0 to 255.
   * @param green - The green channel, from 0 to 255.
   * @param blue - The blue channel, from 0 to 255.
   * @native BlzSetSpecialEffectColor
   */
  public setColor(red: number, green: number, blue: number) {
    BlzSetSpecialEffectColor(this.handle, red, green, blue);
  }

  /**
   * Paints the model's team-colour parts in a player's colour; a model with no
   * team-colour parts does not change.
   * @param whichPlayer - The player whose colour to use.
   * @native BlzSetSpecialEffectColorByPlayer
   */
  public setColorByPlayer(whichPlayer: MapPlayer) {
    BlzSetSpecialEffectColorByPlayer(this.handle, whichPlayer.handle);
  }

  /**
   * Moves a free effect to a height, as the `z` setter does.
   * @param height - The z-coordinate, in world units.
   * @native BlzSetSpecialEffectHeight
   * @bug Reported on patch 1.36.2 to crash the game on an attached effect:
   * call it on free effects only.
   */
  public setHeight(height: number) {
    BlzSetSpecialEffectHeight(this.handle, height);
  }

  /**
   * Rotates a free effect on all three axes at once.
   * @param yaw - The rotation around the z-axis, in radians, as a unit's
   * facing.
   * @param pitch - The rotation around the y-axis, in radians.
   * @param roll - The rotation around the x-axis, in radians.
   * @native BlzSetSpecialEffectOrientation
   */
  public setOrientation(yaw: number, pitch: number, roll: number) {
    BlzSetSpecialEffectOrientation(this.handle, yaw, pitch, roll);
  }

  /**
   * Rotates a free effect around its y-axis.
   * @param pitch - The rotation, in radians.
   * @native BlzSetSpecialEffectPitch
   */
  public setPitch(pitch: number) {
    BlzSetSpecialEffectPitch(this.handle, pitch);
  }

  /**
   * Moves a free effect to a point's x and y.
   * @param p - The point to move to.
   * @native BlzSetSpecialEffectPositionLoc
   */
  public setPoint(p: Point) {
    BlzSetSpecialEffectPositionLoc(this.handle, p.handle);
  }

  /**
   * Moves a free effect to the given coordinates.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @param z - The z-coordinate, in world units above the map's zero level.
   * @native BlzSetSpecialEffectPosition
   */
  public setPosition(x: number, y: number, z: number) {
    BlzSetSpecialEffectPosition(this.handle, x, y, z);
  }

  /**
   * Rotates a free effect around its x-axis.
   * @param roll - The rotation, in radians.
   * @native BlzSetSpecialEffectRoll
   */
  public setRoll(roll: number) {
    BlzSetSpecialEffectRoll(this.handle, roll);
  }

  /**
   * Stretches the model on each axis; the result is multiplied by `scale`.
   * @param x - The ratio along the x-axis, where 1 is the model's own size.
   * @param y - The ratio along the y-axis.
   * @param z - The ratio along the z-axis.
   * @native BlzSetSpecialEffectMatrixScale
   */
  public setScaleMatrix(x: number, y: number, z: number) {
    BlzSetSpecialEffectMatrixScale(this.handle, x, y, z);
  }

  /**
   * Moves the effect's current animation to a point in its playback.
   * @param value - The time from the animation's start, in seconds.
   * @native BlzSetSpecialEffectTime
   */
  public setTime(value: number) {
    BlzSetSpecialEffectTime(this.handle, value);
  }

  /**
   * Sets the speed of the effect's animations.
   * @param timeScale - The speed, where 1 is the animation's own and 0 holds
   * it still.
   * @native BlzSetSpecialEffectTimeScale
   */
  public setTimeScale(timeScale: number) {
    BlzSetSpecialEffectTimeScale(this.handle, timeScale);
  }

  /**
   * Rotates a free effect around its z-axis, as a unit turns to face.
   * @param y - The yaw, in radians.
   * @native BlzSetSpecialEffectYaw
   */
  public setYaw(y: number) {
    BlzSetSpecialEffectYaw(this.handle, y);
  }
}
