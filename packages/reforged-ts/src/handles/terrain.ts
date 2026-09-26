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
   * `true` when the pathing type is NOT set at the point, `false` when it is:
   * the answer of `IsTerrainPathable`, passed through unchanged.
   * @note The answer is the inverse of what the name says (jassdoc,
   * `IsTerrainPathable`).
   * @see https://lep.duckdns.org/jassbot/doc/IsTerrainPathable
   */
  public static isPathable(x: number, y: number, type: pathingtype) {
    return IsTerrainPathable(x, y, type);
  }

  /**
   * The answer of `BlzIsTerrainPathableEx` (3.0.0) for the point and the
   * pathing type, passed through unchanged.
   * @note jassdoc does not document its answer; whether it keeps the inversion
   * of `IsTerrainPathable` is not measured.
   */
  public static isPathableEx(x: number, y: number, type: pathingtype) {
    return BlzIsTerrainPathableEx(x, y, type);
  }
}
