// The files of a map folder the readers read. A map folder is only read:
// nothing here writes to it (ADR 0006).

import fs from "node:fs";
import path from "node:path";

/** The map script the World Editor writes when the script language is Lua. */
export const MAP_SCRIPT = "war3map.lua";

/**
 * A map folder the package cannot read: it is missing, or it holds no
 * `war3map.lua`. Its message says what the author does in the World Editor
 * to fix it.
 *
 * @remarks
 * Everything else that goes wrong while reading a map folder is a warning,
 * never this error: the build goes on.
 */
export class MapFolderError extends Error {
  override name = "MapFolderError";
}

/** war3map.lua's text, its byte order mark removed. Throws a `MapFolderError`. */
export function readMapScript(mapFolder: string): string {
  if (!fs.statSync(mapFolder, { throwIfNoEntry: false })?.isDirectory()) {
    throw new MapFolderError(
      `Map folder not found: ${mapFolder}. Save the map as a folder from the World Editor (File > Save Map As, "Folder").`,
    );
  }
  const file = path.join(mapFolder, MAP_SCRIPT);
  if (!fs.statSync(file, { throwIfNoEntry: false })?.isFile()) {
    throw new MapFolderError(
      `${path.basename(mapFolder)} has no ${MAP_SCRIPT}: the map was not saved with Lua as the script language. ` +
        `In the World Editor, set Scenario > Map Options > Script Language to Lua and save the map again.`,
    );
  }
  return new TextDecoder("utf-8")
    .decode(fs.readFileSync(file))
    .replace(/^\uFEFF/, "");
}
