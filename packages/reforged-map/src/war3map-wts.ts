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

import { readMapFile } from "./map-folder.js";
import type { MapFolderModel, WtsBlock, WtsFile } from "./model.js";

/** The strings file of a map folder. */
export const WTS_FILE = "war3map.wts";

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

/** One line of war3map.wts: where it starts and ends, its line end included, and its text without it. */
interface Line {
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

/** war3map.wts as its blocks and the bytes between them; every byte is in exactly one part. */
function parseWts(bytes: Uint8Array): WtsFile {
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
