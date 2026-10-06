/**
 * The versions Changesets gives this workspace (#153), proven by the real
 * `changeset version` on a scratch copy: the repository's package manifests
 * and its `.changeset/config.json`, with the versions and the changesets of
 * each scenario. The copy writes no changelog and formats nothing: the GitHub
 * changelog generator needs a token and the network, and neither changes a
 * version.
 */
import { getPackages } from "@manypkg/get-packages";
import { execFile } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join, posix, sep } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { repositoryRoot } from "../src/workspace.js";
import { changesetText, tempDir, writeText } from "./support/workspace.js";

const CHANGESET_BIN = createRequire(import.meta.url).resolve(
  "@changesets/cli/bin.js",
);

/** The packages of the first publish. */
const FIRST_FOUR = [
  "eslint-plugin-reforged",
  "reforged-test",
  "reforged-ts",
  "reforged-types",
] as const;

/** Every package of the first publish at `version`. */
const all = (version: string) =>
  Object.fromEntries(FIRST_FOUR.map((name) => [name, version]));

/**
 * A scratch copy of the workspace: every manifest of the repository, each
 * publishable one at `version` (at the repository's version when absent),
 * and the repository's Changesets config.
 */
async function scratchWorkspace(version?: string): Promise<string> {
  const root = await tempDir("versioning");
  for (const file of ["package.json", "pnpm-workspace.yaml"]) {
    await writeText(
      root,
      file,
      await readFile(join(repositoryRoot, file), "utf8"),
    );
  }
  const { packages } = await getPackages(repositoryRoot);
  for (const { packageJson, relativeDir } of packages) {
    const manifest =
      packageJson.private === true || version === undefined
        ? packageJson
        : { ...packageJson, version };
    await writeText(
      root,
      `${relativeDir.split(sep).join(posix.sep)}/package.json`,
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
  }
  const config = JSON.parse(
    await readFile(join(repositoryRoot, ".changeset/config.json"), "utf8"),
  ) as Record<string, unknown>;
  await writeText(
    root,
    ".changeset/config.json",
    JSON.stringify({ ...config, changelog: false, format: false }),
  );
  return root;
}

/** Runs the Changesets CLI in `root`. */
async function changeset(root: string, ...args: string[]): Promise<void> {
  await promisify(execFile)(process.execPath, [CHANGESET_BIN, ...args], {
    cwd: root,
  });
}

/** Adds a changeset named `id` releasing `releases`. */
async function addChangeset(
  root: string,
  id: string,
  releases: Record<string, string>,
): Promise<void> {
  await writeText(root, `.changeset/${id}.md`, changesetText(releases));
}

/**
 * The version of every package, by name; `undefined` for the release
 * scripts, which have none (manypkg types it as always present).
 */
async function versions(
  root: string,
): Promise<Record<string, string | undefined>> {
  const { packages } = await getPackages(root);
  return Object.fromEntries(
    packages.map(({ packageJson }) => [
      packageJson.name,
      packageJson.version as string | undefined,
    ]),
  );
}

/** Every range naming a workspace package, as `<package> <field> <name>`. */
async function workspaceRanges(root: string): Promise<string[]> {
  const { packages } = await getPackages(root);
  const names = new Set(packages.map(({ packageJson }) => packageJson.name));
  const fields = [
    "dependencies",
    "peerDependencies",
    "optionalDependencies",
    "devDependencies",
  ] as const;
  return packages.flatMap(({ packageJson }) =>
    fields.flatMap((field) =>
      Object.entries(packageJson[field] ?? {})
        .filter(([name]) => names.has(name))
        .map(
          ([name, range]) => `${packageJson.name} ${field} ${name} ${range}`,
        ),
    ),
  );
}

/**
 * The workspace before the first publish: every publishable package at
 * `0.0.0`, pre mode `alpha`, the first-release changeset majoring all four,
 * and the kinds of changesets pending when pre mode was entered (majors on
 * the library, minors on the harness and the plugin, a patch on the Typings).
 */
async function beforeFirstPublish(): Promise<string> {
  const root = await scratchWorkspace("0.0.0");
  await changeset(root, "pre", "enter", "alpha");
  await addChangeset(root, "first-release", {
    "reforged-ts": "major",
    "reforged-types": "major",
    "reforged-test": "major",
    "eslint-plugin-reforged": "major",
  });
  await addChangeset(root, "library-feature", { "reforged-ts": "minor" });
  await addChangeset(root, "library-break", { "reforged-ts": "major" });
  await addChangeset(root, "harness-stubs", { "reforged-test": "minor" });
  await addChangeset(root, "plugin", { "eslint-plugin-reforged": "minor" });
  await addChangeset(root, "typings-fix", { "reforged-types": "patch" });
  return root;
}

describe("changeset version", { timeout: 60_000 }, () => {
  it("gives every publishable package 1.0.0-alpha.0 first", async () => {
    const root = await beforeFirstPublish();
    const releaseVersions = await versions(root);
    const ranges = await workspaceRanges(root);

    await changeset(root, "version");

    // reforged-map was not part of the first publish: at 0.0.0 its
    // workspace ranges on the majored packages fall out of range, so
    // Changesets gives it the patch of updateInternalDependencies.
    expect(await versions(root)).toEqual({
      ...releaseVersions,
      ...all("1.0.0-alpha.0"),
      "reforged-map": "0.0.1-alpha.0",
    });
    // The versioned changesets wait in the pre folder for the 1.0.0
    // changelog; the ranges stay on the workspace protocol for pnpm publish.
    expect((await readdir(join(root, ".changeset/pre"))).sort()).toEqual([
      "first-release.md",
      "harness-stubs.md",
      "library-break.md",
      "library-feature.md",
      "plugin.md",
      "typings-fix.md",
    ]);
    expect(await workspaceRanges(root)).toEqual(ranges);
  });

  it("gives reforged-map 1.0.0-alpha.0 first, entering at 0.0.0 with a major in the repository's pre mode", async () => {
    const root = await scratchWorkspace();
    await writeText(
      root,
      ".changeset/pre.json",
      await readFile(join(repositoryRoot, ".changeset/pre.json"), "utf8"),
    );
    const before = await versions(root);
    expect(before["reforged-map"]).toBe("0.0.0");
    await addChangeset(root, "reforged-map", { "reforged-map": "major" });

    await changeset(root, "version");

    expect(await versions(root)).toEqual({
      ...before,
      "reforged-map": "1.0.0-alpha.0",
    });
  });

  it("moves only the Typings for a minor on the Typings in pre mode", async () => {
    const root = await beforeFirstPublish();
    await changeset(root, "version");
    await addChangeset(root, "new-natives", { "reforged-types": "minor" });

    await changeset(root, "version");

    expect(await versions(root)).toMatchObject({
      ...all("1.0.0-alpha.0"),
      "reforged-types": "1.0.0-alpha.1",
    });
  });

  it("moves only the Typings for a minor on the Typings after 1.0.0", async () => {
    const root = await scratchWorkspace("1.0.0");
    await addChangeset(root, "new-natives", { "reforged-types": "minor" });

    await changeset(root, "version");

    expect(await versions(root)).toMatchObject({
      ...all("1.0.0"),
      "reforged-types": "1.1.0",
    });
  });

  it("gives the peers of the Typings a patch, not a major, for a major on the Typings", async () => {
    const root = await scratchWorkspace("1.0.0");
    await addChangeset(root, "typings-break", { "reforged-types": "major" });

    await changeset(root, "version");

    expect(await versions(root)).toMatchObject({
      "eslint-plugin-reforged": "1.0.1",
      "reforged-map": "1.0.1",
      "reforged-test": "1.0.0",
      "reforged-ts": "1.0.1",
      "reforged-types": "2.0.0",
    });
  });
});
