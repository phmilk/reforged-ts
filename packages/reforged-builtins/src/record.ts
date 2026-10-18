/**
 * The record of a Patch (#509, "The record and versioning"): what a new
 * model of the Built-in objects changes against the previous one, each
 * change with its verdict, and the rename entries a major needs.
 *
 * - an added object is additive: a minor;
 * - a removed object, a renamed constant (the same Rawcode, a new name) and
 *   an object whose kind changed break code that names them: a major;
 * - a change of the Game data sets that hold an object is additive;
 * - a Game data set the index no longer lists breaks code that names its id
 *   (`reforged-map` matches a map's Game data set against the ids): a
 *   major; a set it adds, or a new label on a set it keeps, is additive.
 */
import { KIND_CONSTANTS, list, withArticle } from "./emit.js";
import {
  byCodePoint,
  type BuiltinsIndex,
  type IndexEntry,
  type ObjectKind,
} from "./model.js";

/** The version bump a record calls for. */
export type Verdict = "none" | "minor" | "major";

/** An object, by its Rawcode and its constant as code names it: `Units.Footman_hfoo`. */
export interface RecordObject {
  rawcode: string;
  symbol: string;
}

/** A constant that moved: renamed, or into another kind's object. */
export interface RecordMove {
  rawcode: string;
  from: string;
  to: string;
}

/** The Game data sets that hold an object, before and after. */
export interface RecordSets {
  rawcode: string;
  symbol: string;
  from: string[];
  to: string[];
}

/** A Game data set of the index: its id and its label. */
export interface RecordSet {
  id: string;
  label: string;
}

/** A Game data set that keeps its id under a new label. */
export interface RecordRelabel {
  id: string;
  from: string;
  to: string;
}

export interface PatchRecord {
  /** The previous model; undefined when there is none. */
  previous: Pick<BuiltinsIndex, "gameVersion" | "build"> | undefined;
  /** The new model's Game version. */
  gameVersion: string;
  /** The labels of the Game data sets, by id, for the messages. */
  labels: ReadonlyMap<string, string>;
  added: RecordObject[];
  removed: RecordObject[];
  renamed: RecordMove[];
  kindChanged: RecordMove[];
  setsChanged: RecordSets[];
  /** The Game data sets the new index lists and the previous one does not, in the new index's order. */
  setsAdded: RecordSet[];
  /** The Game data sets the previous index lists and the new one does not, in the previous index's order. */
  setsRemoved: RecordSet[];
  /** The Game data sets both list under different labels, in the new index's order. */
  setsRelabelled: RecordRelabel[];
  verdict: Verdict;
}

/** An entry of a rename map, with the schema of the library's. */
export interface RenameEntry {
  old: string;
  new: string | null;
  kind: "member";
  versions: { from: string; to: string };
  oneToOne: boolean;
  note: string;
}

/** `Units.Footman_hfoo`. */
function symbolOf(entry: IndexEntry): string {
  return `${KIND_CONSTANTS[entry.kind].object}.${entry.constant}`;
}

/** The record of `next` against `previous`, by Rawcode in code-point order. */
export function recordOf(
  previous: BuiltinsIndex | undefined,
  next: BuiltinsIndex,
): PatchRecord {
  const before = previous?.objects ?? {};
  const after = next.objects;
  const rawcodes = [
    ...new Set([...Object.keys(before), ...Object.keys(after)]),
  ].sort(byCodePoint);
  const record: PatchRecord = {
    previous:
      previous === undefined
        ? undefined
        : { gameVersion: previous.gameVersion, build: previous.build },
    gameVersion: next.gameVersion,
    labels: new Map(
      [...(previous?.gameDataSets ?? []), ...next.gameDataSets].map((set) => [
        set.id,
        set.label,
      ]),
    ),
    added: [],
    removed: [],
    renamed: [],
    kindChanged: [],
    setsChanged: [],
    ...setChangesOf(previous, next),
    verdict: "none",
  };
  for (const rawcode of rawcodes) {
    const old = before[rawcode] as IndexEntry | undefined;
    const now = after[rawcode] as IndexEntry | undefined;
    if (old === undefined && now !== undefined) {
      record.added.push({ rawcode, symbol: symbolOf(now) });
    } else if (old !== undefined && now === undefined) {
      record.removed.push({ rawcode, symbol: symbolOf(old) });
    } else if (old !== undefined && now !== undefined) {
      if (old.kind !== now.kind) {
        record.kindChanged.push({
          rawcode,
          from: symbolOf(old),
          to: symbolOf(now),
        });
      } else if (old.constant !== now.constant) {
        record.renamed.push({
          rawcode,
          from: symbolOf(old),
          to: symbolOf(now),
        });
      }
      if (old.sets.join() !== now.sets.join()) {
        record.setsChanged.push({
          rawcode,
          symbol: symbolOf(now),
          from: old.sets,
          to: now.sets,
        });
      }
    }
  }
  record.verdict =
    record.removed.length +
      record.renamed.length +
      record.kindChanged.length +
      record.setsRemoved.length >
    0
      ? "major"
      : record.added.length +
            record.setsChanged.length +
            record.setsAdded.length +
            record.setsRelabelled.length >
          0
        ? "minor"
        : "none";
  return record;
}

/**
 * The Game data sets `next` adds, removes and relabels against `previous`,
 * by id: a renamed id is one removed set and one added set. None against
 * no previous model.
 */
function setChangesOf(
  previous: BuiltinsIndex | undefined,
  next: BuiltinsIndex,
): Pick<PatchRecord, "setsAdded" | "setsRemoved" | "setsRelabelled"> {
  if (previous === undefined) {
    return { setsAdded: [], setsRemoved: [], setsRelabelled: [] };
  }
  const before = new Map(previous.gameDataSets.map((set) => [set.id, set]));
  const after = new Set(next.gameDataSets.map((set) => set.id));
  return {
    setsAdded: next.gameDataSets
      .filter((set) => !before.has(set.id))
      .map(({ id, label }) => ({ id, label })),
    setsRemoved: previous.gameDataSets
      .filter((set) => !after.has(set.id))
      .map(({ id, label }) => ({ id, label })),
    setsRelabelled: next.gameDataSets.flatMap((set) => {
      const old = before.get(set.id);
      return old === undefined || old.label === set.label
        ? []
        : [{ id: set.id, from: old.label, to: set.label }];
    }),
  };
}

/** The record as text, one line per change with its verdict. */
export function formatRecord(record: PatchRecord): string {
  const against =
    record.previous === undefined
      ? "no previous model"
      : `Game version ${record.previous.gameVersion} (Build ${record.previous.build})`;
  const verdict =
    record.verdict === "none" ? "no change" : `a ${record.verdict}`;
  const sets = (ids: readonly string[]) =>
    list(ids.map((id) => record.labels.get(id) ?? id));
  return [
    `The record against ${against}: ${verdict}.`,
    ...record.setsAdded.map(
      (set) => `- Game data set added (minor): ${set.label} (${set.id})`,
    ),
    ...record.setsRemoved.map(
      (set) =>
        `- Game data set removed (major): ${set.label} (${set.id}), with no rename entry: say on the migration page which set a map of it reads now`,
    ),
    ...record.setsRelabelled.map(
      (set) =>
        `- Game data set relabelled (minor): ${set.id}, from ${set.from} to ${set.to}`,
    ),
    ...record.added.map((o) => `- added (minor): ${o.symbol} (${o.rawcode})`),
    ...record.removed.map(
      (o) => `- removed (major): ${o.symbol} (${o.rawcode})`,
    ),
    ...record.renamed.map(
      (m) => `- renamed (major): ${m.from} to ${m.to} (${m.rawcode})`,
    ),
    ...record.kindChanged.map(
      (m) => `- kind changed (major): ${m.from} to ${m.to} (${m.rawcode})`,
    ),
    ...record.setsChanged.map(
      (s) =>
        `- Game data sets changed (minor): ${s.symbol} (${s.rawcode}), from ${sets(s.from)} to ${sets(s.to)}`,
    ),
  ]
    .map((line) => `${line}\n`)
    .join("");
}

/** The kind a symbol's constants object holds: `Units` holds units. */
function kindOfSymbol(symbol: string): ObjectKind {
  const object = symbol.slice(0, symbol.indexOf("."));
  const kind = (Object.keys(KIND_CONSTANTS) as ObjectKind[]).find(
    (k) => KIND_CONSTANTS[k].object === object,
  );
  if (kind === undefined)
    throw new Error(`${symbol} names no kind's constants.`);
  return kind;
}

/**
 * The rename entries of a record for the version pair `versions`, in the
 * order of their old symbols: a renamed constant maps to its new name, a
 * constant moved to another kind's object to its new one, and a removed
 * object's to nothing.
 */
export function renameEntriesOf(
  record: PatchRecord,
  versions: { from: string; to: string },
): RenameEntry[] {
  const entries: RenameEntry[] = [
    ...record.removed.map((o) => ({
      old: o.symbol,
      new: null,
      kind: "member" as const,
      versions,
      oneToOne: false,
      note: `The Built-in ${kindOfSymbol(o.symbol)} ${o.rawcode} is gone from Game version ${record.gameVersion}.`,
    })),
    ...record.renamed.map((m) => ({
      old: m.from,
      new: m.to,
      kind: "member" as const,
      versions,
      oneToOne: true,
      note: `The Built-in ${kindOfSymbol(m.to)} ${m.rawcode} is renamed in Game version ${record.gameVersion}.`,
    })),
    ...record.kindChanged.map((m) => ({
      old: m.from,
      new: m.to,
      kind: "member" as const,
      versions,
      oneToOne: false,
      note: `${m.rawcode} is a Built-in ${kindOfSymbol(m.to)} in Game version ${record.gameVersion}, no longer ${withArticle(kindOfSymbol(m.from))}: its Rawcode's type changes.`,
    })),
  ];
  return entries.sort((a, b) => byCodePoint(a.old, b.old));
}
