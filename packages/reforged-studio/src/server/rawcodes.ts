/**
 * The free Rawcode of a new object, and what holds a taken one. A Rawcode
 * is free when no object of any of the seven Object kinds holds it (the
 * map folder's, saved or not, the Object definitions' and the Built-in
 * objects of `reforged-builtins`' index), the Object manifest does not
 * record it as removed, and no placement on the terrain names it (#482: a
 * Rawcode reused before the World Editor's next save would bring its dead
 * placements back as the new object). The suggestion takes the World
 * Editor's prefix and the lowest free number in the editor's order.
 */
import fs from "node:fs";
import type { ObjectKind, RawcodeObject } from "reforged-map";
import { isKind } from "../kinds.js";
import { DOODADS_FILE, UNITS_FILE, type Placements } from "../placements.js";
import type { ObjectOrigin, RawcodeHolder } from "./api-types.js";
import type { ObjectState } from "./states.js";

/** The prefix the World Editor gives a new object of each kind but a unit, whose prefix is its base's first letter. */
export const RAWCODE_PREFIXES: Readonly<
  Record<Exclude<ObjectKind, "unit">, string>
> = {
  item: "I",
  ability: "A",
  buff: "B",
  destructable: "B",
  doodad: "D",
  upgrade: "R",
};

/** The digits of a new Rawcode's number, in the World Editor's order: `0` to `9`, then `A` to `Z`. */
const DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Whether a text is a Rawcode: four printable ASCII characters. */
export const isRawcode = (text: string): boolean =>
  /^[\x20-\x7e]{4}$/.test(text);

/** What a Rawcode is checked against. */
export interface RawcodeSources {
  /** The lookup's objects: the map folder's on disk, the Object definitions' and the Built-in objects. */
  readonly listed: readonly RawcodeObject[];
  /** The session's working state, which holds the objects an unsaved edit added. */
  readonly working: ObjectState;
  /** The Rawcodes the Object manifest records as removed, each with its Object kind. */
  readonly removed: readonly {
    readonly kind: ObjectKind;
    readonly rawcode: string;
  }[];
  /** The placements on the terrain. */
  readonly placements: Placements;
}

/** An object's origin as the Studio names it: a listed object an Object definition defines is `"definition"`. */
function originOf(object: RawcodeObject): ObjectOrigin {
  if (object.origin !== "builtin" && object.definitionFile !== undefined) {
    return "definition";
  }
  return object.origin;
}

/**
 * Everything that holds a Rawcode: each object of any kind, each removal
 * the Object manifest records, each placement file that names it.
 *
 * @param rawcode - The Rawcode.
 * @param sources - What it is checked against.
 * @returns The holders; empty when the Rawcode is free.
 */
export function rawcodeHolders(
  rawcode: string,
  sources: RawcodeSources,
): RawcodeHolder[] {
  const holders: RawcodeHolder[] = [];
  const seen = new Set<string>();
  for (const object of sources.listed) {
    if (object.rawcode !== rawcode) continue;
    seen.add(object.kind);
    holders.push({
      by: "object",
      kind: object.kind,
      origin: originOf(object),
      ...(object.name !== undefined && { name: object.name }),
    });
  }
  for (const object of sources.working.values()) {
    if (object.rawcode !== rawcode || seen.has(object.kind)) continue;
    holders.push({ by: "object", kind: object.kind, origin: "custom" });
  }
  for (const removed of sources.removed) {
    if (removed.rawcode === rawcode) {
      holders.push({ by: "removed", kind: removed.kind });
    }
  }
  for (const [file, counts] of [
    [UNITS_FILE, sources.placements.units],
    [DOODADS_FILE, sources.placements.doodads],
  ] as const) {
    const count = counts.get(rawcode);
    if (count !== undefined) holders.push({ by: "placed", file, count });
  }
  return holders;
}

/**
 * An object in a sentence: its name and Rawcode, or its Rawcode alone.
 *
 * @param rawcode - Its Rawcode.
 * @param name - Its name, when one is known.
 * @returns The words.
 */
export const objectText = (
  rawcode: string,
  name: string | undefined,
): string => (name === undefined ? rawcode : `${name} (${rawcode})`);

/**
 * The message that refuses a text as a Rawcode.
 *
 * @param text - The text.
 * @returns The sentence.
 */
export const notRawcodeText = (text: string): string =>
  `${text === "" ? "An empty text" : text} is not a Rawcode: a Rawcode is four printable ASCII characters.`;

/** The words an origin takes in a sentence. */
const ORIGIN_NAMES: Readonly<Record<ObjectOrigin, string>> = {
  builtin: "the Built-in",
  modified: "the modified Built-in",
  custom: "the Custom",
  definition: "the Object definition's",
};

/**
 * What holds a taken Rawcode, in one sentence an author reads.
 *
 * @param rawcode - The Rawcode.
 * @param holders - What {@link rawcodeHolders} found.
 * @returns The sentence.
 */
export function holdersText(
  rawcode: string,
  holders: readonly RawcodeHolder[],
): string {
  const parts = holders.map((holder) => {
    switch (holder.by) {
      case "object":
        return `${ORIGIN_NAMES[holder.origin]} ${holder.kind} ${objectText(rawcode, holder.name)}`;
      case "removed":
        return `the Object manifest, which records the ${holder.kind} ${rawcode} as removed`;
      case "placed":
        return `${String(holder.count)} placement${holder.count === 1 ? "" : "s"} on the terrain in ${holder.file}`;
    }
  });
  return `${rawcode} is taken by ${parts.join(", ")}.`;
}

/**
 * The prefix of a new object's Rawcode, as the World Editor gives it: a
 * unit's base's first letter, else its kind's.
 *
 * @param kind - The new object's Object kind.
 * @param base - Its base's Rawcode, which a unit's prefix needs.
 * @returns The prefix.
 */
export function rawcodePrefix(
  kind: ObjectKind,
  base: string | undefined,
): string {
  if (kind !== "unit") return RAWCODE_PREFIXES[kind];
  return base === undefined || base === "" ? "h" : base.charAt(0);
}

/**
 * The free Rawcode the Studio suggests for a new object: its prefix, then
 * the lowest free number of three digits in the World Editor's order
 * (`h000` to `h009`, `h00A` to `h00Z`, `h010`).
 *
 * @param prefix - The prefix, from {@link rawcodePrefix}.
 * @param sources - What a Rawcode is checked against.
 * @returns The Rawcode; undefined when every one of the prefix is taken.
 */
export function freeRawcode(
  prefix: string,
  sources: RawcodeSources,
): string | undefined {
  const taken = new Set<string>();
  for (const object of sources.listed) taken.add(object.rawcode);
  for (const object of sources.working.values()) taken.add(object.rawcode);
  for (const removed of sources.removed) taken.add(removed.rawcode);
  for (const rawcode of sources.placements.units.keys()) taken.add(rawcode);
  for (const rawcode of sources.placements.doodads.keys()) taken.add(rawcode);
  const size = DIGITS.length;
  for (let number = 0; number < size ** 3; number++) {
    const rawcode =
      prefix +
      DIGITS.charAt(Math.floor(number / size / size)) +
      DIGITS.charAt(Math.floor(number / size) % size) +
      DIGITS.charAt(number % size);
    if (!taken.has(rawcode)) return rawcode;
  }
  return undefined;
}

/**
 * The Rawcodes the Object manifest records as removed, read from its file
 * with one whole-file read; none when it is missing or does not parse, as
 * the lookup then says.
 *
 * @param file - The Object manifest, an absolute path.
 * @returns Each removed object's Object kind and Rawcode.
 */
export function removedRawcodes(
  file: string,
): { readonly kind: ObjectKind; readonly rawcode: string }[] {
  let json: unknown;
  try {
    json = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return [];
  }
  const removed = (json as { removed?: unknown } | null)?.removed;
  if (!Array.isArray(removed)) return [];
  return removed.flatMap((entry: unknown) => {
    const { kind, rawcode } = (entry ?? {}) as Record<string, unknown>;
    return typeof kind === "string" &&
      isKind(kind) &&
      typeof rawcode === "string"
      ? [{ kind, rawcode }]
      : [];
  });
}
