/**
 * The layers of the storage a map's Game data set reads its object data
 * from, as Probe runs on 3.0.0.24268 measured them (#575,
 * `docs/research/builtins-layers.md`): the base layer, the `_Balance` layer
 * of a set and version where the install has one, and the enUS locale
 * layer of the names and the editor's strings. The `reforged-builtins`
 * generator reads the Built-in objects through them, and the game data
 * model (`./game-data.ts`) their base values.
 */
import VERSIONS_FILE from "./game-data-versions.json" with { type: "json" };

/** A Game Data Version of a map: Reign of Chaos, The Frozen Throne or Forsaken Kingdom. */
export interface GameDataVersion {
  /** Its id, the end of a Game data set's: `tft`. */
  id: string;
  /** The World Editor's label: `The Frozen Throne`. */
  label: string;
  /** The value a map's `war3map.w3i` and the data's `version` cells store. */
  version: number;
}

/**
 * The Game Data Versions, by their value: `game-data-versions.json`, the
 * workspace's one list of them, which the Probe runner reads too (#620).
 */
export const GAME_DATA_VERSIONS: readonly GameDataVersion[] = VERSIONS_FILE;

/** The base layer: the object data of the sets of Forsaken Kingdom. */
export const BASE_LAYER = "War3.w3mod:";
/** The enUS locale layer, which holds the names. */
export const ENUS_LAYER = "War3.w3mod:_Locales/enUS.w3mod:";

/** A Game data set and the layer its object data comes from. */
export interface LayeredGameDataSet {
  /** Its stable id, as `reforged-builtins`' index names it: `custom-tft`. */
  id: string;
  /** Its label: `Custom (The Frozen Throne)`. */
  label: string;
  /**
   * The layer whose file of a kind replaces the base layer's, when it has
   * one: `_Balance/<Set>_V<version>`, which the install has for Custom of
   * Reign of Chaos and The Frozen Throne and Melee of Reign of Chaos only.
   */
  layer: string;
  /**
   * The Game Data Version: an object whose `version` cell is greater, one
   * of a later expansion, is not in the set.
   */
  version: number;
  /**
   * The qualifier of its own values in the profile files, which no layer
   * replaces: `Name:custom,V1=` names an object in the Custom set of The
   * Frozen Throne, over `Name=`. The sets of Forsaken Kingdom have none:
   * the profile files hold no `V2` value. Melee of The Frozen Throne keeps
   * `melee,V1`, which they hold, though it reads the base layer.
   */
  qualifier?: string;
}

/** A map's Game Data Sets, as the World Editor of 3.0 offers them, but Default. */
const SETS = [
  { id: "custom", label: "Custom", layer: "Custom" },
  { id: "melee", label: "Melee", layer: "Melee" },
] as const;

/** The Game Data Versions, latest first. */
const VERSIONS = GAME_DATA_VERSIONS.toSorted((a, b) => b.version - a.version);

/**
 * The Game data sets: one per Game Data Set and Game Data Version of a map,
 * latest version first, as Probe runs on 3.0.0.24268 settled them (#575,
 * docs/research/builtins-layers.md). A map reads the layer
 * `_Balance/<Set>_V<version>` where the install has it, else the base
 * layer, and leaves out the units, items and abilities of a later version:
 * all the sets of Forsaken Kingdom read the base layer whole. A map's
 * Default set reads Custom, or Melee on a melee map, so it has no set of
 * its own.
 */
export const GAME_DATA_SETS: readonly LayeredGameDataSet[] = VERSIONS.flatMap(
  (version) =>
    SETS.map((set) => ({
      id: `${set.id}-${version.id}`,
      label: `${set.label} (${version.label})`,
      layer: `${BASE_LAYER}_Balance/${set.layer}_V${String(version.version)}.w3mod:`,
      version: version.version,
      ...(version !== VERSIONS[0] && {
        qualifier: `${set.id},V${String(version.version)}`,
      }),
    })),
);

/**
 * The editor strings the data's `WESTRING_` names and the metadata's labels
 * resolve through, keys matched without regard to case: the destructables'
 * and doodads' names are mostly in the second file. A key both files set
 * keeps the second's value (`WESTRING_DOOD_YOIG` is "Iron Gate", then
 * "Iron Gate (A)"), read with `new Profile("last")`: the World Editor reads
 * these files, not the game, so the Probe that settled the names files'
 * rule (#564) cannot settle this one.
 */
export const EDITOR_STRINGS: readonly string[] = [
  `${ENUS_LAYER}UI/WorldEditGameStrings.txt`,
  `${ENUS_LAYER}UI/WorldEditStrings.txt`,
];
/** The section of the editor strings that holds the keys. */
export const WORLD_EDIT_SECTION = "WorldEditStrings";

/** The column of the Game Data Version an object came with, in the data of the versioned kinds. */
export const VERSION_COLUMN = "version";

/** The version of a row whose cell is no number: below every set's, so every set holds it. */
export const NO_VERSION = -1;

/** A row's Game Data Version: 0 without a cell, `NO_VERSION` for a cell that is no number. */
export function versionOf(row: ReadonlyMap<string, string>): number {
  const version = Number(row.get(VERSION_COLUMN) ?? 0);
  return Number.isNaN(version) ? NO_VERSION : version;
}

/**
 * The path the set `set` reads `file` of the base layer from: its layer's
 * when `listed` (the storage's paths, lower-cased) holds it, else the base
 * layer's.
 */
export function layeredPath(
  set: LayeredGameDataSet,
  file: string,
  listed: ReadonlySet<string>,
): string {
  return listed.has((set.layer + file).toLowerCase())
    ? set.layer + file
    : BASE_LAYER + file;
}
