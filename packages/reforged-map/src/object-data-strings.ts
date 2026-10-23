// The strings of war3map.wts an edit of a localizable field writes (#638),
// in the Editor form, the form the 3.0 World Editor saves (#475):
//
// - a value is a `TRIGSTR_nnn` reference, zero-padded to three digits;
// - a new string's number is one above the highest of every `STRING n` and
//   every `TRIGSTR` the Object data references, an orphan's and a missing
//   string's included, and of every `TRIGSTR` the map folder's other files
//   hold: a gap is never filled;
// - a string is free, for a changed text to go into it or for an edit that
//   leaves it unreferenced to remove it, when no other Object data
//   modification references its number and no other file of the map
//   folder holds `TRIGSTR_n` in any zero padding (#484);
// - a new block is appended (its number is the highest, so a sorted file
//   stays sorted), with the file's own line ends, its comment line, and a
//   blank line after it, as the editor writes every block;
// - a translation goes into the locale's table, `_Locales/<locale>.w3mod/
//   war3map.wts`, under the same number: a table replaces war3map.wts whole
//   in its locale, so each table is kept a whole copy of it, a string the
//   table does not translate in its default text, and a locale that
//   translates nothing has no table (docs/research/locales.md, #711).
//
// Only the blocks an edit changes are touched: every other byte of
// war3map.wts and of a locale table stays as read.

import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import type {
  Locale,
  MapFolderModel,
  Modification,
  WtsBlock,
  WtsFile,
} from "./model.js";
import { encodeWts } from "./object-data-writer.js";
import { WTS_FILE } from "./war3map-wts.js";

const ENCODER = new TextEncoder();
const DECODER = new TextDecoder("utf-8", { fatal: false, ignoreBOM: true });
const LF = 0x0a;
const CR = 0x0d;

/** A value that is a `TRIGSTR` reference, in any zero padding, as the readers resolve one. */
const REFERENCE = /^TRIGSTR_(\d+)$/;

/** A `TRIGSTR` reference anywhere in a file's bytes, read one byte per character. */
const REFERENCE_IN_FILE = /TRIGSTR_(\d+)/g;

/** The number a modification's value references, when it is a `TRIGSTR`. */
export function referencedNumber(
  modification: Modification,
): number | undefined {
  if (typeof modification.value !== "string") return undefined;
  const number = REFERENCE.exec(modification.value)?.[1];
  return number === undefined ? undefined : Number(number);
}

/** The value that references the string of a number, as the World Editor writes it: `TRIGSTR_007`. */
export function reference(number: number): string {
  return `TRIGSTR_${String(number).padStart(3, "0")}`;
}

/**
 * The numbers of the `TRIGSTR` references the files of the map folder hold
 * besides the Object data the readers read and war3map.wts: war3map.lua,
 * war3map.w3i, war3map.wtg, an Object data file the readers left out. Its
 * top-level files only, each read whole as bytes.
 */
export function foreignReferences(
  mapFolder: string,
  model: MapFolderModel,
): Set<number> {
  const read = new Set(model.objectData.map((file) => file.name));
  const numbers = new Set<number>();
  for (const entry of fs.readdirSync(mapFolder, { withFileTypes: true })) {
    if (!entry.isFile() || entry.name === WTS_FILE || read.has(entry.name)) {
      continue;
    }
    const bytes =
      model.files.get(entry.name) ??
      fs.readFileSync(path.join(mapFolder, entry.name));
    const text = Buffer.from(
      bytes.buffer,
      bytes.byteOffset,
      bytes.length,
    ).toString("latin1");
    for (const match of text.matchAll(REFERENCE_IN_FILE)) {
      numbers.add(Number(match[1]));
    }
  }
  return numbers;
}

/** How many modifications of the model's Object data reference each number, the `except` ones left out. */
export function objectDataReferences(
  model: MapFolderModel,
  except: readonly Modification[] = [],
): Map<number, number> {
  const counts = new Map<number, number>();
  for (const file of model.objectData) {
    for (const entry of [...file.original, ...file.custom]) {
      for (const set of entry.sets) {
        for (const modification of set.modifications) {
          if (except.includes(modification)) continue;
          const number = referencedNumber(modification);
          if (number !== undefined) {
            counts.set(number, (counts.get(number) ?? 0) + 1);
          }
        }
      }
    }
  }
  return counts;
}

/**
 * The number of a new string: one above every `STRING n` of war3map.wts
 * and every `TRIGSTR` of the Object data, and of the map folder's other
 * files (`foreign`), so that a reference to a missing string never comes to
 * name the new one.
 */
export function newNumber(
  model: MapFolderModel,
  foreign: ReadonlySet<number>,
): number {
  const numbers = [
    ...(model.wts?.blocks ?? []).map((block) => block.number),
    ...[...model.locales.values()].flatMap((table) =>
      table.blocks.map((block) => block.number),
    ),
    ...objectDataReferences(model).keys(),
    ...foreign,
  ];
  return numbers.reduce((highest, number) => Math.max(highest, number), 0) + 1;
}

/** Whether war3map.wts holds a block of the number. */
export function hasString(model: MapFolderModel, number: number): boolean {
  return model.wts?.blocks.some((block) => block.number === number) ?? false;
}

/**
 * Writes a string into the model's war3map.wts, with its comment line: into
 * the last block of its number, its comment and body replaced and every
 * other byte of it kept, when `inPlace`; else into a new block appended. A
 * map folder without war3map.wts gets one, with a byte order mark and CRLF.
 *
 * Then into the table of each locale, which must stay a whole copy of
 * war3map.wts (docs/research/locales.md): its translation, else the default
 * text, into each table the map folder has, and into a new table, a copy
 * of war3map.wts, for a locale that has a translation and no table yet.
 * Each table written gets every string of war3map.wts it lacks, with its
 * default text; a table that then translates nothing goes, as the editor
 * leaves a locale without translations without a file.
 */
export function putString(
  model: MapFolderModel,
  number: number,
  text: string,
  comment: string,
  inPlace: boolean,
  translations: Readonly<Partial<Record<Locale, string>>> = {},
): void {
  const root = putBlock(
    model.wts ?? emptyWts(),
    number,
    text,
    comment,
    inPlace,
  );
  model.wts = root;
  model.strings.set(number, text);
  const locales = new Set([
    ...model.locales.keys(),
    ...(Object.keys(translations) as Locale[]),
  ]);
  for (const locale of locales) {
    const wanted = translations[locale] ?? text;
    let table = completed(
      model.locales.get(locale) ?? {
        ...emptyWts(),
        bom: root.bom,
        eol: root.eol,
      },
      root,
    );
    const held = table.blocks.findLast((block) => block.number === number);
    if (held?.text !== wanted) {
      table = putBlock(table, number, wanted, comment, held !== undefined);
    }
    setLocaleTable(model, locale, table);
  }
}

/**
 * Removes every block of the number from the model's war3map.wts, with the
 * blank lines before it, and from the table of each locale; the bytes
 * before a first block, the head of the file, are kept, and so is anything
 * but blank lines between blocks. A locale table that then translates
 * nothing goes.
 */
export function removeString(model: MapFolderModel, number: number): void {
  if (model.wts !== undefined) model.wts = removeBlocks(model.wts, number);
  model.strings.delete(number);
  for (const [locale, table] of model.locales) {
    if (!table.blocks.some((block) => block.number === number)) continue;
    setLocaleTable(model, locale, removeBlocks(table, number));
  }
}

/** The text of each locale whose table translates the string of a number: its last block of the number, when its text is not the default text. */
export function translationsOf(
  model: MapFolderModel,
  number: number,
): Partial<Record<Locale, string>> {
  const text = model.strings.get(number);
  const translations: Partial<Record<Locale, string>> = {};
  if (text === undefined) return translations;
  for (const locale of [...model.locales.keys()].sort()) {
    const block = model.locales
      .get(locale)
      ?.blocks.findLast((other) => other.number === number);
    if (block !== undefined && block.text !== text) {
      translations[locale] = block.text;
    }
  }
  return translations;
}

/** Puts a locale's table into the model, or drops it when it translates nothing. */
function setLocaleTable(
  model: MapFolderModel,
  locale: Locale,
  table: WtsFile,
): void {
  const translates = table.blocks.some(
    (block) => model.strings.get(block.number) !== block.text,
  );
  if (translates) model.locales.set(locale, table);
  else model.locales.delete(locale);
}

/** A locale table holding every string of war3map.wts: those it lacks appended in number order, with their default text and comment. */
function completed(table: WtsFile, root: WtsFile): WtsFile {
  const held = new Set(table.blocks.map((block) => block.number));
  const missing = new Map<number, WtsBlock>();
  for (const block of root.blocks) {
    if (!held.has(block.number)) missing.set(block.number, block);
  }
  let result = table;
  for (const block of [...missing.values()].sort(
    (a, b) => a.number - b.number,
  )) {
    result = putBlock(
      result,
      block.number,
      block.text,
      DECODER.decode(block.comment)
        .replace(/\r?\n$/, "")
        .split(/\r?\n/)
        .join(result.eol),
      false,
    );
  }
  return result;
}

/** A war3map.wts with no block, a byte order mark and CRLF, as the World Editor writes one. */
function emptyWts(): WtsFile {
  return { bom: true, eol: "\r\n", blocks: [], after: new Uint8Array() };
}

/**
 * A war3map.wts with a string written, with its comment lines (none when
 * empty): into the last block of its number, its comment and body replaced
 * and every other byte of it kept, when `inPlace`; else into a new block
 * appended.
 */
function putBlock(
  wts: WtsFile,
  number: number,
  text: string,
  comment: string,
  inPlace: boolean,
): WtsFile {
  const { eol } = wts;
  const lines = {
    comment: ENCODER.encode(comment === "" ? "" : `${comment}${eol}`),
    body: ENCODER.encode(
      text
        .split("\n")
        .map((line) => line + eol)
        .join(""),
    ),
    close: ENCODER.encode(`}${eol}`),
  };
  const index = inPlace
    ? wts.blocks.findLastIndex((block) => block.number === number)
    : -1;
  if (index !== -1) {
    const block = wts.blocks[index];
    return {
      ...wts,
      blocks: wts.blocks.map((other, at) =>
        at === index
          ? {
              ...block,
              comment: lines.comment,
              body: lines.body,
              close: block.close.length > 0 ? block.close : lines.close,
              text,
            }
          : other,
      ),
    };
  }
  const block: WtsBlock = {
    number,
    before: concat(wts.after, separator(wts)),
    header: ENCODER.encode(`STRING ${String(number)}${eol}`),
    comment: lines.comment,
    open: ENCODER.encode(`{${eol}`),
    body: lines.body,
    close: lines.close,
    text,
  };
  return { ...wts, blocks: [...wts.blocks, block], after: ENCODER.encode(eol) };
}

/** A war3map.wts without the blocks of a number, nor the blank lines before them. */
function removeBlocks(wts: WtsFile, number: number): WtsFile {
  const blocks = [...wts.blocks];
  let { after } = wts;
  for (let index = blocks.length - 1; index >= 0; index--) {
    const { number: other, before } = blocks[index];
    if (other !== number) continue;
    blocks.splice(index, 1);
    // What the removed block leaves of the bytes before it goes before what
    // followed it: all of them before a first block, else all but blank lines.
    const kept = index === 0 || !isBlank(before) ? before : new Uint8Array();
    const next = blocks.at(index);
    const following = next === undefined ? after : next.before;
    const merged =
      index === 0 && isBlank(following) ? kept : concat(kept, following);
    if (next === undefined) after = merged;
    else blocks[index] = { ...next, before: merged };
  }
  return { ...wts, blocks, after };
}

/**
 * The line ends a new block needs after the file's last bytes so far: one
 * to end its last line, and a blank line, none in a file that is empty.
 */
function separator(wts: WtsFile): Uint8Array {
  const bytes = encodeWts({ ...wts, bom: false });
  if (bytes.length === 0) return new Uint8Array();
  const endsLine = bytes.at(-1) === LF;
  const endsBlank =
    endsLine &&
    (bytes.at(-2) === LF || (bytes.at(-2) === CR && bytes.at(-3) === LF));
  return ENCODER.encode(
    endsBlank ? "" : endsLine ? wts.eol : wts.eol + wts.eol,
  );
}

/** Whether the bytes are line ends alone, or none. */
function isBlank(bytes: Uint8Array): boolean {
  return bytes.every((byte) => byte === LF || byte === CR);
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  if (a.length === 0) return b;
  if (b.length === 0) return a;
  const bytes = new Uint8Array(a.length + b.length);
  bytes.set(a);
  bytes.set(b, a.length);
  return bytes;
}
