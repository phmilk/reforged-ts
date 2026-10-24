// Object adoption (#709; #700, "Object adoption and release"; #484): hand
// objects of the map folder to the code. Each adopted object gets a
// definition file under the definitions folder holding every modification
// the map folder holds, and an owned entry in the Object manifest with its
// current snapshot, so that the next Object sync finds it clean and writes
// no byte. The map folder is never written.

import fs from "node:fs";
import path from "node:path";
import {
  loadBuiltins,
  loadFieldTable,
  type FieldEntry,
  type FieldTable,
} from "./builtins.js";
import { NAME_FIELDS } from "./definitions-check.js";
import {
  ObjectDefinitionsError,
  definitionsError,
  type ObjectDefinitionProblem,
} from "./definitions-error.js";
import { displayPath } from "./definitions-loader.js";
import {
  loadObjectDefinitions,
  objectsByKey,
  projectPaths,
  type DefinedObject,
  type ObjectDefinitionsOptions,
} from "./definitions.js";
import { checkMapFolder } from "./map-folder.js";
import { OBJECT_KINDS, type ObjectKind } from "./model.js";
import { constantName } from "./names.js";
import { openObjectData, type ObjectDataObject } from "./object-data-editor.js";
import {
  byKindThenRawcode,
  objectKey,
  readObjectManifest,
  snapshotOf,
  writeObjectManifest,
  type ObjectSnapshot,
  type SnapshotModification,
} from "./object-manifest.js";
import {
  checkWorldEditor,
  type WorldEditorCheckOptions,
  type WorldEditorState,
} from "./world-editor.js";
import { ObjectDataWriterError } from "./writer-error.js";

/** The options of {@link adoptObjects}. */
export interface ObjectAdoptionOptions extends ObjectDefinitionsOptions {
  /**
   * Whether to adopt while the World Editor shows unsaved edits for the
   * map folder (` *]`): the objects are then adopted as the map folder
   * holds them on disk, without the World Editor check. False when left
   * out.
   */
  force?: boolean;
  /** How to run the World Editor check before the first write: injected window titles, a timeout. */
  worldEditorCheck?: WorldEditorCheckOptions;
}

/** What {@link adoptObjects} returns: the objects adopted, and what it wrote. */
export interface ObjectAdoptionReport {
  /** The objects adopted, by Object kind then Rawcode, each with its new definition file. */
  readonly adopted: readonly DefinedObject[];
  /** The definition files written, absolute paths, in the order of `adopted`: format them with the Map project's Prettier. */
  readonly files: readonly string[];
  /** Whether it wrote the Object manifest, which it does only when its bytes change. */
  readonly manifestWritten: boolean;
  /** What the World Editor showed of the map folder before the first write; undefined with `force`, or when nothing was adopted. */
  readonly worldEditor: WorldEditorState | undefined;
  /** Author-facing warnings, each one line: a field adopted through the raw escape. */
  readonly warnings: readonly string[];
}

/** The `define<Kind>` function of each Object kind. */
const DEFINE: Readonly<Record<ObjectKind, string>> = {
  unit: "defineUnit",
  item: "defineItem",
  ability: "defineAbility",
  buff: "defineBuff",
  destructable: "defineDestructable",
  doodad: "defineDoodad",
  upgrade: "defineUpgrade",
};

/** The kinds whose modifications store a level and a data pointer. */
const LEVELLED_KINDS: ReadonlySet<ObjectKind> = new Set([
  "ability",
  "doodad",
  "upgrade",
]);

/** An `<kind>:<rawcode>` argument, naming the kind of a Rawcode two kinds share. */
const KIND_AND_RAWCODE = new RegExp(`^(${OBJECT_KINDS.join("|")}):(.{4})$`);

/**
 * A text an adopted definition sets: the default text, and, where the map's
 * `_Locales` translate it, its translations.
 */
interface AdoptedText {
  readonly text: string;
  readonly translations?: Readonly<Record<string, string>>;
}

/** An object to adopt, its definition rendered. */
interface Adoption {
  readonly object: ObjectDataObject;
  readonly snapshot: ObjectSnapshot;
  readonly file: string;
  readonly source: string;
  readonly warnings: readonly string[];
}

/**
 * Hands objects of the map folder to the code: Object adoption,
 * `pnpm objects:adopt`. Each object gets a definition file and an owned
 * entry in the Object manifest; the map folder is left byte for byte as it
 * was.
 *
 * @remarks
 * An object is adoptable when it is a Custom object, or a Built-in object
 * the map folder changes, that the code neither owns (the Object manifest
 * has it) nor defines (a definition names its Rawcode in its kind).
 * `"all"` adopts every adoptable object. A Rawcode adopts the object of
 * the map folder at it; one two kinds share, such as a Custom buff and a
 * Custom destructable at `B000`, names its kind, `buff:B000`.
 *
 * Each object is written to `<definitions folder>/<kind>/<Name>_<rawcode>.ts`,
 * named by the rule of the generated constants from the name the map
 * folder gives it (a renamed Built-in object by its new name), exporting
 * one `define<Kind>` call of that name. It holds the explicit Rawcode, a
 * Custom object's base as `FourCC("hfoo")`, and every modification the map
 * folder holds, a value equal to the base's included: the name field
 * first, then the fields by field id, a levelled field as a record from
 * level to value. A string is its text, a `TRIGSTR` resolved; a flag is a
 * boolean; a reference to an object is `FourCC("A000")`, whoever owns it,
 * since adoption does not follow references; a list of references is an
 * array of them. A field the field table of `reforged-builtins` does not
 * know goes through the raw escape, with its value type, a comment and a
 * warning. A localizable text that a locale's table in `_Locales/`
 * translates is a localized value, `localized("Captain", { deDE:
 * "Hauptmann" })`, with the text of each locale whose table holds another
 * text than the default under its number.
 *
 * The Object manifest records each adopted object with its current
 * snapshot, as Object sync records what it wrote, so that the next sync
 * finds it clean and writes no byte; a removed entry at its Rawcode goes.
 * The files are written unformatted but valid: the caller formats them
 * with the Map project's Prettier.
 *
 * @param mapFolder - The map folder, saved as a folder by the World Editor.
 * @param projectRoot - The Map project's root, from which the definitions
 *   folder, the Object manifest, `typescript` and `reforged-builtins` are
 *   found.
 * @param rawcodes - The Rawcodes to adopt (`h000`, or `buff:B000` for a
 *   Rawcode two kinds share), or `"all"` for every adoptable object.
 * @param options - The definitions folder, the generated folder, the
 *   Object manifest, `force` and the World Editor check's options.
 * @returns The objects adopted, the files written, whether the manifest was
 *   written, the World Editor's state and the warnings.
 * @throws {@link ObjectDefinitionsError} With the reason `"not-adoptable"`,
 *   when a Rawcode names an object the code owns or defines, a Built-in
 *   object the map folder does not change, no object of the map folder, or
 *   an object of two kinds without naming its kind, one problem per
 *   Rawcode, or an object holding a value no definition can hold (a flag
 *   that is not 0 or 1, a value outside its enumeration, a field held
 *   twice), one problem per field; `"target-exists"`, when a definition file to write exists; or
 *   the reasons of loading the definitions: `"load-failed"`,
 *   `"invalid-definition"`, `"defined-twice"`, `"manifest-unreadable"` and
 *   `"peer-missing"`. Nothing is written.
 * @throws {@link ObjectDataWriterError} With the reason
 *   `"modified-in-world-editor"`, without `force`, when the World Editor
 *   shows unsaved edits for the map folder: save or discard them there
 *   first; `"world-editor-check-failed"`, when the check could not read
 *   the windows' titles; `"builtins-missing"`, when `reforged-builtins`
 *   cannot be read. Nothing is written.
 * @throws {@link MapFolderError} When the map folder is missing.
 */
export function adoptObjects(
  mapFolder: string,
  projectRoot: string,
  rawcodes: readonly string[] | "all",
  options: ObjectAdoptionOptions = {},
): ObjectAdoptionReport {
  checkMapFolder(mapFolder);
  const paths = projectPaths(projectRoot, options);
  const loaded = loadObjectDefinitions(paths);
  const manifest = readObjectManifest(paths.manifest, paths.projectRoot);
  const fields = loadFieldTable(paths.projectRoot);
  if ("missing" in fields) {
    throw definitionsError(
      "peer-missing",
      `reforged-builtins ${fields.missing}: Object adoption needs its field table of format 2. Install a newer reforged-builtins in the Map project.`,
    );
  }
  const { table } = fields;
  if (table.format !== 2) {
    throw definitionsError(
      "peer-missing",
      `reforged-builtins has a field table of format ${String(table.format)} for Game version ${table.gameVersion}: Object adoption needs the field table of format 2, with each field's category. Install a newer reforged-builtins in the Map project.`,
    );
  }
  const builtins = loadBuiltins(paths.projectRoot);
  const builtinKind = (rawcode: string): string | undefined =>
    "index" in builtins && Object.hasOwn(builtins.index.objects, rawcode)
      ? builtins.index.objects[rawcode].kind
      : undefined;
  const editor = openObjectData(mapFolder, { projectRoot: paths.projectRoot });
  const present = objectsByKey(editor);
  const owned = new Set(manifest.owned.map(objectKey));
  const defined = new Map(
    (loaded?.definitions ?? []).map((definition) => [
      objectKey(definition),
      definition.file,
    ]),
  );
  const adoptable = (object: ObjectDataObject): boolean =>
    !owned.has(objectKey(object)) &&
    !defined.has(objectKey(object)) &&
    (object.origin === "custom" || object.modifications.length > 0);

  const problems: ObjectDefinitionProblem[] = [];
  const chosen = new Map<string, ObjectDataObject>();
  if (rawcodes === "all") {
    for (const object of present.values()) {
      if (adoptable(object)) chosen.set(objectKey(object), object);
    }
  } else {
    for (const argument of rawcodes) {
      const found = findObject(
        argument,
        present,
        owned,
        defined,
        builtinKind,
        paths.projectRoot,
      );
      if ("problem" in found) problems.push(found.problem);
      else chosen.set(objectKey(found.object), found.object);
    }
  }
  if (problems.length > 0) {
    throw new ObjectDefinitionsError("not-adoptable", problems);
  }

  const objects = [...chosen.values()].sort(byKindThenRawcode);
  const adoptions: Adoption[] = [];
  const unwritable: ObjectDefinitionProblem[] = [];
  const existing: ObjectDefinitionProblem[] = [];
  for (const object of objects) {
    const file = path.join(
      paths.definitionsFolder,
      object.kind,
      `${exportName(object)}.ts`,
    );
    const rendered = renderDefinition(object, table, paths.projectRoot, file);
    if ("problems" in rendered) {
      unwritable.push(...rendered.problems);
      continue;
    }
    if (fs.existsSync(file)) {
      existing.push({
        file,
        rawcode: object.rawcode,
        field: undefined,
        message: `${displayPath(paths.projectRoot, file)} exists: adoption never overwrites a file. Move or rename it, then adopt the ${object.kind} ${object.rawcode} again.`,
      });
      continue;
    }
    adoptions.push({
      object,
      snapshot: snapshotOf(object),
      file,
      source: rendered.source,
      warnings: rendered.warnings,
    });
  }
  if (unwritable.length > 0) {
    throw new ObjectDefinitionsError("not-adoptable", unwritable);
  }
  if (existing.length > 0) {
    throw new ObjectDefinitionsError("target-exists", existing);
  }
  if (adoptions.length === 0) {
    return {
      adopted: [],
      files: [],
      manifestWritten: false,
      worldEditor: undefined,
      warnings: [],
    };
  }

  let worldEditor: WorldEditorState | undefined;
  if (options.force !== true) {
    worldEditor = checkWorldEditor(mapFolder, options.worldEditorCheck ?? {});
    if (worldEditor === "modified") {
      throw new ObjectDataWriterError(
        "modified-in-world-editor",
        `The World Editor shows unsaved edits for ${mapFolder} (its title ends in " *]"): nothing was adopted. Save or discard them in the World Editor first, then adopt again, or adopt with force to adopt what the map folder holds on disk.`,
      );
    }
  }

  for (const { file, source } of adoptions) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, source, { flag: "wx" });
  }
  const adopted = new Set(adoptions.map(({ object }) => objectKey(object)));
  const manifestWritten = writeObjectManifest(paths.manifest, {
    owned: [...manifest.owned, ...adoptions.map(({ snapshot }) => snapshot)],
    removed: manifest.removed.filter((entry) => !adopted.has(objectKey(entry))),
  });
  return {
    adopted: adoptions.map(({ object, file }) => ({
      kind: object.kind,
      rawcode: object.rawcode,
      base: object.base,
      file,
    })),
    files: adoptions.map(({ file }) => file),
    manifestWritten,
    worldEditor,
    warnings: adoptions.flatMap(({ warnings }) => warnings),
  };
}

/** The object of the map folder a Rawcode argument names, or why it is not adoptable. */
function findObject(
  argument: string,
  present: ReadonlyMap<string, ObjectDataObject>,
  owned: ReadonlySet<string>,
  defined: ReadonlyMap<string, string>,
  builtinKind: (rawcode: string) => string | undefined,
  projectRoot: string,
): { object: ObjectDataObject } | { problem: ObjectDefinitionProblem } {
  const named = KIND_AND_RAWCODE.exec(argument);
  const kind = named?.[1] as ObjectKind | undefined;
  const rawcode = named?.[2] ?? argument;
  const problem = (message: string, file?: string) => ({
    problem: { file, rawcode, field: undefined, message },
  });
  const kinds = kind === undefined ? OBJECT_KINDS : [kind];
  const candidates = kinds
    .map((each) => present.get(objectKey({ kind: each, rawcode })))
    .filter((object) => object !== undefined);
  const claimed = kinds.map((each) => objectKey({ kind: each, rawcode }));
  if (candidates.length > 1) {
    const [first, second] = candidates;
    return problem(
      `The map folder holds a ${first.kind} and a ${second.kind} at ${rawcode}: name the kind of the one to adopt, ${first.kind}:${rawcode} or ${second.kind}:${rawcode}.`,
    );
  }
  const object = candidates.at(0);
  const key =
    object === undefined
      ? claimed.find((each) => owned.has(each) || defined.has(each))
      : objectKey(object);
  if (key !== undefined) {
    const file = defined.get(key);
    if (file !== undefined) {
      return problem(
        `${displayPath(projectRoot, file)} defines the ${key} already: it cannot be adopted. Remove that definition to adopt the map folder's object, or give the definition another Rawcode.`,
        file,
      );
    }
    if (owned.has(key)) {
      return problem(
        `The ${key} is in the Object manifest: the code owns it already. Change its definition, or restore it from git if it was deleted.`,
      );
    }
  }
  const builtin = builtinKind(rawcode) as ObjectKind | undefined;
  if (
    object === undefined &&
    builtin !== undefined &&
    (kind ?? builtin) === builtin
  ) {
    return problem(unchanged(builtin, rawcode));
  }
  if (object === undefined) {
    return problem(
      kind === undefined
        ? `The map folder holds no object ${rawcode} of any kind. Check the Rawcode.`
        : `The map folder holds no ${kind} ${rawcode}. Check the Rawcode and the kind.`,
    );
  }
  if (object.origin === "modified" && object.modifications.length === 0) {
    return problem(unchanged(object.kind, object.rawcode));
  }
  return { object };
}

/** The refusal of a Built-in object the map folder does not change. */
function unchanged(kind: ObjectKind, rawcode: string): string {
  return `The map folder does not change the Built-in ${kind} ${rawcode}: there is nothing to adopt. Define the change in code with ${DEFINE[kind]}({ rawcode: "${rawcode}", fields: { ... } }) instead.`;
}

/**
 * The name of an adopted object's export and file: its constant's name,
 * from the name the map folder gives it. A Rawcode that cannot end an
 * identifier is spelt by its bytes in hex.
 */
function exportName(object: ObjectDataObject): string {
  const name = constantName(object.name, object.rawcode);
  if (name !== undefined) return name;
  const stem = (constantName(object.name, "____") ?? "").slice(0, -5);
  const hex = Array.from({ length: object.rawcode.length }, (_, index) =>
    object.rawcode.charCodeAt(index).toString(16).padStart(2, "0"),
  ).join("");
  return `${stem}_x${hex}`;
}

/** Compares two strings by UTF-16 code unit. */
function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * The source of an adopted object's definition file, or why a modification
 * cannot be written as a definition the build would accept as it is.
 */
function renderDefinition(
  object: ObjectDataObject,
  table: FieldTable,
  projectRoot: string,
  file: string,
):
  | { source: string; warnings: string[] }
  | { problems: ObjectDefinitionProblem[] } {
  const { kind, rawcode } = object;
  const levelled = LEVELLED_KINDS.has(kind);
  const entries = table.fields[kind] ?? {};
  const shown = displayPath(projectRoot, file);
  const problems: ObjectDefinitionProblem[] = [];
  const warnings: string[] = [];
  const known = new Map<
    string,
    { entry: FieldEntry; values: [number, string][] }
  >();
  const raw: string[] = [];
  const seen = new Set<string>();
  for (const modification of snapshotOf(object).modifications) {
    const { field } = modification;
    const at = `${field} ${String(modification.level ?? 0)} ${String(modification.dataPointer ?? 0)}`;
    const problem = (message: string) =>
      problems.push({
        file: undefined,
        rawcode,
        field,
        message: `The ${kind} ${rawcode}'s field ${field}${modification.level === undefined || modification.level === 0 ? "" : ` at level ${String(modification.level)}`} ${message}, which an Object definition cannot hold. Fix it in the World Editor, then adopt the object again.`,
      });
    if (seen.has(at)) {
      problem("is held twice");
      continue;
    }
    seen.add(at);
    const entry = Object.hasOwn(entries, field) ? entries[field] : undefined;
    if (entry === undefined) {
      if (
        typeof modification.value === "string" &&
        modification.type !== "string"
      ) {
        problem(`holds the real ${modification.value}, not a finite number`);
        continue;
      }
      raw.push(
        `    // ${field} is not in the field table of reforged-builtins (Game version ${table.gameVersion}): adopted through the raw escape.`,
        `    { field: ${JSON.stringify(field)}, type: ${JSON.stringify(modification.type)}, ${levelled ? `level: ${String(modification.level ?? 0)}, dataPointer: ${String(modification.dataPointer ?? 0)}, ` : ""}value: ${literal(modification.value)} },`,
      );
      warnings.push(
        `${shown}, ${kind} ${rawcode}, field ${field}: the field table of reforged-builtins (Game version ${table.gameVersion}) does not know it, so it was adopted through the raw escape with its value type. Check it, and move it to fields once a newer reforged-builtins knows it.`,
      );
      continue;
    }
    if (modification.type !== entry.type) {
      problem(
        `stores a value of type ${modification.type} where the field table of reforged-builtins says ${entry.type}`,
      );
      continue;
    }
    if (levelled && (modification.dataPointer ?? 0) !== (entry.data ?? 0)) {
      problem(
        `has the data pointer ${String(modification.dataPointer ?? 0)} where the field table of reforged-builtins says ${String(entry.data ?? 0)}`,
      );
      continue;
    }
    const level = modification.level ?? 0;
    if (!entry.levels && level !== 0) {
      problem("has a level, and the field holds one value");
      continue;
    }
    const value = valueSource(entry, table, modification, {
      text: String(modification.value),
      ...(modification.translations !== undefined && {
        translations: modification.translations,
      }),
    });
    if (typeof value !== "string") {
      problem(value.problem);
      continue;
    }
    const held = known.get(field);
    if (held === undefined)
      known.set(field, { entry, values: [[level, value]] });
    else held.values.push([level, value]);
  }
  if (problems.length > 0) return { problems };

  const ids = [...known.keys()].sort((a, b) => {
    const name = Number(NAME_FIELDS.has(b)) - Number(NAME_FIELDS.has(a));
    return name !== 0 ? name : compare(a, b);
  });
  const usesLocalized = [...known.values()].some(({ values }) =>
    values.some(([, each]) => each.startsWith("localized(")),
  );
  const lines = [
    `import { ${DEFINE[kind]}${usesLocalized ? ", localized" : ""} } from "reforged-map/objects";`,
    "",
    `export const ${path.basename(file, ".ts")} = ${DEFINE[kind]}({`,
    `  rawcode: ${JSON.stringify(rawcode)},`,
  ];
  if (object.base !== undefined) {
    lines.push(`  base: FourCC(${JSON.stringify(object.base)}),`);
  }
  if (ids.length > 0) {
    lines.push("  fields: {");
    for (const id of ids) {
      const { entry, values } = known.get(id) as {
        entry: FieldEntry;
        values: [number, string][];
      };
      const value = entry.levels
        ? `{ ${values
            .sort(([a], [b]) => a - b)
            .map(([level, each]) => `${String(level)}: ${each}`)
            .join(", ")} }`
        : values[0][1];
      lines.push(`    ${propertyName(id)}: ${value},`);
    }
    lines.push("  },");
  }
  if (raw.length > 0) lines.push("  raw: [", ...raw, "  ],");
  lines.push("});", "");
  return { source: lines.join("\n"), warnings };
}

/** A field id as a property name: bare when it is an identifier. */
function propertyName(id: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(id) ? id : JSON.stringify(id);
}

/** A number or a string as TypeScript source. */
function literal(value: number | string): string {
  return typeof value === "string" ? JSON.stringify(value) : String(value);
}

/** A text as TypeScript source: a string, or, with translations, a localized value. */
function textSource(text: AdoptedText): string {
  const translations = Object.entries(text.translations ?? {});
  if (translations.length === 0) return JSON.stringify(text.text);
  return `localized(${JSON.stringify(text.text)}, { ${translations
    .map(([locale, each]) => `${propertyName(locale)}: ${JSON.stringify(each)}`)
    .join(", ")} })`;
}

/** A Rawcode as TypeScript source, `FourCC("A000")`; undefined when it is not four printable characters. */
function rawcodeSource(code: string): string | undefined {
  return /^[\x20-\x7e]{4}$/.test(code)
    ? `FourCC(${JSON.stringify(code)})`
    : undefined;
}

/**
 * One value of a field as TypeScript source, by the field's category, so
 * that a definition holding it stores the same value; or why it cannot.
 */
function valueSource(
  entry: FieldEntry,
  table: FieldTable,
  modification: SnapshotModification,
  text: AdoptedText,
): string | { problem: string } {
  const { value } = modification;
  const enumeration =
    entry.metaType === undefined
      ? undefined
      : table.enumerations?.[entry.metaType];
  switch (entry.category) {
    case "boolean":
      if (value === 0) return "false";
      if (value === 1) return "true";
      return { problem: `holds ${literal(value)}, not a flag of 0 or 1` };
    case "enumeration": {
      const allowed: readonly unknown[] | undefined =
        enumeration === undefined
          ? undefined
          : entry.type === "string"
            ? ["", ...enumeration]
            : enumeration;
      if (allowed !== undefined && !allowed.includes(value)) {
        return {
          problem: `holds ${literal(value)}, not a value of the enumeration ${entry.metaType ?? ""}`,
        };
      }
      return literal(value);
    }
    case "rawcode": {
      if (value === "") return '""';
      const source =
        typeof value === "string" ? rawcodeSource(value) : undefined;
      return source ?? { problem: `holds ${literal(value)}, not a Rawcode` };
    }
    case "rawcodeList": {
      if (value === "") return "[]";
      const items =
        typeof value === "string" ? value.split(",").map(rawcodeSource) : [];
      if (items.length === 0 || items.some((item) => item === undefined)) {
        return {
          problem: `holds ${literal(value)}, not a list of Rawcodes separated by commas`,
        };
      }
      return `[${items.join(", ")}]`;
    }
    case "stringList": {
      if (typeof value !== "string") {
        return { problem: `holds ${literal(value)}, not a list of strings` };
      }
      if (value === "") return "[]";
      const items = value.split(",");
      const wrong =
        enumeration === undefined
          ? undefined
          : items.find(
              (item) => !(enumeration as readonly unknown[]).includes(item),
            );
      if (wrong !== undefined) {
        return {
          problem: `holds ${JSON.stringify(wrong)}, not a value of the enumeration ${entry.metaType ?? ""}`,
        };
      }
      return `[${items.map((item) => JSON.stringify(item)).join(", ")}]`;
    }
    case "text":
      if (typeof value !== "string") {
        return { problem: `holds ${literal(value)}, not a text` };
      }
      return entry.localizable ? textSource(text) : JSON.stringify(value);
    case "number":
    case undefined:
    default:
      if (entry.type !== "string" && typeof value === "string") {
        return { problem: `holds the real ${value}, not a finite number` };
      }
      return literal(value);
  }
}
