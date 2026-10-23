// Object sync (#700, "Object sync"; ADR 0015): write a Map project's Object
// definitions into its map folder in the Editor form, and record what the
// code owns in the Object manifest. Steps 1 to 3 and 6 to 8 of the spec:
// the drift check and the removed entries (#705) and the World Editor
// reload (#706) plug in between them.

import {
  applyDefinitions,
  checkCollisions,
  definedObjects,
  objectsByKey,
  prepareDefinitions,
  type DefinedObject,
  type ObjectDefinitionsOptions,
} from "./definitions.js";
import { displayPath } from "./definitions-loader.js";
import { checkMapFolder } from "./map-folder.js";
import type { ObjectKind } from "./model.js";
import { openObjectData } from "./object-data-editor.js";
import {
  objectKey,
  sameSnapshot,
  snapshotOf,
  writeObjectManifest,
  type ObjectSnapshot,
} from "./object-manifest.js";
import type {
  WorldEditorCheckOptions,
  WorldEditorState,
} from "./world-editor.js";

/** The options of {@link syncObjectDefinitions}. */
export interface ObjectSyncOptions extends ObjectDefinitionsOptions {
  /**
   * Whether to overwrite the changes made to an owned object outside the
   * code. It never overrides a collision, an invalid definition or unsaved
   * edits in the World Editor, whose remedy is elsewhere. False when left
   * out.
   */
  force?: boolean;
  /**
   * How to run the World Editor check before the first write, which a sync
   * always runs: injected window titles, a timeout.
   */
  worldEditorCheck?: WorldEditorCheckOptions;
}

/** An object Object sync removed: its Object kind, its Rawcode and, for a Custom object, its base. */
export interface RemovedObject {
  /** Its Object kind. */
  readonly kind: ObjectKind;
  /** Its Rawcode (`h000`). */
  readonly rawcode: string;
  /** A Custom object's base (`hfoo`); undefined for a Built-in object whose modifications were removed. */
  readonly base: string | undefined;
}

/** What {@link syncObjectDefinitions} returns: what it did to the map folder and the Object manifest. */
export interface ObjectSyncReport {
  /** The objects the definitions define, every one owned after the sync, by Object kind then Rawcode. */
  readonly objects: readonly DefinedObject[];
  /** The defined objects the map folder did not hold: a Custom object added, a Built-in object changed for the first time. */
  readonly added: readonly DefinedObject[];
  /** The defined objects the map folder held whose modifications the sync changed. */
  readonly changed: readonly DefinedObject[];
  /** The owned objects no definition defines any more, which the sync removed. */
  readonly removed: readonly RemovedObject[];
  /** The files of the map folder it wrote, by file name: empty when no byte changed. */
  readonly written: readonly string[];
  /** Whether it wrote the Object manifest, which it does only when its bytes change. */
  readonly manifestWritten: boolean;
  /** What the World Editor showed of the map folder before the first write. */
  readonly worldEditor: WorldEditorState | undefined;
  /** Author-facing warnings, each one line. */
  readonly warnings: readonly string[];
}

/**
 * Writes a Map project's Object definitions into its map folder in the
 * Editor form, and records each object the code owns in the Object
 * manifest: Object sync, `pnpm objects:sync`.
 *
 * @remarks
 * The definitions are loaded and fully checked, as
 * {@link mergeObjectDefinitions} checks them, and the Object manifest is
 * read, before anything is written. A definition at a Rawcode the map
 * folder defines or changes in its kind, which the manifest does not own,
 * is a collision.
 *
 * Each defined object is then made exactly its definition: a Custom object
 * is added, the fields the definition sets are set and those it does not
 * are removed, and a field already holding its value is left as it is. An
 * owned object no definition defines is removed, a Custom object entirely,
 * a Built-in object's modifications; a removed Custom object draws a
 * warning, since the World Editor's next save drops its placements on the
 * terrain and the game skips them, and release (`pnpm objects:release`)
 * hands an object back with them instead. A localizable string is written
 * as the Object data editor writes it ({@link ObjectDataEditor.setField}):
 * a `STRING n` of `war3map.wts` another owner references keeps its text.
 *
 * The map folder is saved with the World Editor check on: a World Editor
 * showing unsaved edits for it (` *]`) refuses the save, and one holding it
 * without unsaved edits draws a warning to reload the map there by hand,
 * else its next save puts back what it loaded. Then the written objects are
 * read back and the manifest records each defined object's snapshot: base
 * and Skin files merged, strings as their text, each modification as field
 * id, level, data pointer, value type and value. The manifest is written
 * byte-stably, sorted by Object kind then Rawcode, and only when its bytes
 * change: a second sync writes no byte.
 *
 * A change made to an owned object outside the code, in the World Editor,
 * is not detected yet (#705): the sync overwrites it, as `force` would.
 *
 * @param mapFolder - The map folder, saved as a folder by the World Editor.
 * @param projectRoot - The Map project's root, from which the definitions
 *   folder, the Object manifest, `typescript` and `reforged-builtins` are
 *   found.
 * @param options - The definitions folder, the generated folder, the
 *   Object manifest, `force` and the World Editor check's options.
 * @returns The objects defined, added, changed and removed, the files
 *   written, whether the manifest was written, the World Editor's state and
 *   the warnings.
 * @throws {@link ObjectDefinitionsError} With the reasons
 *   {@link mergeObjectDefinitions} gives: `"load-failed"`,
 *   `"invalid-definition"`, `"defined-twice"`, `"collision"`,
 *   `"manifest-unreadable"` and `"peer-missing"`. Nothing is written.
 * @throws {@link ObjectDataWriterError} With the reason
 *   `"modified-in-world-editor"`, when the World Editor shows unsaved edits
 *   for the map folder: save or discard them there first;
 *   `"world-editor-check-failed"`, when the check could not read the
 *   windows' titles; `"changed-on-disk"`, when a file changed while the
 *   sync ran; or another reason, when the Object data editor refuses an
 *   edit. Nothing is written.
 * @throws {@link MapFolderError} When the map folder is missing.
 */
export function syncObjectDefinitions(
  mapFolder: string,
  projectRoot: string,
  options: ObjectSyncOptions = {},
): ObjectSyncReport {
  checkMapFolder(mapFolder);
  const prepared = prepareDefinitions(projectRoot, options);
  const { paths } = prepared;
  const objects = definedObjects(prepared.definitions);
  if (
    prepared.definitions.length === 0 &&
    prepared.manifest.owned.length === 0
  ) {
    return {
      objects,
      added: [],
      changed: [],
      removed: [],
      written: [],
      manifestWritten: false,
      worldEditor: undefined,
      warnings: [],
    };
  }
  const editor = openObjectData(mapFolder, { projectRoot: paths.projectRoot });
  const present = objectsByKey(editor);
  checkCollisions(prepared, present);
  // #705: the drift check of each owned object, and the removed entries,
  // go here, before the first edit.
  const applied = applyDefinitions(editor, prepared, present);
  const { written, worldEditor } = editor.save(undefined, {
    worldEditorCheck: options.worldEditorCheck ?? {},
  });

  const warnings = [...applied.warnings];
  for (const object of applied.removed) {
    if (object.origin !== "custom") continue;
    warnings.push(
      `The Custom ${object.kind} ${object.rawcode} was removed: no definition defines it any more. Its placements on the terrain, if any, are dropped by the World Editor's next save and skipped by the game. To hand an object back to the map folder with its placements, restore its definition and release it (pnpm objects:release ${object.rawcode}).`,
    );
  }
  // #706: reload the World Editor here when the caller gives its
  // executable; until then, the author reloads by hand.
  if (worldEditor === "open" && written.length > 0) {
    warnings.push(
      `The World Editor has ${mapFolder} open: reload the map there (close it without saving and open it again), or its next save puts back what it loaded before this sync.`,
    );
  }

  // Read back what was written, and record it.
  const after = objectsByKey(
    openObjectData(mapFolder, { projectRoot: paths.projectRoot }),
  );
  const owned: ObjectSnapshot[] = [];
  const added: DefinedObject[] = [];
  const changed: DefinedObject[] = [];
  for (const object of objects) {
    const key = objectKey(object);
    const now = after.get(key);
    if (now === undefined) {
      throw new Error(
        `unreachable: the ${key} of ${displayPath(paths.projectRoot, object.file)} is not in the map folder after the sync`,
      );
    }
    const snapshot = snapshotOf(now);
    owned.push(snapshot);
    const before = present.get(key);
    if (before === undefined) added.push(object);
    else if (!sameSnapshot(snapshotOf(before), snapshot)) changed.push(object);
  }
  const manifestWritten = writeObjectManifest(paths.manifest, { owned });
  return {
    objects,
    added,
    changed,
    removed: applied.removed.map(({ kind, rawcode, base }) => ({
      kind,
      rawcode,
      base,
    })),
    written,
    manifestWritten,
    worldEditor,
    warnings,
  };
}
