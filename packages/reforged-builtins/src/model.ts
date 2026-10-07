/**
 * The model: the JSON index of a Game version's Built-in objects, and its
 * provenance file. Both are written byte-stably: fixed key order, entries in
 * code-point order of their Rawcode, LF line ends and a final LF, so a
 * regeneration from unchanged inputs writes the same bytes.
 */

/** The index's shape; it changes only with an incompatible shape, in a major. */
export const INDEX_FORMAT = 1;

/** The Object kinds of ADR 0012, as `reforged-types`' `ObjectKind` names them. */
export type ObjectKind =
  "unit" | "item" | "ability" | "buff" | "destructable" | "doodad" | "upgrade";

/** A Game data set: its stable id and its label. */
export interface GameDataSet {
  id: string;
  label: string;
}

/** One Built-in object of the index. */
export interface IndexEntry {
  kind: ObjectKind;
  /** The enUS name; absent when the game gives none. */
  name?: string;
  /** Lower-case, as the game writes it (`human`, `nightelf`); absent for a kind without one. */
  race?: string;
  /** The ids of the Game data sets that hold the object. */
  sets: string[];
  /** The name of its constant, `Footman_hfoo`. */
  constant: string;
}

/** The JSON index of one Game version. */
export interface BuiltinsIndex {
  format: number;
  /** The Build it was extracted from, `3.0.0.24268`. */
  build: string;
  /** The Game version, `3.0.0`. */
  gameVersion: string;
  gameDataSets: GameDataSet[];
  /** Each object by its Rawcode. */
  objects: Record<string, IndexEntry>;
}

/** One file the generator read from the storage. */
export interface ProvenanceInput {
  /** Its CASC path, as the root spells it. */
  path: string;
  contentKey: string;
  sha256: string;
  /** Its decoded size in bytes. */
  size: number;
}

/** The provenance file: the only trace of the raw files. Never published. */
export interface Provenance {
  build: string;
  /** The build config's key, from `.build.info`. */
  buildConfig: string;
  inputs: ProvenanceInput[];
}

/** Code-point order, independent of locale. */
export function byCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** The Game version of a Build: its first three parts. */
export function gameVersionOf(build: string): string {
  return build.split(".").slice(0, 3).join(".");
}

/** The index's text: one line per object, by Rawcode in code-point order. */
export function serializeIndex(index: BuiltinsIndex): string {
  const sets = index.gameDataSets
    .map((set) => `    ${JSON.stringify({ id: set.id, label: set.label })}`)
    .join(",\n");
  const objects = Object.keys(index.objects)
    .sort(byCodePoint)
    .map((rawcode) => {
      const entry = index.objects[rawcode];
      const ordered: IndexEntry = {
        kind: entry.kind,
        ...(entry.name !== undefined && { name: entry.name }),
        ...(entry.race !== undefined && { race: entry.race }),
        sets: entry.sets,
        constant: entry.constant,
      };
      return `    ${JSON.stringify(rawcode)}: ${JSON.stringify(ordered)}`;
    })
    .join(",\n");
  return (
    `{\n` +
    `  "format": ${String(index.format)},\n` +
    `  "build": ${JSON.stringify(index.build)},\n` +
    `  "gameVersion": ${JSON.stringify(index.gameVersion)},\n` +
    `  "gameDataSets": ${block(sets, "[", "]")},\n` +
    `  "objects": ${block(objects, "{", "}")}\n` +
    `}\n`
  );
}

/** An indented JSON array or object of the given lines. */
function block(lines: string, open: string, close: string): string {
  return lines === "" ? `${open}${close}` : `${open}\n${lines}\n  ${close}`;
}

/** The provenance file's text, its inputs by path in code-point order. */
export function serializeProvenance(provenance: Provenance): string {
  const ordered: Provenance = {
    build: provenance.build,
    buildConfig: provenance.buildConfig,
    inputs: [...provenance.inputs]
      .sort((a, b) => byCodePoint(a.path, b.path))
      .map(({ path, contentKey, sha256, size }) => ({
        path,
        contentKey,
        sha256,
        size,
      })),
  };
  return `${JSON.stringify(ordered, null, 2)}\n`;
}
