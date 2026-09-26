// The rename map, migration/renames.json: the facts the migration guide and
// the legacy-names lint rule read. It must parse against its schema, target
// this step's version pair, name only replacements that exist in the
// library's emitted declarations and cover every member step 3 removes, every
// entry point, enum and helper step 4 removes or replaces, every Trigger
// registration step 5 renames or changes, and every member of the sync, host
// and binary Systems step 6 removes or renames.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createMapProject,
  publicApi,
  type MapProject,
  type PublicApi,
} from "./support/declarations";
import {
  isNoRenamesMarker,
  loadRenameMap,
  loadRenames,
  parseRenames,
  parseSymbol,
  publishedFiles,
  replacements,
  type NoRenamesMarker,
  type RenameEntry,
  type RenameMapItem,
} from "./support/renames";

/** The version pair every entry of the first release carries. */
const VERSIONS = { from: "w3ts@3", to: "reforged-ts@1" };

/** What build step 3 (#51) removes from the public API, with its kind. */
const REMOVED_IN_STEP_3: [old: string, kind: RenameEntry["kind"]][] = [
  ...[
    "CameraSetup",
    "Destructable",
    "Dialog",
    "DialogButton",
    "Effect",
    "FogModifier",
    "Force",
    "Frame",
    "GameCache",
    "Group",
    "Image",
    "Item",
    "Leaderboard",
    "MapPlayer",
    "Multiboard",
    "MultiboardItem",
    "Point",
    "Quest",
    "QuestItem",
    "Rectangle",
    "Region",
    "Sound",
    "TextTag",
    "Timer",
    "TimerDialog",
    "Trigger",
    "Ubersplat",
    "Unit",
    "WeatherEffect",
  ].map((name): [string, RenameEntry["kind"]] => [
    `new ${name}(...)`,
    "constructor",
  ]),
  ["Frame.parent", "accessor"],
  ["Unit.owner", "accessor"],
  ["Unit.point", "accessor"],
  ["Group.getEnumUnit", "member"],
  ["Group.getFilterUnit", "member"],
  ["MapPlayer.create", "member"],
  // Protected: what a w3ts 3.x author's own Wrapper subclass called.
  ["Handle.getObject", "member"],
  ["Handle.initFromHandle", "member"],
];

/**
 * What build step 4 (#49) removes from the public API or replaces with an
 * Init stage, with its kind: the four entry points of the deprecated alias,
 * its enum (still exported this release, removed in 2.0) and the old Hook
 * code's helpers.
 */
const REMOVED_IN_STEP_4: [old: string, kind: RenameEntry["kind"]][] = [
  ["main::before", "entryPoint"],
  ["main::after", "entryPoint"],
  ["config::before", "entryPoint"],
  ["config::after", "entryPoint"],
  ["W3TS_HOOK", "type"],
  ["hookedMain", "function"],
  ["hookedConfig", "function"],
  ["executeHooksMainBefore", "function"],
  ["executeHooksMainAfter", "function"],
  ["executeHooksConfigBefore", "function"],
  ["executeHooksConfigAfter", "function"],
];

/**
 * What build step 5 (#47) removes from the public API, with its kind: the
 * four Trigger registrations that took a raw handle or a misnamed prefix, and
 * the mouse registration, whose numeric argument became `MouseEventKind` (a
 * note entry: the member keeps its name).
 */
const REMOVED_IN_STEP_5: [old: string, kind: RenameEntry["kind"]][] = [
  ["Trigger.registerTimerExpireEvent", "member"],
  ["Trigger.triggerRegisterFrameEvent", "member"],
  ["Trigger.registerTrackableHitEvent", "member"],
  ["Trigger.registerTrackableTrackEvent", "member"],
  ["Trigger.registerPlayerMouseEvent", "member"],
];

/**
 * What build step 6 (#53) removes from the public API or renames, with its
 * kind: the sync System's callback API and `I`-prefixed types, the constructor
 * overloads that took the data (a note entry: the constructor stays, taking
 * the sender and the options), the host System's callback, and the binary
 * reader's and writer's internals.
 */
const REMOVED_IN_STEP_6: [old: string, kind: RenameEntry["kind"]][] = [
  ["new SyncRequest(...)", "constructor"],
  ["SyncRequest.then", "member"],
  ["SyncRequest.catch", "member"],
  ["SyncCallback", "type"],
  ["ISyncResponse", "type"],
  ["ISyncOptions", "type"],
  ["SyncRequest.destroy", "member"],
  ["SyncRequest.fromIndex", "member"],
  ["onHostDetect", "function"],
  ["BinaryReader.read", "member"],
  ["BinaryReader.data", "member"],
  ["BinaryWriter.values", "member"],
];

const valid: RenameEntry = {
  old: "Group.getEnumUnit",
  new: "Unit.fromEnum",
  kind: "member",
  versions: VERSIONS,
  oneToOne: true,
  note: "One name for one Native.",
};

describe("the rename map's loader", () => {
  it("accepts a well-formed entry", () => {
    expect(parseRenames(JSON.stringify([valid]))).toEqual([valid]);
  });

  it("accepts an entry point of the deprecated alias as an old symbol", () => {
    const entryPoint: RenameEntry = {
      ...valid,
      old: "main::after",
      new: "Init.onInitTriggers",
      kind: "entryPoint",
      oneToOne: false,
    };
    expect(parseRenames(JSON.stringify([entryPoint]))).toEqual([entryPoint]);
  });

  it("accepts the package itself, renamed, as a package entry", () => {
    const packageEntry: RenameEntry = {
      ...valid,
      old: "w3ts",
      new: "reforged-ts",
      kind: "package",
    };
    expect(parseRenames(JSON.stringify([packageEntry]))).toEqual([
      packageEntry,
    ]);
  });

  it("accepts the no-renames marker of a version pair", () => {
    const marker: NoRenamesMarker = {
      kind: "noRenames",
      versions: { from: "reforged-ts@1", to: "reforged-ts@2" },
      note: "2.0 raises the supported Patch and renames nothing.",
    };
    expect(parseRenames(JSON.stringify([valid, marker]))).toEqual([
      valid,
      marker,
    ]);
  });

  it.each<[string, unknown]>([
    ["is not an array", valid],
    [
      "has a no-renames marker without a note",
      [{ kind: "noRenames", versions: VERSIONS }],
    ],
    [
      "has a no-renames marker with an empty note",
      [{ kind: "noRenames", versions: VERSIONS, note: "" }],
    ],
    [
      "has a no-renames marker without its version pair",
      [{ kind: "noRenames", note: "n." }],
    ],
    [
      "has a no-renames marker naming a symbol",
      [{ kind: "noRenames", versions: VERSIONS, note: "n.", old: "Unit" }],
    ],
    [
      "has a no-renames marker with a version without a major",
      [
        {
          kind: "noRenames",
          versions: { ...VERSIONS, to: "reforged-ts" },
          note: "n.",
        },
      ],
    ],
    ["has an entry without a note", [{ ...valid, note: undefined }]],
    ["has an entry with an unknown field", [{ ...valid, reason: "x" }]],
    ["has an unknown kind", [{ ...valid, kind: "method" }]],
    [
      "has a version without a major",
      [{ ...valid, versions: { ...VERSIONS, from: "w3ts" } }],
    ],
    [
      "has an old symbol that is not a symbol",
      [{ ...valid, old: "Group getEnumUnit" }],
    ],
    [
      "has an entry point with a single colon",
      [{ ...valid, old: "main:before", kind: "entryPoint" }],
    ],
    [
      "has an entry point qualified by a class",
      [{ ...valid, old: "Init.main::before", kind: "entryPoint" }],
    ],
    [
      "has an entry point written as a call",
      [{ ...valid, old: "main::before(...)", kind: "entryPoint" }],
    ],
    [
      "has a one-to-one entry with two replacements",
      [{ ...valid, new: ["Unit.fromEnum", "Unit.fromFilter"] }],
    ],
    ["has an empty note", [{ ...valid, note: "" }]],
    [
      "has a package entry whose replacement is a symbol",
      [{ ...valid, old: "w3ts", new: "Unit.create(...)", kind: "package" }],
    ],
    [
      "has a package entry whose old name is a call",
      [{ ...valid, old: "w3ts(...)", new: "reforged-ts", kind: "package" }],
    ],
    [
      "has a package name as a member's replacement",
      [{ ...valid, new: "reforged-ts" }],
    ],
    [
      "has a package name as a member's old symbol",
      [{ ...valid, old: "reforged-ts" }],
    ],
  ])("rejects a map that %s", (_, map) => {
    expect(() => parseRenames(JSON.stringify(map))).toThrow(
      /does not match its schema/,
    );
  });

  it("rejects text that is not JSON", () => {
    expect(() => parseRenames("[{")).toThrow();
  });
});

describe("a symbol of the rename map", () => {
  it.each([
    ["new Unit(...)", { className: "Unit", member: undefined }],
    ["Unit.create(...)", { className: "Unit", member: "create" }],
    ["Frame.parent", { className: "Frame", member: "parent" }],
    ["Unit", { className: "Unit", member: undefined }],
  ])("%s names %o", (symbol, parsed) => {
    expect(parseSymbol(symbol)).toEqual(parsed);
  });
});

describe("migration/renames.json", () => {
  let project: MapProject;
  let api: PublicApi;

  beforeAll(async () => {
    project = await createMapProject();
    api = publicApi(project);
  }, 120_000);

  afterAll(async () => {
    await (project as MapProject | undefined)?.dispose();
  });

  it("matches its schema", async () => {
    await expect(loadRenames()).resolves.not.toEqual([]);
  });

  it("targets this step's version pair in every entry", async () => {
    const entries = await loadRenames();
    expect(
      entries.filter(
        (entry) =>
          entry.versions.from !== VERSIONS.from ||
          entry.versions.to !== VERSIONS.to,
      ),
    ).toEqual([]);
  });

  it("gives each version pair entries or the no-renames marker, not both", async () => {
    const items = await loadRenameMap();
    const pair = (item: RenameMapItem) =>
      `${item.versions.from} to ${item.versions.to}`;
    const marked = new Set(items.filter(isNoRenamesMarker).map(pair));
    const markedTwice = items
      .filter(isNoRenamesMarker)
      .map(pair)
      .filter((each, index, all) => all.indexOf(each) !== index);
    expect(markedTwice).toEqual([]);
    expect(
      items
        .filter((item) => !isNoRenamesMarker(item))
        .map(pair)
        .filter((each) => marked.has(each)),
    ).toEqual([]);
  });

  it("names every old symbol once", async () => {
    const entries = await loadRenames();
    const olds = entries.map((entry) => entry.old);
    expect(olds.filter((old, index) => olds.indexOf(old) !== index)).toEqual(
      [],
    );
  });

  it("has an entry for every member step 3 removes, of its kind", async () => {
    const entries = await loadRenames();
    const kinds = new Map(entries.map((entry) => [entry.old, entry.kind]));
    expect(
      REMOVED_IN_STEP_3.filter(([old, kind]) => kinds.get(old) !== kind),
    ).toEqual([]);
  });

  it("has an entry for every entry point, enum and helper step 4 removes or replaces, of its kind", async () => {
    const entries = await loadRenames();
    const kinds = new Map(entries.map((entry) => [entry.old, entry.kind]));
    expect(
      REMOVED_IN_STEP_4.filter(([old, kind]) => kinds.get(old) !== kind),
    ).toEqual([]);
  });

  it("renames the package w3ts to reforged-ts, one to one", async () => {
    const entries = await loadRenames();
    expect(entries.filter((entry) => entry.kind === "package")).toEqual([
      expect.objectContaining({
        old: "w3ts",
        new: "reforged-ts",
        oneToOne: true,
      }),
    ]);
  });

  it("has an entry for every Trigger registration step 5 renames or changes, of its kind", async () => {
    const entries = await loadRenames();
    const kinds = new Map(entries.map((entry) => [entry.old, entry.kind]));
    expect(
      REMOVED_IN_STEP_5.filter(([old, kind]) => kinds.get(old) !== kind),
    ).toEqual([]);
  });

  it("has an entry for every System member step 6 removes or renames, of its kind", async () => {
    const entries = await loadRenames();
    const kinds = new Map(entries.map((entry) => [entry.old, entry.kind]));
    expect(
      REMOVED_IN_STEP_6.filter(([old, kind]) => kinds.get(old) !== kind),
    ).toEqual([]);
  });

  it("names both halves of an accessor's get/set pair", async () => {
    const entries = await loadRenames();
    expect(
      entries
        .filter((entry) => entry.kind === "accessor" && entry.new !== null)
        .filter((entry) => replacements(entry).length !== 2),
    ).toEqual([]);
  });

  it("names only replacements the emitted declarations export publicly", async () => {
    const entries = await loadRenames();
    const missing = entries.flatMap((entry) =>
      replacements(entry).filter((symbol) => !api.has(parseSymbol(symbol))),
    );
    expect(missing).toEqual([]);
  });

  it("sees a member that does not exist as missing", () => {
    expect(api.has(parseSymbol("Unit.noSuchMember"))).toBe(false);
    expect(api.has(parseSymbol("NoSuchClass"))).toBe(false);
    expect(api.has(parseSymbol("Unit.fromEnum"))).toBe(true);
    expect(api.has(parseSymbol("Frame.getParent"))).toBe(true);
    // Private in w3ts 3.x and deleted by step 3: never a replacement.
    expect(api.has(parseSymbol("MapPlayer.create"))).toBe(false);
    expect(api.has(parseSymbol("Handle.fromHandle"))).toBe(true);
    // A value export whose type has the member: the Init stages and the
    // library's entry point are const instances, not classes.
    expect(api.has(parseSymbol("Init.onGlobals"))).toBe(true);
    expect(api.has(parseSymbol("Init.noSuchStage"))).toBe(false);
    expect(api.has(parseSymbol("Reforged.configure"))).toBe(true);
    expect(api.has(parseSymbol("Host.detectHost"))).toBe(true);
    // Deleted by step 6: the Promise replaces the callback members.
    expect(api.has(parseSymbol("SyncRequest.then"))).toBe(false);
    expect(api.has(parseSymbol("SyncRequest.send"))).toBe(true);
    // An exported type is not a value an author can write a member of.
    expect(api.has(parseSymbol("InitStages.onGlobals"))).toBe(false);
  });
});

describe("the published package", () => {
  it("ships the rename map, its schema and the behaviour-changes note", () => {
    expect(publishedFiles()).toEqual(
      expect.arrayContaining([
        "migration/renames.json",
        "migration/renames.schema.json",
        "migration/behaviour-changes.md",
      ]),
    );
  });
});
