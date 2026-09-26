import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { main as matrixMain } from "../src/cli/matrix.js";
import { main as versionMain } from "../src/cli/version.js";
import {
  FRAGMENT_FILE,
  generateMatrix,
  MATRIX_FILE,
  MatrixInputError,
  render,
  SITE_TABLE_FILE,
  SYSTEMS_FILE,
  type Matrix,
  type MatrixRow,
} from "../src/matrix.js";
import { repositoryRoot } from "../src/workspace.js";
import {
  changesetText,
  PACKAGES,
  writeText,
  writeWorkspace,
} from "./support/workspace.js";

const PATCH = "3.0.0.24268";
const TODAY = new Date("2026-10-01T12:00:00Z");
const LATER = new Date("2026-11-15T08:00:00Z");

const TIER_1 = ["Equipment and bag", "Ability cooldowns"];
const TIER_2 = ["Camera"];
const TIER_3 = ["Doodads"];

const SYSTEMS = { minors: { "1.0": [...TIER_1, ...TIER_2], "1.1": TIER_3 } };

const CATALOG =
  "catalog:\n" +
  "  # typescript-to-lua pins its TypeScript peer exactly.\n" +
  "  typescript: 6.0.2\n" +
  "  typescript-to-lua: ^1.37.1\n" +
  '  "lua-types": ^2.14.1 # the Lua globals\n' +
  "  vitest: ^5.0.1\n";

interface Fixture {
  /** Each publishable package's version; `1.0.0` when absent. */
  versions?: Record<string, string>;
  /** The library's `reforged.patch`. */
  libraryPatch?: string;
  /** `.changeset/pre.json`, none when absent. */
  pre?: boolean;
  systems?: unknown;
  /** The committed matrix, none when absent. */
  existing?: Matrix;
  catalog?: string;
}

/**
 * A fixture workspace: the packages of `PACKAGES` with their versions, the
 * Patch of the one Typings entry and the Node floor, a catalog, a systems
 * list, and optionally the pre state and a committed matrix.
 */
async function workspace(fixture: Fixture = {}): Promise<string> {
  const root = await writeWorkspace(
    PACKAGES.map((pkg) =>
      pkg.private === true
        ? pkg
        : {
            ...pkg,
            fields: {
              version: fixture.versions?.[pkg.name] ?? "1.0.0",
              engines: { node: ">=22.13" },
              reforged: {
                patch:
                  pkg.name === "reforged-ts"
                    ? (fixture.libraryPatch ?? PATCH)
                    : PATCH,
              },
            },
          },
    ),
  );
  await writeText(
    root,
    "pnpm-workspace.yaml",
    `packages:\n${PACKAGES.map((pkg) => `  - ${pkg.dir}\n`).join("")}\n${fixture.catalog ?? CATALOG}`,
  );
  await writeText(
    root,
    "packages/reforged-types/3.0.0/manifest.json",
    JSON.stringify({ patch: PATCH, entries: [] }),
  );
  await writeText(
    root,
    SYSTEMS_FILE,
    JSON.stringify(fixture.systems ?? SYSTEMS),
  );
  if (fixture.pre === true) {
    await writeText(
      root,
      ".changeset/pre.json",
      JSON.stringify({ mode: "pre", tag: "alpha" }),
    );
  }
  if (fixture.existing !== undefined) {
    for (const [path, text] of render(fixture.existing)) {
      await writeText(root, path, text);
    }
  }
  return root;
}

/** The row of a release at `versions` (all `1.0.0` by default). */
function row(fields: Partial<MatrixRow> = {}): MatrixRow {
  return {
    library: "1.0.0",
    typings: "1.0.0",
    harness: "1.0.0",
    plugin: "1.0.0",
    patch: PATCH,
    typescript: "6.0.2",
    typescriptToLua: "^1.37.1",
    luaTypes: "^2.14.1",
    node: "22.13",
    systems: [...TIER_1, ...TIER_2],
    cutDate: "2026-10-01",
    docs: "https://phmilk.github.io/reforged-ts/docs/1.0",
    ...fields,
  };
}

const matrix = (...rows: MatrixRow[]): Matrix => ({ format: 1, rows });

/** The three generated files as they are on disk under `root`. */
async function files(root: string): Promise<Map<string, string>> {
  const found = new Map<string, string>();
  for (const path of [MATRIX_FILE, FRAGMENT_FILE, SITE_TABLE_FILE]) {
    found.set(path, await readFile(join(root, path), "utf8"));
  }
  return found;
}

async function run(
  command: typeof matrixMain,
  root: string,
  now: Date = TODAY,
  args: string[] = [],
) {
  let stdout = "";
  let stderr = "";
  const status = await command(
    args,
    {
      stdout: (text) => (stdout += text),
      stderr: (text) => (stderr += text),
    },
    { root, now: () => now },
  );
  return { status, stdout, stderr };
}

describe("generateMatrix", () => {
  it("writes the first row", async () => {
    const result = await generateMatrix(await workspace(), TODAY);

    expect(result).toMatchObject({
      ok: true,
      status: "appended",
      row: row(),
      matrix: matrix(row()),
    });
    if (!result.ok) return;
    expect(JSON.parse(result.files.get(MATRIX_FILE) ?? "")).toEqual(
      matrix(row()),
    );
    const table =
      "| reforged-ts | reforged-types | reforged-test | eslint-plugin-reforged | Patch       | TypeScript | typescript-to-lua | lua-types | Node           | 3.0.0 systems                                | Cut        | Docs                                                 |\n" +
      "| ----------- | -------------- | ------------- | ---------------------- | ----------- | ---------- | ----------------- | --------- | -------------- | -------------------------------------------- | ---------- | ---------------------------------------------------- |\n" +
      "| 1.0.0       | 1.0.0          | 1.0.0         | 1.0.0                  | 3.0.0.24268 | 6.0.2      | ^1.37.1           | ^2.14.1   | 22.13 or later | Equipment and bag, Ability cooldowns, Camera | 2026-10-01 | [1.0](https://phmilk.github.io/reforged-ts/docs/1.0) |\n";
    expect(result.files.get(FRAGMENT_FILE)).toBe(
      "<!-- Generated by `pnpm release:matrix` from release/compatibility/matrix.json; do not edit. -->\n\n" +
        table,
    );
    expect(result.files.get(SITE_TABLE_FILE)).toBe(
      "{/* Generated by `pnpm release:matrix` from release/compatibility/matrix.json; do not edit. */}\n\n" +
        table,
    );
  });

  it("appends a row after the committed ones, which keep their cut date", async () => {
    const first = row({ cutDate: "2026-09-01" });
    const root = await workspace({
      versions: { "reforged-types": "1.1.0" },
      existing: matrix(first),
    });

    const result = await generateMatrix(root, LATER);

    expect(result).toMatchObject({
      ok: true,
      status: "appended",
      matrix: matrix(first, row({ typings: "1.1.0", cutDate: "2026-11-15" })),
    });
    if (!result.ok) return;
    // Newest release first in the tables.
    const fragment = result.files.get(FRAGMENT_FILE) ?? "";
    expect(fragment.indexOf("2026-11-15")).toBeLessThan(
      fragment.indexOf("2026-09-01"),
    );
  });

  it("covers the 3.0.0 systems of the library's minor and of every earlier one", async () => {
    const root = await workspace({
      versions: { "reforged-ts": "1.1.0" },
      existing: matrix(row()),
    });

    const result = await generateMatrix(root, TODAY);

    expect(result.ok && result.row).toEqual(
      row({
        library: "1.1.0",
        systems: [...TIER_1, ...TIER_2, ...TIER_3],
        docs: "https://phmilk.github.io/reforged-ts/docs/1.1",
      }),
    );
  });

  it("keeps a committed row that matches the release, whatever the day", async () => {
    const committed = row({ cutDate: "2026-09-01" });
    const root = await workspace({ existing: matrix(committed) });

    const result = await generateMatrix(root, LATER);

    expect(result).toMatchObject({
      ok: true,
      status: "unchanged",
      row: committed,
      matrix: matrix(committed),
    });
    if (result.ok) expect(result.files).toEqual(await files(root));
  });

  it("refuses a committed row of the release with other contents", async () => {
    const root = await workspace({
      existing: matrix(row({ typescript: "6.0.1", cutDate: "2026-09-01" })),
    });

    expect(await generateMatrix(root, TODAY)).toEqual({
      ok: false,
      problems: [
        {
          kind: "changed-row",
          message:
            "The matrix already has a row for reforged-ts 1.0.0, reforged-types 1.0.0, reforged-test 1.0.0, eslint-plugin-reforged 1.0.0 (cut 2026-09-01) with other contents: " +
            'typescript "6.0.1" in the matrix, "6.0.2" now. Rows are only ever appended; a change to them ships in a new release.',
        },
      ],
    });
  });

  it("skips a prerelease in pre mode, leaving the committed matrix as it is", async () => {
    const committed = matrix(row());
    const root = await workspace({
      pre: true,
      versions: { "reforged-ts": "1.1.0-alpha.0" },
      existing: committed,
    });

    const result = await generateMatrix(root, LATER);

    expect(result).toMatchObject({
      ok: true,
      status: "skipped",
      row: null,
      reason: "Changesets is in pre mode: prerelease versions produce no row.",
      matrix: committed,
    });
    if (result.ok) expect(result.files).toEqual(await files(root));
  });

  it("appends the row of a stable release once pre mode is exited", async () => {
    const root = await workspace();
    await writeText(
      root,
      ".changeset/pre.json",
      JSON.stringify({ mode: "exit", tag: "alpha" }),
    );

    expect(await generateMatrix(root, TODAY)).toMatchObject({
      ok: true,
      status: "appended",
      row: row(),
    });
  });

  it("refuses a pre state whose mode it does not know", async () => {
    const root = await workspace();
    await writeText(
      root,
      ".changeset/pre.json",
      JSON.stringify({ mode: "alpha" }),
    );

    await expect(generateMatrix(root, TODAY)).rejects.toThrow(
      '.changeset/pre.json: mode must be "pre" or "exit", not "alpha".',
    );
  });

  it("skips a prerelease of the library outside pre mode", async () => {
    const root = await workspace({ versions: { "reforged-ts": "2.0.0-rc.1" } });

    expect(await generateMatrix(root, TODAY)).toMatchObject({
      ok: true,
      status: "skipped",
      reason:
        "reforged-ts 2.0.0-rc.1 is a prerelease: prerelease versions produce no row.",
      matrix: matrix(),
    });
  });

  it("refuses a stable library with a prerelease package", async () => {
    const root = await workspace({
      versions: { "reforged-types": "1.1.0-alpha.2" },
    });

    expect(await generateMatrix(root, TODAY)).toEqual({
      ok: false,
      problems: [
        {
          kind: "prerelease-package",
          message:
            "reforged-types is at the prerelease 1.1.0-alpha.2 while reforged-ts 1.0.0 is stable; a row holds stable versions only.",
        },
      ],
    });
  });

  it("fails on a Patch the Typings have no entry for", async () => {
    const root = await workspace({ libraryPatch: "3.0.0.99999" });

    expect(await generateMatrix(root, TODAY)).toEqual({
      ok: false,
      problems: [
        {
          kind: "patch-check",
          message: `reforged-ts has reforged.patch 3.0.0.99999, a Patch reforged-types ships no entry for (it ships: ${PATCH}).`,
        },
        {
          kind: "patch-check",
          message: `reforged-ts has reforged.patch 3.0.0.99999, but the newest Patch reforged-types ships an entry for is ${PATCH}; the library pins the newest Patch it supports.`,
        },
      ],
    });
  });

  it("fails on the Patch check in pre mode too", async () => {
    const root = await workspace({ pre: true, libraryPatch: "3.0.0.99999" });

    expect((await generateMatrix(root, TODAY)).ok).toBe(false);
  });

  it("fails on a library minor without a systems entry", async () => {
    const root = await workspace({ versions: { "reforged-ts": "1.2.0" } });

    expect(await generateMatrix(root, TODAY)).toEqual({
      ok: false,
      problems: [
        {
          kind: "missing-systems",
          message: `${SYSTEMS_FILE} has no entry for reforged-ts 1.2; add "1.2" with the 3.0.0 systems it adds (an empty list when none).`,
        },
      ],
    });
  });

  it("fails on a Toolchain pin missing from the catalog", async () => {
    const root = await workspace({
      catalog: "catalog:\n  typescript: 6.0.2\n",
    });

    const result = await generateMatrix(root, TODAY);

    expect(result.ok || result.problems.map(({ kind }) => kind)).toEqual([
      "missing-toolchain",
      "missing-toolchain",
    ]);
  });

  it("rejects a malformed systems list or matrix", async () => {
    await expect(
      generateMatrix(await workspace({ systems: { "1.0": [] } }), TODAY),
    ).rejects.toThrow(MatrixInputError);

    const root = await workspace();
    await writeText(
      root,
      MATRIX_FILE,
      JSON.stringify({ format: 1, rows: [{}] }),
    );
    await expect(generateMatrix(root, TODAY)).rejects.toThrow(
      /matrix\.json: row 0 has no valid "library"/,
    );
  });

  it("runs green on this repository in pre mode and leaves its files unchanged", async () => {
    const result = await generateMatrix(repositoryRoot, TODAY);

    expect(result).toMatchObject({ ok: true, status: "skipped" });
    if (result.ok) expect(result.files).toEqual(await files(repositoryRoot));
  });
});

describe("release:matrix", () => {
  it("writes the files, then gives byte-identical output on a later run", async () => {
    const root = await workspace();

    expect(await run(matrixMain, root)).toEqual({
      status: 0,
      stdout:
        "Appended the row of reforged-ts 1.0.0, reforged-types 1.0.0, reforged-test 1.0.0, eslint-plugin-reforged 1.0.0 (Patch 3.0.0.24268, cut 2026-10-01). " +
        `Wrote ${MATRIX_FILE}, ${FRAGMENT_FILE}, ${SITE_TABLE_FILE}.\n`,
      stderr: "",
    });
    const first = await files(root);

    expect(await run(matrixMain, root, LATER)).toMatchObject({
      status: 0,
      stdout: expect.stringMatching(
        /^The matrix already has the row of .* No file changed\.\n$/,
      ) as unknown,
    });
    expect(await files(root)).toEqual(first);
  });

  it("fails with one line per problem and writes nothing", async () => {
    const root = await workspace({
      versions: { "reforged-ts": "1.2.0" },
      libraryPatch: "3.0.0.99999",
    });

    const result = await run(matrixMain, root);

    expect(result.status).toBe(1);
    expect(result.stderr.split("\n")).toHaveLength(5);
    expect(result.stderr).toMatch(
      /The compatibility matrix: docs\/release\.md#the-compatibility-matrix\.\n$/,
    );
    await expect(readFile(join(root, MATRIX_FILE))).rejects.toThrow();
  });

  it("rejects arguments", async () => {
    expect(await run(matrixMain, repositoryRoot, TODAY, ["--date"])).toEqual({
      status: 2,
      stdout: "",
      stderr: "Usage: release:matrix\n",
    });
  });
});

describe("release:version", () => {
  const CHANGESET_BIN = createRequire(import.meta.url).resolve(
    "@changesets/cli/bin.js",
  );

  /**
   * The fixture made a Changesets workspace: a configuration without a
   * changelog (the GitHub generator needs the network) or formatting, and
   * one changeset releasing `releases`.
   */
  async function versionable(
    fixture: Fixture,
    releases: Record<string, string>,
  ): Promise<string> {
    const root = await workspace(fixture);
    await writeText(
      root,
      ".changeset/config.json",
      JSON.stringify({
        changelog: false,
        commit: false,
        access: "public",
        baseBranch: "master",
        updateInternalDependencies: "patch",
        privatePackages: { version: false, tag: false },
        format: false,
      }),
    );
    await writeText(root, ".changeset/a-change.md", changesetText(releases));
    return root;
  }

  async function version(root: string, now: Date = TODAY) {
    let stdout = "";
    let stderr = "";
    const status = await versionMain(
      [],
      {
        stdout: (text) => (stdout += text),
        stderr: (text) => (stderr += text),
      },
      {
        root,
        now: () => now,
        changesetVersion: async (cwd) => {
          await promisify(execFile)(
            process.execPath,
            [CHANGESET_BIN, "version"],
            {
              cwd,
            },
          );
          return 0;
        },
      },
    );
    return { status, stdout, stderr };
  }

  it("versions the packages, then appends the release's row", async () => {
    const root = await versionable(
      { existing: matrix(row({ cutDate: "2026-09-01" })) },
      { "reforged-types": "minor" },
    );

    const result = await version(root, LATER);

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(
      /^Appended the row of .*reforged-types 1\.1\.0/,
    );
    expect(JSON.parse((await files(root)).get(MATRIX_FILE) ?? "")).toEqual(
      matrix(
        row({ cutDate: "2026-09-01" }),
        row({ typings: "1.1.0", cutDate: "2026-11-15" }),
      ),
    );
  });

  it("adds no row in pre mode and leaves the files unchanged", async () => {
    const root = await versionable(
      { pre: true, existing: matrix(row()) },
      { "reforged-ts": "minor" },
    );
    const before = await files(root);

    const result = await version(root);

    expect(result).toMatchObject({ status: 0, stderr: "" });
    expect(
      JSON.parse(
        await readFile(join(root, "packages/reforged-ts/package.json"), "utf8"),
      ),
    ).toMatchObject({ version: "1.1.0-alpha.0" });
    expect(await files(root)).toEqual(before);
  });

  it("stops when changeset version fails", async () => {
    const root = await workspace();

    let stderr = "";
    const status = await versionMain(
      [],
      { stdout: () => undefined, stderr: (text) => (stderr += text) },
      { root, now: () => TODAY, changesetVersion: () => Promise.resolve(3) },
    );

    expect(status).toBe(1);
    expect(stderr).toBe(
      "changeset version failed (exit code 3); the compatibility matrix was not generated.\n",
    );
    await expect(readFile(join(root, MATRIX_FILE))).rejects.toThrow();
  });
});
