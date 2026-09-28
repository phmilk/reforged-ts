/** @noSelfInFile */

import { Handle } from "./handle";
import type { MapPlayer } from "./player";
import type { Point } from "./point";
import type { Rectangle } from "./rect";

/**
 * A fog modifier: a fog-of-war state forced on an area for one player, such
 * as a region kept visible or kept black.
 * @remarks
 * A new fog modifier does nothing until `start`; while it runs, it overrides
 * the player's own fog over its area, and `stop` gives it back.
 * @example Revealing the centre of the map to a player
 * {@includeCode ../../examples/game/fogmodifier-create.ts}
 * @native fogmodifier
 */
export class FogModifier extends Handle<fogmodifier> {
  /**
   * Creates a stopped fog modifier over a circle.
   * @param forWhichPlayer - The player whose fog it changes.
   * @param whichState - The fog state forced on the area, such as
   * `FOG_OF_WAR_VISIBLE`.
   * @param centerX - The x-coordinate of the circle's centre, in world units.
   * @param centerY - The y-coordinate of the circle's centre, in world units.
   * @param radius - The radius of the circle, in world units.
   * @param useSharedVision - Whether the players sharing vision with
   * `forWhichPlayer` get the change too.
   * @param afterUnits - Whether a masking state also hides what the player's
   * units see in the area, units included; `false` masks only what they do
   * not see.
   * @returns The new fog modifier.
   * @throws When the game returns no handle:
   * `reforged-ts: failed to create FogModifier`, at the calling line. In Dev
   * mode, also when called before the globals Init stage or inside
   * `MapPlayer.runLocal`.
   * @native CreateFogModifierRadius
   */
  public static create(
    forWhichPlayer: MapPlayer,
    whichState: fogstate,
    centerX: number,
    centerY: number,
    radius: number,
    useSharedVision: boolean,
    afterUnits: boolean,
  ): FogModifier {
    return this.expect(
      CreateFogModifierRadius(
        forWhichPlayer.handle,
        whichState,
        centerX,
        centerY,
        radius,
        useSharedVision,
        afterUnits,
      ),
    );
  }

  /**
   * Creates a stopped fog modifier over a circle around `center`, through
   * `CreateFogModifierRadiusLoc`.
   * @param forWhichPlayer - The player whose fog it changes.
   * @param whichState - The fog state forced on the area, such as
   * `FOG_OF_WAR_VISIBLE`.
   * @param center - The centre of the circle.
   * @param radius - The radius of the circle, in world units.
   * @param useSharedVision - Whether the players sharing vision with
   * `forWhichPlayer` get the change too.
   * @param afterUnits - Whether a masking state also hides what the player's
   * units see in the area; `false` masks only what they do not see.
   * @returns The new fog modifier.
   * @throws When the game returns no handle:
   * `reforged-ts: failed to create FogModifier`, at the calling line. In Dev
   * mode, also when called before the globals Init stage or inside
   * `MapPlayer.runLocal`.
   * @native CreateFogModifierRadiusLoc
   */
  public static createAtPoint(
    forWhichPlayer: MapPlayer,
    whichState: fogstate,
    center: Point,
    radius: number,
    useSharedVision: boolean,
    afterUnits: boolean,
  ): FogModifier {
    return this.expect(
      CreateFogModifierRadiusLoc(
        forWhichPlayer.handle,
        whichState,
        center.handle,
        radius,
        useSharedVision,
        afterUnits,
      ),
    );
  }

  /**
   * Destroys the FogModifier through its Native.
   * @remarks
   * In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
   * a second `destroy()` included, raises
   * `reforged-ts: used after destroy: <Class>#<id>`, and
   * `Reforged.debug.report()` counts it destroyed.
   * @native DestroyFogModifier
   */
  public destroy() {
    DestroyFogModifier(this.handle);
    this.release();
  }

  /**
   * Turns the fog modifier on: its state overrides the player's fog over its
   * area.
   * @native FogModifierStart
   */
  public start() {
    FogModifierStart(this.handle);
  }

  /**
   * Turns the fog modifier off: the area returns to the player's own fog.
   * @native FogModifierStop
   */
  public stop() {
    FogModifierStop(this.handle);
  }

  /**
   * Creates a stopped fog modifier over the rectangle `where`.
   * @remarks
   * A creation, whatever its name says: each call makes a new fog modifier.
   * @param forWhichPlayer - The player whose fog it changes.
   * @param whichState - The fog state forced on the area, such as
   * `FOG_OF_WAR_VISIBLE`.
   * @param where - The rectangle the fog state is forced on.
   * @param useSharedVision - Whether the players sharing vision with
   * `forWhichPlayer` get the change too.
   * @param afterUnits - Whether a masking state also hides what the player's
   * units see in the area; `false` masks only what they do not see.
   * @returns The new fog modifier.
   * @throws When the game returns no handle:
   * `reforged-ts: failed to create FogModifier`, at the calling line. In Dev
   * mode, also when called before the globals Init stage or inside
   * `MapPlayer.runLocal`.
   * @native CreateFogModifierRect
   */
  public static fromRect(
    forWhichPlayer: MapPlayer,
    whichState: fogstate,
    where: Rectangle,
    useSharedVision: boolean,
    afterUnits: boolean,
  ): FogModifier {
    return this.expect(
      CreateFogModifierRect(
        forWhichPlayer.handle,
        whichState,
        where.handle,
        useSharedVision,
        afterUnits,
      ),
    );
  }
}
