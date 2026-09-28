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

export class Effect extends Handle<effect> {
  public readonly attachWidget?: Widget;

  public readonly attachPointName?: string;

  /**
   * Creates a special effect.
   * @param modelName - The path of the model that the effect will use.
   * @param x -
   * @param y -
   * @native AddSpecialEffect
   */
  public static create(modelName: string, x: number, y: number): Effect {
    return this.expect(AddSpecialEffect(modelName, x, y), modelName);
  }

  /**
   * Creates a special effect at `where`, through `AddSpecialEffectLoc`.
   * @param modelName - The path of the model that the effect will use.
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
   * for a string. common.j names that string `modelName`, and jassdoc does
   * not say what it is: pass the ability id.
   * @example
   * {@includeCode ../../examples/harness/effect-create-spell-attachment.ts}
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

  public get scale() {
    return BlzGetSpecialEffectScale(this.handle);
  }

  public set scale(scale: number) {
    BlzSetSpecialEffectScale(this.handle, scale);
  }

  /**
   * Warning: asynchronous
   * @native BlzGetLocalSpecialEffectX
   * @async
   */
  public get x() {
    return BlzGetLocalSpecialEffectX(this.handle);
  }

  public set x(x: number) {
    BlzSetSpecialEffectX(this.handle, x);
  }

  /**
   * Warning: asynchronous
   * @native BlzGetLocalSpecialEffectY
   * @async
   */
  public get y() {
    return BlzGetLocalSpecialEffectY(this.handle);
  }

  public set y(y: number) {
    BlzSetSpecialEffectY(this.handle, y);
  }

  /**
   * Warning: asynchronous
   * @native BlzGetLocalSpecialEffectZ
   * @async
   */
  public get z() {
    return BlzGetLocalSpecialEffectZ(this.handle);
  }

  public set z(z: number) {
    BlzSetSpecialEffectZ(this.handle, z);
  }

  public addSubAnimation(subAnim: subanimtype) {
    BlzSpecialEffectAddSubAnimation(this.handle, subAnim);
  }

  public clearSubAnimations() {
    BlzSpecialEffectClearSubAnimations(this.handle);
  }

  /**
   * Destroy the effect handle. This will play the effect's death animation.
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

  public playAnimation(animType: animtype) {
    BlzPlaySpecialEffect(this.handle, animType);
  }

  public playWithTimeScale(animType: animtype, timeScale: number) {
    BlzPlaySpecialEffectWithTimeScale(this.handle, animType, timeScale);
  }

  /**
   * Queues the named animation after the current one, through
   * `BlzQueueSpecialEffectAnimation` (3.0.0).
   * @native BlzQueueSpecialEffectAnimation
   */
  public queueAnimation(name: string) {
    BlzQueueSpecialEffectAnimation(this.handle, name);
  }

  public removeSubAnimation(subAnim: subanimtype) {
    BlzSpecialEffectRemoveSubAnimation(this.handle, subAnim);
  }

  public resetScaleMatrix() {
    BlzResetSpecialEffectMatrix(this.handle);
  }

  public setAlpha(alpha: number) {
    BlzSetSpecialEffectAlpha(this.handle, alpha);
  }

  /**
   * Plays the named animation, through `BlzSetSpecialEffectAnimation`
   * (3.0.0).
   * @native BlzSetSpecialEffectAnimation
   */
  public setAnimation(name: string) {
    BlzSetSpecialEffectAnimation(this.handle, name);
  }

  /**
   * Sets the time in seconds the effect takes to blend into its next
   * animation, through `BlzSetSpecialEffectAnimationBlendTime` (3.0.0).
   * @native BlzSetSpecialEffectAnimationBlendTime
   */
  public setAnimationBlendTime(seconds: number) {
    BlzSetSpecialEffectAnimationBlendTime(this.handle, seconds);
  }

  public setColor(red: number, green: number, blue: number) {
    BlzSetSpecialEffectColor(this.handle, red, green, blue);
  }

  public setColorByPlayer(whichPlayer: MapPlayer) {
    BlzSetSpecialEffectColorByPlayer(this.handle, whichPlayer.handle);
  }

  public setHeight(height: number) {
    BlzSetSpecialEffectHeight(this.handle, height);
  }

  public setOrientation(yaw: number, pitch: number, roll: number) {
    BlzSetSpecialEffectOrientation(this.handle, yaw, pitch, roll);
  }

  public setPitch(pitch: number) {
    BlzSetSpecialEffectPitch(this.handle, pitch);
  }

  public setPoint(p: Point) {
    BlzSetSpecialEffectPositionLoc(this.handle, p.handle);
  }

  public setPosition(x: number, y: number, z: number) {
    BlzSetSpecialEffectPosition(this.handle, x, y, z);
  }

  public setRoll(roll: number) {
    BlzSetSpecialEffectRoll(this.handle, roll);
  }

  public setScaleMatrix(x: number, y: number, z: number) {
    BlzSetSpecialEffectMatrixScale(this.handle, x, y, z);
  }

  public setTime(value: number) {
    BlzSetSpecialEffectTime(this.handle, value);
  }

  public setTimeScale(timeScale: number) {
    BlzSetSpecialEffectTimeScale(this.handle, timeScale);
  }

  public setYaw(y: number) {
    BlzSetSpecialEffectYaw(this.handle, y);
  }
}
