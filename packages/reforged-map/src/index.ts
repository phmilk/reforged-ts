// reforged-map: reads a Map project's map folder and returns the code
// generated from it. Node only, run at build time (ADR 0014). It reads and
// writes the map folder's Object data, through the Object data editor, and
// only reads the rest of the map folder (ADR 0015).

import { loadBuiltins } from "./builtins.js";
import { checkMapFolder, readMapFile, readMapScript } from "./map-folder.js";
import { OBJECT_KINDS, createModel, type ObjectKind } from "./model.js";
import { readObjectData } from "./object-data.js";
import {
  KIND_CONSTANTS,
  constantWarnings,
  mapFolderObjects,
  renderConstants,
  renderOverloads,
} from "./objects.js";
import { renderDeclarations, renderLuaStub } from "./render.js";
import { readWar3mapLua } from "./war3map-lua.js";
import { readWar3mapWts } from "./war3map-wts.js";
import { WTG_FILE, readWar3mapWtg } from "./war3map-wtg.js";

export { MapFolderError } from "./map-folder.js";
export {
  ObjectDataWriterError,
  openObjectData,
  type ObjectDataEditor,
  type ObjectDataEditorOptions,
  type ObjectDataModification,
  type ObjectDataObject,
  type ObjectDataSaveResult,
  type ObjectDataValueType,
  type ObjectDataWriterErrorReason,
} from "./object-data-editor.js";
export type { GameDataSet } from "./builtins.js";
export type { ObjectKind } from "./model.js";

/** The name of the generated TypeScript declarations of the Editor globals. */
export const DECLARATIONS_FILE = "editor-globals.d.ts";

/** The name of the generated Lua stub of the Editor globals, which the reforged-test harness loads. */
export const LUA_STUB_FILE = "editor-globals.lua";

/** One generated file: a bare file name, written into the Map project's generated folder, and its text. */
export interface GeneratedFile {
  /** The bare file name (`editor-globals.d.ts`). */
  name: string;
  /** The file's text. */
  contents: string;
}

/** What {@link generateEditorGlobals} returns. */
export interface EditorGlobalsOutput {
  /** The declarations ({@link DECLARATIONS_FILE}) and the Lua stub ({@link LUA_STUB_FILE}), in that order. */
  files: GeneratedFile[];
  /** Author-facing warnings, each one line: never errors, the build goes on. */
  warnings: string[];
}

/**
 * Generates the declarations and the Lua stub of a map folder's Editor
 * globals: the `gg_` and `udg_` globals the World Editor declares in its
 * `war3map.lua`.
 *
 * @remarks
 * Only the header of `war3map.lua` and the body of `InitGlobals` are read.
 * A `gg_` global is typed by its prefix (`gg_rct_` a `rect`), and a `udg_`
 * one by its initializer or the Native `InitGlobals` assigns it. A `udg_`
 * variable whose Variable Editor type names an Object kind is typed by that
 * Object kind, read from the variables block of `war3map.wtg` (a `unitcode`
 * variable is a `Rawcode<"unit">`); without a readable `war3map.wtg`, a
 * warning says so and it keeps the type `war3map.lua` gives it: `number` for
 * a map saved by the World Editor, `unknown` or `Record<number, string>` for
 * one saved by HiveWE. The stub calls no Native.
 *
 * @param mapFolder - The path of the map folder, saved as a folder by the
 *   World Editor.
 * @returns The generated files and the warnings.
 * @throws {@link MapFolderError} When the map folder is missing or holds no
 *   `war3map.lua`.
 */
export function generateEditorGlobals(mapFolder: string): EditorGlobalsOutput {
  const model = createModel();
  readWar3mapLua(readMapScript(mapFolder), model);
  readWar3mapWtg(readMapFile(mapFolder, WTG_FILE), model);
  return {
    files: [
      { name: DECLARATIONS_FILE, contents: renderDeclarations(model) },
      { name: LUA_STUB_FILE, contents: renderLuaStub(model) },
    ],
    warnings: [...model.warnings],
  };
}

/** The name of the generated declarations of the map's objects: their `FourCC` overloads. */
export const OBJECTS_DECLARATIONS_FILE = "map-objects.d.ts";

/**
 * The name of each Object kind's generated constants module, which exports
 * its `Custom<Kind>s` object (`custom-units.ts` exports `CustomUnits`).
 */
export const CONSTANTS_FILES: Readonly<Record<ObjectKind, string>> =
  Object.fromEntries(
    OBJECT_KINDS.map((kind) => [kind, KIND_CONSTANTS[kind].file]),
  ) as Record<ObjectKind, string>;

/** What {@link generateObjects} returns. */
export interface ObjectsOutput {
  /** The declarations ({@link OBJECTS_DECLARATIONS_FILE}), then the constants modules ({@link CONSTANTS_FILES}) in its order. */
  files: GeneratedFile[];
  /** Author-facing warnings, each one line: never errors, the build goes on. */
  warnings: string[];
}

/** The options of {@link generateObjects}. */
export interface ObjectsOptions {
  /**
   * A folder of the Map project, from which `reforged-builtins` is
   * resolved as Node resolves a package. The map folder when left out.
   */
  projectRoot?: string;
}

/**
 * Generates the code of a map folder's objects: a `FourCC` overload per
 * Custom object and per Built-in object the map modifies, typed by its
 * Object kind, and per Object kind a constants module of its Custom objects
 * (`CustomUnits.Captain_h000`), always written, empty when the map has none
 * of that kind.
 *
 * @remarks
 * The overload of a modified Built-in object gives the game's name and the
 * map's ("Footman (`hfoo`), a Built-in unit of Patch 3.0.0, named Militia in
 * this map") and names its constant in `reforged-builtins`; it gets no
 * Custom constant. Its declarations file sits under the Map project's
 * `src/`, so its overload precedes the one `reforged-builtins` declares. A
 * Rawcode two kinds share, such as a Custom buff and a Custom destructable
 * at `B000`, gets no overload and no warning, and each kind keeps its
 * constant. A Custom Rawcode equal to a Built-in object's is read as the
 * Custom object, with a warning.
 *
 * The objects of the seven Object kinds are read from
 * `war3map.w3u`, `.w3t`, `.w3a`, `.w3h`, `.w3b`, `.w3d` and `.w3q` and
 * their `war3mapSkin` counterparts, in format versions 1, 2 and 3, their names
 * through `war3map.wts`. The Object kind of an object is its file's. A constant is
 * named by the rules of `reforged-builtins`, from the object's name, else
 * its base's enUS name from the index of `reforged-builtins`, an optional
 * peer resolved from the Map project, else `Unnamed`, with a warning. A file
 * the reader cannot read is left out with a warning; a missing one holds no
 * object.
 *
 * @param mapFolder - The path of the map folder, saved as a folder by the
 *   World Editor. It need not hold `war3map.lua`.
 * @param options - Where `reforged-builtins` is resolved from.
 * @returns The generated files and the warnings.
 * @throws {@link MapFolderError} When the map folder is missing.
 */
export function generateObjects(
  mapFolder: string,
  options: ObjectsOptions = {},
): ObjectsOutput {
  checkMapFolder(mapFolder);
  const model = createModel();
  readObjectData(mapFolder, OBJECT_KINDS, model);
  readWar3mapWts(mapFolder, model);
  const builtins = loadBuiltins(options.projectRoot ?? mapFolder);
  const { objects, keptBaseName } = mapFolderObjects(model, {
    builtins: "index" in builtins ? builtins.index : undefined,
  });
  if (keptBaseName && "missing" in builtins) {
    model.warnings.push(
      `reforged-builtins ${builtins.missing}: a Custom object that keeps its base's name is named Unnamed. Install reforged-builtins to name it after its base.`,
    );
  }
  return {
    files: [
      { name: OBJECTS_DECLARATIONS_FILE, contents: renderOverloads(objects) },
      ...OBJECT_KINDS.map((kind) => ({
        name: CONSTANTS_FILES[kind],
        contents: renderConstants(kind, objects),
      })),
    ],
    warnings: [...model.warnings, ...constantWarnings(objects)],
  };
}

export {
  DEFAULT_MIN_INTERVAL,
  openRawcodeLookup,
  type BuiltinRawcodeObject,
  type CustomRawcodeObject,
  type KnownRawcode,
  type MalformedRawcode,
  type ModifiedRawcodeObject,
  type NotInGameDataSetRawcode,
  type RawcodeConstant,
  type RawcodeLookup,
  type RawcodeLookupOptions,
  type RawcodeLookupResult,
  type RawcodeObject,
  type RawcodeSuggestion,
  type UnavailableLookup,
  type UnknownRawcode,
} from "./lookup.js";
