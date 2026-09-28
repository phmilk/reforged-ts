/** @noSelfInFile */

/**
 * The terrain of the map, over the terrain Natives: a Static namespace,
 * static members over the terrain of the whole game rather than one Handle.
 * The terrain namespaces of release 1.1 will sit beside it.
 * @example Finding a walkable spot
 * {@includeCode ../../examples/game/terrain-walkable.ts}
 */
export class Terrain {
  private constructor() {
    // nothing
  }

  /**
   * Checks one pathing type at a point, with the inverted answer of
   * `IsTerrainPathable` passed through unchanged.
   * @remarks The answer is the inverse of what the name says (jassdoc,
   * `IsTerrainPathable`).
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @param type - The pathing type, such as `PATHING_TYPE_WALKABILITY`.
   * @returns `true` when the pathing type is NOT set at the point, `false`
   * when it is.
   * @native IsTerrainPathable
   * @see https://lep.duckdns.org/jassbot/doc/IsTerrainPathable
   */
  public static isPathable(x: number, y: number, type: pathingtype) {
    return IsTerrainPathable(x, y, type);
  }

  /**
   * Checks one pathing type at a point through `BlzIsTerrainPathableEx`
   * (3.0.0).
   * @remarks jassdoc does not document its answer; whether it keeps the inversion
   * of `IsTerrainPathable` is not measured.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @param type - The pathing type, such as `PATHING_TYPE_WALKABILITY`.
   * @returns The Native's answer, passed through unchanged.
   * @native BlzIsTerrainPathableEx
   */
  public static isPathableEx(x: number, y: number, type: pathingtype) {
    return BlzIsTerrainPathableEx(x, y, type);
  }
}
