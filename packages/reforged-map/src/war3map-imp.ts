// war3map.imp, the map's list of imported files, as far as the locale
// tables need it (docs/research/locales.md, #711, #712): the 3.0.1 World
// Editor lists each `_Locales/<locale>.w3mod/war3map.wts` there, so a writer
// that adds or removes a locale table edits the list the way the editor's
// next save would, or that save changes war3map.imp.
//
// Format 1, little-endian: the format (uint32, 1), the count of entries
// (uint32), then per entry a flag byte and the path, NUL-terminated. The
// editor's save of test/fixtures/editor-locales.w3m lists the locale tables
// with flag 0x15, sorted by path. Only format 1 is read; every entry and
// any trailing byte is kept as read.

import { Buffer } from "node:buffer";
import type { Locale } from "./model.js";
import { localeTablePath } from "./war3map-wts.js";

/** The import list of a map folder. */
export const IMP_FILE = "war3map.imp";

/** The flag the 3.0.1 World Editor gives a locale table's entry. */
const LOCALE_TABLE_FLAG = 0x15;

/** The only format of war3map.imp this package reads. */
const IMP_FORMAT = 1;

/** One entry of war3map.imp: its flag, and its path read one byte per character. */
interface ImportEntry {
  readonly flag: number;
  readonly path: string;
}

/** war3map.imp as read: its entries in file order, and the bytes after them. */
interface ImportList {
  readonly entries: readonly ImportEntry[];
  readonly trailing: Uint8Array;
}

/** The import list of war3map.imp's bytes; undefined when it is not one of format 1. */
function parseImp(bytes: Uint8Array): ImportList | undefined {
  if (bytes.length < 8) return undefined;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.length);
  if (view.getUint32(0, true) !== IMP_FORMAT) return undefined;
  const count = view.getUint32(4, true);
  const entries: ImportEntry[] = [];
  let offset = 8;
  for (let index = 0; index < count; index++) {
    if (offset >= bytes.length) return undefined;
    const end = bytes.indexOf(0, offset + 1);
    if (end === -1) return undefined;
    entries.push({
      flag: bytes[offset],
      path: Buffer.from(bytes.subarray(offset + 1, end)).toString("latin1"),
    });
    offset = end + 1;
  }
  return { entries, trailing: bytes.slice(offset) };
}

function encodeImp(list: ImportList): Uint8Array {
  const paths = list.entries.map((entry) => Buffer.from(entry.path, "latin1"));
  const size =
    8 +
    paths.reduce((total, bytes) => total + bytes.length + 2, 0) +
    list.trailing.length;
  const bytes = new Uint8Array(size);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, IMP_FORMAT, true);
  view.setUint32(4, list.entries.length, true);
  let offset = 8;
  list.entries.forEach((entry, index) => {
    bytes[offset] = entry.flag;
    bytes.set(paths[index], offset + 1);
    offset += paths[index].length + 2;
  });
  bytes.set(list.trailing, offset);
  return bytes;
}

/** The locale whose table an entry's path names, in either separator and any case; undefined for another file. */
function localeOf(entry: ImportEntry): string | undefined {
  return /^_Locales[\\/]([A-Za-z]{4})\.w3mod[\\/]war3map\.wts$/i.exec(
    entry.path,
  )?.[1];
}

/**
 * The bytes of war3map.imp listing exactly the given locale tables, the way
 * the World Editor lists them: each other entry kept where it is, a locale
 * table's entry dropped when its locale has no table, and a new one, flag
 * 0x15, inserted in path order among the locale tables' entries (appended
 * when there are none). Undefined when the list ends empty, since the editor
 * writes no war3map.imp for a map without imports; `"unreadable"` when the
 * bytes read are not an import list of format 1.
 *
 * @param read - The bytes of war3map.imp as read; undefined when the map
 *   folder has none.
 * @param locales - The locales that have a table.
 */
export function importListWith(
  read: Uint8Array | undefined,
  locales: ReadonlySet<Locale>,
): Uint8Array | undefined | "unreadable" {
  const list =
    read === undefined
      ? { entries: [], trailing: new Uint8Array() }
      : parseImp(read);
  if (list === undefined) return "unreadable";
  const listed = new Set<string>();
  const entries = list.entries.filter((entry) => {
    const locale = localeOf(entry);
    if (locale === undefined) return true;
    const kept = locales.has(locale as Locale) && !listed.has(locale);
    listed.add(locale);
    return kept;
  });
  for (const locale of [...locales].sort()) {
    if (listed.has(locale)) continue;
    const entry = { flag: LOCALE_TABLE_FLAG, path: localeTablePath(locale) };
    const after = entries.findIndex(
      (other) => localeOf(other) !== undefined && other.path > entry.path,
    );
    const lastLocale = entries.findLastIndex(
      (other) => localeOf(other) !== undefined,
    );
    entries.splice(
      after !== -1
        ? after
        : lastLocale !== -1
          ? lastLocale + 1
          : entries.length,
      0,
      entry,
    );
  }
  if (entries.length === 0 && list.trailing.length === 0) return undefined;
  return encodeImp({ entries, trailing: list.trailing });
}
