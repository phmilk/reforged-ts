/** @noSelfInFile */

import { Handle } from "./handle";

/**
 * An ubersplat: a texture laid on the terrain from the game's ubersplat
 * table, such as the ground under a building or a scorch mark.
 * @remarks
 * The name given to `create` is the row of `Splats\UberSplatData.slk` that
 * sets the texture, its size and its lifetime; the map's own ubersplats come
 * from the same table.
 * @example A building's ground texture at the centre of the map
 * {@includeCode ../../examples/game/ubersplat-create.ts}
 * @native ubersplat
 */
export class Ubersplat extends Handle<ubersplat> {
  /**
   * Creates an ubersplat on the terrain at the given point.
   * @param x - The x-coordinate of its centre, in world units.
   * @param y - The y-coordinate of its centre, in world units.
   * @param name - The ubersplat type: the name of its row in
   * `Splats\UberSplatData.slk`.
   * @param red - The red channel of its tint, from 0 to 255.
   * @param green - The green channel of its tint, from 0 to 255.
   * @param blue - The blue channel of its tint, from 0 to 255.
   * @param alpha - Its opacity, from 0 (invisible) to 255 (opaque).
   * @param forcePaused - Whether it stays as it is instead of going through
   * its lifetime and fading away.
   * @param noBirthTime - Whether it skips its birth, appearing at once.
   * @returns The new ubersplat.
   * @throws When the game returns no handle:
   * `reforged-ts: failed to create Ubersplat (<name>)`, at the calling line.
   * In Dev mode, also when called before the globals Init stage or inside
   * `MapPlayer.runLocal`.
   * @native CreateUbersplat
   */
  public static create(
    x: number,
    y: number,
    name: string,
    red: number,
    green: number,
    blue: number,
    alpha: number,
    forcePaused: boolean,
    noBirthTime: boolean,
  ): Ubersplat {
    return this.expect(
      CreateUbersplat(
        x,
        y,
        name,
        red,
        green,
        blue,
        alpha,
        forcePaused,
        noBirthTime,
      ),
      name,
    );
  }

  /**
   * Destroys the Ubersplat through its Native.
   * @remarks
   * In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
   * a second `destroy()` included, raises
   * `reforged-ts: used after destroy: <Class>#<id>`, and
   * `Reforged.debug.report()` counts it destroyed.
   * @native DestroyUbersplat
   */
  public destroy() {
    DestroyUbersplat(this.handle);
    this.release();
  }

  /**
   * Would move the ubersplat to the end of its lifetime.
   * @native FinishUbersplat
   * @bug The Native has no effect.
   */
  public finish() {
    FinishUbersplat(this.handle);
  }

  /**
   * Sets whether the game draws the ubersplat.
   * @param flag - `true` to draw it.
   * @param always - Whether to set the flag that keeps it drawn always,
   * through `SetUbersplatRenderAlways`, instead of the plain one, through
   * `SetUbersplatRender`; the plain one when left out.
   * @native SetUbersplatRenderAlways
   * @native SetUbersplatRender
   */
  public render(flag: boolean, always = false) {
    if (always) {
      SetUbersplatRenderAlways(this.handle, flag);
    } else {
      SetUbersplatRender(this.handle, flag);
    }
  }

  /**
   * Would restart the ubersplat's lifetime from its birth.
   * @native ResetUbersplat
   * @bug The Native has no effect.
   */
  public reset() {
    ResetUbersplat(this.handle);
  }

  /**
   * Shows or hides the ubersplat.
   * @param flag - `true` to show it, `false` to hide it.
   * @native ShowUbersplat
   */
  public show(flag: boolean) {
    ShowUbersplat(this.handle, flag);
  }
}
