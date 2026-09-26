/** @noSelfInFile */

/**
 * The terrain of the map, over the terrain Natives. The terrain namespaces of
 * release 1.1 will sit beside it.
 */
export class Terrain {
  private constructor() {
    // nothing
  }

  /**
   * What `IsTerrainPathable` answers for the point and the pathing type,
   * unchanged.
   * @note The answer is inverted: `true` when the pathing type is not set at
   * the point, `false` when it is (jassdoc, `IsTerrainPathable`).
   * @see https://lep.duckdns.org/jassbot/doc/IsTerrainPathable
   */
  public static isPathable(x: number, y: number, type: pathingtype) {
    return IsTerrainPathable(x, y, type);
  }

  /**
   * What `BlzIsTerrainPathableEx` answers for the point and the pathing type,
   * unchanged (3.0.0).
   * @note jassdoc does not document its answer; whether it keeps the inversion
   * of `IsTerrainPathable` is not measured.
   */
  public static isPathableEx(x: number, y: number, type: pathingtype) {
    return BlzIsTerrainPathableEx(x, y, type);
  }
}
