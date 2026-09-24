/** @noSelfInFile */

import { rawcodeToString } from "../utils/rawcode";
import { HandleBase } from "./handle";
import { Rectangle } from "./rect";

export class WeatherEffect extends HandleBase<weathereffect> {
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

  public destroy() {
    RemoveWeatherEffect(this.handle);
  }

  public enable(flag: boolean) {
    EnableWeatherEffect(this.handle, flag);
  }
}
