/** @noSelfInFile */
// common.j of the fixture Patch 9.9.9.99999, in the Typings generator's shape.

declare interface handle {
  __handle: never;
}
declare interface unit extends handle {
  __unit: never;
}

/**
 * @param whichUnit - unit
 * @returns string
 * @async
 * @see {@link https://lep.duckdns.org/jassbot/doc/GetUnitName}
 */
declare function GetUnitName(whichUnit: unit): string | undefined;

/**
 * @param whichUnit - unit
 * @returns nothing
 * @see {@link https://lep.duckdns.org/jassbot/doc/KillUnit}
 */
declare function KillUnit(whichUnit: unit): void;

/**
 * Jass: constant integer
 * @defaultValue `1`
 * @see {@link https://lep.duckdns.org/jassbot/doc/SLEEP}
 */
declare const SLEEP: number;
