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
// lines are joined with LF. The file is kept as read, losslessly, for the
// writer of ADR 0015 (src/object-data-writer.ts): its blocks as their raw
// lines, the bytes between them, its byte order mark and its line ends.
//
// A locale's translation of the strings is a war3map.wts of its own,
// `_Locales/<locale>.w3mod/war3map.wts`, read the same way: a whole copy of
// the root table under the same numbers, which replaces it in that locale
// (docs/research/locales.md, #711).

import { readMapFile } from "./map-folder.js";
import {
  LOCALES,
  type Locale,
  type MapFolderModel,
  type WtsBlock,
  type WtsFile,
} from "./model.js";

/** The strings file of a map folder. */
export const WTS_FILE = "war3map.wts";

/** The folder of a map folder that holds a folder per locale. */
export const LOCALES_FOLDER = "_Locales";

/** The path of a locale's string table in the map folder, with `/`: `_Locales/ptBR.w3mod/war3map.wts`. */
export function localeTablePath(locale: Locale): string {
  return `${LOCALES_FOLDER}/${locale}.w3mod/${WTS_FILE}`;
}

const UTF8 = new TextDecoder("utf-8", { fatal: false, ignoreBOM: true });
const LF = 0x0a;
const CR = 0x0d;

/**
 * Reads war3map.wts into the model: the file, its bytes into the model's
 * files, and its strings by number. A map folder without one has none.
 */
export function readWar3mapWts(mapFolder: string, model: MapFolderModel): void {
  const bytes = readMapFile(mapFolder, WTS_FILE);
  if (bytes === undefined) return;
  model.files.set(WTS_FILE, bytes);
  model.wts = parseWts(bytes);
  for (const block of model.wts.blocks) {
    model.strings.set(block.number, block.text);
  }
}

/**
 * Reads the string table of each locale that has one into the model: the
 * table, and its bytes into the model's files by its path. A folder of
 * another name than a locale's is not read.
 */
export function readLocaleTables(
  mapFolder: string,
  model: MapFolderModel,
): void {
  for (const locale of LOCALES) {
    const name = localeTablePath(locale);
    const bytes = readMapFile(mapFolder, name);
    if (bytes === undefined) continue;
    model.files.set(name, bytes);
    model.locales.set(locale, parseWts(bytes));
  }
}

/** One line of war3map.wts: where it starts and ends, its line end included, and its text without it. */
interface Line {
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

/** war3map.wts as its blocks and the bytes between them; every byte is in exactly one part. */
export function parseWts(bytes: Uint8Array): WtsFile {
  const bom = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
  const start = bom ? 3 : 0;
  const firstLf = bytes.indexOf(LF, start);
  const lfOnly =
    firstLf !== -1 && !(firstLf > start && bytes[firstLf - 1] === CR);
  const lines = splitLines(bytes, start);
  const slice = (from: number, to: number) => bytes.slice(from, to);

  const blocks: WtsBlock[] = [];
  let pending = start;
  let index = 0;
  while (index < lines.length) {
    const header = lines[index];
    const number = /^STRING\s+(\d+)\s*$/.exec(header.text)?.[1];
    index++;
    if (number === undefined) continue;
    while (index < lines.length && lines[index].text.startsWith("//")) index++;
    const open = lines.at(index);
    if (open?.text.trim() !== "{") continue;
    index++;
    const bodyStart = index;
    while (index < lines.length && lines[index].text !== "}") index++;
    const close = lines.at(index);
    const bodyEnd = close?.start ?? bytes.length;
    blocks.push({
      number: Number(number),
      before: slice(pending, header.start),
      header: slice(header.start, header.end),
      comment: slice(header.end, open.start),
      open: slice(open.start, open.end),
      body: slice(open.end, bodyEnd),
      close:
        close === undefined ? new Uint8Array() : slice(close.start, close.end),
      text: lines
        .slice(bodyStart, index)
        .map((line) => line.text)
        .join("\n"),
    });
    pending = close?.end ?? bytes.length;
    index++;
  }
  return {
    bom,
    eol: lfOnly ? "\n" : "\r\n",
    blocks,
    after: slice(pending, bytes.length),
  };
}

/**
 * The lines of the bytes from `start`, split at each LF, a CR before it
 * part of the line end, as `text.split(/\r?\n/)` splits the decoded text:
 * a file that ends with a line end has a last, empty line.
 */
function splitLines(bytes: Uint8Array, start: number): Line[] {
  const lines: Line[] = [];
  let from = start;
  for (;;) {
    const lf = bytes.indexOf(LF, from);
    if (lf === -1) {
      lines.push({
        start: from,
        end: bytes.length,
        text: UTF8.decode(bytes.subarray(from)),
      });
      return lines;
    }
    const contentEnd = lf > from && bytes[lf - 1] === CR ? lf - 1 : lf;
    lines.push({
      start: from,
      end: lf + 1,
      text: UTF8.decode(bytes.subarray(from, contentEnd)),
    });
    from = lf + 1;
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
