// The text of one Object data file, for git's textconv driver
// (`reforged-map textconv <file>`, src/cli.ts) and for a tool that shows a
// diff of Object data, such as the Studio (ADR 0015). Deterministic and
// line-oriented, so that `git diff` of two versions of a file shows which
// object and which field changed:
//
//   war3map.w3u, format version 3: 1 builtin, 1 custom
//   builtin hfoo
//     umvs int = 300
//   custom h000 from hfoo
//     unam string = "TRIGSTR_001"
//
// An object's line starts with a letter and a modification's with spaces,
// so git's default hunk header names the object above the change. Only the
// reader is imported, never the generators or reforged-builtins: git runs
// the driver once per file it diffs.

import path from "node:path";
import {
  EXTENSIONS,
  LEVELLED,
  ObjectDataError,
  readObjectDataFile,
} from "./object-data.js";
import type {
  Modification,
  ModificationSet,
  ObjectDataFile,
  ObjectEntry,
  ObjectKind,
} from "./model.js";

/** The Object kind of each extension, lower-cased. */
const KINDS_BY_EXTENSION: ReadonlyMap<string, ObjectKind> = new Map(
  Object.entries(EXTENSIONS).map(([kind, extension]) => [
    extension,
    kind as ObjectKind,
  ]),
);

/** The extension of an Object data file's name; a Skin file's name ends in `Skin` before it. */
const OBJECT_DATA_NAME = /\.(w3[a-z])$/i;

const STRICT_UTF8 = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
const ENCODER = new TextEncoder();

/**
 * Prints one Object data file as text, one line per object and per
 * modification, as the git `textconv` driver `reforged-map textconv`
 * prints it.
 *
 * @remarks
 * The Object kind and the Skin flag come from the end of `fileName`
 * (`war3mapSkin.w3a`, `/tmp/Xq3_war3map.w3u`), and the text names the file
 * by the name the game gives it, so that the temporary file names git
 * passes never show in a diff. The text is:
 *
 * - a header line: the file's name, its format version and the count of
 *   each table, `war3map.w3u, format version 3: 2 builtin, 1 custom`;
 * - one line per object, in file order, the Built-in objects first:
 *   `builtin hfoo` or `custom h000 from hfoo`, with its set count and flags
 *   when it does not hold one set of flag 0 (format version 3), and the
 *   four bytes of a Built-in object's Custom slot when they are not NUL;
 * - under it, one line per modification, indented by two spaces: the field
 *   id, the value type, the level and data pointer in the abilities,
 *   doodads and upgrades files, then `=` and the value, and the end marker
 *   when it is not the one the 3.0 World Editor writes, the object's own
 *   Rawcode (a Custom object's Custom Rawcode): `  amcs int level 1 data 0 = 80`,
 *   `  umvs int = 300, end "\u0000\u0000\u0000\u0000"`;
 * - a value as stored: an integer in decimal, a real as the shortest
 *   decimal that reads back to the same 32 bits (its bits in hex, `0x7fc00000`,
 *   when it is not a finite number), a string JSON-quoted, a `TRIGSTR_nnn`
 *   included, or its bytes in hex when they are not valid UTF-8;
 * - the bytes after the last table, if any, as a hex dump.
 *
 * A Rawcode or field id that is not four printable ASCII characters is
 * JSON-quoted (`"Crs\u0000"`). A file it cannot read (a name of no Object
 * kind, truncated, an unknown format version or value type, more than one
 * set) gives a line with the reason, then a hex dump of the whole file:
 * the function never throws on the bytes.
 *
 * @param bytes - The file's bytes.
 * @param fileName - The file's name or path, ending in the name the game
 *   gives it.
 * @returns The text, each line ending in LF.
 */
export function objectDataText(bytes: Uint8Array, fileName: string): string {
  const base = path.basename(fileName.replaceAll("\\", "/"));
  const match = OBJECT_DATA_NAME.exec(base);
  const kind = KINDS_BY_EXTENSION.get(match?.[1]?.toLowerCase() ?? "");
  if (match === null || kind === undefined) {
    return notRead(
      base,
      `its name ends in none of ${[...KINDS_BY_EXTENSION.keys()].map((extension) => `.${extension}`).join(", ")}`,
      bytes,
    );
  }
  const skin = /skin\.w3[a-z]$/i.test(base);
  const name = `war3map${skin ? "Skin" : ""}.${EXTENSIONS[kind]}`;
  let file: ObjectDataFile;
  try {
    file = readObjectDataFile(bytes, name, kind, skin);
  } catch (error) {
    if (!(error instanceof ObjectDataError)) throw error;
    return notRead(name, error.message, bytes);
  }
  return fileText(file);
}

function fileText(file: ObjectDataFile): string {
  const levelled = LEVELLED.has(file.kind);
  const lines = [
    `${file.name}, format version ${String(file.version)}: ${String(file.original.length)} builtin, ${String(file.custom.length)} custom`,
  ];
  for (const entry of [...file.original, ...file.custom]) {
    lines.push(objectLine(entry, file.version));
    // The 3.0 World Editor ends each modification with the object's own
    // Rawcode, a Custom object's included (test/fixtures/editor-objects.md).
    const end = entry.custom ?? entry.original;
    for (const set of entry.sets) {
      for (const modification of set.modifications) {
        lines.push(`  ${modificationText(modification, levelled, end)}`);
      }
    }
  }
  if (file.trailing !== undefined) {
    lines.push(
      `trailing ${String(file.trailing.length)} bytes`,
      ...hexDump(file.trailing).map((line) => `  ${line}`),
    );
  }
  return lines.map((line) => `${line}\n`).join("");
}

function objectLine(entry: ObjectEntry, version: number): string {
  let line =
    entry.custom === undefined
      ? `builtin ${rawcodeText(entry.original)}`
      : `custom ${rawcodeText(entry.custom)} from ${rawcodeText(entry.original)}`;
  if (entry.customSlot !== undefined) {
    line += `, slot ${rawcodeText(entry.customSlot)}`;
  }
  if (version >= 3 && !oneSetOfFlagZero(entry.sets)) {
    const count = entry.sets.length;
    line += `, ${String(count)} ${count === 1 ? "set" : "sets"}`;
    if (count > 0) {
      const flags = entry.sets.map(({ flag }) => String(flag ?? 0));
      line += `, ${count === 1 ? "flag" : "flags"} ${flags.join(" ")}`;
    }
  }
  return line;
}

function oneSetOfFlagZero(sets: readonly ModificationSet[]): boolean {
  return sets.length === 1 && sets[0]?.flag === 0;
}

function modificationText(
  modification: Modification,
  levelled: boolean,
  conventionalEnd: string,
): string {
  let text = `${rawcodeText(modification.field)} ${modification.type}`;
  if (levelled) {
    text += ` level ${String(modification.level ?? 0)} data ${String(modification.dataPointer ?? 0)}`;
  }
  text += ` = ${valueText(modification)}`;
  if (modification.end !== conventionalEnd) {
    text += `, end ${rawcodeText(modification.end)}`;
  }
  return text;
}

function valueText(modification: Modification): string {
  const { value } = modification;
  if (typeof value === "string") {
    const bytes = modification.bytes ?? ENCODER.encode(value);
    let text: string;
    try {
      text = STRICT_UTF8.decode(bytes);
    } catch {
      return `0x${hex(bytes, "")}`;
    }
    return quote(text);
  }
  if (modification.type === "int") return String(value);
  return realText(value, modification.bits);
}

/** A 32-bit real as the shortest decimal that reads back to the same bits; its bits in hex when it is not finite. */
function realText(value: number, bits: number | undefined): string {
  if (!Number.isFinite(value)) {
    return `0x${(bits ?? float32Bits(value)).toString(16).padStart(8, "0")}`;
  }
  if (Object.is(value, -0)) return "-0";
  for (let precision = 1; precision < 9; precision++) {
    const candidate = Number(value.toPrecision(precision));
    if (Math.fround(candidate) === value) return String(candidate);
  }
  return String(Number(value.toPrecision(9)));
}

function float32Bits(value: number): number {
  const view = new DataView(new ArrayBuffer(4));
  view.setFloat32(0, value, true);
  return view.getUint32(0, true);
}

/** A Rawcode or field id as is when it is four printable ASCII characters, JSON-quoted otherwise. */
function rawcodeText(rawcode: string): string {
  return /^[\x21-\x7e]{4}$/.test(rawcode) ? rawcode : quote(rawcode);
}

/** JSON-quoted, with every character a reader cannot see (a control, a format character such as a byte order mark, a separator) escaped. */
function quote(text: string): string {
  return JSON.stringify(text).replace(/[\p{C}\p{Zl}\p{Zp}]/gu, (character) =>
    Array.from(
      { length: character.length },
      (_, index) =>
        `\\u${character.charCodeAt(index).toString(16).padStart(4, "0")}`,
    ).join(""),
  );
}

function notRead(name: string, reason: string, bytes: Uint8Array): string {
  return [`${name}: not read (${reason})`, ...hexDump(bytes)]
    .map((line) => `${line}\n`)
    .join("");
}

function hex(bytes: Uint8Array, separator: string): string {
  return [...bytes]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join(separator);
}

/** The bytes as `hexdump -C` prints them: an offset, sixteen bytes in hex, and those bytes as ASCII. */
function hexDump(bytes: Uint8Array): string[] {
  const lines: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += 16) {
    const row = bytes.subarray(offset, offset + 16);
    const columns = [hex(row.subarray(0, 8), " "), hex(row.subarray(8), " ")]
      .filter((half) => half !== "")
      .join("  ");
    const ascii = String.fromCharCode(
      ...[...row].map((byte) => (byte >= 0x20 && byte < 0x7f ? byte : 0x2e)),
    );
    lines.push(
      `${offset.toString(16).padStart(8, "0")}  ${columns.padEnd(48)}  |${ascii}|`,
    );
  }
  return lines;
}
