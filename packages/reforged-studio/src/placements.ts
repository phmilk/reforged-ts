/**
 * The reader of a map folder's placement files: `war3mapUnits.doo`, the
 * units and items placed on the terrain, and `war3map.doo`, the
 * destructables and doodads. It counts the placements of each Rawcode, for
 * the delete confirmation and the free Rawcode (#482). It only reads: the
 * Studio writes no placement file, since terrain and placed units stay the
 * World Editor's (ADR 0015, ADR 0006).
 *
 * The layouts are the World Editor's `W3do` of version 7, 8 and 13 (the
 * 3.0 World Editor saves version 13, sub-version 9 or 11 for units and 11
 * for doodads), field by field as HiveWE reads them
 * (`src/base/units.ixx`, `src/base/doodads.ixx` at `cbfd6b3`): version 13
 * adds a group id after the skin id, a dword before the creation number of
 * a doodad, then a roll, a pitch and a list of lights after it. Whether a
 * record of version 7 or 8 holds a skin id depends on the Game version of
 * `war3map.w3i`, which HiveWE reads; this reader instead takes the layout
 * that reads the whole file to its last byte, with or without it.
 */
import fs from "node:fs";
import path from "node:path";
import type { ObjectKind } from "reforged-map";

/** The placement file of units and items. */
export const UNITS_FILE = "war3mapUnits.doo";

/** The placement file of destructables and doodads. */
export const DOODADS_FILE = "war3map.doo";

/** The placements of one file, by Rawcode: how many records name it. */
export type PlacementCounts = ReadonlyMap<string, number>;

/** What {@link readPlacements} read of a map folder. */
export interface Placements {
  /** The units and items of `war3mapUnits.doo`, by Rawcode; empty when the file is missing or unreadable. */
  readonly units: PlacementCounts;
  /** The destructables and doodads of `war3map.doo`, the terrain's special doodads included, by Rawcode; empty when the file is missing or unreadable. */
  readonly doodads: PlacementCounts;
  /** One line per file that could not be read, naming it and why. */
  readonly warnings: readonly string[];
}

/** A placement file that does not read in any layout of the World Editor. */
export class PlacementFileError extends Error {
  override name = "PlacementFileError";
}

/** The bytes of a light, in version 13: index, shadow flag, colour and six reals. */
const LIGHT_SIZE = 36;

/** A cursor over a file's bytes, which throws past their end. */
class Reader {
  #offset = 0;
  readonly #view: DataView;

  /** @param bytes - The file's bytes. */
  constructor(readonly bytes: Uint8Array) {
    this.#view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  /** Whether every byte was read. */
  get done(): boolean {
    return this.#offset === this.bytes.byteLength;
  }

  /** Skips `count` bytes. */
  skip(count: number): void {
    if (count < 0 || this.#offset + count > this.bytes.byteLength) {
      throw new PlacementFileError(
        `it ends at byte ${String(this.bytes.byteLength)}, before the record read at byte ${String(this.#offset)}`,
      );
    }
    this.#offset += count;
  }

  /** Reads a little-endian unsigned 32-bit integer. */
  uint(): number {
    const at = this.#offset;
    this.skip(4);
    return this.#view.getUint32(at, true);
  }

  /** Reads four bytes as a Rawcode. */
  rawcode(): string {
    const at = this.#offset;
    this.skip(4);
    return String.fromCharCode(...this.bytes.subarray(at, at + 4));
  }

  /** Skips a count, then that many entries of `size` bytes. */
  list(size: number): void {
    const count = this.uint();
    if (count > this.bytes.byteLength) {
      throw new PlacementFileError(`a list of ${String(count)} entries`);
    }
    this.skip(count * size);
  }
}

/** A file's header: its version, its sub-version and its record count, after `W3do`. */
function header(reader: Reader): {
  version: number;
  subversion: number;
  count: number;
} {
  if (reader.rawcode() !== "W3do") {
    throw new PlacementFileError("it does not start with W3do");
  }
  const version = reader.uint();
  const subversion = reader.uint();
  const count = reader.uint();
  if (version !== 7 && version !== 8 && version !== 13) {
    throw new PlacementFileError(
      `its version is ${String(version)}, not 7, 8 or 13`,
    );
  }
  return { version, subversion, count };
}

/** The record's prefix every version has: Rawcode, variation, position, angle and scale; returns the Rawcode. */
function prefix(reader: Reader, skin: boolean, version: number): string {
  const rawcode = reader.rawcode();
  reader.skip(4 + 12 + 4 + 12);
  if (skin) reader.skip(4);
  if (version >= 13) reader.skip(4); // The group id.
  return rawcode;
}

/** Skips the item sets a placement drops: a count, then each set's count and its (item, chance) pairs. */
function itemSets(reader: Reader): void {
  const sets = reader.uint();
  if (sets > reader.bytes.byteLength) {
    throw new PlacementFileError(`${String(sets)} item sets`);
  }
  for (let set = 0; set < sets; set++) reader.list(8);
}

/** Skips version 13's roll, pitch and lights, after the creation number. */
function lights(reader: Reader, version: number): void {
  if (version < 13) return;
  reader.skip(8);
  reader.list(LIGHT_SIZE);
}

/** Counts a Rawcode. */
function count(counts: Map<string, number>, rawcode: string): void {
  counts.set(rawcode, (counts.get(rawcode) ?? 0) + 1);
}

/** Reads a whole units file in one layout, with or without skin ids. */
function unitsIn(bytes: Uint8Array, skin: boolean): Map<string, number> {
  const reader = new Reader(bytes);
  const { version, subversion, count: records } = header(reader);
  const counts = new Map<string, number>();
  for (let record = 0; record < records; record++) {
    const rawcode = prefix(reader, skin, version);
    reader.skip(1 + 4 + 1 + 1 + 4 + 4); // Flags, player, two bytes, life, mana.
    if (subversion >= 11) reader.skip(4); // The item table.
    itemSets(reader);
    reader.skip(4 + 4 + 4); // Gold, acquisition range, hero level.
    if (subversion >= 11) reader.skip(12); // Strength, agility, intelligence.
    reader.list(8); // The inventory: slot and item.
    reader.list(12); // The abilities: ability, autocast and level.
    const random = reader.uint();
    if (random === 0) reader.skip(4);
    else if (random === 1) reader.skip(8);
    else if (random === 2) reader.list(8);
    reader.skip(4 + 4 + 4); // Colour, waygate, creation number.
    lights(reader, version);
    count(counts, rawcode);
  }
  if (!reader.done) {
    throw new PlacementFileError(
      `bytes are left after its ${String(records)} records`,
    );
  }
  return counts;
}

/** Reads a whole doodads file in one layout, with or without skin ids. */
function doodadsIn(bytes: Uint8Array, skin: boolean): Map<string, number> {
  const reader = new Reader(bytes);
  const { version, count: records } = header(reader);
  const counts = new Map<string, number>();
  for (let record = 0; record < records; record++) {
    const rawcode = prefix(reader, skin, version);
    reader.skip(1 + 1); // State and life.
    if (version >= 8) {
      reader.skip(4); // The item table.
      itemSets(reader);
    }
    if (version >= 13) reader.skip(4);
    reader.skip(4); // The creation number.
    lights(reader, version);
    count(counts, rawcode);
  }
  reader.skip(4); // The special doodads' version.
  const specials = reader.uint();
  for (let special = 0; special < specials; special++) {
    const rawcode = reader.rawcode();
    reader.skip(4 + 8); // Variation, position.
    count(counts, rawcode);
  }
  if (!reader.done) {
    throw new PlacementFileError(
      `bytes are left after its ${String(records)} records and ${String(specials)} special doodads`,
    );
  }
  return counts;
}

/** Reads a file in the layout with skin ids, else without them; throws the first layout's error when neither reads. */
function inEitherLayout(
  bytes: Uint8Array,
  read: (bytes: Uint8Array, skin: boolean) => Map<string, number>,
): Map<string, number> {
  try {
    return read(bytes, true);
  } catch (error) {
    if (!(error instanceof PlacementFileError)) throw error;
    try {
      return read(bytes, false);
    } catch {
      throw error;
    }
  }
}

/**
 * Counts the placements of each Rawcode in the bytes of a
 * `war3mapUnits.doo`: the units and items placed on the terrain, the start
 * locations (`sloc`) included.
 *
 * @param bytes - The file's bytes.
 * @returns The placements, by Rawcode.
 * @throws {@link PlacementFileError} When the bytes read in no layout of
 *   the World Editor to their last byte.
 */
export function readUnitPlacements(bytes: Uint8Array): PlacementCounts {
  return inEitherLayout(bytes, unitsIn);
}

/**
 * Counts the placements of each Rawcode in the bytes of a `war3map.doo`:
 * the destructables and doodads placed on the terrain, then its special
 * doodads.
 *
 * @param bytes - The file's bytes.
 * @returns The placements, by Rawcode.
 * @throws {@link PlacementFileError} When the bytes read in no layout of
 *   the World Editor to their last byte.
 */
export function readDoodadPlacements(bytes: Uint8Array): PlacementCounts {
  return inEitherLayout(bytes, doodadsIn);
}

/**
 * Reads the placement files of a map folder, each with one whole-file read
 * and no handle kept: a missing file has no placement, and a file that does
 * not read gives a warning and no placement.
 *
 * @param mapFolder - The map folder.
 * @returns The placements of each file, and the warnings.
 */
export function readPlacements(mapFolder: string): Placements {
  const warnings: string[] = [];
  const read = (
    file: string,
    reader: (bytes: Uint8Array) => PlacementCounts,
  ): PlacementCounts => {
    let bytes: Uint8Array;
    try {
      bytes = fs.readFileSync(path.join(mapFolder, file));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return new Map();
      warnings.push(`${file} could not be read: ${(error as Error).message}.`);
      return new Map();
    }
    try {
      return reader(bytes);
    } catch (error) {
      if (!(error instanceof PlacementFileError)) throw error;
      warnings.push(
        `${file} is not in a layout the Studio reads (${error.message}): its placements are not counted.`,
      );
      return new Map();
    }
  };
  return {
    units: read(UNITS_FILE, readUnitPlacements),
    doodads: read(DOODADS_FILE, readDoodadPlacements),
    warnings,
  };
}

/**
 * The file that places objects of a kind: `war3mapUnits.doo` for units and
 * items, `war3map.doo` for destructables and doodads; undefined for the
 * kinds nothing places.
 *
 * @param kind - The Object kind.
 * @returns The file's name, or undefined.
 */
export function placementFile(
  kind: ObjectKind,
): typeof UNITS_FILE | typeof DOODADS_FILE | undefined {
  switch (kind) {
    case "unit":
    case "item":
      return UNITS_FILE;
    case "destructable":
    case "doodad":
      return DOODADS_FILE;
    default:
      return undefined;
  }
}

/**
 * How many times an object is placed on the terrain: the records of its
 * kind's placement file that name its Rawcode.
 *
 * @param placements - What {@link readPlacements} read.
 * @param kind - The object's Object kind.
 * @param rawcode - Its Rawcode.
 * @returns The count; 0 for a kind nothing places.
 */
export function placementCount(
  placements: Placements,
  kind: ObjectKind,
  rawcode: string,
): number {
  const file = placementFile(kind);
  if (file === undefined) return 0;
  return (
    (file === UNITS_FILE ? placements.units : placements.doodads).get(
      rawcode,
    ) ?? 0
  );
}
