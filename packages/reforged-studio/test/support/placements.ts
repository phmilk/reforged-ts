/**
 * Placement files written for the tests, in the layouts the placement
 * reader reads (`src/placements.ts`): a `war3mapUnits.doo` and a
 * `war3map.doo` of version 13 by default, with skin ids, every list a
 * record can carry filled where a test asks for it.
 */

/** One placed unit or item of a units file. */
export interface PlacedUnit {
  readonly rawcode: string;
  /** Its item sets, each a list of (item, chance) pairs. */
  readonly itemSets?: readonly (readonly (readonly [string, number])[])[];
  /** Its inventory's items. */
  readonly inventory?: readonly string[];
  /** Its abilities. */
  readonly abilities?: readonly string[];
  /** Its random kind: 0 (a level), 1 (a group) or 2 (a custom list of this many entries). */
  readonly random?: 0 | 1 | readonly [2, number];
  /** How many lights it carries, in version 13. */
  readonly lights?: number;
}

/** One placed destructable or doodad of a doodads file. */
export interface PlacedDoodad {
  readonly rawcode: string;
  /** Its item sets, each a list of (item, chance) pairs. */
  readonly itemSets?: readonly (readonly (readonly [string, number])[])[];
  /** How many lights it carries, in version 13. */
  readonly lights?: number;
}

/** The layout of a file: its version and sub-version, and whether its records carry a skin id. */
export interface Layout {
  readonly version?: 7 | 8 | 13;
  readonly subversion?: number;
  readonly skin?: boolean;
}

/** Bytes appended little-endian. */
class Writer {
  readonly #bytes: number[] = [];

  /** Appends a Rawcode's four characters. */
  rawcode(text: string): this {
    for (const char of text) this.#bytes.push(char.charCodeAt(0));
    return this;
  }

  /** Appends an unsigned 32-bit integer. */
  uint(value: number): this {
    for (let shift = 0; shift < 32; shift += 8) {
      this.#bytes.push((value >>> shift) & 0xff);
    }
    return this;
  }

  /** Appends `count` zero bytes, or bytes of a value the reader skips. */
  zeros(count: number): this {
    for (let i = 0; i < count; i++) this.#bytes.push(0);
    return this;
  }

  /** The bytes. */
  done(): Uint8Array {
    return Uint8Array.from(this.#bytes);
  }
}

/** Writes the header: `W3do`, version, sub-version, record count. */
function header(
  writer: Writer,
  layout: Required<Layout>,
  count: number,
): Writer {
  return writer
    .rawcode("W3do")
    .uint(layout.version)
    .uint(layout.subversion)
    .uint(count);
}

/** Writes the prefix of a record: Rawcode, variation, position, angle, scale, skin and group id. */
function prefix(
  writer: Writer,
  layout: Required<Layout>,
  rawcode: string,
): void {
  writer.rawcode(rawcode).zeros(4 + 12 + 4 + 12);
  if (layout.skin) writer.rawcode(rawcode);
  if (layout.version >= 13) writer.uint(0xffffffff);
}

/** Writes item sets: a count, then each set's count and pairs. */
function itemSets(
  writer: Writer,
  sets: readonly (readonly (readonly [string, number])[])[],
): void {
  writer.uint(sets.length);
  for (const set of sets) {
    writer.uint(set.length);
    for (const [item, chance] of set) writer.rawcode(item).uint(chance);
  }
}

/** Writes version 13's roll, pitch and lights. */
function lights(writer: Writer, layout: Required<Layout>, count: number): void {
  if (layout.version < 13) return;
  writer
    .zeros(8)
    .uint(count)
    .zeros(36 * count);
}

/** The layout's defaults: version 13, the units' sub-version 11, skin ids. */
const withDefaults = (layout: Layout): Required<Layout> => ({
  version: layout.version ?? 13,
  subversion: layout.subversion ?? 11,
  skin: layout.skin ?? true,
});

/**
 * The bytes of a `war3mapUnits.doo` placing units and items.
 *
 * @param units - The placements, in order.
 * @param layout - The file's layout; version 13, sub-version 11, skin ids by default.
 * @returns The file's bytes.
 */
export function unitsFile(
  units: readonly PlacedUnit[],
  layout: Layout = {},
): Uint8Array {
  const full = withDefaults(layout);
  const writer = header(new Writer(), full, units.length);
  for (const unit of units) {
    prefix(writer, full, unit.rawcode);
    writer.zeros(1).uint(0).zeros(2).uint(0xffffffff).uint(0xffffffff);
    if (full.subversion >= 11) writer.uint(0xffffffff);
    itemSets(writer, unit.itemSets ?? []);
    writer.uint(0).uint(0).uint(1);
    if (full.subversion >= 11) writer.uint(0).uint(0).uint(0);
    const inventory = unit.inventory ?? [];
    writer.uint(inventory.length);
    inventory.forEach((item, slot) => writer.uint(slot).rawcode(item));
    const abilities = unit.abilities ?? [];
    writer.uint(abilities.length);
    for (const ability of abilities) writer.rawcode(ability).uint(0).uint(1);
    const random = unit.random ?? 0;
    if (random === 0) writer.uint(0).zeros(4);
    else if (random === 1) writer.uint(1).zeros(8);
    else
      writer
        .uint(2)
        .uint(random[1])
        .zeros(8 * random[1]);
    writer.uint(0xffffffff).uint(0xffffffff).uint(0);
    lights(writer, full, unit.lights ?? 0);
  }
  return writer.done();
}

/**
 * The bytes of a `war3map.doo` placing destructables and doodads, then the
 * terrain's special doodads.
 *
 * @param doodads - The placements, in order.
 * @param specials - The special doodads' Rawcodes.
 * @param layout - The file's layout; version 13, sub-version 11, skin ids by default.
 * @returns The file's bytes.
 */
export function doodadsFile(
  doodads: readonly PlacedDoodad[],
  specials: readonly string[] = [],
  layout: Layout = {},
): Uint8Array {
  const full = withDefaults(layout);
  const writer = header(new Writer(), full, doodads.length);
  for (const doodad of doodads) {
    prefix(writer, full, doodad.rawcode);
    writer.zeros(1 + 1);
    if (full.version >= 8) {
      writer.uint(0xffffffff);
      itemSets(writer, doodad.itemSets ?? []);
    }
    if (full.version >= 13) writer.uint(0);
    writer.uint(0);
    lights(writer, full, doodad.lights ?? 0);
  }
  writer.uint(0).uint(specials.length);
  for (const special of specials) writer.rawcode(special).zeros(4 + 8);
  return writer.done();
}
