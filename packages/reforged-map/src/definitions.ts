// Object definitions in the build (#700, "The build's merge"): load the
// definitions of a Map project, check them, and edit the build's staged
// copy of the map folder to hold them. Without an Object manifest (#704),
// the code owns no object of the map folder: a definition at a Rawcode the
// map folder defines or changes is a collision.

import path from "node:path";
import {
  loadBuiltins,
  loadFieldTable,
  type BuiltinsIndex,
  type FieldTable,
} from "./builtins.js";
import {
  checkFields,
  checkIdentity,
  type CheckedDefinition,
} from "./definitions-check.js";
import {
  definitionsError,
  ObjectDefinitionsError,
  type ObjectDefinitionProblem,
} from "./definitions-error.js";
import {
  DEFAULT_DEFINITIONS_FOLDER,
  DEFAULT_GENERATED_FOLDER,
  definitionFiles,
  displayPath,
  loadDefinitionFiles,
  type DefinitionPaths,
} from "./definitions-loader.js";
import { checkMapFolder } from "./map-folder.js";
import { OBJECT_KINDS, type ObjectKind } from "./model.js";
import { openObjectData } from "./object-data-editor.js";

/** Where the Object definitions of a Map project are, for {@link mergeObjectDefinitions}. */
export interface ObjectDefinitionsOptions {
  /**
   * The definitions folder, absolute or relative to the Map project's root:
   * every `.ts` file under it is loaded. `src/objects` when left out; a
   * missing folder holds no definition.
   */
  definitionsFolder?: string;
  /**
   * The Map project's generated folder, absolute or relative to its root,
   * which a definition may not import: `src/generated` when left out.
   */
  generatedFolder?: string;
}

/** One object an Object definition defines: its Object kind, its Rawcode and its definition's file. */
export interface DefinedObject {
  /** Its Object kind. */
  readonly kind: ObjectKind;
  /** Its Rawcode (`h000`). */
  readonly rawcode: string;
  /** A Custom object's base (`hfoo`); undefined for a change to a Built-in object. */
  readonly base: string | undefined;
  /** The definition file that exports it, an absolute path. */
  readonly file: string;
}

/** What {@link mergeObjectDefinitions} returns. */
export interface ObjectDefinitionsMergeResult {
  /** The objects the definitions define, by Object kind then Rawcode. */
  readonly objects: readonly DefinedObject[];
  /** The files of the staged copy it wrote, by file name: empty when there is no definition. */
  readonly written: readonly string[];
  /** Author-facing warnings, each one line: the build goes on. */
  readonly warnings: readonly string[];
}

/** The definitions of a Map project, checked, with what checking their fields needs. */
interface LoadedDefinitions {
  readonly definitions: readonly CheckedDefinition[];
  readonly builtins: BuiltinsIndex;
  readonly table: FieldTable;
}

/** The absolute paths of a Map project's definitions. */
function definitionPaths(
  projectRoot: string,
  options: ObjectDefinitionsOptions,
): DefinitionPaths {
  const root = path.resolve(projectRoot);
  return {
    projectRoot: root,
    definitionsFolder: path.resolve(
      root,
      options.definitionsFolder ?? DEFAULT_DEFINITIONS_FOLDER,
    ),
    generatedFolder: path.resolve(
      root,
      options.generatedFolder ?? DEFAULT_GENERATED_FOLDER,
    ),
  };
}

/**
 * Loads the definitions of a Map project and checks their identity; undefined
 * when the definitions folder holds no definition file, so that a Map project
 * without definitions needs neither peer.
 */
function loadObjectDefinitions(
  paths: DefinitionPaths,
): LoadedDefinitions | undefined {
  if (definitionFiles(paths.definitionsFolder).length === 0) return undefined;
  const builtins = loadBuiltins(paths.projectRoot);
  if ("missing" in builtins) {
    throw definitionsError(
      "peer-missing",
      `reforged-builtins ${builtins.missing}: Object definitions need its index and its field table. Install reforged-builtins in the Map project (${paths.projectRoot}).`,
    );
  }
  const fields = loadFieldTable(paths.projectRoot);
  if ("missing" in fields) {
    throw definitionsError(
      "peer-missing",
      `reforged-builtins ${fields.missing}: Object definitions need its field table of format 2. Install a newer reforged-builtins in the Map project.`,
    );
  }
  if (fields.table.format !== 2) {
    throw definitionsError(
      "peer-missing",
      `reforged-builtins has a field table of format ${String(fields.table.format)} for Game version ${fields.table.gameVersion}: Object definitions need the field table of format 2, with each field's category. Install a newer reforged-builtins in the Map project.`,
    );
  }
  const loaded = loadDefinitionFiles(paths);
  return {
    definitions: checkIdentity(loaded, builtins.index, paths.projectRoot),
    builtins: builtins.index,
    table: fields.table,
  };
}

/** The definitions by Object kind, in the order of the kinds, then by Rawcode. */
function sorted(
  definitions: readonly CheckedDefinition[],
): CheckedDefinition[] {
  return [...definitions].sort(
    (a, b) =>
      OBJECT_KINDS.indexOf(a.kind) - OBJECT_KINDS.indexOf(b.kind) ||
      (a.rawcode < b.rawcode ? -1 : a.rawcode > b.rawcode ? 1 : 0),
  );
}

/**
 * Merges a Map project's Object definitions into the build's staged copy of
 * its map folder: each Custom object added with its fields, each change to
 * a Built-in object made, in the Editor form.
 *
 * @remarks
 * Every `.ts` file under the definitions folder is transpiled with the Map
 * project's own `typescript` and evaluated in Node, and every definition it
 * exports counts, once. A definition imports the files of the definitions
 * folder (with or without extension), `reforged-map/objects`, packages and
 * Node's built-in modules, all resolved from the Map project's root; an
 * import of the generated folder, of `reforged-builtins`' kind entries or
 * of a file outside the definitions folder is refused. Each definition's
 * identity (its Rawcode, its base, no Rawcode defined twice in one kind)
 * and fields (known for the kind, of the field's category, 32-bit integers,
 * levels only where the field has them, base-specific fields only on those
 * bases) are checked before any edit. A value equal to the base's is kept
 * as a modification.
 *
 * Until the Object manifest records which objects the code owns, the code
 * owns none: a definition at a Rawcode the map folder defines or changes is
 * a collision. The copy is saved with the World Editor check off, as a
 * folder no World Editor opens; the map folder is never written. A Map
 * project without definition files needs neither `typescript` nor
 * `reforged-builtins`, and the copy is left as it is.
 *
 * @param stagedFolder - The build's staged copy of the map folder, which it
 *   edits.
 * @param projectRoot - The Map project's root, from which the definitions
 *   folder, `typescript` and `reforged-builtins` are found.
 * @param options - The definitions folder and the generated folder.
 * @returns The objects defined, the files of the copy written, and the
 *   warnings.
 * @throws {@link ObjectDefinitionsError} With the reason `"load-failed"`,
 *   when a definition file throws while loading, cannot be transpiled or
 *   imports what a definition may not; `"invalid-definition"`, when a
 *   definition's Rawcode, base or fields are invalid, each problem naming
 *   its file, Rawcode and field; `"defined-twice"`, when two definitions
 *   name one Rawcode of one Object kind; `"collision"`, when a definition
 *   names a Rawcode the map folder defines or changes; `"peer-missing"`,
 *   when `typescript` or `reforged-builtins`, or its field table of format
 *   2, cannot be read from the Map project. Nothing is written.
 * @throws {@link ObjectDataWriterError} When the Object data editor refuses
 *   an edit or the save. Nothing is written.
 * @throws {@link MapFolderError} When the staged copy is missing.
 */
export function mergeObjectDefinitions(
  stagedFolder: string,
  projectRoot: string,
  options: ObjectDefinitionsOptions = {},
): ObjectDefinitionsMergeResult {
  checkMapFolder(stagedFolder);
  const paths = definitionPaths(projectRoot, options);
  const loaded = loadObjectDefinitions(paths);
  if (loaded === undefined) return { objects: [], written: [], warnings: [] };
  const definitions = sorted(loaded.definitions);
  const fields = checkFields(definitions, loaded.table, paths.projectRoot);
  const editor = openObjectData(stagedFolder, {
    projectRoot: paths.projectRoot,
  });
  const existing = new Set(
    editor.objects().map((object) => `${object.kind} ${object.rawcode}`),
  );
  const collisions: ObjectDefinitionProblem[] = definitions
    .filter((definition) =>
      existing.has(`${definition.kind} ${definition.rawcode}`),
    )
    .map(({ kind, rawcode, file }) => ({
      file,
      rawcode,
      field: undefined,
      message: `${displayPath(paths.projectRoot, file)} defines the ${kind} ${rawcode}, which the map folder already ${Object.hasOwn(loaded.builtins.objects, rawcode) ? "changes" : "defines"}, and the code does not own it. Adopt it into the code (pnpm objects:adopt ${rawcode}), or give the definition another Rawcode.`,
    }));
  if (collisions.length > 0) {
    throw new ObjectDefinitionsError("collision", collisions);
  }
  const warnings: string[] = [];
  for (const definition of definitions) {
    const { kind, rawcode, base } = definition;
    if (base !== undefined) editor.addObject({ kind, rawcode, base });
    const checked = fields.get(definition);
    for (const edit of checked?.edits ?? []) {
      editor.setField(
        {
          kind,
          rawcode,
          field: edit.field,
          ...(edit.level !== undefined && { level: edit.level }),
          ...(edit.dataPointer !== undefined && {
            dataPointer: edit.dataPointer,
          }),
        },
        edit.value,
        edit.type === undefined ? {} : { type: edit.type },
      );
    }
    warnings.push(...(checked?.warnings ?? []));
  }
  const { written } = editor.save(undefined, { worldEditorCheck: false });
  return {
    objects: definitions.map(({ kind, rawcode, base, file }) => ({
      kind,
      rawcode,
      base,
      file,
    })),
    written,
    warnings,
  };
}
