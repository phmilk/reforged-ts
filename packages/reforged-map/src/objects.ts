// The map's objects, derived from the model's Object data, and the
// renderers of their generated files: the FourCC overloads and the
// constants modules, one per Object kind.

import type { BuiltinsIndex } from "./builtins.js";
import {
  OBJECT_KINDS,
  type MapFolderModel,
  type Modification,
  type ObjectDataFile,
  type ObjectKind,
} from "./model.js";
import { constantName, displayName, UNNAMED } from "./names.js";
import { resolveString } from "./war3map-wts.js";

/**
 * The name of each Object kind's constants object, of its objects in a
 * sentence, of its generated module, and of reforged-builtins' constants
 * object, exported from `reforged-builtins/<plural>`.
 */
export const KIND_CONSTANTS: Readonly<
  Record<
    ObjectKind,
    { object: string; plural: string; file: string; builtins: string }
  >
> = {
  unit: {
    object: "CustomUnits",
    plural: "units",
    file: "custom-units.ts",
    builtins: "Units",
  },
  item: {
    object: "CustomItems",
    plural: "items",
    file: "custom-items.ts",
    builtins: "Items",
  },
  ability: {
    object: "CustomAbilities",
    plural: "abilities",
    file: "custom-abilities.ts",
    builtins: "Abilities",
  },
  buff: {
    object: "CustomBuffs",
    plural: "buffs",
    file: "custom-buffs.ts",
    builtins: "Buffs",
  },
  destructable: {
    object: "CustomDestructables",
    plural: "destructables",
    file: "custom-destructables.ts",
    builtins: "Destructables",
  },
  doodad: {
    object: "CustomDoodads",
    plural: "doodads",
    file: "custom-doodads.ts",
    builtins: "Doodads",
  },
  upgrade: {
    object: "CustomUpgrades",
    plural: "upgrades",
    file: "custom-upgrades.ts",
    builtins: "Upgrades",
  },
};

/**
 * The fields that hold each kind's name, as the Object Editor shows it,
 * the first one set winning: the fields reforged-builtins' generator
 * locates from the kind's `*MetaData.slk`. A buff without an editor name
 * shows its tooltip's title; an upgrade's name is its first level's.
 */
const NAME_FIELDS: Readonly<Record<ObjectKind, readonly string[]>> = {
  unit: ["unam"],
  item: ["unam"],
  ability: ["anam"],
  buff: ["fnam", "ftip"],
  destructable: ["bnam"],
  doodad: ["dnam"],
  upgrade: ["gnam"],
};

/** One Custom object of the map. */
export interface CustomObject {
  readonly origin: "custom";
  readonly kind: ObjectKind;
  readonly rawcode: string;
  /** The Rawcode of the Built-in object it derives from. */
  readonly base: string;
  /** Its name, else its base's; undefined when neither is known. */
  readonly name: string | undefined;
  /** Its base's enUS name, when reforged-builtins is installed. */
  readonly baseName: string | undefined;
  /** Its constant's name, or undefined when its Rawcode cannot end an identifier. */
  readonly constant: string | undefined;
  /** Whether an object of another kind has its Rawcode. */
  readonly shared: boolean;
}

/** One Built-in object the map modifies. */
export interface ModifiedObject {
  readonly origin: "modified";
  readonly kind: ObjectKind;
  readonly rawcode: string;
  /** The map's name for it, when the map renames it: undefined when it sets none or the game's. */
  readonly name: string | undefined;
  /** What reforged-builtins' index holds of it: undefined when it is not installed or its index lacks the Rawcode. */
  readonly builtin:
    | {
        readonly gameVersion: string;
        readonly name: string | undefined;
        readonly constant: string | undefined;
      }
    | undefined;
  /** Whether an object of another kind has its Rawcode. */
  readonly shared: boolean;
}

/** One object of the map folder: a Custom object, or a Built-in object the map modifies. */
export type MapFolderObject = CustomObject | ModifiedObject;

/** An object before the kinds that share its Rawcode are known. */
type Unshared = Omit<CustomObject, "shared"> | Omit<ModifiedObject, "shared">;

/** What `mapFolderObjects` needs of reforged-builtins: its index, or nothing. */
export interface MapFolderObjectsOptions {
  readonly builtins: BuiltinsIndex | undefined;
}

/** A modification and the file it was read from. */
interface ReadModification {
  readonly modification: Modification;
  readonly file: string;
}

/** One object's entries of a table, base and Skin file merged. */
interface MergedEntry {
  /** The Custom object's base; in the table of modified Built-in objects, the object's own Rawcode, unread. */
  readonly base: string;
  /** The first file that holds it with a modification. */
  readonly file: string;
  readonly fields: Map<string, ReadModification>;
}

/**
 * The objects of each kind, sorted by Rawcode: the Custom objects and the
 * Built-in objects the map modifies. A Custom object wins over a modified
 * Built-in object of its Rawcode and kind. A base file's and a Skin file's
 * modifications of one object merge, the Skin file winning a field both
 * set; a Skin entry with no modification is ignored. Warnings go to the
 * model.
 */
export function mapFolderObjects(
  model: MapFolderModel,
  { builtins }: MapFolderObjectsOptions,
): { objects: MapFolderObject[]; keptBaseName: boolean } {
  const objects: Unshared[] = [];
  let keptBaseName = false;
  for (const kind of OBJECT_KINDS) {
    const files = model.objectData.filter((f) => f.kind === kind);
    const custom = mergeTable(files, "custom", kind, model);
    const modified = mergeTable(files, "original", kind, model);
    for (const rawcode of custom.keys()) modified.delete(rawcode);

    const kindObjects: Unshared[] = [];
    for (const [rawcode, { base, file, fields }] of custom) {
      const builtin = builtins?.objects[rawcode];
      if (builtins !== undefined && builtin !== undefined) {
        const builtinName =
          builtin.name === undefined ? "" : ` ${builtin.name}'s`;
        model.warnings.push(
          `${file} adds the Custom ${kind} ${rawcode}, whose Rawcode is the Built-in ${builtin.kind}${builtinName} (${rawcode}) in Patch ${builtins.gameVersion}: ${rawcode} is read as this map's Custom ${kind}.`,
        );
      }
      const baseName = builtins?.objects[base]?.name;
      let name = nameOf(kind, rawcode, fields, model);
      if (name === undefined) {
        name = baseName;
        if (builtins === undefined) keptBaseName = true;
      }
      kindObjects.push({
        origin: "custom",
        kind,
        rawcode,
        base,
        name,
        baseName,
        constant: constantName(name, rawcode),
      });
    }
    for (const [rawcode, { fields }] of modified) {
      const builtin = builtins?.objects[rawcode];
      const name = nameOf(kind, rawcode, fields, model);
      kindObjects.push({
        origin: "modified",
        kind,
        rawcode,
        name: name === builtin?.name ? undefined : name,
        builtin:
          builtins === undefined || builtin === undefined
            ? undefined
            : {
                gameVersion: builtins.gameVersion,
                name: builtin.name,
                constant: builtin.constant,
              },
      });
    }
    objects.push(
      ...kindObjects.sort((a, b) => byCodePoint(a.rawcode, b.rawcode)),
    );
  }

  const kindsOf = new Map<string, Set<ObjectKind>>();
  for (const { rawcode, kind } of objects) {
    kindsOf.set(rawcode, (kindsOf.get(rawcode) ?? new Set()).add(kind));
  }
  return {
    objects: objects.map((object) => ({
      ...object,
      shared: (kindsOf.get(object.rawcode)?.size ?? 0) > 1,
    })),
    keptBaseName,
  };
}

/**
 * The objects of one table of a kind's files (the Custom objects added, or
 * the Built-in objects modified), by Rawcode, base and Skin file merged.
 * An object a file holds twice keeps its first entry, with a warning.
 */
function mergeTable(
  files: readonly ObjectDataFile[],
  table: "custom" | "original",
  kind: ObjectKind,
  model: MapFolderModel,
): Map<string, MergedEntry> {
  const merged = new Map<string, MergedEntry>();
  for (const file of files) {
    const defined = new Set<string>();
    for (const entry of file[table]) {
      const rawcode =
        table === "custom" ? (entry.custom ?? entry.original) : entry.original;
      if (defined.has(rawcode)) {
        model.warnings.push(
          table === "custom"
            ? `${file.name} defines the Custom ${kind} ${rawcode} twice: the first definition is kept.`
            : `${file.name} modifies the Built-in ${kind} ${rawcode} twice: the first modification is kept.`,
        );
        continue;
      }
      defined.add(rawcode);
      const modifications = entry.sets.flatMap((set) => set.modifications);
      if (file.skin && modifications.length === 0) continue;
      let object = merged.get(rawcode);
      if (object === undefined) {
        object = {
          base: entry.original,
          file: file.name,
          fields: new Map(),
        };
        merged.set(rawcode, object);
      }
      for (const modification of modifications) {
        object.fields.set(
          fieldKey(modification.field, modification.level ?? 0),
          { modification, file: file.name },
        );
      }
    }
  }
  return merged;
}

/** The object's own name, or undefined when it sets none, an empty one, or a string war3map.wts lacks. */
function nameOf(
  kind: ObjectKind,
  rawcode: string,
  fields: ReadonlyMap<string, ReadModification>,
  model: MapFolderModel,
): string | undefined {
  for (const field of NAME_FIELDS[kind]) {
    const read = firstLevel(fields, field);
    if (read === undefined || typeof read.modification.value !== "string") {
      continue;
    }
    const text = resolveString(read.modification.value, model);
    if (text === undefined) {
      model.warnings.push(
        `${read.file}: the name of ${rawcode} is ${read.modification.value}, which war3map.wts does not hold; ${rawcode} is named as if it set none.`,
      );
      return undefined;
    }
    const name = displayName(text);
    return name === "" ? undefined : name;
  }
  return undefined;
}

/** The modification of `field` at its lowest level: a field without levels is at level 0, an upgrade's first level at 1. */
function firstLevel(
  fields: ReadonlyMap<string, ReadModification>,
  field: string,
): ReadModification | undefined {
  let first: ReadModification | undefined;
  for (const read of fields.values()) {
    if (read.modification.field !== field) continue;
    if (
      first === undefined ||
      (read.modification.level ?? 0) < (first.modification.level ?? 0)
    ) {
      first = read;
    }
  }
  return first;
}

const BANNER = [
  "// Generated by reforged-map from the map folder's Object data on every install, build and watch.",
  "// Do not edit: create and rename the objects in the World Editor.",
];

/**
 * The declarations of the FourCC overloads: one per Custom object and per
 * Built-in object the map modifies, except a Rawcode two kinds share.
 */
export function renderOverloads(objects: readonly MapFolderObject[]): string {
  const body = objects
    .filter((object) => !object.shared)
    .flatMap((object) => [
      ...docComment(overloadDoc(object), ""),
      `declare function FourCC(id: ${JSON.stringify(object.rawcode)}): Rawcode<${JSON.stringify(object.kind)}>;`,
      "",
    ]);
  return ["/** @noSelfInFile */", ...BANNER, "", ...body].join("\n");
}

/** An overload's TSDoc: the object, then where its constant comes from. */
function overloadDoc(object: MapFolderObject): string[] {
  const kindConstants = KIND_CONSTANTS[object.kind];
  if (object.origin === "custom") {
    return object.constant === undefined
      ? [describe(object)]
      : [
          describe(object),
          "",
          `Its constant is \`${kindConstants.object}.${object.constant}\`, from the generated \`${kindConstants.file}\`.`,
        ];
  }
  const { builtin } = object;
  const game =
    builtin === undefined
      ? `\`${object.rawcode}\`, a Built-in ${object.kind}`
      : `${builtin.name === undefined ? "" : `${builtin.name} `}(\`${object.rawcode}\`), a Built-in ${object.kind} of Patch ${builtin.gameVersion}`;
  const map =
    object.name === undefined
      ? "which this map modifies"
      : `named ${object.name} in this map`;
  return builtin?.constant === undefined
    ? [`${game}, ${map}.`]
    : [
        `${game}, ${map}.`,
        "",
        `Its constant is \`${kindConstants.builtins}.${builtin.constant}\`, from \`reforged-builtins/${kindConstants.plural}\`.`,
      ];
}

/** The constants module of one kind: its Custom objects that have a constant. */
export function renderConstants(
  kind: ObjectKind,
  objects: readonly MapFolderObject[],
): string {
  const { object: constants, plural } = KIND_CONSTANTS[kind];
  const members = customOnly(objects)
    .filter((object) => object.kind === kind && object.constant !== undefined)
    .flatMap((object) => [
      ...docComment([describe(object)], "  "),
      `  ${String(object.constant)}: ${String(rawcodeValue(object.rawcode))} as Rawcode<${JSON.stringify(kind)}>,`,
    ]);
  return [
    ...BANNER,
    "// Each value is the integer FourCC returns for the Rawcode: its four bytes, big-endian.",
    "",
    ...docComment(
      [`The Custom ${plural} of this map, each named by its name and Rawcode.`],
      "",
    ),
    members.length === 0
      ? `export const ${constants} = {} as const;`
      : [`export const ${constants} = {`, ...members, "} as const;"].join("\n"),
    "",
  ].join("\n");
}

/** One warning per Custom object without a constant. */
export function constantWarnings(
  objects: readonly MapFolderObject[],
): string[] {
  return customOnly(objects)
    .filter((object) => object.constant === undefined)
    .map((object) => {
      const literal = JSON.stringify(object.rawcode);
      return `The Custom ${object.kind} ${literal} has no constant: its Rawcode cannot end an identifier. Name it with FourCC(${literal}), or give it a Rawcode of letters and digits in the World Editor.`;
    });
}

/** The Custom objects among `objects`. */
function customOnly(objects: readonly MapFolderObject[]): CustomObject[] {
  return objects.filter(
    (object): object is CustomObject => object.origin === "custom",
  );
}

/** A Custom object's TSDoc's first paragraph: name, Rawcode, origin and base. */
function describe(object: CustomObject): string {
  const base =
    object.baseName === undefined
      ? `\`${object.base}\``
      : `${object.baseName} (\`${object.base}\`)`;
  return `${object.name ?? UNNAMED} (\`${object.rawcode}\`), a Custom ${object.kind} of this map, derived from ${base}.`;
}

function docComment(lines: readonly string[], indent: string): string[] {
  return [
    `${indent}/**`,
    ...lines.map((line) =>
      `${indent} * ${line.replaceAll("*/", "*\\/")}`.trimEnd(),
    ),
    `${indent} */`,
  ];
}

/** The integer `FourCC` returns for a Rawcode: its four bytes, big-endian. */
function rawcodeValue(rawcode: string): number {
  let value = 0;
  for (let index = 0; index < rawcode.length; index++) {
    value = value * 256 + rawcode.charCodeAt(index);
  }
  return value;
}

/** The key of a field at a level, in an object's merged modifications. */
function fieldKey(field: string, level: number): string {
  return `${field}\0${String(level)}`;
}

function byCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
