// The Object data editor (ADR 0015): opens a map folder's Object data and
// war3map.wts through the readers, lists its objects, and saves them, to
// the map folder or to another folder, through the writer. Files are read
// and written only through Node's fs, which opens them with delete sharing
// on Windows (#475): one whole-file read or write per call, no handle held
// across calls, no lock and no watcher.

import fs from "node:fs";
import path from "node:path";
import {
  loadBuiltins,
  loadFieldTable,
  type BuiltinsIndex,
} from "./builtins.js";
import {
  removeField,
  setField,
  type EditTables,
  type StringSources,
} from "./object-data-edit.js";
import { foreignReferences } from "./object-data-strings.js";
import { checkMapFolder, readMapFile } from "./map-folder.js";
import {
  OBJECT_KINDS,
  createModel,
  type MapFolderModel,
  type ObjectKind,
  type ValueType,
} from "./model.js";
import {
  objectDataFileNames,
  readObjectData,
  sameBytes,
} from "./object-data.js";
import { encodeObjectDataFile, encodeWts } from "./object-data-writer.js";
import { mapFolderObjects, type MapFolderObject } from "./objects.js";
import { WTS_FILE, readWar3mapWts, resolveString } from "./war3map-wts.js";
import {
  checkWorldEditor,
  type WorldEditorCheckOptions,
  type WorldEditorState,
} from "./world-editor.js";
import { ObjectDataWriterError } from "./writer-error.js";

/** The type of a modification's value, as the file stores it: an integer, a real, an unreal (a real the editor shows unbounded) or a string. */
export type ObjectDataValueType = ValueType;

/** One modification of an object, in the file it is in. */
export interface ObjectDataModification {
  /** The field's id (`unam`). */
  readonly field: string;
  /** The type of its value. */
  readonly type: ObjectDataValueType;
  /** Its level, or a doodad's variation; absent in the kinds that store none (units, items, buffs, destructables). */
  readonly level?: number;
  /** Its data pointer; absent in the kinds that store none. */
  readonly dataPointer?: number;
  /** Its value: an integer, a real, or a string, a `TRIGSTR_nnn` resolved through `war3map.wts` (kept as stored when the file lacks it). */
  readonly value: number | string;
  /** Its value as the file stores it, a `TRIGSTR_nnn` as is. */
  readonly stored: number | string;
  /** The file it is in: the kind's base file (`war3map.w3u`) or its Skin file (`war3mapSkin.w3u`). */
  readonly file: string;
}

/** One object of the map folder's Object data, as the Object Editor shows it: its base and Skin files merged. */
export interface ObjectDataObject {
  /** Its Object kind. */
  readonly kind: ObjectKind;
  /** `"custom"` for a Custom object the map adds, `"modified"` for a Built-in object it modifies. */
  readonly origin: "custom" | "modified";
  /** Its Rawcode (`h000`). */
  readonly rawcode: string;
  /** A Custom object's base, the Rawcode of the Built-in object it derives from; absent on a modified Built-in object. */
  readonly base?: string;
  /** Its name, else its base's or the game's, from the index of `reforged-builtins`; undefined when none is known. */
  readonly name: string | undefined;
  /** Its modifications, in file order: its base file's, then its Skin file's, every entry and duplicate kept. */
  readonly modifications: readonly ObjectDataModification[];
}

/** What {@link ObjectDataEditor.save} returns. */
export interface ObjectDataSaveResult {
  /** The files it wrote, by file name, each kind's base file then its Skin file, then `war3map.wts`: empty when no file's bytes changed. */
  readonly written: string[];
  /**
   * What the World Editor showed of the folder saved to, before the first
   * write: `"open"` tells the caller to reload the map there with
   * `-launch -loadfile`. Undefined when the World Editor check was off.
   */
  readonly worldEditor: WorldEditorState | undefined;
}

/** The options of {@link ObjectDataEditor.save}. */
export interface ObjectDataSaveOptions {
  /**
   * Whether to run the World Editor check ({@link checkWorldEditor}) on the
   * folder saved to, before the first write, or the options to run it with:
   * on when left out. Turn it off for a folder no World Editor opens, such
   * as the build's staged copy in `dist/`.
   */
  worldEditorCheck?: boolean | WorldEditorCheckOptions;
}

/** The options of {@link openObjectData}. */
export interface ObjectDataEditorOptions {
  /**
   * A folder of the Map project, from which `reforged-builtins` is
   * resolved as Node resolves a package. The map folder when left out.
   */
  projectRoot?: string;
}

/** The field of an object an edit addresses: its Object kind, Rawcode and field id, and its level and data pointer in the kinds that store them. */
export interface ObjectDataField {
  /** The Object kind of the object. */
  readonly kind: ObjectKind;
  /** The object's Rawcode: a Custom object of the map (`h000`), or a Built-in object (`hfoo`). */
  readonly rawcode: string;
  /** The field's id (`umvs`), four characters. */
  readonly field: string;
  /**
   * The level, or a doodad's variation, in the abilities, doodads and
   * upgrades only: required for a field the field table gives levels, 0
   * when left out otherwise.
   */
  readonly level?: number;
  /**
   * The data pointer, in the abilities, doodads and upgrades only: the
   * field table's data column, else 0, when left out.
   */
  readonly dataPointer?: number;
}

/** The options of {@link ObjectDataEditor.setField}. */
export interface ObjectDataSetFieldOptions {
  /**
   * The value type of a field the field table of `reforged-builtins` does
   * not know (Object adoption's raw escape, #484), which is set only with
   * one. A field the table knows takes the table's type: a different one
   * is refused.
   */
  readonly type?: ObjectDataValueType;
}

/** A map folder's Object data and `war3map.wts`, opened by {@link openObjectData}. */
export interface ObjectDataEditor {
  /** The path of the map folder it opened. */
  readonly mapFolder: string;
  /** The readers' warnings, each one line: a file left out, an object defined twice, a name `war3map.wts` lacks. */
  readonly warnings: readonly string[];
  /**
   * Lists the objects of a kind, or of every kind, as the Object Editor
   * shows them.
   *
   * @remarks
   * The objects of each kind are sorted by Rawcode, the kinds in the order
   * of {@link ObjectKind}. A Custom object wins over a modified Built-in
   * object of its Rawcode and kind.
   *
   * @param kind - The Object kind to list; every kind when left out.
   * @returns The objects, base and Skin files merged, each with its
   *   modifications.
   */
  objects(kind?: ObjectKind): ObjectDataObject[];
  /**
   * Sets a field of an object, to be written in the Editor form on the next
   * save.
   *
   * @remarks
   * The field goes into the file the World Editor keeps it in, the base or
   * the Skin file of its kind, as the field table of `reforged-builtins`
   * says. When the object holds the field there, its value is replaced in
   * place, its position, value type, level, data pointer and end marker
   * kept; else it is appended to the object's modifications, with the field
   * table's value type and the end marker the 3.0 World Editor writes, the
   * object's own Rawcode (a Custom object's, not its base's). The
   * field held in the other file is removed from there, and the object's
   * other modifications stay as read. The object is added to both files of
   * its kind when either lacks it, and a file the kind did not have is
   * created in format version 3. A value equal to its base's is kept as a
   * modification. An integer is checked to fit 32 bits, a real is stored as
   * its nearest 32-bit value, and a string, written as literal UTF-8, is
   * checked to hold no NUL byte. A localizable string (a name, a tooltip)
   * is written as a `TRIGSTR_nnn` reference and its `STRING n` block in
   * `war3map.wts`: into the string it references when nothing else does,
   * the Object data or another file of the map folder, else into a new one,
   * numbered one above every number in use and appended with the World
   * Editor's comment line; it is checked to hold no NUL byte, no CR and no
   * line that is `}` alone. A string the edit leaves unreferenced is
   * removed when nothing else references it. Nothing is written until
   * {@link ObjectDataEditor.save}.
   *
   * @param field - The object and field to set: Object kind, Rawcode,
   *   field id, and level and data pointer where the kind has them.
   * @param value - Its value: an integer, a real or a string, as its type
   *   is.
   * @param options - The value type of a field the field table does not
   *   know.
   * @throws {@link ObjectDataWriterError} With the reason
   *   `"builtins-missing"`, when `reforged-builtins` or its field table
   *   could not be read; `"file-not-read"`, when the readers left out a file
   *   of the kind; `"unknown-object"`, when the kind holds no object of the
   *   Rawcode and no Built-in object has it; `"unknown-field"`, when the
   *   field table does not know the field and no type was given;
   *   `"field-held-twice"`, when a file holds the field twice for the
   *   object; `"invalid-value"`, when the value, its type, the level or the
   *   data pointer is not one the file can hold. Nothing is changed.
   */
  setField(
    field: ObjectDataField,
    value: number | string,
    options?: ObjectDataSetFieldOptions,
  ): void;
  /**
   * Removes a field of an object, from both files of its kind, so that it
   * goes back to its base's value on the next save.
   *
   * @remarks
   * The object's other modifications stay as read, and its entries stay in
   * both files. A `STRING n` of `war3map.wts` the field referenced is
   * removed when no other modification of the Object data and no other
   * file of the map folder references it. A field the object does not hold
   * is no change. Nothing is written until {@link ObjectDataEditor.save}.
   *
   * @param field - The object and field to remove: Object kind, Rawcode,
   *   field id, and level and data pointer where the kind has them.
   * @throws {@link ObjectDataWriterError} With the reason
   *   `"builtins-missing"`, `"file-not-read"`, `"unknown-object"`,
   *   `"field-held-twice"` or `"invalid-value"`, as
   *   {@link ObjectDataEditor.setField} does. Nothing is changed.
   */
  removeField(field: ObjectDataField): void;
  /**
   * Saves the Object data to the map folder it opened, or to another
   * folder.
   *
   * @remarks
   * Every file is encoded first. A save to the map folder compares the bytes
   * on disk of each file it would rewrite with the bytes it read, and
   * refuses on any difference; a save to another folder, created when
   * missing, picks each file whose bytes differ from that folder's. Then,
   * before the first write, it runs the World Editor check
   * ({@link checkWorldEditor}) on the folder saved to, unless it is off: a
   * World Editor showing unsaved edits for that folder refuses the save
   * when a file would be written, and a failed check refuses it always.
   * Then it writes only the files whose bytes change. A file the readers
   * left out (truncated, of an unknown format version, an object with more
   * than one set) is never rewritten: a save to another folder copies its
   * bytes. Reloading the map in a World Editor that holds it
   * (`-launch -loadfile`) is the caller's.
   *
   * @param folder - The folder to save to; the map folder when left out.
   * @param options - Whether to run the World Editor check, and how.
   * @returns The files written, and what the World Editor showed of the
   *   folder.
   * @throws {@link ObjectDataWriterError} With the reason
   *   `"changed-on-disk"`, when a file it would rewrite in the map folder
   *   changed since it was read; `"modified-in-world-editor"`, when a World
   *   Editor shows unsaved edits for the folder and a file would be
   *   written; `"world-editor-check-failed"`, when the World Editor check
   *   could not read the windows' titles. Nothing is written.
   */
  save(folder?: string, options?: ObjectDataSaveOptions): ObjectDataSaveResult;
}

/**
 * Opens a map folder's Object data and `war3map.wts`, to list and save its
 * objects.
 *
 * @remarks
 * The Object data files of the seven Object kinds and their Skin files are
 * read in format versions 1, 2 and 3, and `war3map.wts`, by the readers of
 * {@link generateObjects}; what they read is kept losslessly, so a save
 * with no edit gives back the same bytes. The field table of
 * `reforged-builtins`, which every edit needs, is read from the Map
 * project's installation, its newest Game version; without it, listing and
 * a save with no edit still work. Files are read only through
 * Node's `fs`, which shares delete, one whole-file read per file: no file
 * stays open.
 *
 * @param mapFolder - The path of the map folder, saved as a folder by the
 *   World Editor. It need not hold `war3map.lua`.
 * @param options - Where `reforged-builtins` is resolved from.
 * @returns The editor of the map folder's Object data.
 * @throws {@link MapFolderError} When the map folder is missing.
 */
export function openObjectData(
  mapFolder: string,
  options: ObjectDataEditorOptions = {},
): ObjectDataEditor {
  checkMapFolder(mapFolder);
  const model = createModel();
  readObjectData(mapFolder, OBJECT_KINDS, model);
  readWar3mapWts(mapFolder, model);
  const projectRoot = options.projectRoot ?? mapFolder;
  const builtins = loadBuiltins(projectRoot);
  const fields = loadFieldTable(projectRoot);
  const tables: EditTables =
    "missing" in fields
      ? fields
      : "missing" in builtins
        ? builtins
        : { fields: fields.table, builtins: builtins.index };
  return new Editor(
    mapFolder,
    model,
    "index" in builtins ? builtins.index : undefined,
    tables,
  );
}

class Editor implements ObjectDataEditor {
  readonly mapFolder: string;
  readonly warnings: readonly string[];
  readonly #model: MapFolderModel;
  readonly #builtins: BuiltinsIndex | undefined;
  readonly #tables: EditTables;
  readonly #strings: StringSources;

  constructor(
    mapFolder: string,
    model: MapFolderModel,
    builtins: BuiltinsIndex | undefined,
    tables: EditTables,
  ) {
    this.mapFolder = mapFolder;
    this.#model = model;
    this.#builtins = builtins;
    this.#tables = tables;
    // Read once, at the first edit that needs it: the files it reads are
    // ones the editor never writes.
    let foreign: ReadonlySet<number> | undefined;
    this.#strings = {
      foreignReferences: () =>
        (foreign ??= foreignReferences(mapFolder, model)),
    };
    mapFolderObjects(model, { builtins });
    this.warnings = [...model.warnings];
  }

  setField(
    field: ObjectDataField,
    value: number | string,
    options: ObjectDataSetFieldOptions = {},
  ): void {
    setField(
      this.#model,
      this.#tables,
      this.#strings,
      field,
      value,
      options.type,
    );
  }

  removeField(field: ObjectDataField): void {
    removeField(this.#model, this.#tables, this.#strings, field);
  }

  objects(kind?: ObjectKind): ObjectDataObject[] {
    // A model of its own warnings, so that listing adds none to the editor's.
    const model = { ...this.#model, warnings: [] };
    const { objects } = mapFolderObjects(model, { builtins: this.#builtins });
    return objects
      .filter((object) => kind === undefined || object.kind === kind)
      .map((object) => this.#object(object));
  }

  #object(object: MapFolderObject): ObjectDataObject {
    const table = object.origin === "custom" ? "custom" : "original";
    const modifications: ObjectDataModification[] = [];
    for (const file of this.#model.objectData) {
      if (file.kind !== object.kind) continue;
      for (const entry of file[table]) {
        const rawcode = table === "custom" ? entry.custom : entry.original;
        if (rawcode !== object.rawcode) continue;
        for (const modification of entry.sets.flatMap(
          (set) => set.modifications,
        )) {
          const { field, type, level, dataPointer, value } = modification;
          modifications.push({
            field,
            type,
            ...(level !== undefined && { level }),
            ...(dataPointer !== undefined && { dataPointer }),
            value:
              typeof value === "string"
                ? (resolveString(value, this.#model) ?? value)
                : value,
            stored: value,
            file: file.name,
          });
        }
      }
    }
    return {
      kind: object.kind,
      origin: object.origin,
      rawcode: object.rawcode,
      ...(object.origin === "custom" && { base: object.base }),
      name:
        object.origin === "custom"
          ? object.name
          : (object.name ?? object.builtin?.name),
      modifications,
    };
  }

  save(
    folder?: string,
    options: ObjectDataSaveOptions = {},
  ): ObjectDataSaveResult {
    // Each kind's base file then its Skin file, then war3map.wts: those
    // read, and those an edit created.
    const files = [...objectDataFileNames(), WTS_FILE]
      .filter(
        (name) =>
          this.#model.files.has(name) ||
          this.#model.objectData.some((file) => file.name === name) ||
          (name === WTS_FILE && this.#model.wts !== undefined),
      )
      .map((name) => {
        const read = this.#model.files.get(name);
        return { name, read, encoded: this.#encode(name, read) };
      });
    const { worldEditorCheck = true } = options;
    return writeMapFiles(
      this.mapFolder,
      folder ?? this.mapFolder,
      files,
      worldEditorCheck === true ? {} : worldEditorCheck || undefined,
    );
  }

  /** The bytes of a file the editor read: encoded from the model, or as read when the readers left it out. */
  #encode(name: string, read: Uint8Array | undefined): Uint8Array {
    const file = this.#model.objectData.find((other) => other.name === name);
    if (file !== undefined) return encodeObjectDataFile(file);
    if (name === WTS_FILE && this.#model.wts !== undefined) {
      return encodeWts(this.#model.wts);
    }
    if (read === undefined) throw new Error(`unreachable: ${name} not read`);
    return read;
  }
}

/** One file a save covers: its name, the bytes read (undefined when the map folder had none) and the bytes encoded. */
export interface MapFileWrite {
  readonly name: string;
  readonly read: Uint8Array | undefined;
  readonly encoded: Uint8Array;
}

/**
 * Writes the files whose bytes change into `target`, and returns their
 * names and the World Editor's state. In the map folder, a file changes
 * when its encoded bytes differ from those read, and every such file's
 * bytes on disk must still be those read, or nothing is written; in another
 * folder, when they differ from that folder's. Then the World Editor check
 * runs on `target`, unless `worldEditorCheck` is undefined: "modified"
 * refuses when a file changes, and a failed check always does.
 */
export function writeMapFiles(
  mapFolder: string,
  target: string,
  files: readonly MapFileWrite[],
  worldEditorCheck?: WorldEditorCheckOptions,
): ObjectDataSaveResult {
  const own = sameFolder(mapFolder, target);
  const changed = files.filter(({ name, read, encoded }) => {
    const baseline = own ? read : readMapFile(target, name);
    return baseline === undefined || !sameBytes(baseline, encoded);
  });
  if (own) {
    for (const { name, read } of changed) {
      const disk = readMapFile(mapFolder, name);
      const same =
        disk === undefined || read === undefined
          ? disk === read
          : sameBytes(disk, read);
      if (!same) {
        throw new ObjectDataWriterError(
          "changed-on-disk",
          `${name} changed on disk since the map folder was opened (by a World Editor save?): nothing was written. Open the map folder again and make the edits again.`,
          name,
        );
      }
    }
  }
  const worldEditor =
    worldEditorCheck === undefined
      ? undefined
      : checkWorldEditor(target, worldEditorCheck);
  if (worldEditor === "modified" && changed.length > 0) {
    throw new ObjectDataWriterError(
      "modified-in-world-editor",
      `The World Editor shows unsaved edits for ${target} (its title ends in " *]"): nothing was written. ` +
        `Save or discard them in the World Editor first, then save again.`,
    );
  }
  if (changed.length > 0) fs.mkdirSync(target, { recursive: true });
  for (const { name, encoded } of changed) {
    fs.writeFileSync(path.join(target, name), encoded);
  }
  return { written: changed.map(({ name }) => name), worldEditor };
}

/** Whether two paths name one folder: resolved, and through their real paths when both exist. */
function sameFolder(a: string, b: string): boolean {
  if (path.resolve(a) === path.resolve(b)) return true;
  try {
    return fs.realpathSync.native(a) === fs.realpathSync.native(b);
  } catch {
    return false;
  }
}
