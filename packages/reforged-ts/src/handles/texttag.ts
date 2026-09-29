/** @noSelfInFile */

import { Handle } from "./handle";
import { Unit } from "./unit";

/**
 * A floating text drawn in the world, such as the gold a kill earns: a text
 * at a point, which can drift, fade and expire.
 * @remarks
 * - A text tag ages from 0, in seconds, unless suspended. A temporary one
 *   starts fading at its fadepoint and is destroyed at the end of its
 *   lifespan; a permanent one, as a new tag is, stays until destroyed.
 * - The game holds a limited number of text tags (10,000 in 3.0.0). When all
 *   exist, {@link TextTag.create} gets back the one with id 0, with its
 *   settings, rather than a new one.
 * @example A text rising above each dying unit
 * {@includeCode ../../examples/harness/text-tag-death.ts}
 * @native texttag
 */
export class TextTag extends Handle<texttag> {
  /**
   * Creates an empty, permanent text tag at the world's origin.
   * @returns The new text tag.
   * @throws When the game returns no handle: `reforged-ts: failed to create TextTag`, at the calling line.
   * In Dev mode, also when called before the globals Init stage or inside `MapPlayer.runLocal`.
   * @native CreateTextTag
   */
  public static create(): TextTag {
    return this.expect(CreateTextTag());
  }

  /**
   * Destroys the TextTag through its Native.
   * @remarks
   * In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
   * a second `destroy()` included, raises
   * `reforged-ts: used after destroy: <Class>#<id>`, and
   * `Reforged.debug.report()` counts it destroyed.
   * @example The handles a feature owns, destroyed when it ends
   * {@includeCode ../../examples/game/destroy-owned.ts}
   * @native DestroyTextTag
   */
  public destroy() {
    DestroyTextTag(this.handle);
    this.release();
  }

  /**
   * Sets how long the text tag has existed, which places it along its drift,
   * fading and lifespan.
   * @param age - The age, in seconds; a negative age delays all three.
   * @native SetTextTagAge
   */
  public setAge(age: number) {
    SetTextTagAge(this.handle, age);
  }

  /**
   * Sets the colour of the text; it applies even while the tag fades.
   * @remarks
   * The alpha takes effect only while the tag is suspended
   * ({@link TextTag.setSuspended}).
   * @param red - The red component, from 0 to 255.
   * @param green - The green component, from 0 to 255.
   * @param blue - The blue component, from 0 to 255.
   * @param alpha - The opacity, from 0 (transparent) to 255 (opaque).
   * @native SetTextTagColor
   */
  public setColor(red: number, green: number, blue: number, alpha: number) {
    SetTextTagColor(this.handle, red, green, blue, alpha);
  }

  /**
   * Sets the age at which a temporary text tag starts fading out, reaching
   * full transparency at the end of its lifespan.
   * @param fadepoint - The age, in seconds.
   * @native SetTextTagFadepoint
   */
  public setFadepoint(fadepoint: number) {
    SetTextTagFadepoint(this.handle, fadepoint);
  }

  /**
   * Sets the age at which a temporary text tag is destroyed.
   * @param lifespan - The age, in seconds; 100 by default. Shorter than the
   * fadepoint, the tag disappears without fading.
   * @native SetTextTagLifespan
   */
  public setLifespan(lifespan: number) {
    SetTextTagLifespan(this.handle, lifespan);
  }

  /**
   * Makes the text tag permanent, or temporary so that it fades and expires.
   * @param flag - True for permanent, as a new tag is; false for temporary.
   * @native SetTextTagPermanent
   */
  public setPermanent(flag: boolean) {
    SetTextTagPermanent(this.handle, flag);
  }

  /**
   * Moves the text tag to a point, above the ground there.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @param heightOffset - The height above the ground at the point, in world
   * units, as the ground is at the time of the call.
   * @native SetTextTagPos
   */
  public setPos(x: number, y: number, heightOffset: number) {
    SetTextTagPos(this.handle, x, y, heightOffset);
  }

  /**
   * Moves the text tag above a unit, where the unit stands now: it does not
   * follow the unit.
   * @param u - The unit to move it above.
   * @param heightOffset - The height above the top of the unit's model, in
   * world units.
   * @native SetTextTagPosUnit
   */
  public setPosUnit(u: Unit, heightOffset: number) {
    SetTextTagPosUnit(this.handle, u.handle, heightOffset);
  }

  /**
   * Stops or resumes the text tag's ageing, which freezes its drift, fading
   * and lifespan.
   * @param flag - True to stop the ageing, false to resume it.
   * @native SetTextTagSuspended
   */
  public setSuspended(flag: boolean) {
    SetTextTagSuspended(this.handle, flag);
  }

  /**
   * Sets the text and its size.
   * @param s - The text; `"\n"` starts a new line.
   * @param height - The size of the text, relative to the screen: from about
   * 0.02 to 0.1. With `adjustHeight`, a font size as the World Editor's
   * triggers give it, such as 10.
   * @param adjustHeight - When true, `height` is a World Editor font size,
   * converted by multiplying it by 0.0023; false by default.
   * @native SetTextTagText
   */
  public setText(s: string, height: number, adjustHeight = false) {
    if (adjustHeight) {
      height *= 0.0023;
    }
    SetTextTagText(this.handle, s, height);
  }

  /**
   * Makes the text tag drift as it ages, by an offset that grows with its age.
   * @param xvel - The rightward velocity, relative to the screen rather than
   * in world units.
   * @param yvel - The upward velocity, relative to the screen.
   * @native SetTextTagVelocity
   */
  public setVelocity(xvel: number, yvel: number) {
    SetTextTagVelocity(this.handle, xvel, yvel);
  }

  /**
   * Makes the text tag drift as it ages, at a speed and in a direction.
   * @param speed - The speed, in the World Editor's text tag units: 64 is a
   * common rising speed.
   * @param angle - The direction, in degrees: 0 to the right, 90 up.
   * @native SetTextTagVelocity
   * @native Cos
   * @native Sin
   */
  public setVelocityAngle(speed: number, angle: number) {
    const vel = (speed * 0.071) / 128;
    this.setVelocity(
      vel * Cos(angle * bj_DEGTORAD),
      vel * Sin(angle * bj_DEGTORAD),
    );
  }

  /**
   * Shows or hides the text tag, for every player.
   * @param flag - True to show it, false to hide it.
   * @native SetTextTagVisibility
   */
  public setVisible(flag: boolean) {
    SetTextTagVisibility(this.handle, flag);
  }
}
