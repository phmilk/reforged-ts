/**
 * The Game Data Set and the Game Data Version a staged map declares in its
 * `war3map.w3i`, which a Probe run may choose (`--game-data-set`,
 * `--game-data-version`) without changing the committed map folder (#575).
 * The fields are located as HiveWE's reader of the format locates them
 * (`src/base/map_info.ixx`), formats 31 to 39: the Game Data Version came
 * with format 31, and the World Editor of 3.0 saves format 39.
 */
import { AuthorError } from "./errors.js";

/** The Game Data Sets, by the index the file stores, as the World Editor of 3.0 lists them in its map options. */
export const GAME_DATA_SETS = ["default", "custom", "melee"] as const;
export type GameDataSet = (typeof GAME_DATA_SETS)[number];

/** The Game Data Versions, by the index the file stores: Reign of Chaos, The Frozen Throne, Forsaken Kingdom. */
export const GAME_DATA_VERSIONS = ["roc", "tft", "fk"] as const;
export type GameDataVersion = (typeof GAME_DATA_VERSIONS)[number];

/** The World Editor's label of each Game Data Set and Game Data Version. */
const LABELS: Readonly<Record<GameDataSet | GameDataVersion, string>> = {
  default: "Default",
  custom: "Custom",
  melee: "Melee",
  roc: "Reign of Chaos",
  tft: "The Frozen Throne",
  fk: "Forsaken Kingdom",
};

/** What a build sets in the staged map; a field left out keeps the map's own. */
export interface GameData {
  set?: GameDataSet;
  version?: GameDataVersion;
}

/** The command-line option of each field, without its `--`. */
export const GAME_DATA_OPTIONS = {
  set: "game-data-set",
  version: "game-data-version",
} as const;

/** The options of `GAME_DATA_OPTIONS` as `parseArgs` takes them. */
export const GAME_DATA_ARGS = {
  [GAME_DATA_OPTIONS.set]: { type: "string" },
  [GAME_DATA_OPTIONS.version]: { type: "string" },
} as const;

/** The Game data of the options `parseArgs` read with `GAME_DATA_ARGS`. */
export function gameDataOf(
  values: Readonly<Record<string, unknown>>,
): GameData {
  const option = (name: string) => {
    const value = values[name];
    return typeof value === "string" ? value : undefined;
  };
  return parseGameData(
    option(GAME_DATA_OPTIONS.set),
    option(GAME_DATA_OPTIONS.version),
  );
}

/** The first format that stores the Game Data Version. */
const FIRST_FORMAT = 31;
/** The last format, the World Editor of 3.0's, which adds the loading screen's source and the fog's linear fields. */
const LAST_FORMAT = 39;

/** The Game Data Set and the Game Data Version a `war3map.w3i` declares. */
export function readGameData(w3i: Uint8Array): Required<GameData> {
  const { view, set, version } = locate(w3i);
  return {
    set: byIndex(GAME_DATA_SETS, view.getInt32(set, true), "Game Data Set"),
    version: byIndex(
      GAME_DATA_VERSIONS,
      view.getInt32(version, true),
      "Game Data Version",
    ),
  };
}

/** A copy of `w3i` declaring what `gameData` sets, every other byte unchanged. */
export function writeGameData(w3i: Uint8Array, gameData: GameData): Uint8Array {
  const copy = w3i.slice();
  const { view, set, version } = locate(copy);
  if (gameData.set !== undefined) {
    view.setInt32(set, GAME_DATA_SETS.indexOf(gameData.set), true);
  }
  if (gameData.version !== undefined) {
    view.setInt32(version, GAME_DATA_VERSIONS.indexOf(gameData.version), true);
  }
  return copy;
}

/** The Game data of the command line's options: an id each, or nothing for the map's own. */
export function parseGameData(
  set: string | undefined,
  version: string | undefined,
): GameData {
  return {
    ...(set !== undefined && {
      set: oneOf(GAME_DATA_SETS, set, `--${GAME_DATA_OPTIONS.set}`),
    }),
    ...(version !== undefined && {
      version: oneOf(
        GAME_DATA_VERSIONS,
        version,
        `--${GAME_DATA_OPTIONS.version}`,
      ),
    }),
  };
}

/** What a build's line adds for its Game data: nothing when it keeps the map's own. */
export function gameDataMessage(gameData: GameData): string {
  const parts = [
    gameData.set !== undefined && `the Game Data Set ${LABELS[gameData.set]}`,
    gameData.version !== undefined &&
      `the Game Data Version ${LABELS[gameData.version]}`,
  ].filter((part) => part !== false);
  return parts.length === 0 ? "" : ` under ${parts.join(" and ")}`;
}

function oneOf<T extends string>(
  ids: readonly T[],
  value: string,
  flag: string,
): T {
  if (!(ids as readonly string[]).includes(value)) {
    throw new AuthorError(
      `${flag} is "${value}": it takes one of ${ids.join(", ")}.`,
    );
  }
  return value as T;
}

function byIndex<T>(ids: readonly T[], index: number, field: string): T {
  const id = ids[index];
  if (id === undefined) {
    throw new AuthorError(
      `war3map.w3i declares the ${field} ${String(index)}, which the runner does not know.`,
    );
  }
  return id;
}

/** The offsets of the two fields, read through the fields before them. */
function locate(w3i: Uint8Array): {
  view: DataView;
  set: number;
  version: number;
} {
  const view = new DataView(w3i.buffer, w3i.byteOffset, w3i.byteLength);
  let offset = 0;
  const need = (bytes: number) => {
    if (offset + bytes > w3i.byteLength) {
      throw new AuthorError(
        "war3map.w3i ends before its Game Data Version: the file is cut short.",
      );
    }
  };
  const skip = (bytes: number) => {
    need(bytes);
    offset += bytes;
  };
  const skipString = () => {
    const end = w3i.indexOf(0, offset);
    skip((end === -1 ? w3i.byteLength : end) - offset + 1);
  };

  need(4);
  const format = view.getInt32(0, true);
  if (format < FIRST_FORMAT || format > LAST_FORMAT) {
    throw new AuthorError(
      `war3map.w3i is of format ${String(format)}: the runner sets the Game data of formats ${String(FIRST_FORMAT)} to ${String(LAST_FORMAT)}. Save the map folder with the World Editor of 3.0.`,
    );
  }
  // Format, saves, editor version, and the game version's four parts.
  skip(4 * 7);
  // Name, author, description, recommended players.
  for (let i = 0; i < 4; i++) skipString();
  // Camera bounds (8 floats) and their complements (4 integers), playable
  // width and height, flags, then the main tileset (1 byte).
  skip(4 * 8 + 4 * 4 + 4 * 3 + 1);
  // The loading screen's number, from 39 its source, then its model, text,
  // title and subtitle.
  skip(format >= LAST_FORMAT ? 8 : 4);
  for (let i = 0; i < 4; i++) skipString();
  const set = offset;
  skip(4);
  // The prologue's model, text, title and subtitle.
  for (let i = 0; i < 4; i++) skipString();
  // Fog style, its start and end heights and density, its colour (4
  // bytes), the weather, and from 39 six more fog fields.
  skip(4 * 6 + (format >= LAST_FORMAT ? 4 * 6 : 0));
  // The sound environment, the light tileset (1 byte), the water colour
  // (4 bytes), the script language, the supported modes.
  skipString();
  skip(1 + 4 + 4 + 4);
  const version = offset;
  skip(4);
  return { view, set, version };
}
