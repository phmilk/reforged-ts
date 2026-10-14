// The Rawcode lookup: from a Rawcode literal to the object or objects it
// names, for the tools that read the map (the lint rule, the hover). It
// reads the map folder through the same model and derivation as
// generateObjects, so the generated code and the lookup agree.

import { loadBuiltins, type BuiltinObject } from "./builtins.js";
import { MapFolderError, checkMapFolder } from "./map-folder.js";
import { OBJECT_KINDS, createModel, type ObjectKind } from "./model.js";
import { readObjectData } from "./object-data.js";
import {
  KIND_CONSTANTS,
  mapFolderObjects,
  type MapFolderObject,
} from "./objects.js";
import { readWar3mapWts } from "./war3map-wts.js";

/** The default of {@link RawcodeLookupOptions.minInterval}, in milliseconds: one second. */
export const DEFAULT_MIN_INTERVAL = 1000;

/** The options of {@link openRawcodeLookup}. */
export interface RawcodeLookupOptions {
  /** The path of the map folder, saved as a folder by the World Editor. */
  mapFolder: string;
  /**
   * A folder of the Map project, from which `reforged-builtins` is resolved
   * as Node resolves a package.
   */
  projectRoot: string;
  /**
   * The minimum interval between two checks of the map folder's
   * modification times, in milliseconds; {@link DEFAULT_MIN_INTERVAL} when
   * left out.
   */
  minInterval?: number;
}

/**
 * The constant that names an object: a member of `reforged-builtins`'
 * constants (`Units.Footman_hfoo`), or of the Map project's generated
 * constants (`CustomUnits.Captain_h000`).
 */
export interface RawcodeConstant {
  /** The exported constants object (`Units`, `CustomUnits`). */
  readonly object: string;
  /** The member of that object (`Footman_hfoo`). */
  readonly member: string;
  /**
   * The module that exports it: a package specifier
   * (`reforged-builtins/units`), or, when {@link RawcodeConstant.generated}
   * is true, the bare file name of the generated constants module
   * (`custom-units.ts`, one of `CONSTANTS_FILES`).
   */
  readonly module: string;
  /** Whether the module is one the Map project generates from its map folder. */
  readonly generated: boolean;
}

/** A Built-in object of the index, which the map does not modify. */
export interface BuiltinRawcodeObject {
  /** `"builtin"`: the game ships it, and the map does not modify it. */
  readonly origin: "builtin";
  /** Its Rawcode. */
  readonly rawcode: string;
  /** Its Object kind. */
  readonly kind: ObjectKind;
  /** Its enUS name, undefined when the index holds none. */
  readonly name: string | undefined;
  /** Its race (`human`), undefined when it has none. */
  readonly race: string | undefined;
  /** The ids of the Game data sets that hold it (`melee-tft`), as the index names them. */
  readonly gameDataSets: readonly string[];
  /** Its constant in `reforged-builtins`, undefined when the index gives it none. */
  readonly constant: RawcodeConstant | undefined;
}

/** A Built-in object the map's Object data modifies. */
export interface ModifiedRawcodeObject {
  /** `"modified"`: the game ships it, and the map modifies it. */
  readonly origin: "modified";
  /** Its Rawcode. */
  readonly rawcode: string;
  /** Its Object kind. */
  readonly kind: ObjectKind;
  /** The name it has in this map: the map's name, else the game's. */
  readonly name: string | undefined;
  /** The game's enUS name, undefined when the index holds none. */
  readonly builtinName: string | undefined;
  /** The map's name for it, undefined when the map keeps the game's. */
  readonly mapName: string | undefined;
  /** The game's race (`human`), undefined when it has none. */
  readonly race: string | undefined;
  /** The ids of the Game data sets that hold it (`melee-tft`), as the index names them. */
  readonly gameDataSets: readonly string[];
  /** Its constant in `reforged-builtins`, undefined when the index gives it none. */
  readonly constant: RawcodeConstant | undefined;
}

/** A Custom object of the map. */
export interface CustomRawcodeObject {
  /** `"custom"`: the map's Object data adds it. */
  readonly origin: "custom";
  /** Its Rawcode. */
  readonly rawcode: string;
  /** Its Object kind. */
  readonly kind: ObjectKind;
  /** Its name, else its base's enUS name; undefined when neither is known. */
  readonly name: string | undefined;
  /** Its base's race (`human`), undefined when the base has none. */
  readonly race: string | undefined;
  /** The Built-in object it derives from: its Rawcode, and its enUS name when the index holds it. */
  readonly base: {
    readonly rawcode: string;
    readonly name: string | undefined;
  };
  /** Its constant in the generated constants module, undefined when its Rawcode cannot end an identifier. */
  readonly constant: RawcodeConstant | undefined;
}

/** One object a Rawcode names, told apart by its `origin`. */
export type RawcodeObject =
  BuiltinRawcodeObject | ModifiedRawcodeObject | CustomRawcodeObject;

/** A Rawcode one edit away from an unknown one, and the object it names. */
export interface RawcodeSuggestion {
  /** The suggested Rawcode. */
  readonly rawcode: string;
  /** The name of the object it names, as {@link RawcodeObject.name}. */
  readonly name: string | undefined;
  /** The Object kind of the object it names. */
  readonly kind: ObjectKind;
}

/** The Rawcode names one object, or two when two Object kinds share it. */
export interface KnownRawcode {
  /** `"known"`. */
  readonly status: "known";
  /** The Rawcode looked up. */
  readonly rawcode: string;
  /** The objects it names, one, or two for a Rawcode two kinds share, in Object kind order. */
  readonly objects: readonly RawcodeObject[];
}

/** The Rawcode names no Built-in object and no object of the map. */
export interface UnknownRawcode {
  /** `"unknown"`. */
  readonly status: "unknown";
  /** The Rawcode looked up. */
  readonly rawcode: string;
  /** Up to three Rawcodes one edit away, a change of case first; empty when none is. */
  readonly suggestions: readonly RawcodeSuggestion[];
}

/** The literal can never be a Rawcode: it is not four characters of one byte each. */
export interface MalformedRawcode {
  /** `"malformed"`. */
  readonly status: "malformed";
  /** The literal looked up. */
  readonly rawcode: string;
}

/** The lookup cannot answer: the map folder cannot be read, or `reforged-builtins` is not installed. */
export interface UnavailableLookup {
  /** `"unavailable"`. */
  readonly status: "unavailable";
  /** Why, in one sentence a tool shows once. */
  readonly reason: string;
}

/** What {@link RawcodeLookup.lookup} returns, told apart by its `status`. */
export type RawcodeLookupResult =
  KnownRawcode | UnknownRawcode | MalformedRawcode | UnavailableLookup;

/** A lookup over one map folder, which {@link openRawcodeLookup} returns. */
export interface RawcodeLookup {
  /** The map folder it reads. */
  readonly mapFolder: string;
  /** The Map project folder it resolves `reforged-builtins` from. */
  readonly projectRoot: string;
  /** The minimum interval between two checks of modification times, in milliseconds. */
  readonly minInterval: number;
  /**
   * Looks a Rawcode literal up. Synchronous, and never throws.
   *
   * @param rawcode - The literal's text (`"hfoo"`).
   * @returns What it names, unknown with its suggestions, malformed, or
   *   unavailable with the reason. A malformed literal is malformed even
   *   when the lookup is unavailable.
   */
  lookup(rawcode: string): RawcodeLookupResult;
  /**
   * The Game version of the `reforged-builtins` index the lookup read
   * (`3.0.0`). Synchronous, and never throws.
   *
   * @returns The Game version, or undefined when the lookup is unavailable.
   */
  gameVersion(): string | undefined;
}

/**
 * Opens a lookup from a Rawcode to the object or objects it names, over a
 * map folder's Object data and the Built-in objects of `reforged-builtins`.
 *
 * @remarks
 * Nothing is read until the first lookup, which reads the map folder and the
 * index of `reforged-builtins` (an optional peer, resolved from
 * `projectRoot`) and keeps what it read for the next ones. A map folder it
 * cannot read, or a missing `reforged-builtins`, makes every lookup but a
 * malformed one unavailable, with the reason. The objects and their names
 * are the ones `generateObjects` writes. Loaded by `require` from a
 * CommonJS host such as tsserver: the package has no top-level await.
 *
 * @param options - The map folder, the Map project folder, and the minimum
 *   interval between two checks of modification times.
 * @returns The lookup.
 */
export function openRawcodeLookup(
  options: RawcodeLookupOptions,
): RawcodeLookup {
  const { mapFolder, projectRoot } = options;
  let loaded: Loaded | UnavailableLookup | undefined;
  const load = (): Loaded | UnavailableLookup => {
    try {
      loaded ??= loadLookup(mapFolder, projectRoot);
    } catch (error) {
      loaded = unavailable(error);
    }
    return loaded;
  };
  return {
    mapFolder,
    projectRoot,
    minInterval: options.minInterval ?? DEFAULT_MIN_INTERVAL,
    lookup(rawcode) {
      if (isMalformed(rawcode)) return { status: "malformed", rawcode };
      try {
        const state = load();
        return "status" in state ? state : lookUp(state, rawcode);
      } catch (error) {
        return unavailable(error);
      }
    },
    gameVersion() {
      try {
        const state = load();
        return "status" in state ? undefined : state.gameVersion;
      } catch {
        return undefined;
      }
    },
  };
}

/** What a lookup keeps after its first read. */
interface Loaded {
  readonly gameVersion: string;
  /** The objects of every Rawcode, Built-in and of the map, in Object kind order. */
  readonly objects: ReadonlyMap<string, readonly RawcodeObject[]>;
}

/** The most suggestions an unknown Rawcode gets. */
const MAX_SUGGESTIONS = 3;

function isMalformed(rawcode: string): boolean {
  return rawcode.length !== 4 || /[^\0-\xff]/.test(rawcode);
}

function loadLookup(
  mapFolder: string,
  projectRoot: string,
): Loaded | UnavailableLookup {
  checkMapFolder(mapFolder);
  const builtins = loadBuiltins(projectRoot);
  if ("missing" in builtins) {
    return {
      status: "unavailable",
      reason: `reforged-builtins ${builtins.missing}: install it in the Map project to look Rawcodes up.`,
    };
  }
  const { index } = builtins;

  const model = createModel();
  readObjectData(mapFolder, OBJECT_KINDS, model);
  readWar3mapWts(mapFolder, model);
  const { objects: mapObjects } = mapFolderObjects(model, { builtins: index });

  const objects = new Map<string, RawcodeObject[]>();
  const add = (object: RawcodeObject): void => {
    const list = objects.get(object.rawcode);
    if (list === undefined) objects.set(object.rawcode, [object]);
    else list.push(object);
  };
  for (const object of mapObjects) {
    add(fromMapObject(object, index.objects));
  }
  for (const [rawcode, builtin] of Object.entries(index.objects)) {
    const kind = objectKind(builtin.kind);
    if (kind === undefined) continue;
    // A map object of the same kind (a modified one, or a Custom one at a
    // Built-in Rawcode) stands for it.
    if (objects.get(rawcode)?.some((object) => object.kind === kind)) continue;
    add({
      origin: "builtin",
      rawcode,
      kind,
      name: builtin.name,
      race: builtin.race,
      gameDataSets: builtin.sets ?? [],
      constant: builtinConstant(kind, builtin),
    });
  }
  for (const list of objects.values()) {
    list.sort(
      (a, b) => OBJECT_KINDS.indexOf(a.kind) - OBJECT_KINDS.indexOf(b.kind),
    );
  }
  return { gameVersion: index.gameVersion, objects };
}

function fromMapObject(
  object: MapFolderObject,
  builtins: Readonly<Record<string, BuiltinObject>>,
): RawcodeObject {
  const { kind, rawcode } = object;
  if (object.origin === "custom") {
    return {
      origin: "custom",
      rawcode,
      kind,
      name: object.name,
      race: ownBuiltin(builtins, object.base)?.race,
      base: { rawcode: object.base, name: object.baseName },
      constant:
        object.constant === undefined
          ? undefined
          : {
              object: KIND_CONSTANTS[kind].object,
              member: object.constant,
              module: KIND_CONSTANTS[kind].file,
              generated: true,
            },
    };
  }
  const builtin = ownBuiltin(builtins, rawcode);
  return {
    origin: "modified",
    rawcode,
    kind,
    name: object.name ?? builtin?.name,
    builtinName: builtin?.name,
    mapName: object.name,
    race: builtin?.race,
    gameDataSets: builtin?.sets ?? [],
    constant:
      builtin === undefined ? undefined : builtinConstant(kind, builtin),
  };
}

function lookUp(state: Loaded, rawcode: string): RawcodeLookupResult {
  const objects = state.objects.get(rawcode);
  if (objects !== undefined) return { status: "known", rawcode, objects };
  return { status: "unknown", rawcode, suggestions: suggest(state, rawcode) };
}

/**
 * Up to three Rawcodes one edit away from `rawcode`: a substitution, an
 * insertion or a deletion, a change of case counting as one edit, and a
 * Rawcode equal but for case too. A change of case comes first, then the
 * Rawcodes in code point order, the objects of each in Object kind order.
 */
function suggest(state: Loaded, rawcode: string): RawcodeSuggestion[] {
  const lower = rawcode.toLowerCase();
  const near = [...state.objects.keys()]
    .filter(
      (other) => other.toLowerCase() === lower || oneEditAway(rawcode, other),
    )
    .sort((a, b) => {
      const aCase = a.toLowerCase() === lower ? 0 : 1;
      const bCase = b.toLowerCase() === lower ? 0 : 1;
      return aCase - bCase || (a < b ? -1 : a > b ? 1 : 0);
    });
  return near
    .flatMap((other) =>
      (state.objects.get(other) ?? []).map(({ name, kind }) => ({
        rawcode: other,
        name,
        kind,
      })),
    )
    .slice(0, MAX_SUGGESTIONS);
}

/** Whether `b` is one substitution, insertion or deletion away from `a`. */
function oneEditAway(a: string, b: string): boolean {
  if (a === b || Math.abs(a.length - b.length) > 1) return false;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  let index = 0;
  while (index < short.length && short[index] === long[index]) index++;
  return short.length === long.length
    ? short.slice(index + 1) === long.slice(index + 1)
    : short.slice(index) === long.slice(index + 1);
}

function builtinConstant(
  kind: ObjectKind,
  builtin: BuiltinObject,
): RawcodeConstant | undefined {
  return builtin.constant === undefined
    ? undefined
    : {
        object: KIND_CONSTANTS[kind].builtins,
        member: builtin.constant,
        module: `reforged-builtins/${KIND_CONSTANTS[kind].plural}`,
        generated: false,
      };
}

function ownBuiltin(
  builtins: Readonly<Record<string, BuiltinObject>>,
  rawcode: string,
): BuiltinObject | undefined {
  return Object.hasOwn(builtins, rawcode) ? builtins[rawcode] : undefined;
}

function objectKind(kind: string): ObjectKind | undefined {
  return (OBJECT_KINDS as readonly string[]).includes(kind)
    ? (kind as ObjectKind)
    : undefined;
}

function unavailable(error: unknown): UnavailableLookup {
  return {
    status: "unavailable",
    reason:
      error instanceof MapFolderError
        ? error.message
        : `The map folder could not be read: ${error instanceof Error ? error.message : String(error)}`,
  };
}
