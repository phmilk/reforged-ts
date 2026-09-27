import { copyFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { main } from "../src/cli/data-check.js";
import {
  dataCheck,
  failingViolations,
  type DataCheckInput,
  type Violation,
} from "../src/data-check.js";
import type { NoRenamesMarker, RenameEntry } from "../src/rename-map.js";
import {
  PACKAGES,
  tempDir,
  writeText,
  writeWorkspace,
} from "./support/workspace.js";

/** The library's schema, next to which every fixture map is written. */
const SCHEMA = fileURLToPath(
  new URL(
    "../../packages/reforged-ts/migration/renames.schema.json",
    import.meta.url,
  ),
);

const FIRST = { from: "w3ts@3", to: "reforged-ts@1" };
const SECOND = { from: "reforged-ts@1", to: "reforged-ts@2" };

/** The migration pages of `FIRST` and `SECOND`, relative to the docs tree. */
const FIRST_PAGE = "migration/w3ts-3-to-reforged-ts-1.md";
const SECOND_PAGE = "migration/reforged-ts-1-to-reforged-ts-2.md";

function entry(fields: Partial<RenameEntry>): RenameEntry {
  return {
    old: "Unit.owner",
    new: ["Unit.getOwner", "Unit.setOwner"],
    kind: "accessor",
    versions: FIRST,
    oneToOne: false,
    note: "A get/set pair.",
    ...fields,
  };
}

const marker: NoRenamesMarker = {
  kind: "noRenames",
  versions: SECOND,
  note: "Renames nothing.",
};

/**
 * A built declaration entry: the old names of a consistent map are gone
 * (the constructor protected, the accessor split, the removed member
 * absent), and a replacement of each exists.
 */
const DECLARATIONS: Record<string, string> = {
  "index.d.ts": [
    'export { Handle } from "./handle";',
    'export { Unit } from "./unit";',
    "export declare function onHost(): void;",
    "",
  ].join("\n"),
  "handle.d.ts": [
    "export declare class Handle {",
    "  protected constructor(handle: unknown);",
    "  static fromHandle(handle: unknown): Handle | undefined;",
    "  protected getObject(): unknown;",
    "}",
    "",
  ].join("\n"),
  "unit.d.ts": [
    'import { Handle } from "./handle";',
    "export declare class Unit extends Handle {",
    "  static create(): Unit;",
    "  getOwner(): number;",
    "  setOwner(owner: number): void;",
    "}",
    "",
  ].join("\n"),
};

/** A map whose old names the fixture declarations no longer export. */
const CONSISTENT: RenameEntry[] = [
  entry({}),
  entry({
    old: "new Unit(...)",
    new: "Unit.create(...)",
    kind: "constructor",
    oneToOne: true,
  }),
  entry({ old: "Handle.getObject", new: "Handle.fromHandle", kind: "member" }),
  entry({ old: "Group.getEnumUnit", new: null, kind: "member" }),
  entry({ old: "onHostDetect", new: "onHost", kind: "function" }),
];

interface Fixture {
  /** The rename map's items. */
  renames: unknown[];
  /** Files of the declaration entry's folder, by name; `DECLARATIONS` by default. */
  declarations?: Record<string, string>;
  /** Pages of the docs tree, relative to it. */
  pages?: string[];
  /** The library's version; `2.0.0` by default, past both pairs. */
  version?: string;
}

/**
 * Writes the fixture's map, declarations and docs tree; resolves with their
 * paths and the version.
 */
async function fixture(files: Fixture): Promise<DataCheckInput> {
  const root = await tempDir("data-check");
  await writeText(
    root,
    "migration/renames.json",
    JSON.stringify(files.renames),
  );
  await copyFile(SCHEMA, join(root, "migration/renames.schema.json"));
  for (const [name, text] of Object.entries(
    files.declarations ?? DECLARATIONS,
  )) {
    await writeText(root, `dist/${name}`, text);
  }
  for (const page of files.pages ?? []) {
    await writeText(root, `docs/${page}`, "# Migrating\n");
  }
  return {
    renames: join(root, "migration/renames.json"),
    declarations: join(root, "dist/index.d.ts"),
    docs: join(root, "docs"),
    version: files.version ?? "2.0.0",
  };
}

describe("data:check", () => {
  it("finds nothing in a consistent map, declarations and docs tree", async () => {
    const paths = await fixture({
      renames: [...CONSISTENT, marker],
      pages: [FIRST_PAGE, SECOND_PAGE],
    });
    expect(await dataCheck(paths)).toEqual([]);
  });
});

describe("an old name still exported", () => {
  it("is a violation naming it and its version pair", async () => {
    const paths = await fixture({
      renames: [
        ...CONSISTENT,
        entry({ old: "Unit.create", new: "Unit.spawn", kind: "member" }),
      ],
      pages: [FIRST_PAGE],
    });
    expect(await dataCheck(paths)).toEqual([
      { kind: "old-name", old: "Unit.create", versions: FIRST },
    ]);
  });

  /** What an author of the old version wrote, still in the declarations. */
  const LEFTOVERS: Record<string, string> = {
    ...DECLARATIONS,
    "index.d.ts": [
      DECLARATIONS["index.d.ts"],
      'export { Timer, Group, SyncRequest } from "./leftovers";',
      "/** @deprecated Use `Init` instead. */",
      "export declare enum HOOK { MAIN = 0 }",
      "export declare enum W3TS_HOOK { MAIN = 0 }",
      "export declare function hookedMain(): void;",
      "export declare function w3ts(): void;",
      "export declare function main(): void;",
      "",
    ].join("\n"),
    "leftovers.d.ts": [
      "export declare class Timer {",
      "  constructor();",
      "  static create(): Timer;",
      "  /** @deprecated Use `create`. */",
      "  static make(): Timer;",
      "  start(): void;",
      "}",
      "export declare class Group {",
      "  static create(): Group;",
      "}",
      "export declare class SyncRequest {",
      "  constructor(from: number);",
      "  static send(from: number, data: string): SyncRequest;",
      "}",
      "",
    ].join("\n"),
  };

  async function check(
    renames: RenameEntry[],
    version?: string,
  ): Promise<Violation[]> {
    return dataCheck(
      await fixture({
        renames,
        declarations: LEFTOVERS,
        pages: [FIRST_PAGE, SECOND_PAGE],
        version,
      }),
    );
  }

  it.each<[string, Partial<RenameEntry>]>([
    [
      "a public constructor",
      { old: "new Timer(...)", new: "Timer.create(...)", kind: "constructor" },
    ],
    [
      "an implicit constructor",
      { old: "new Group(...)", new: "Group.create(...)", kind: "constructor" },
    ],
    ["an instance member", { old: "Timer.start", new: null, kind: "member" }],
    ["a function", { old: "hookedMain", new: null, kind: "function" }],
  ])("is found for %s", async (_, fields) => {
    const renamed = entry(fields);
    expect(await check([renamed])).toEqual([
      { kind: "old-name", old: renamed.old, versions: FIRST },
    ]);
  });

  it.each<[string, Partial<RenameEntry>]>([
    [
      "an entry that keeps its name, a note on changed arguments",
      { old: "Timer.start", new: "Timer.start", kind: "member" },
    ],
    [
      "the sync System's constructor, which stays without its data overloads",
      {
        old: "new SyncRequest(...)",
        new: "SyncRequest.send",
        kind: "constructor",
      },
    ],
    [
      "an entry point, which is not a symbol",
      { old: "main::before", new: null, kind: "entryPoint" },
    ],
    [
      "a package name, which is not a symbol",
      { old: "w3ts", new: "reforged-ts", kind: "package", oneToOne: true },
    ],
  ])("is not a violation for %s", async (_, fields) => {
    expect(await check([entry(fields)])).toEqual([]);
  });

  describe("marked @deprecated", () => {
    // Deprecated in a 1.x minor with its entry of the pair to 2, removed by
    // the major ("Deprecating and removing a symbol" in docs/release.md).
    const deprecations = [
      entry({ old: "HOOK", new: null, kind: "type", versions: SECOND }),
      entry({
        old: "Timer.make(...)",
        new: "Timer.create(...)",
        kind: "member",
        versions: SECOND,
      }),
    ];

    it("is not a violation before the pair's target major", async () => {
      expect(await check(deprecations, "1.4.0")).toEqual([]);
    });

    it("is one from the pair's target major: the removal was forgotten", async () => {
      expect(await check(deprecations, "2.0.0-alpha.0")).toEqual([
        { kind: "old-name", old: "HOOK", versions: SECOND },
        { kind: "old-name", old: "Timer.make(...)", versions: SECOND },
      ]);
    });
  });

  describe("kept by the first major although its pair says it is gone", () => {
    const hook = entry({ old: "W3TS_HOOK", new: null, kind: "type" });

    it("is not a violation through 1.x", async () => {
      expect(await check([hook], "1.2.0")).toEqual([]);
    });

    it("is one from 2.0", async () => {
      expect(await check([hook], "2.0.0")).toEqual([
        { kind: "old-name", old: "W3TS_HOOK", versions: FIRST },
      ]);
    });
  });
});

describe("a version pair without its migration page", () => {
  it("is a violation naming the expected path", async () => {
    const paths = await fixture({ renames: [...CONSISTENT, marker] });
    expect(await dataCheck(paths)).toEqual([
      {
        kind: "page",
        versions: FIRST,
        path: join(paths.docs, FIRST_PAGE),
      },
      {
        kind: "page",
        versions: SECOND,
        path: join(paths.docs, SECOND_PAGE),
      },
    ]);
  });

  it("is not one when the page is MDX", async () => {
    const paths = await fixture({
      renames: CONSISTENT,
      pages: [`${FIRST_PAGE}x`],
    });
    expect(await dataCheck(paths)).toEqual([]);
  });

  it("is not one for a pair the map does not reference", async () => {
    const paths = await fixture({ renames: CONSISTENT, pages: [FIRST_PAGE] });
    expect(await dataCheck(paths)).toEqual([]);
  });

  it("is not one before the library reaches the pair's target major", async () => {
    // A 1.x minor adds the entries of the symbols it deprecates to the
    // pair to 2; the page is due with the major, which the gate requires.
    const toNextMajor = entry({ versions: SECOND });
    const paths = await fixture({
      renames: [...CONSISTENT, toNextMajor],
      pages: [FIRST_PAGE],
      version: "1.4.0",
    });
    expect(await dataCheck(paths)).toEqual([]);
  });

  it("is one from the first prerelease of the pair's target major", async () => {
    const paths = await fixture({
      renames: CONSISTENT,
      version: "1.0.0-alpha.0",
    });
    expect(await dataCheck(paths)).toEqual([
      { kind: "page", versions: FIRST, path: join(paths.docs, FIRST_PAGE) },
    ]);
  });

  it("cannot be told on a version that is not semver", async () => {
    const paths = await fixture({ renames: CONSISTENT, version: "latest" });
    await expect(dataCheck(paths)).rejects.toThrow(
      'reforged-ts has version "latest", which is not semver.',
    );
  });
});

describe("the violations that fail the check", () => {
  const oldName: Violation = {
    kind: "old-name",
    old: "Unit.owner",
    versions: FIRST,
  };
  const page: Violation = { kind: "page", versions: FIRST, path: FIRST_PAGE };

  it("leave a missing page out while pre mode is active", () => {
    expect(failingViolations([oldName, page], "pre")).toEqual([oldName]);
  });

  it.each(["none", "exit"] as const)(
    "are all of them with pre mode %s",
    (preMode) => {
      expect(failingViolations([oldName, page], preMode)).toEqual([
        oldName,
        page,
      ]);
    },
  );
});

describe("pnpm data:check", () => {
  /** The library's folder in the fixture workspace. */
  const LIBRARY = "packages/reforged-ts";

  /**
   * A workspace whose library has `renames` as its rename map and the
   * fixture declarations built, the pages under `website/docs`, and pre
   * mode `preMode` (no pre state when undefined).
   */
  async function workspace(fixture: {
    renames: unknown[];
    pages?: string[];
    preMode?: "pre" | "exit";
  }): Promise<string> {
    const root = await writeWorkspace(
      PACKAGES.map((pkg) =>
        pkg.dir === LIBRARY
          ? { ...pkg, fields: { types: "dist/index.d.ts" } }
          : pkg,
      ),
    );
    await writeText(
      root,
      `${LIBRARY}/migration/renames.json`,
      JSON.stringify(fixture.renames),
    );
    await copyFile(
      SCHEMA,
      join(root, LIBRARY, "migration/renames.schema.json"),
    );
    for (const [name, text] of Object.entries(DECLARATIONS)) {
      await writeText(root, `${LIBRARY}/dist/${name}`, text);
    }
    for (const page of fixture.pages ?? []) {
      await writeText(root, `website/docs/${page}`, "# Migrating\n");
    }
    if (fixture.preMode !== undefined) {
      await writeText(
        root,
        ".changeset/pre.json",
        JSON.stringify({ mode: fixture.preMode, tag: "alpha" }),
      );
    }
    return root;
  }

  async function runCli(root: string, args: string[] = []) {
    let stdout = "";
    let stderr = "";
    const status = await main(
      args,
      {
        stdout: (text) => (stdout += text),
        stderr: (text) => (stderr += text),
      },
      { root },
    );
    return { status, stdout, stderr };
  }

  const leftover = entry({
    old: "Unit.create",
    new: "Unit.spawn",
    kind: "member",
  });
  const OLD_NAME_LINE =
    "- `Unit.create` (w3ts@3 to reforged-ts@1) is still exported by packages/reforged-ts/dist/index.d.ts: remove it, or see `data:check` in docs/release.md for what may stay.\n";
  const PAGE_LINE =
    "- No migration page for w3ts@3 to reforged-ts@1: website/docs/migration/w3ts-3-to-reforged-ts-1.md (or .mdx).\n";
  const HEADER =
    "packages/reforged-ts/migration/renames.json disagrees with the declarations or the docs tree:\n";

  it("passes a consistent workspace", async () => {
    const root = await workspace({ renames: CONSISTENT, pages: [FIRST_PAGE] });
    expect(await runCli(root)).toEqual({
      status: 0,
      stdout:
        "packages/reforged-ts/migration/renames.json agrees with packages/reforged-ts/dist/index.d.ts and website/docs.\n",
      stderr: "",
    });
  });

  it("prints each violation on its line and fails", async () => {
    const root = await workspace({ renames: [...CONSISTENT, leftover] });
    expect(await runCli(root)).toEqual({
      status: 1,
      stdout: "",
      stderr: HEADER + OLD_NAME_LINE + PAGE_LINE,
    });
  });

  it("reports a missing page without failing while pre mode is active", async () => {
    const root = await workspace({ renames: CONSISTENT, preMode: "pre" });
    expect(await runCli(root)).toEqual({
      status: 0,
      stdout:
        HEADER +
        PAGE_LINE +
        "Pre mode is active (`.changeset/pre.json`): a missing migration page is reported only, and fails once pre mode is exited.\n",
      stderr: "",
    });
  });

  it("still fails on an old name while pre mode is active", async () => {
    const root = await workspace({
      renames: [...CONSISTENT, leftover],
      preMode: "pre",
    });
    const { status, stderr } = await runCli(root);
    expect(status).toBe(1);
    expect(stderr).toContain(OLD_NAME_LINE);
  });

  it("fails on a missing page once pre mode is exited", async () => {
    const root = await workspace({ renames: CONSISTENT, preMode: "exit" });
    const { status, stderr } = await runCli(root);
    expect(status).toBe(1);
    expect(stderr).toContain(PAGE_LINE);
  });

  it("fails when the map does not match its schema", async () => {
    const root = await workspace({ renames: [{ kind: "method" }] });
    const { status, stderr } = await runCli(root);
    expect(status).toBe(1);
    expect(stderr).toMatch(/^The rename map does not match its schema:/);
  });

  it("takes no arguments", async () => {
    const root = await workspace({ renames: CONSISTENT });
    expect(await runCli(root, ["--fix"])).toEqual({
      status: 2,
      stdout: "",
      stderr: "Usage: data:check\n",
    });
  });
});
