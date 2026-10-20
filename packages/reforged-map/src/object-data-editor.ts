// The Object data editor (ADR 0015): opens a map folder's Object data and
// war3map.wts through the readers, lists its objects, and saves them, to
// the map folder or to another folder, through the writer. Files are read
// and written only through Node's fs, which opens them with delete sharing
// on Windows (#475): one whole-file read or write per call, no handle held
// across calls, no lock and no watcher.

import fs from "node:fs";
import path from "node:path";
import { loadBuiltins, type BuiltinsIndex } from "./builtins.js";
import { checkMapFolder, readMapFile } from "./map-folder.js";
import {
  OBJECT_KINDS,
  createModel,
  type MapFolderModel,
  type ObjectKind,
  type ValueType,
} from "./model.js";
import { readObjectData, sameBytes } from "./object-data.js";
import { encodeObjectDataFile, encodeWts } from "./object-data-writer.js";
import { mapFolderObjects, type MapFolderObject } from "./objects.js";
import { WTS_FILE, readWar3mapWts, resolveString } from "./war3map-wts.js";

/**
 * Why the Object data editor refused: `"changed-on-disk"`, a file it would
 * rewrite changed on disk since it was read.
 */
export type ObjectDataWriterErrorReason = "changed-on-disk";

/**
 * An edit or a save the Object data editor refuses. Its `reason` says
 * which, for a caller to switch on, and its message what the author does
 * next. Nothing is written when it is thrown.
 */
export class ObjectDataWriterError extends Error {
  /** `"ObjectDataWriterError"`, the error's name in a stack trace and in `String(error)`. */
  override name = "ObjectDataWriterError";
  /** Why the editor refused. */
  readonly reason: ObjectDataWriterErrorReason;
  /** The file of the map folder it is about (`war3map.w3u`), when it is about one. */
  readonly file: string | undefined;

  constructor(
    reason: ObjectDataWriterErrorReason,
    message: string,
    file?: string,
  ) {
    super(message);
    this.reason = reason;
    this.file = file;
  }
}

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
}

/** The options of {@link openObjectData}. */
export interface ObjectDataEditorOptions {
  /**
   * A folder of the Map project, from which `reforged-builtins` is
   * resolved as Node resolves a package. The map folder when left out.
   */
  projectRoot?: string;
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
   * Saves the Object data to the map folder it opened, or to another
   * folder.
   *
   * @remarks
   * Every file is encoded first. A save to the map folder compares the bytes
   * on disk of each file it would rewrite with the bytes it read, and
   * refuses on any difference; then it writes only the files whose bytes
   * change. A save to another folder, created when missing, writes each file
   * whose bytes differ from that folder's. A file the readers left out
   * (truncated, of an unknown format version, an object with more than one
   * set) is never rewritten: a save to another folder copies its bytes.
   *
   * @param folder - The folder to save to; the map folder when left out.
   * @returns The files written.
   * @throws {@link ObjectDataWriterError} With the reason
   *   `"changed-on-disk"`, when a file it would rewrite in the map folder
   *   changed since it was read; nothing is written.
   */
  save(folder?: string): ObjectDataSaveResult;
}

/**
 * Opens a map folder's Object data and `war3map.wts`, to list and save its
 * objects.
 *
 * @remarks
 * The Object data files of the seven Object kinds and their Skin files are
 * read in format versions 1, 2 and 3, and `war3map.wts`, by the readers of
 * {@link generateObjects}; what they read is kept losslessly, so a save
 * with no edit gives back the same bytes. Files are read only through
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
  const builtins = loadBuiltins(options.projectRoot ?? mapFolder);
  return new Editor(
    mapFolder,
    model,
    "index" in builtins ? builtins.index : undefined,
  );
}

class Editor implements ObjectDataEditor {
  readonly mapFolder: string;
  readonly warnings: readonly string[];
  readonly #model: MapFolderModel;
  readonly #builtins: BuiltinsIndex | undefined;

  constructor(
    mapFolder: string,
    model: MapFolderModel,
    builtins: BuiltinsIndex | undefined,
  ) {
    this.mapFolder = mapFolder;
    this.#model = model;
    this.#builtins = builtins;
    mapFolderObjects(model, { builtins });
    this.warnings = [...model.warnings];
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

  save(folder?: string): ObjectDataSaveResult {
    const files = [...this.#model.files].map(([name, read]) => ({
      name,
      read,
      encoded: this.#encode(name, read),
    }));
    return {
      written: writeMapFiles(this.mapFolder, folder ?? this.mapFolder, files),
    };
  }

  /** The bytes of a file the editor read: encoded from the model, or as read when the readers left it out. */
  #encode(name: string, read: Uint8Array): Uint8Array {
    const file = this.#model.objectData.find((other) => other.name === name);
    if (file !== undefined) return encodeObjectDataFile(file);
    if (name === WTS_FILE && this.#model.wts !== undefined) {
      return encodeWts(this.#model.wts);
    }
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
 * names. In the map folder, a file changes when its encoded bytes differ
 * from those read, and every such file's bytes on disk must still be those
 * read, or nothing is written; in another folder, when they differ from
 * that folder's.
 */
export function writeMapFiles(
  mapFolder: string,
  target: string,
  files: readonly MapFileWrite[],
): string[] {
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
  if (changed.length > 0) fs.mkdirSync(target, { recursive: true });
  for (const { name, encoded } of changed) {
    fs.writeFileSync(path.join(target, name), encoded);
  }
  return changed.map(({ name }) => name);
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
