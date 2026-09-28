/** @noSelfInFile */

import { rawcodeToString } from "../utils/rawcode";
import { Handle } from "./handle";
import { Rectangle } from "./rect";

/**
 * A weather effect: rain, snow, wind or another weather type from the
 * game's weather table, shown over a rectangle.
 * @remarks
 * A new weather effect is off: `enable(true)` turns it on.
 * @example Heavy rain over the centre of the map
 * {@includeCode ../../examples/game/weathereffect-create.ts}
 * @native weathereffect
 */
export class WeatherEffect extends Handle<weathereffect> {
  /**
   * Adds a weather effect.
   * @remarks
   * - To understand more about weather effects nature, I advise to read
   *   Ammorth's article about weather effects: [http://www.wc3c.net/showthread.php?t=91176](https://web.archive.org/web/20180130202056/http://www.wc3c.net/showthread.php?t=91176).
   * - To get an idea on how to add your own weather effects, you may read
   *   CryoniC's article about custom weather effects: [http://www.wc3c.net/showthread.php?t=67949](https://web.archive.org/web/20180507060112/http://www.wc3c.net/showthread.php?t=67949).
   * @param where - The rect to apply the WeatherEffect to.
   * @param effectID - The weather type's rawcode, such as `FourCC("RAhr")`
   * for Ashenvale heavy rain.
   * @returns The new weather effect, turned off.
   * @throws When the game returns no handle:
   * `reforged-ts: failed to create WeatherEffect (<effectID>)`, at the calling
   * line, the id as its rawcode string. In Dev mode, also when called before
   * the globals Init stage or inside `MapPlayer.runLocal`.
   * @native AddWeatherEffect
   */
  public static create(where: Rectangle, effectID: number): WeatherEffect {
    return this.expect(
      AddWeatherEffect(where.handle, effectID),
      rawcodeToString(effectID),
    );
  }

  /**
   * Destroys the WeatherEffect through its Native.
   * @remarks
   * In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
   * a second `destroy()` included, raises
   * `reforged-ts: used after destroy: <Class>#<id>`, and
   * `Reforged.debug.report()` counts it destroyed.
   * @native RemoveWeatherEffect
   */
  public destroy() {
    RemoveWeatherEffect(this.handle);
    this.release();
  }

  /**
   * Turns the weather on or off, with a gradual transition.
   * @param flag - `true` to turn it on, `false` to turn it off.
   * @native EnableWeatherEffect
   */
  public enable(flag: boolean) {
    EnableWeatherEffect(this.handle, flag);
  }
}
