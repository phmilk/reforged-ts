// The reader of war3map.wts, the map's strings, which a `TRIGSTR_nnn` value
// of the Object data names by its number:
//
//   STRING 7
//   // an optional comment line
//   {
//   Captain
//   }
//
// with or without a byte order mark, with CRLF or LF line ends. A string's
// lines are joined with LF.

import { readMapFile } from "./map-folder.js";
import type { MapFolderModel } from "./model.js";

/** The strings file of a map folder. */
export const WTS_FILE = "war3map.wts";

/** Reads war3map.wts into the model's strings; a map folder without one has none. */
export function readWar3mapWts(mapFolder: string, model: MapFolderModel): void {
  const bytes = readMapFile(mapFolder, WTS_FILE);
  if (bytes === undefined) return;
  const lines = new TextDecoder("utf-8")
    .decode(bytes)
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/);
  let index = 0;
  while (index < lines.length) {
    const header = /^STRING\s+(\d+)\s*$/.exec(lines[index]);
    index++;
    if (header === null) continue;
    while (index < lines.length && lines[index].startsWith("//")) index++;
    if (lines[index]?.trim() !== "{") continue;
    index++;
    const body: string[] = [];
    while (index < lines.length && lines[index] !== "}") {
      body.push(lines[index]);
      index++;
    }
    index++;
    model.strings.set(Number(header[1]), body.join("\n"));
  }
}

/**
 * The text of a string value: a `TRIGSTR_nnn` resolved through the model's
 * strings, `undefined` when war3map.wts lacks it; any other value as is.
 */
export function resolveString(
  value: string,
  model: MapFolderModel,
): string | undefined {
  const reference = /^TRIGSTR_(\d+)$/.exec(value);
  if (reference === null) return value;
  return model.strings.get(Number(reference[1]));
}
