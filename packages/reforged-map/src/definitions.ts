// Object definitions in the build (#700, "The build's merge"): load the
// definitions of a Map project, check them, and edit the build's staged
// copy of the map folder to hold them. What the build and Object sync share
// lives here too: loading and checking the definitions with the Object
// manifest, the collisions, and the edit that makes each owned object
// exactly its definition (the sync's step 6).

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
  type CheckedFields,
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
import type { ObjectKind } from "./model.js";
import {
  openObjectData,
  type ObjectDataEditor,
  type ObjectDataModification,
  type ObjectDataObject,
} from "./object-data-editor.js";
import {
  DEFAULT_OBJECT_MANIFEST,
  byKindThenRawcode,
  objectKey,
  readObjectManifest,
  type ObjectManifest,
} from "./object-manifest.js";

/** Where the Object definitions and the Object manifest of a Map project are, for {@link mergeObjectDefinitions}, {@link syncObjectDefinitions}, `generateObjects` and `openRawcodeLookup`. */
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
  /**
   * The Object manifest, absolute or relative to the Map project's root:
   * `object-manifest.json` when left out. A missing file owns no object.
   */
  manifest?: string;
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

/** The absolute paths of a Map project's definitions and its Object manifest. */
export interface ProjectPaths extends DefinitionPaths {
  readonly manifest: string;
}

/** The definitions of a Map project, checked, with what checking their fields needs. */
interface LoadedDefinitions {
  readonly definitions: readonly CheckedDefinition[];
  readonly builtins: BuiltinsIndex;
  readonly table: FieldTable;
}

/** The definitions of a Map project, fully checked and sorted, and its Object manifest: what the build and Object sync start from. */
export interface PreparedDefinitions {
  readonly paths: ProjectPaths;
  /** The definitions, by Object kind then Rawcode. */
  readonly definitions: readonly CheckedDefinition[];
  /** Each definition's edits and warnings. */
  readonly fields: ReadonlyMap<CheckedDefinition, CheckedFields>;
  /** The field table; undefined when there is no definition file. */
  readonly table: FieldTable | undefined;
  readonly manifest: ObjectManifest;
}

/** The absolute paths of a Map project's definitions and its Object manifest. */
export function projectPaths(
  projectRoot: string,
  options: ObjectDefinitionsOptions,
): ProjectPaths {
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
    manifest: path.resolve(root, options.manifest ?? DEFAULT_OBJECT_MANIFEST),
  };
}

/**
 * Loads the definitions of a Map project and checks their identity; undefined
 * when the definitions folder holds no definition file, so that a Map project
 * without definitions needs neither peer.
 */
export function loadObjectDefinitions(
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

/**
 * Loads and fully checks a Map project's definitions, and reads its Object
 * manifest, before anything is written: every error is thrown here.
 */
export function prepareDefinitions(
  projectRoot: string,
  options: ObjectDefinitionsOptions,
): PreparedDefinitions {
  const paths = projectPaths(projectRoot, options);
  const loaded = loadObjectDefinitions(paths);
  const manifest = readObjectManifest(paths.manifest, paths.projectRoot);
  if (loaded === undefined) {
    return {
      paths,
      definitions: [],
      fields: new Map(),
      table: undefined,
      manifest,
    };
  }
  const definitions = [...loaded.definitions].sort(byKindThenRawcode);
  return {
    paths,
    definitions,
    fields: checkFields(definitions, loaded.table, paths.projectRoot),
    table: loaded.table,
    manifest,
  };
}

/** The objects of an editor, by {@link objectKey}. */
export function objectsByKey(
  editor: ObjectDataEditor,
): Map<string, ObjectDataObject> {
  return new Map(editor.objects().map((object) => [objectKey(object), object]));
}

/**
 * Throws the collisions: each definition at a Rawcode the map folder
 * defines or changes in its kind, which the Object manifest does not own.
 */
export function checkCollisions(
  prepared: PreparedDefinitions,
  present: ReadonlyMap<string, ObjectDataObject>,
): void {
  const owned = new Set(prepared.manifest.owned.map(objectKey));
  const { projectRoot } = prepared.paths;
  const collisions: ObjectDefinitionProblem[] = [];
  for (const { kind, rawcode, file } of prepared.definitions) {
    const key = objectKey({ kind, rawcode });
    const object = present.get(key);
    if (object === undefined || owned.has(key)) continue;
    collisions.push({
      file,
      rawcode,
      field: undefined,
      message: `${displayPath(projectRoot, file)} defines the ${kind} ${rawcode}, which the map folder already ${object.origin === "modified" ? "changes" : "defines"}, and the code does not own it. Adopt it into the code (pnpm objects:adopt ${rawcode}), or give the definition another Rawcode.`,
    });
  }
  if (collisions.length > 0) {
    throw new ObjectDefinitionsError("collision", collisions);
  }
}

/** What {@link applyDefinitions} did, before the save. */
export interface AppliedDefinitions {
  /** The owned objects no definition defines that it removed, as they were. */
  readonly removed: readonly ObjectDataObject[];
  /** The definitions' warnings. */
  readonly warnings: readonly string[];
}

/** The kinds whose modifications store a level and a data pointer. */
const LEVELLED_KINDS: ReadonlySet<ObjectKind> = new Set([
  "ability",
  "doodad",
  "upgrade",
]);

/**
 * Whether a modification the object holds already stores an edit's value,
 * so that setting it again would change no byte: a localizable string must
 * be a `TRIGSTR` of the same text, a real the same 32-bit value.
 */
function holds(
  held: ObjectDataModification,
  value: number | string,
  localizable: boolean,
): boolean {
  if (typeof value === "string") {
    if (typeof held.stored !== "string") return false;
    return localizable
      ? held.stored.startsWith("TRIGSTR_") && held.value === value
      : held.stored === value;
  }
  if (typeof held.value !== "number") return false;
  return held.type === "int"
    ? held.value === value
    : held.value === Math.fround(value);
}

/**
 * Edits the Object data so that each defined object's modifications are
 * exactly its definition's: a Custom object added (again, on a new base),
 * the fields the definition does not set removed, the fields it sets set,
 * unless they already hold its value in the file the World Editor keeps
 * them in; then each owned object no definition defines removed, a Custom
 * object entirely, a Built-in object's modifications. The collisions are
 * the caller's, checked first.
 */
export function applyDefinitions(
  editor: ObjectDataEditor,
  prepared: PreparedDefinitions,
  present: ReadonlyMap<string, ObjectDataObject>,
): AppliedDefinitions {
  const warnings: string[] = [];
  const defined = new Set<string>();
  for (const definition of prepared.definitions) {
    const { kind, rawcode, base } = definition;
    const key = objectKey(definition);
    defined.add(key);
    let current = present.get(key);
    if (current !== undefined && base !== undefined && current.base !== base) {
      editor.removeObject({ kind, rawcode });
      current = undefined;
    }
    if (base !== undefined && current === undefined) {
      editor.addObject({ kind, rawcode, base });
    }
    const checked = prepared.fields.get(definition);
    const edits = checked?.edits ?? [];
    const entries = prepared.table?.fields[kind] ?? {};
    const entryOf = (field: string) =>
      Object.hasOwn(entries, field) ? entries[field] : undefined;
    const levelled = LEVELLED_KINDS.has(kind);
    // A modification's address: field id, level and data pointer, as the
    // writer finds a field.
    const address = (field: string, level?: number, dataPointer?: number) =>
      `${field} ${String(level ?? 0)} ${String(dataPointer ?? (levelled ? entryOf(field)?.data : undefined) ?? 0)}`;
    const held = current?.modifications ?? [];
    const heldAddress = (modification: ObjectDataModification) =>
      address(
        modification.field,
        modification.level,
        modification.dataPointer ?? 0,
      );
    const wanted = new Set(
      edits.map(({ field, level, dataPointer }) =>
        address(field, level, dataPointer),
      ),
    );
    const removed = new Set<string>();
    for (const modification of held) {
      const at = heldAddress(modification);
      if (wanted.has(at) || removed.has(at)) continue;
      removed.add(at);
      editor.removeField({
        kind,
        rawcode,
        field: modification.field,
        ...(levelled && {
          level: modification.level ?? 0,
          dataPointer: modification.dataPointer ?? 0,
        }),
      });
    }
    for (const edit of edits) {
      const at = address(edit.field, edit.level, edit.dataPointer);
      const entry = entryOf(edit.field);
      const same = held.filter(
        (modification) => heldAddress(modification) === at,
      );
      const [only] = same;
      if (
        same.length === 1 &&
        holds(only, edit.value, entry?.localizable === true) &&
        (entry === undefined ||
          only.file.startsWith("war3mapSkin.") === (entry.file === "skin"))
      ) {
        continue;
      }
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
  const removed: ObjectDataObject[] = [];
  for (const entry of [...prepared.manifest.owned].sort(byKindThenRawcode)) {
    const key = objectKey(entry);
    const current = present.get(key);
    if (defined.has(key) || current === undefined) continue;
    editor.removeObject({ kind: entry.kind, rawcode: entry.rawcode });
    removed.push(current);
  }
  return { removed, warnings };
}

/** The public view of checked definitions. */
export function definedObjects(
  definitions: readonly CheckedDefinition[],
): DefinedObject[] {
  return definitions.map(({ kind, rawcode, base, file }) => ({
    kind,
    rawcode,
    base,
    file,
  }));
}

/**
 * Merges a Map project's Object definitions into the build's staged copy of
 * its map folder: each Custom object added with its fields, each change to
 * a Built-in object made, in the Editor form, and each object the code
 * owned and no definition defines any more removed.
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
 * The Object manifest, which {@link syncObjectDefinitions} writes, says
 * which objects the code owns: the merge reads it and never writes it. A
 * definition replaces an owned object, which then holds exactly the
 * definition's modifications; an owned object no definition defines is
 * removed from the copy, a Custom object entirely, a Built-in object's
 * modifications, with no warning: the copy is not the author's. A
 * definition at a Rawcode the map folder defines or changes, which the
 * code does not own, is a collision. The copy is saved with the World
 * Editor check off, as a folder no World Editor opens; the map folder is
 * never written. A Map project with no definition file and no owned object
 * needs neither `typescript` nor `reforged-builtins`, and the copy is left
 * as it is.
 *
 * @param stagedFolder - The build's staged copy of the map folder, which it
 *   edits.
 * @param projectRoot - The Map project's root, from which the definitions
 *   folder, the Object manifest, `typescript` and `reforged-builtins` are
 *   found.
 * @param options - The definitions folder, the generated folder and the
 *   Object manifest.
 * @returns The objects defined, the files of the copy written, and the
 *   warnings.
 * @throws {@link ObjectDefinitionsError} With the reason `"load-failed"`,
 *   when a definition file throws while loading, cannot be transpiled or
 *   imports what a definition may not; `"invalid-definition"`, when a
 *   definition's Rawcode, base or fields are invalid, each problem naming
 *   its file, Rawcode and field; `"defined-twice"`, when two definitions
 *   name one Rawcode of one Object kind; `"collision"`, when a definition
 *   names a Rawcode the map folder defines or changes and the code does
 *   not own; `"manifest-unreadable"`, when the Object manifest does not
 *   parse or is not one Object sync writes; `"peer-missing"`, when
 *   `typescript` or `reforged-builtins`, or its field table of format 2,
 *   cannot be read from the Map project. Nothing is written.
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
  const prepared = prepareDefinitions(projectRoot, options);
  if (
    prepared.definitions.length === 0 &&
    prepared.manifest.owned.length === 0
  ) {
    return { objects: [], written: [], warnings: [] };
  }
  const editor = openObjectData(stagedFolder, {
    projectRoot: prepared.paths.projectRoot,
  });
  const present = objectsByKey(editor);
  checkCollisions(prepared, present);
  const { warnings } = applyDefinitions(editor, prepared, present);
  const { written } = editor.save(undefined, { worldEditorCheck: false });
  return {
    objects: definedObjects(prepared.definitions),
    written,
    warnings,
  };
}
