/** @noSelfInFile */

import { Handle } from "./handle";

export class Ubersplat extends Handle<ubersplat> {
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
   * @native FinishUbersplat
   * @bug Does nothing.
   */
  public finish() {
    FinishUbersplat(this.handle);
  }

  public render(flag: boolean, always = false) {
    if (always) {
      SetUbersplatRenderAlways(this.handle, flag);
    } else {
      SetUbersplatRender(this.handle, flag);
    }
  }

  /**
   * @native ResetUbersplat
   * @bug Does nothing.
   */
  public reset() {
    ResetUbersplat(this.handle);
  }

  public show(flag: boolean) {
    ShowUbersplat(this.handle, flag);
  }
}
