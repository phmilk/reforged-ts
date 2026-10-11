// The map's objects, derived from the model's Object data, and the
// renderers of their generated files: the FourCC overloads and the
// constants modules, one per Object kind.

import type { BuiltinsIndex } from "./builtins.js";
import {
  OBJECT_KINDS,
  type MapFolderModel,
  type Modification,
  type ObjectKind,
} from "./model.js";
import { constantName, displayName, UNNAMED } from "./names.js";
import { resolveString } from "./war3map-wts.js";

/** The name of each Object kind's constants object, and of its objects in a sentence. */
export const KIND_CONSTANTS: Readonly<
  Record<ObjectKind, { object: string; plural: string; file: string }>
> = {
  unit: { object: "CustomUnits", plural: "units", file: "custom-units.ts" },
  item: { object: "CustomItems", plural: "items", file: "custom-items.ts" },
  ability: {
    object: "CustomAbilities",
    plural: "abilities",
    file: "custom-abilities.ts",
  },
  buff: { object: "CustomBuffs", plural: "buffs", file: "custom-buffs.ts" },
  destructable: {
    object: "CustomDestructables",
    plural: "destructables",
    file: "custom-destructables.ts",
  },
  doodad: {
    object: "CustomDoodads",
    plural: "doodads",
    file: "custom-doodads.ts",
  },
  upgrade: {
    object: "CustomUpgrades",
    plural: "upgrades",
    file: "custom-upgrades.ts",
  },
};

/**
 * The field that holds each kind's name, as the Object Editor shows it:
 * the field reforged-builtins' generator locates from the kind's
 * `*MetaData.slk`. Only the kinds read so far.
 */
const NAME_FIELDS: Readonly<Partial<Record<ObjectKind, string>>> = {
  unit: "unam",
};

/** One Custom object of the map. */
export interface CustomObject {
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
}

/** What `customObjects` needs of reforged-builtins: its index, or nothing. */
export interface CustomObjectsOptions {
  readonly builtins: BuiltinsIndex | undefined;
}

/** A modification and the file it was read from. */
interface ReadModification {
  readonly modification: Modification;
  readonly file: string;
}

/**
 * The Custom objects of each kind, sorted by Rawcode. A base file's and a
 * Skin file's modifications of one object merge, the Skin file winning a
 * field both set; a Skin entry with no modification is ignored. Warnings
 * go to the model.
 */
export function customObjects(
  model: MapFolderModel,
  { builtins }: CustomObjectsOptions,
): { objects: CustomObject[]; keptBaseName: boolean } {
  const objects: CustomObject[] = [];
  let keptBaseName = false;
  for (const kind of OBJECT_KINDS) {
    const merged = new Map<
      string,
      { base: string; fields: Map<string, ReadModification> }
    >();
    for (const file of model.objectData.filter((f) => f.kind === kind)) {
      const defined = new Set<string>();
      for (const entry of file.custom) {
        const rawcode = entry.custom ?? entry.original;
        if (defined.has(rawcode)) {
          model.warnings.push(
            `${file.name} defines the Custom ${kind} ${rawcode} twice: the first definition is kept.`,
          );
          continue;
        }
        defined.add(rawcode);
        const modifications = entry.sets.flatMap((set) => set.modifications);
        if (file.skin && modifications.length === 0) continue;
        let object = merged.get(rawcode);
        if (object === undefined) {
          object = { base: entry.original, fields: new Map() };
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

    for (const [rawcode, { base, fields }] of [...merged].sort(([a], [b]) =>
      byCodePoint(a, b),
    )) {
      const baseName = builtins?.objects[base]?.name;
      let name = nameOf(kind, rawcode, fields, model);
      if (name === undefined) {
        name = baseName;
        if (builtins === undefined) keptBaseName = true;
      }
      objects.push({
        kind,
        rawcode,
        base,
        name,
        baseName,
        constant: constantName(name, rawcode),
      });
    }
  }
  return { objects, keptBaseName };
}

/** The object's own name, or undefined when it sets none (or names a string war3map.wts lacks). */
function nameOf(
  kind: ObjectKind,
  rawcode: string,
  fields: ReadonlyMap<string, ReadModification>,
  model: MapFolderModel,
): string | undefined {
  const field = NAME_FIELDS[kind];
  const read = field === undefined ? undefined : fields.get(fieldKey(field, 0));
  if (read === undefined || typeof read.modification.value !== "string") {
    return undefined;
  }
  const text = resolveString(read.modification.value, model);
  if (text === undefined) {
    model.warnings.push(
      `${read.file}: the name of ${rawcode} is ${read.modification.value}, which war3map.wts does not hold; ${rawcode} is named as if it set none.`,
    );
    return undefined;
  }
  return displayName(text);
}

const BANNER = [
  "// Generated by reforged-map from the map folder's Object data on every install, build and watch.",
  "// Do not edit: create and rename the objects in the World Editor.",
];

/** The declarations of the FourCC overloads: one per Custom object. */
export function renderOverloads(objects: readonly CustomObject[]): string {
  const body = objects.flatMap((object) => {
    const { object: constants, file } = KIND_CONSTANTS[object.kind];
    const lines = [describe(object)];
    if (object.constant !== undefined) {
      lines.push(
        "",
        `Its constant is \`${constants}.${object.constant}\`, from the generated \`${file}\`.`,
      );
    }
    return [
      ...docComment(lines, ""),
      `declare function FourCC(id: ${JSON.stringify(object.rawcode)}): Rawcode<${JSON.stringify(object.kind)}>;`,
      "",
    ];
  });
  return ["/** @noSelfInFile */", ...BANNER, "", ...body].join("\n");
}

/** The constants module of one kind: its Custom objects that have a constant. */
export function renderConstants(
  kind: ObjectKind,
  objects: readonly CustomObject[],
): string {
  const { object: constants, plural } = KIND_CONSTANTS[kind];
  const members = objects
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
export function constantWarnings(objects: readonly CustomObject[]): string[] {
  return objects
    .filter((object) => object.constant === undefined)
    .map((object) => {
      const literal = JSON.stringify(object.rawcode);
      return `The Custom ${object.kind} ${literal} has no constant: its Rawcode cannot end an identifier. Name it with FourCC(${literal}), or give it a Rawcode of letters and digits in the World Editor.`;
    });
}

/** The TSDoc's first paragraph: name, Rawcode, origin and base. */
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
