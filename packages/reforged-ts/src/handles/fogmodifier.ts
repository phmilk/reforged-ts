/** @noSelfInFile */

import { Handle } from "./handle";
import type { MapPlayer } from "./player";
import type { Point } from "./point";
import type { Rectangle } from "./rect";

export class FogModifier extends Handle<fogmodifier> {
  /**
   * @param forWhichPlayer
   * @param whichState Determines what type of fog the area is being modified to.
   * @param centerX The x-coordinate where the fog modifier begins.
   * @param centerY The y-coordinate where the fog modifier begins.
   * @param radius Determines the extent that the fog travels (expanding from the coordinates ( centerx , centery )).
   * @param useSharedVision Determines whether or not the fog modifier will be applied to allied players with shared vision.
   * @param afterUnits Will determine whether or not units in that area will be masked by the fog.
   * If it is set to true and the fogstate is masked, it will hide all the units in the fog modifier's radius and mask the area.
   * If set to false, it will only mask the areas that are not visible to the units.
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
   * A new fog modifier over a circle around `center`, through
   * `CreateFogModifierRadiusLoc`; the parameters are `create`'s.
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
   */
  public destroy() {
    DestroyFogModifier(this.handle);
    this.release();
  }

  public start() {
    FogModifierStart(this.handle);
  }

  public stop() {
    FogModifierStop(this.handle);
  }

  /**
   * A new fog modifier over `where`: a creation, whatever its name says.
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
