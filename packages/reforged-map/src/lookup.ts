// The Rawcode lookup: from a Rawcode literal to the object or objects it
// names, for the tools that read the map (the lint rule, the hover). It
// reads the map folder through the same model and derivation as
// generateObjects, so the generated code and the lookup agree.

import {
  loadBuiltins,
  type BuiltinObject,
  type BuiltinsIndex,
  type GameDataSet,
} from "./builtins.js";
import { MapFolderError, checkMapFolder } from "./map-folder.js";
import { OBJECT_KINDS, createModel, type ObjectKind } from "./model.js";
import { readObjectData } from "./object-data.js";
import {
  KIND_CONSTANTS,
  mapFolderObjects,
  type MapFolderObject,
} from "./objects.js";
import { readWar3mapW3i } from "./war3map-w3i.js";
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
   * left out. Kept for the reload of a changed map folder (#590): until
   * then, the lookup reads the map folder once and never checks again.
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
   * (`custom-units.ts`, one of `CONSTANTS_FILES`). The lookup never reads
   * the Map project's configuration, so the caller resolves that file in
   * the folder its build writes the generated code to.
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
  /** The Game data sets that hold it, each with its id and the name the World Editor gives it, in the index's order. */
  readonly gameDataSets: readonly GameDataSet[];
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
  /** The game's race (`human`), undefined when it has none: a race the map sets on the object is not read. */
  readonly race: string | undefined;
  /** The Game data sets that hold it, each with its id and the name the World Editor gives it, in the index's order. */
  readonly gameDataSets: readonly GameDataSet[];
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
  /** Its base's race (`human`), undefined when the base has none: a race the map sets on the object is not read. */
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

/**
 * The Rawcode names Built-in objects of the Patch only, and the map's Game
 * data set holds none of them: the game finds no such object in this map.
 */
export interface NotInGameDataSetRawcode {
  /** `"not-in-game-data-set"`. */
  readonly status: "not-in-game-data-set";
  /** The Rawcode looked up. */
  readonly rawcode: string;
  /** The objects it names, with the fields of a known one, in Object kind order. */
  readonly objects: readonly (BuiltinRawcodeObject | ModifiedRawcodeObject)[];
  /** The map's Game data set, with its id and the name the World Editor gives it. */
  readonly gameDataSet: GameDataSet;
}

/** The Rawcode names no Built-in object and no object of the map. */
export interface UnknownRawcode {
  /** `"unknown"`. */
  readonly status: "unknown";
  /** The Rawcode looked up. */
  readonly rawcode: string;
  /** Up to three Rawcodes one edit away, each once, a change of case first; empty when none is. */
  readonly suggestions: readonly RawcodeSuggestion[];
}

/** The literal can never be a Rawcode: it is not four printable ASCII characters (U+0020 to U+007E). */
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
  | KnownRawcode
  | NotInGameDataSetRawcode
  | UnknownRawcode
  | MalformedRawcode
  | UnavailableLookup;

/** A lookup over one map folder, which {@link openRawcodeLookup} returns. */
export interface RawcodeLookup {
  /** The map folder it reads. */
  readonly mapFolder: string;
  /** The Map project folder it resolves `reforged-builtins` from. */
  readonly projectRoot: string;
  /** The minimum interval between two checks of modification times, in milliseconds; not used until the reload of #590. */
  readonly minInterval: number;
  /**
   * Looks a Rawcode literal up. Synchronous, and never throws.
   *
   * @param rawcode - The literal's text (`"hfoo"`).
   * @returns What it names; not in the map's Game data set when it names
   *   only Built-in objects that set does not hold; unknown with its
   *   suggestions, malformed, or unavailable with the reason. A malformed
   *   literal is malformed even when the lookup is unavailable.
   */
  lookup(rawcode: string): RawcodeLookupResult;
  /**
   * The Game version of the `reforged-builtins` index the lookup read
   * (`3.0.0`). Synchronous, and never throws.
   *
   * @returns The Game version, or undefined when the lookup is unavailable.
   */
  gameVersion(): string | undefined;
  /**
   * The author-facing warnings of reading the map folder, each one line,
   * such as a `war3map.w3i` the lookup cannot read, which turns its Game
   * data set check off. Synchronous, and never throws.
   *
   * @returns The warnings, empty when there are none or the lookup is
   *   unavailable.
   */
  warnings(): readonly string[];
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
 * are the ones `generateObjects` writes. The map's Game data set is read
 * from `war3map.w3i`; when it cannot be, a warning says so and no Rawcode is
 * reported as outside it. Loaded by `require` from a
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
    warnings() {
      try {
        const state = load();
        return "status" in state ? [] : state.warnings;
      } catch {
        return [];
      }
    },
  };
}

/** What a lookup keeps after its first read. */
interface Loaded {
  readonly gameVersion: string;
  /** The objects of every Rawcode, Built-in and of the map, in Object kind order. */
  readonly objects: ReadonlyMap<string, readonly RawcodeObject[]>;
  /** The map's Game data set; undefined when unknown, which turns its check off. */
  readonly gameDataSet: GameDataSet | undefined;
  readonly warnings: readonly string[];
}

/** The most suggestions an unknown Rawcode gets. */
const MAX_SUGGESTIONS = 3;

function isMalformed(rawcode: string): boolean {
  return !/^[\x20-\x7e]{4}$/.test(rawcode);
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
  readWar3mapW3i(mapFolder, model);
  const { objects: mapObjects } = mapFolderObjects(model, { builtins: index });

  const objects = new Map<string, RawcodeObject[]>();
  const add = (object: RawcodeObject): void => {
    const list = objects.get(object.rawcode);
    if (list === undefined) objects.set(object.rawcode, [object]);
    else list.push(object);
  };
  for (const object of mapObjects) {
    add(fromMapObject(object, index));
  }
  for (const [rawcode, builtin] of Object.entries(index.objects)) {
    const kind = objectKind(builtin.kind);
    if (kind === undefined) continue;
    // An object of the map's Object data of the same kind (a modified one,
    // or a Custom one at a Built-in Rawcode) stands for it.
    if (objects.get(rawcode)?.some((object) => object.kind === kind)) continue;
    add({
      origin: "builtin",
      rawcode,
      kind,
      name: builtin.name,
      race: builtin.race,
      gameDataSets: gameDataSets(index, builtin),
      constant: builtinConstant(kind, builtin),
    });
  }
  for (const list of objects.values()) {
    list.sort(
      (a, b) => OBJECT_KINDS.indexOf(a.kind) - OBJECT_KINDS.indexOf(b.kind),
    );
  }
  return {
    gameVersion: index.gameVersion,
    objects,
    gameDataSet: mapGameDataSet(model.gameDataSet, index, model.warnings),
    warnings: model.warnings,
  };
}

/** The map's Game data set with its name, when the index has it; a warning otherwise. */
function mapGameDataSet(
  id: string | undefined,
  index: BuiltinsIndex,
  warnings: string[],
): GameDataSet | undefined {
  if (id === undefined) return undefined;
  const set = index.gameDataSets?.find((other) => other.id === id);
  if (set === undefined) {
    warnings.push(
      `reforged-builtins ${index.gameVersion} has no Game data set ${id}, the map's: no Built-in object is reported as outside it.`,
    );
  }
  return set;
}

function fromMapObject(
  object: MapFolderObject,
  index: BuiltinsIndex,
): RawcodeObject {
  const { kind, rawcode } = object;
  const builtins = index.objects;
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
    gameDataSets: builtin === undefined ? [] : gameDataSets(index, builtin),
    constant:
      builtin === undefined ? undefined : builtinConstant(kind, builtin),
  };
}

function lookUp(state: Loaded, rawcode: string): RawcodeLookupResult {
  const objects = state.objects.get(rawcode);
  if (objects === undefined) {
    return { status: "unknown", rawcode, suggestions: suggest(state, rawcode) };
  }
  const { gameDataSet } = state;
  if (gameDataSet !== undefined) {
    const outside = objects.filter((object) => isOutside(object, gameDataSet));
    if (outside.length === objects.length) {
      return {
        status: "not-in-game-data-set",
        rawcode,
        objects: outside,
        gameDataSet,
      };
    }
  }
  return { status: "known", rawcode, objects };
}

/**
 * Whether a Built-in object, modified or not, is outside the map's Game data
 * set: the index names the sets that hold it, and none is the map's.
 */
function isOutside(
  object: RawcodeObject,
  gameDataSet: GameDataSet,
): object is BuiltinRawcodeObject | ModifiedRawcodeObject {
  return (
    object.origin !== "custom" &&
    object.gameDataSets.length > 0 &&
    !object.gameDataSets.some((set) => set.id === gameDataSet.id)
  );
}

/**
 * Up to three Rawcodes one edit away from `rawcode`, a four-character
 * literal: one character changed, a change of case counting as one edit.
 * Insertion and deletion would change its length, which every Rawcode has.
 * A change of case comes first, then the Rawcodes in code point order; a
 * Rawcode two kinds share is suggested once, by its first object in Object
 * kind order.
 */
function suggest(state: Loaded, rawcode: string): RawcodeSuggestion[] {
  const lower = rawcode.toLowerCase();
  return [...state.objects.keys()]
    .filter((other) => oneEditAway(rawcode, other))
    .sort((a, b) => {
      const aCase = a.toLowerCase() === lower ? 0 : 1;
      const bCase = b.toLowerCase() === lower ? 0 : 1;
      return aCase - bCase || (a < b ? -1 : a > b ? 1 : 0);
    })
    .slice(0, MAX_SUGGESTIONS)
    .map((other) => {
      const [{ name, kind }] = state.objects.get(other) ?? [];
      return { rawcode: other, name, kind };
    });
}

/** Whether `b`, of the same length as `a`, differs from it in exactly one character. */
function oneEditAway(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let differences = 0;
  for (let index = 0; index < a.length; index++) {
    if (a[index] !== b[index]) differences++;
  }
  return differences === 1;
}

/** The Game data sets that hold a Built-in object, with their names. */
function gameDataSets(
  index: BuiltinsIndex,
  builtin: BuiltinObject,
): GameDataSet[] {
  return (builtin.sets ?? []).map((id) => ({
    id,
    label: index.gameDataSets?.find((set) => set.id === id)?.label ?? id,
  }));
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
