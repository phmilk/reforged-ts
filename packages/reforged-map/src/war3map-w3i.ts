// The reader of war3map.w3i, the map's options: only its Game data set, the
// Game Data Set (Default, Custom, Melee) and the Game Data Version (Reign of
// Chaos, The Frozen Throne, Forsaken Kingdom) it declares, which name one
// of reforged-builtins' Game data sets together (`melee-fk`). Default reads
// Custom, or Melee when the melee map flag is set, as Probe runs measured
// (#575, #596).
//
// The header is read up to the Game Data Version, in the formats wc3libs
// reads (`W3I.java`): 18, 25, 28, 31, 32, 33 and 39, the 3.0 World
// Editor's. Little-endian integers, UTF-8 null-terminated strings:
//
//   int32    format
//   int32    saves, int32 editor version
//   int32[4] game version (format 28 and later)
//   cstring  name, author, description, recommended players
//   float32[8] camera bounds, int32[4] their complements
//   int32    playable width, int32 playable height
//   int32    flags (0x0004: melee map)
//   char     main tileset
//   int32    loading screen number
//   int32    loading screen crest race (format 39)
//   cstring  loading screen model (format 25 and later)
//   cstring  loading screen text, title, subtitle
//   int32    Game Data Set: 0 Default, 1 Custom, 2 Melee
//   -- read only in format 31 and later, for the Game Data Version:
//   cstring  prologue model, text, title, subtitle
//   int32    fog type, float32 fog start, end, density, ubyte[4] fog colour
//   int32 fog style, int32 fog over sky, float32[4] fog (format 39)
//   char[4]  weather, cstring sound environment, char light tileset
//   ubyte[4] water colour, int32 script language, int32 supported modes
//   int32    Game Data Version: 0 Reign of Chaos, 1 The Frozen Throne,
//            2 Forsaken Kingdom
//
// A format before 31 has no Game Data Version, and is read as The Frozen
// Throne, as wc3libs reads it: the editors that write them predate the
// option.

import { readMapFile } from "./map-folder.js";
import type { MapFolderModel } from "./model.js";

/** The options file of a map folder. */
export const W3I_FILE = "war3map.w3i";

/** The formats the reader reads. */
const FORMATS = [18, 25, 28, 31, 32, 33, 39];
/** The first format with a Game Data Version. */
const GAME_DATA_VERSION_FORMAT = 31;
/** The bit of the melee map flag in the flags field. */
const MELEE_FLAG = 0x0004;
/** The Game Data Sets, by the index the file stores; Default is resolved by the melee map flag. */
const GAME_DATA_SETS = ["default", "custom", "melee"] as const;
/** The Game Data Versions, by the index the file stores, as reforged-builtins' ids end. */
const GAME_DATA_VERSIONS = ["roc", "tft", "fk"] as const;
const UNKNOWN =
  "the map's Game data set is unknown, so no Built-in object is reported as outside it.";

/**
 * Reads the Game data set war3map.w3i declares into the model, as the id
 * of reforged-builtins' index (`melee-fk`). A missing, truncated or
 * unknown-format file, or a value the reader does not know, leaves it
 * unknown, with a warning.
 */
export function readWar3mapW3i(mapFolder: string, model: MapFolderModel): void {
  const bytes = readMapFile(mapFolder, W3I_FILE);
  if (bytes === undefined) {
    model.warnings.push(`${W3I_FILE} not found: ${UNKNOWN}`);
    return;
  }
  try {
    model.gameDataSet = gameDataSet(bytes);
  } catch (error) {
    if (!(error instanceof W3iError)) throw error;
    model.warnings.push(`${W3I_FILE} not read (${error.message}): ${UNKNOWN}`);
  }
}

class W3iError extends Error {}

function gameDataSet(bytes: Uint8Array): string {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;
  const skip = (length: number): number => {
    if (offset + length > bytes.byteLength) {
      throw new W3iError("it ends before its Game data set");
    }
    const start = offset;
    offset += length;
    return start;
  };
  const int32 = (): number => view.getInt32(skip(4), true);
  const skipStrings = (count: number): void => {
    for (let i = 0; i < count; i++) {
      const end = bytes.indexOf(0, offset);
      if (end === -1) throw new W3iError("it ends before its Game data set");
      offset = end + 1;
    }
  };

  const format = int32();
  if (!FORMATS.includes(format)) {
    throw new W3iError(
      `format ${String(format)}, which reforged-map does not read; it reads formats ${FORMATS.join(", ")}`,
    );
  }
  // Saves, editor version, and from format 28 the game version.
  skip(4 * (format >= 28 ? 6 : 2));
  // Name, author, description, recommended players.
  skipStrings(4);
  // Camera bounds and their complements, playable width and height.
  skip(4 * 8 + 4 * 4 + 4 * 2);
  const melee = (int32() & MELEE_FLAG) !== 0;
  // The main tileset, the loading screen number, and its crest race.
  skip(1 + 4 + (format >= 39 ? 4 : 0));
  // The loading screen's model, text, title and subtitle.
  skipStrings(format >= 25 ? 4 : 3);
  const set = byIndex(GAME_DATA_SETS, int32(), "Game Data Set");
  let version: (typeof GAME_DATA_VERSIONS)[number] = "tft";
  if (format >= GAME_DATA_VERSION_FORMAT) {
    // The prologue's model, text, title and subtitle.
    skipStrings(4);
    // The fog and its colour, the fog fields of format 39, the weather.
    skip(4 * 4 + 4 + (format >= 39 ? 4 * 6 : 0) + 4);
    // The sound environment.
    skipStrings(1);
    // The light tileset, the water colour, the script language, the
    // supported modes.
    skip(1 + 4 + 4 + 4);
    version = byIndex(GAME_DATA_VERSIONS, int32(), "Game Data Version");
  }
  const resolved = set === "default" ? (melee ? "melee" : "custom") : set;
  return `${resolved}-${version}`;
}

function byIndex<T>(ids: readonly T[], index: number, field: string): T {
  const id = ids[index];
  if (id === undefined) {
    throw new W3iError(
      `it declares the ${field} ${String(index)}, which reforged-map does not know`,
    );
  }
  return id;
}
