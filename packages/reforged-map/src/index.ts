// reforged-map: reads a Map project's map folder and returns the code
// generated from it. Node only, run at build time; it only reads the map
// folder (ADR 0006, ADR 0014).

import { readMapScript } from "./map-folder.js";
import { createModel } from "./model.js";
import { renderDeclarations, renderLuaStub } from "./render.js";
import { readWar3mapLua } from "./war3map-lua.js";

export { MapFolderError } from "./map-folder.js";

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
 * one by its initializer or the Native `InitGlobals` assigns it. The stub
 * calls no Native.
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
  return {
    files: [
      { name: DECLARATIONS_FILE, contents: renderDeclarations(model) },
      { name: LUA_STUB_FILE, contents: renderLuaStub(model) },
    ],
    warnings: [...model.warnings],
  };
}
