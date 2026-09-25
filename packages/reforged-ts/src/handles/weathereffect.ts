/** @noSelfInFile */

import { rawcodeToString } from "../utils/rawcode";
import { Handle } from "./handle";
import { Rectangle } from "./rect";

export class WeatherEffect extends Handle<weathereffect> {
  /**
   * Adds a weather effect.
   * @param where The rect to apply the WeatherEffect to.
   * @param effectID Which effect to apply.
   * @note To understand more about weather effects nature, I advise to read
   * Ammorth's article about weather effects: [http://www.wc3c.net/showthread.php?t=91176](https://web.archive.org/web/20180130202056/http://www.wc3c.net/showthread.php?t=91176).
   * @note To get an idea on how to add your own weather effects, you may read
   * CryoniC's article about custom weather effects: [http://www.wc3c.net/showthread.php?t=67949](https://web.archive.org/web/20180507060112/http://www.wc3c.net/showthread.php?t=67949).
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
   */
  public destroy() {
    RemoveWeatherEffect(this.handle);
    this.release();
  }

  public enable(flag: boolean) {
    EnableWeatherEffect(this.handle, flag);
  }
}
