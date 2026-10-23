// Object release (#710; #700, "Object adoption and release"; #484): hand
// owned objects back to the map folder. Object sync runs for those objects
// only, so that the map folder holds each as the code last defined it; then
// the Object manifest forgets them, with no removed entry, and their
// definition files go. The object stays in the map folder, and so do its
// placements on the terrain.

import fs from "node:fs";
import {
  applyDefinitions,
  definedObjects,
  objectsByKey,
  prepareDefinitions,
  type DefinedObject,
  type PreparedDefinitions,
} from "./definitions.js";
import {
  ObjectDefinitionsError,
  type ObjectDefinitionProblem,
} from "./definitions-error.js";
import type { CheckedDefinition } from "./definitions-check.js";
import { displayPath } from "./definitions-loader.js";
import { checkMapFolder } from "./map-folder.js";
import { OBJECT_KINDS, type ObjectKind } from "./model.js";
import { openObjectData } from "./object-data-editor.js";
import { findDrift } from "./object-drift.js";
import {
  byKindThenRawcode,
  objectKey,
  writeObjectManifest,
  type ObjectSnapshot,
} from "./object-manifest.js";
import { reloadOrWarn, type ObjectSyncOptions } from "./object-sync.js";
import type { WorldEditorState } from "./world-editor.js";
import { ObjectDataWriterError } from "./writer-error.js";

/** The options of {@link releaseObjects}: those of {@link syncObjectDefinitions}, which it runs for the released objects. */
export type ObjectReleaseOptions = ObjectSyncOptions;

/** What {@link releaseObjects} returns: the objects released, and what it wrote and deleted. */
export interface ObjectReleaseReport {
  /** The objects released, by Object kind then Rawcode, each with the definition file it had. */
  readonly released: readonly DefinedObject[];
  /** The definition files deleted, absolute paths, in the order of `released`. */
  readonly deleted: readonly string[];
  /** The files of the map folder it wrote, by file name: empty when the map folder held each object as the code defines it. */
  readonly written: readonly string[];
  /** Whether it wrote the Object manifest, which it does only when its bytes change. */
  readonly manifestWritten: boolean;
  /** What the World Editor showed of the map folder before the first write; undefined when nothing was released. */
  readonly worldEditor: WorldEditorState | undefined;
  /** Whether it reloaded the map folder in the World Editor that held it, with `-launch -loadfile`. */
  readonly worldEditorReloaded: boolean;
  /** Author-facing warnings, each one line. */
  readonly warnings: readonly string[];
}

/** An `<kind>:<rawcode>` argument, naming the kind of a Rawcode two kinds share. */
const KIND_AND_RAWCODE = new RegExp(`^(${OBJECT_KINDS.join("|")}):(.{4})$`);

/** The first line of the error of a released object changed outside the code. */
const DRIFT_HEADER =
  "Objects to release were changed in the map folder outside the code since the last Object sync: nothing was released. Copy each change into its definition, or release with force (pnpm objects:release --force) to overwrite them with the code's version.";

/**
 * Hands objects the code owns back to the map folder: Object release,
 * `pnpm objects:release`. Each object is left in the map folder as the
 * code last defined it, its placements on the terrain kept, and its
 * Object manifest entry and definition file go.
 *
 * @remarks
 * A Rawcode names an object the code both owns (the Object manifest has
 * it) and defines; one two kinds share, such as a buff and a destructable
 * at `B000`, names its kind, `buff:B000`. Its definition must be the only
 * one its file exports, since release deletes that file and never code it
 * does not own.
 *
 * The definitions are loaded and fully checked, and the manifest read, as
 * {@link syncObjectDefinitions} does. Then Object sync runs for the
 * released objects only: each one changed in the map folder outside the
 * code refuses the release, listing each field with the manifest's value
 * and the map folder's, unless `force`, which overwrites it with the
 * code's version, with a warning; each one is made exactly its
 * definition; and the map folder is saved with the World Editor check on.
 * The other owned objects, the removed entries and the other definitions
 * are left as they are, even when a sync would change them.
 *
 * Then the manifest drops the released objects with no removed entry,
 * since the map folder owns them now, and their definition files are
 * deleted, in that order: a release interrupted before the manifest write
 * leaves objects the next sync finds clean. A World Editor holding the
 * map without unsaved edits when the map folder was written is reloaded,
 * as Object sync reloads it, given the World Editor's executable; without
 * it, or when the reload fails, the release warns to reload the map there
 * by hand.
 *
 * @param mapFolder - The map folder, saved as a folder by the World Editor.
 * @param projectRoot - The Map project's root, from which the definitions
 *   folder, the Object manifest, `typescript` and `reforged-builtins` are
 *   found.
 * @param rawcodes - The Rawcodes to release (`h000`, or `buff:B000` for a
 *   Rawcode two kinds share).
 * @param options - The definitions folder, the generated folder, the
 *   Object manifest, `force`, the World Editor check's options and the
 *   World Editor's executable.
 * @returns The objects released, the definition files deleted, the files
 *   of the map folder written, whether the manifest was written, the World
 *   Editor's state, whether it was reloaded, and the warnings.
 * @throws {@link ObjectDefinitionsError} With the reason
 *   `"not-releasable"`, when a Rawcode names an object the code does not
 *   own, one no definition defines, one whose file exports other
 *   definitions, naming the file, no object of the code, or an object of
 *   two kinds without its kind, one problem per Rawcode;
 *   `"changed-outside-code"`, without `force`, when a released object was
 *   changed in the map folder outside the code, one problem per field; or
 *   the reasons of loading the definitions: `"load-failed"`,
 *   `"invalid-definition"`, `"defined-twice"`, `"manifest-unreadable"` and
 *   `"peer-missing"`. Nothing is written.
 * @throws {@link ObjectDataWriterError} With the reason
 *   `"modified-in-world-editor"`, when the World Editor shows unsaved edits
 *   for the map folder, `force` or not: save or discard them there first;
 *   `"world-editor-check-failed"`, when the check could not read the
 *   windows' titles; `"changed-on-disk"`, when a file changed while the
 *   release ran; or another reason, when the Object data editor refuses an
 *   edit. Nothing is written.
 * @throws {@link MapFolderError} When the map folder is missing.
 */
export function releaseObjects(
  mapFolder: string,
  projectRoot: string,
  rawcodes: readonly string[],
  options: ObjectReleaseOptions = {},
): ObjectReleaseReport {
  checkMapFolder(mapFolder);
  const prepared = prepareDefinitions(projectRoot, options);
  const { projectRoot: root } = prepared.paths;

  const problems: ObjectDefinitionProblem[] = [];
  const chosen = new Map<string, CheckedDefinition>();
  for (const argument of rawcodes) {
    const found = findReleasable(argument, prepared);
    if ("problem" in found) problems.push(found.problem);
    else chosen.set(objectKey(found.definition), found.definition);
  }
  if (problems.length > 0) {
    throw new ObjectDefinitionsError("not-releasable", problems);
  }
  const definitions = [...chosen.values()].sort(byKindThenRawcode);
  if (definitions.length === 0) {
    return {
      released: [],
      deleted: [],
      written: [],
      manifestWritten: false,
      worldEditor: undefined,
      worldEditorReloaded: false,
      warnings: [],
    };
  }

  // Object sync for the released objects only: their definitions, their
  // owned entries, no removed entry.
  const keys = new Set(chosen.keys());
  const scoped: PreparedDefinitions = {
    ...prepared,
    definitions,
    manifest: {
      owned: prepared.manifest.owned.filter((entry) =>
        keys.has(objectKey(entry)),
      ),
      removed: [],
    },
  };
  const editor = openObjectData(mapFolder, { projectRoot: root });
  const present = objectsByKey(editor);
  const applied = applyDefinitions(editor, scoped, present);
  const drifted = findDrift(scoped, present, objectsByKey(editor));
  if (drifted.length > 0 && options.force !== true) {
    throw new ObjectDefinitionsError(
      "changed-outside-code",
      drifted.flatMap((object) => object.problems),
      DRIFT_HEADER,
    );
  }
  const unsaved = new ObjectDataWriterError(
    "modified-in-world-editor",
    `The World Editor shows unsaved edits for ${mapFolder} (its title ends in " *]"): nothing was released. Save or discard them in the World Editor first, then release again.`,
  );
  let saved: ReturnType<typeof editor.save>;
  try {
    saved = editor.save(undefined, {
      worldEditorCheck: options.worldEditorCheck ?? {},
    });
  } catch (error) {
    if (
      error instanceof ObjectDataWriterError &&
      error.reason === "modified-in-world-editor"
    ) {
      throw unsaved;
    }
    throw error;
  }
  const { written, worldEditor } = saved;
  // The save refuses unsaved edits only when it writes; release refuses
  // them always, since the World Editor's save would follow it.
  if (worldEditor === "modified") throw unsaved;

  const owned: ObjectSnapshot[] = prepared.manifest.owned.filter(
    (entry) => !keys.has(objectKey(entry)),
  );
  const manifestWritten = writeObjectManifest(prepared.paths.manifest, {
    owned,
    removed: prepared.manifest.removed,
  });
  const deleted = [...new Set(definitions.map(({ file }) => file))];
  for (const file of deleted) fs.rmSync(file, { force: true });

  const warnings = [...applied.warnings];
  for (const object of drifted) {
    warnings.push(
      `The ${object.kind} ${object.rawcode} was changed outside the code (${object.changes.join(", ")}): force overwrote it with the code's version.`,
    );
  }
  const worldEditorReloaded =
    worldEditor === "open" &&
    written.length > 0 &&
    reloadOrWarn(mapFolder, options, warnings, "release");
  return {
    released: definedObjects(definitions),
    deleted,
    written,
    manifestWritten,
    worldEditor,
    worldEditorReloaded,
    warnings,
  };
}

/** The definition a Rawcode argument names, or why it cannot be released. */
function findReleasable(
  argument: string,
  prepared: PreparedDefinitions,
): { definition: CheckedDefinition } | { problem: ObjectDefinitionProblem } {
  const named = KIND_AND_RAWCODE.exec(argument);
  const kind = named?.[1] as ObjectKind | undefined;
  const rawcode = named?.[2] ?? argument;
  const { projectRoot } = prepared.paths;
  const problem = (message: string, file?: string) => ({
    problem: { file, rawcode, field: undefined, message },
  });
  const defined = new Map(
    prepared.definitions.map((definition) => [
      objectKey(definition),
      definition,
    ]),
  );
  const owned = new Set(prepared.manifest.owned.map(objectKey));
  const kinds = (kind === undefined ? OBJECT_KINDS : [kind]).filter((each) => {
    const key = objectKey({ kind: each, rawcode });
    return defined.has(key) || owned.has(key);
  });
  if (kinds.length > 1) {
    const [first, second] = kinds;
    return problem(
      `The code owns a ${first} and a ${second} at ${rawcode}: name the kind of the one to release, ${first}:${rawcode} or ${second}:${rawcode}.`,
    );
  }
  const found = kinds.at(0);
  if (found === undefined) {
    return problem(
      kind === undefined
        ? `The code neither defines nor owns an object ${rawcode} of any kind: there is nothing to release. Check the Rawcode.`
        : `The code neither defines nor owns the ${kind} ${rawcode}: there is nothing to release. Check the Rawcode and the kind.`,
    );
  }
  const key = objectKey({ kind: found, rawcode });
  const definition = defined.get(key);
  if (definition === undefined) {
    return problem(
      `The ${key} is in the Object manifest and no definition defines it: release hands back an object as the code last defined it. Restore its definition from git, then release it.`,
    );
  }
  const shown = displayPath(projectRoot, definition.file);
  if (!owned.has(key)) {
    return problem(
      `${shown} defines the ${key}, which no Object sync has written: the code does not own it, and there is nothing to release. Sync it first (pnpm objects:sync), or delete its definition.`,
      definition.file,
    );
  }
  const others = prepared.definitions
    .filter((each) => each.file === definition.file && each !== definition)
    .map(objectKey);
  if (others.length > 0) {
    return problem(
      `${shown} holds other definitions than the ${key}'s (${others.join(", ")}): release deletes the file of the object it releases, never code it does not own. Move the definition of the ${key} to a file of its own, then release it.`,
      definition.file,
    );
  }
  return { definition };
}
