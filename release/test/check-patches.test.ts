import { describe, expect, it } from "vitest";
import {
  checkPatches,
  PatchInputError,
  readPatchInputs,
  readTypingsEntries,
} from "../src/check-patches.js";
import { main } from "../src/cli/check-patches.js";
import { repositoryRoot } from "../src/workspace.js";
import {
  PACKAGES,
  writeText,
  writeWorkspace,
  type FixturePackage,
} from "./support/workspace.js";

const OLD = "3.0.0.24268";
const NEW = "3.1.0.25000";

/** Every publishable package of `PACKAGES` with its `reforged.patch`. */
const AGREEING: Record<string, unknown> = {
  "reforged-ts": NEW,
  "reforged-types": NEW,
  "reforged-test": OLD,
  "eslint-plugin-reforged": OLD,
};

/**
 * A fixture workspace: `PACKAGES` plus `extra`, each with the
 * `reforged.patch` `patches` gives it (none when absent), and a Game version
 * folder with a `manifest.json` in the Typings for each of `typings`.
 */
async function workspace(
  patches: Record<string, unknown> = AGREEING,
  typings: readonly string[] = [OLD, NEW],
  extra: readonly FixturePackage[] = [],
): Promise<string> {
  const root = await writeWorkspace(
    [...PACKAGES, ...extra].map((pkg) =>
      pkg.name in patches
        ? {
            ...pkg,
            fields: { ...pkg.fields, reforged: { patch: patches[pkg.name] } },
          }
        : pkg,
    ),
  );
  for (const patch of typings) {
    const folder = patch.split(".").slice(0, 3).join(".");
    await writeText(
      root,
      `packages/reforged-types/${folder}/manifest.json`,
      JSON.stringify({ patch, entries: [] }),
    );
  }
  return root;
}

async function check(root: string) {
  return checkPatches(await readPatchInputs(root));
}

describe("checkPatches", () => {
  it("passes when every package names a shipped Patch and the library the newest", async () => {
    expect(await check(await workspace())).toEqual({
      ok: true,
      patches: [
        { name: "eslint-plugin-reforged", patch: OLD },
        { name: "reforged-test", patch: OLD },
        { name: "reforged-ts", patch: NEW },
        { name: "reforged-types", patch: NEW },
      ],
      newest: NEW,
      problems: [],
    });
  });

  it("fails naming a package whose Patch the Typings have no entry for", async () => {
    const root = await workspace({
      ...AGREEING,
      "reforged-test": "3.0.0.99999",
    });

    const result = await check(root);

    expect(result.ok).toBe(false);
    expect(result.problems).toEqual([
      {
        kind: "unknown-patch",
        package: "reforged-test",
        patch: "3.0.0.99999",
        message: `reforged-test has reforged.patch 3.0.0.99999, a Patch reforged-types ships no entry for (it ships: ${OLD}, ${NEW}).`,
      },
    ]);
  });

  it("fails naming both values when the library's Patch is not the Typings' newest", async () => {
    const root = await workspace({ ...AGREEING, "reforged-ts": OLD });

    const result = await check(root);

    expect(result.ok).toBe(false);
    expect(result.problems).toEqual([
      {
        kind: "library-not-newest",
        package: "reforged-ts",
        patch: OLD,
        newest: NEW,
        message: `reforged-ts has reforged.patch ${OLD}, but the newest Patch reforged-types ships an entry for is ${NEW}; the library pins the newest Patch it supports.`,
      },
    ]);
  });

  it("fails naming a publishable package without the field", async () => {
    const root = await workspace(
      Object.fromEntries(
        Object.entries(AGREEING).filter(
          ([name]) => name !== "eslint-plugin-reforged",
        ),
      ),
    );

    const result = await check(root);

    expect(result.ok).toBe(false);
    expect(result.patches).toContainEqual({
      name: "eslint-plugin-reforged",
      patch: null,
    });
    expect(result.problems).toEqual([
      {
        kind: "missing-field",
        package: "eslint-plugin-reforged",
        message: `eslint-plugin-reforged has no reforged.patch in its package.json; set it to the Patch it supports (reforged-types ships: ${OLD}, ${NEW}).`,
      },
    ]);
  });

  it("fails naming a package whose field is not a Build", async () => {
    const root = await workspace({ ...AGREEING, "reforged-test": "3.0" });

    expect((await check(root)).problems).toEqual([
      {
        kind: "invalid-field",
        package: "reforged-test",
        value: "3.0",
        message:
          'reforged-test has reforged.patch "3.0", which is not a Build such as 3.0.0.24268.',
      },
    ]);
  });

  it("skips private packages", async () => {
    const root = await workspace(
      { ...AGREEING, tools: "9.9.9.9" },
      [OLD, NEW],
      [
        { dir: "tools", name: "tools", private: true },
        { dir: "website", name: "website", private: true },
      ],
    );

    const result = await check(root);

    expect(result.ok).toBe(true);
    expect(result.patches.map(({ name }) => name)).not.toContain("tools");
    // A private package handed in directly is skipped as well.
    expect(
      checkPatches({
        packages: [
          ...(await readPatchInputs(root)).packages,
          {
            name: "hidden",
            manifest: { name: "hidden", version: "1.0.0", private: true },
          },
        ],
        entries: [
          { gameVersion: "3.1.0", patch: NEW },
          { gameVersion: "3.0.0", patch: OLD },
        ],
      }).ok,
    ).toBe(true);
  });

  it("fails when the Typings ship an entry for no Patch", async () => {
    const result = await check(await workspace(AGREEING, []));

    expect(result.newest).toBeNull();
    expect(result.problems).toEqual([
      {
        kind: "no-typings-entries",
        message:
          "reforged-types ships an entry for no Patch, so no reforged.patch can name one.",
      },
    ]);
  });

  it("fails when no publishable package is the library", () => {
    const result = checkPatches({
      packages: [
        {
          name: "reforged-types",
          manifest: {
            name: "reforged-types",
            version: "1.0.0",
            reforged: { patch: OLD },
          },
        },
      ],
      entries: [{ gameVersion: "3.0.0", patch: OLD }],
    });

    expect(result.problems.map(({ kind }) => kind)).toEqual([
      "missing-library",
    ]);
  });

  it("passes on this repository", async () => {
    const result = await check(repositoryRoot);

    expect(result.problems).toEqual([]);
    expect(result.patches.map(({ name }) => name)).toEqual([
      "eslint-plugin-reforged",
      "reforged-test",
      "reforged-ts",
      "reforged-types",
    ]);
  });
});

describe("readTypingsEntries", () => {
  it("reads one entry per Game version folder, in Build order", async () => {
    const root = await workspace(AGREEING, [NEW, OLD, "3.0.10.1"]);
    await writeText(
      root,
      "packages/reforged-types/vendor/3.0.0.24268/common.j",
      "",
    );

    expect(await readTypingsEntries(`${root}/packages/reforged-types`)).toEqual(
      [
        { gameVersion: "3.0.0", patch: OLD },
        { gameVersion: "3.0.10", patch: "3.0.10.1" },
        { gameVersion: "3.1.0", patch: NEW },
      ],
    );
  });

  it("rejects a manifest whose Patch is not of its Game version", async () => {
    const root = await workspace(AGREEING, []);
    await writeText(
      root,
      "packages/reforged-types/3.1.0/manifest.json",
      JSON.stringify({ patch: OLD }),
    );

    await expect(
      readTypingsEntries(`${root}/packages/reforged-types`),
    ).rejects.toThrow(PatchInputError);
  });

  it("rejects a Game version folder without a manifest", async () => {
    const root = await workspace(AGREEING, []);
    await writeText(root, "packages/reforged-types/3.0.0/common.j.d.ts", "");

    await expect(
      readTypingsEntries(`${root}/packages/reforged-types`),
    ).rejects.toThrow(/manifest\.json/);
  });
});

describe("release:check-patches", () => {
  async function run(root: string, args: string[] = []) {
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

  it("passes, listing each package's Patch", async () => {
    expect(await run(await workspace())).toEqual({
      status: 0,
      stdout:
        `Every publishable package names a Patch the Typings ship an entry for, the library the newest (${NEW}): ` +
        `eslint-plugin-reforged ${OLD}, reforged-test ${OLD}, reforged-ts ${NEW}, reforged-types ${NEW}.\n`,
      stderr: "",
    });
  });

  it("fails with one line per problem", async () => {
    const root = await workspace({
      ...AGREEING,
      "reforged-ts": OLD,
      "reforged-test": "3.0.0.99999",
    });

    expect(await run(root)).toEqual({
      status: 1,
      stdout: "",
      stderr:
        `reforged-test has reforged.patch 3.0.0.99999, a Patch reforged-types ships no entry for (it ships: ${OLD}, ${NEW}).\n` +
        `reforged-ts has reforged.patch ${OLD}, but the newest Patch reforged-types ships an entry for is ${NEW}; the library pins the newest Patch it supports.\n` +
        "The bump rules and the reforged.patch field: docs/release.md#the-reforgedpatch-field.\n",
    });
  });

  it("fails when the workspace has no Typings", async () => {
    const root = await writeWorkspace([
      { dir: "packages/reforged-ts", name: "reforged-ts" },
    ]);

    const result = await run(root);

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(
      /^No publishable package is named reforged-types/,
    );
  });

  it("rejects arguments", async () => {
    expect(await run(repositoryRoot, ["--base", "master"])).toEqual({
      status: 2,
      stdout: "",
      stderr: "Usage: release:check-patches\n",
    });
  });
});
