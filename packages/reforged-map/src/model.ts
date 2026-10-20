// The model of a map folder: what the readers fill and the renderers write
// from. It holds the Editor globals and the Object data. The war3map.lua
// reader declares every global (the list of globals is what exists at run
// time); a later reader, such as the war3map.wtg one, refines the type of
// what the first one declared, and adds its warnings. The Object data and
// war3map.wts readers keep every file as read, losslessly: the writer
// (src/object-data-writer.ts, ADR 0015) gives back the bytes they read. Not
// exported from the package.

/** Where an Editor global comes from: `gg_` (placed or created in the editor) or `udg_` (the Variable Editor). */
export type EditorGlobalOrigin = "gg" | "udg";

/** One Editor global of the map folder. */
export interface EditorGlobal {
  /** Its Lua name, prefix included (`udg_SpawnType`). */
  readonly name: string;
  readonly origin: EditorGlobalOrigin;
  /** The TypeScript type of its declaration, which a later reader may refine. */
  type: string;
  /** The Lua expression the stub assigns: `nil`, or the header's literal. */
  readonly stubValue: string;
  /** Whether war3map.lua declares it as an array (`__jarray(...)` or `{}`). */
  readonly array: boolean;
}

/** The Object kinds, as `reforged-types` and `reforged-builtins` name them. */
export const OBJECT_KINDS = [
  "unit",
  "item",
  "ability",
  "buff",
  "destructable",
  "doodad",
  "upgrade",
] as const;
export type ObjectKind = (typeof OBJECT_KINDS)[number];

/** The type of a modification's value, by the index the file stores. */
export const VALUE_TYPES = ["int", "real", "unreal", "string"] as const;
export type ValueType = (typeof VALUE_TYPES)[number];

/** One modification of an object, as the file holds it. */
export interface Modification {
  /** The field's id (`unam`). */
  readonly field: string;
  readonly type: ValueType;
  /** The level, or the variation for a doodad; absent in the kinds that store none. */
  readonly level?: number;
  /** The data pointer; absent in the kinds that store none. */
  readonly dataPointer?: number;
  /** An integer, a 32-bit real, or the string as stored (a `TRIGSTR_nnn` included). */
  readonly value: number | string;
  /** The end marker, as read. */
  readonly end: string;
  /**
   * A string's bytes as read, when they are not the UTF-8 of `value` (bytes
   * that are not valid UTF-8, a leading byte order mark the decoder drops):
   * `value` is then a view of them, and the writer writes them.
   */
  readonly bytes?: Uint8Array;
  /** A real's 32 bits as read, when `value` cannot carry them: a NaN, whose payload a number loses. */
  readonly bits?: number;
}

/**
 * One set of an object's modifications. Format version 3 stores a count of
 * sets and a flag per set; versions 1 and 2 store the modifications alone,
 * read as the one set of an object, without a flag.
 */
export interface ModificationSet {
  /** The set's flag, as read; absent in format versions 1 and 2. */
  readonly flag?: number;
  readonly modifications: readonly Modification[];
}

/** One object of an Object data file: a Built-in object it modifies, or a Custom object it adds. */
export interface ObjectEntry {
  /** The Built-in object's Rawcode, or the Custom object's base. */
  readonly original: string;
  /** The Custom object's Rawcode; absent for a Built-in object. */
  readonly custom?: string;
  /** The four bytes a Built-in object's entry holds where a Custom Rawcode goes, when they are not four NUL bytes. */
  readonly customSlot?: string;
  readonly sets: readonly ModificationSet[];
}

/** One Object data file of the map folder, as read. */
export interface ObjectDataFile {
  /** Its file name (`war3mapSkin.w3u`). */
  readonly name: string;
  readonly kind: ObjectKind;
  readonly skin: boolean;
  readonly version: number;
  /** The Built-in objects it modifies, in file order. */
  readonly original: readonly ObjectEntry[];
  /** The Custom objects it adds, in file order. */
  readonly custom: readonly ObjectEntry[];
  /** The bytes after the last table, when there are any. */
  readonly trailing?: Uint8Array;
}

/**
 * One `STRING n` block of war3map.wts, as its raw lines: each part holds
 * its lines' bytes, their line ends included.
 */
export interface WtsBlock {
  /** Its number, from its header. */
  readonly number: number;
  /** The bytes between the previous block (or the start of the file, after its byte order mark) and this one. */
  readonly before: Uint8Array;
  /** The `STRING n` line. */
  readonly header: Uint8Array;
  /** The `//` lines between the header and the opening brace, none or more. */
  readonly comment: Uint8Array;
  /** The `{` line. */
  readonly open: Uint8Array;
  /** The lines of the string. */
  readonly body: Uint8Array;
  /** The `}` line; empty when the file ends inside the body. */
  readonly close: Uint8Array;
  /** The string: its body's lines, decoded and joined with LF. */
  readonly text: string;
}

/** war3map.wts as read, losslessly: its blocks and every byte between them. */
export interface WtsFile {
  /** Whether it starts with a byte order mark. */
  readonly bom: boolean;
  /** Its line end: its first one, CRLF when it has none. */
  readonly eol: "\r\n" | "\n";
  /** Its blocks, in file order. */
  readonly blocks: readonly WtsBlock[];
  /** The bytes after the last block. */
  readonly after: Uint8Array;
}

/** A map folder's Editor globals, Object data, strings and Game data set, and the author-facing warnings of reading them. */
export interface MapFolderModel {
  /** In the order of war3map.lua's header, one per name. */
  readonly globals: EditorGlobal[];
  /** The Object data files the map folder holds, base files before Skin files. */
  readonly objectData: ObjectDataFile[];
  /** The strings of war3map.wts, by their number, derived from `wts`: of two blocks of one number, the last wins. */
  readonly strings: Map<number, string>;
  /** war3map.wts as read; undefined when the map folder has none. */
  wts: WtsFile | undefined;
  /**
   * The bytes of each Object data file and war3map.wts the readers read, by
   * file name, in the order read: a file they left out with a warning too.
   */
  readonly files: Map<string, Uint8Array>;
  /** The Game data set of war3map.w3i, as the id of reforged-builtins' index (`melee-fk`); undefined when unknown. */
  gameDataSet: string | undefined;
  /** Author-facing, never errors: the build goes on. */
  readonly warnings: string[];
}

export function createModel(): MapFolderModel {
  return {
    globals: [],
    objectData: [],
    strings: new Map(),
    wts: undefined,
    files: new Map(),
    gameDataSet: undefined,
    warnings: [],
  };
}
