/**
 * Fixture workspaces for the release scripts: a pnpm workspace in a
 * temporary folder, written from a list of packages, optionally made a git
 * repository.
 */
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { gitIn, type Git } from "../../src/git.js";

export interface FixturePackage {
  /** `/`-separated folder under the workspace root. */
  dir: string;
  name: string;
  private?: boolean;
  /** More `package.json` fields. */
  fields?: Record<string, unknown>;
}

/** The four packages of the real workspace, and the private release one. */
export const PACKAGES: readonly FixturePackage[] = [
  { dir: "packages/reforged-ts", name: "reforged-ts" },
  { dir: "packages/reforged-types", name: "reforged-types" },
  { dir: "packages/reforged-test", name: "reforged-test" },
  { dir: "packages/eslint-plugin-reforged", name: "eslint-plugin-reforged" },
  { dir: "release", name: "reforged-ts-release", private: true },
];

export const tempDir = (name: string) =>
  mkdtemp(join(tmpdir(), `reforged-release-${name}-`));

/** Writes `text` at the `/`-separated `path` under `root`. */
export async function writeText(
  root: string,
  path: string,
  text: string,
): Promise<void> {
  const target = join(root, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, text);
}

/**
 * A new pnpm workspace holding `packages` (by default `PACKAGES`), each with
 * a `package.json` and a source file; resolves with its root.
 */
export async function writeWorkspace(
  packages: readonly FixturePackage[] = PACKAGES,
): Promise<string> {
  const root = await tempDir("workspace");
  const globs = [...new Set(packages.map((pkg) => pkg.dir))];
  await writeText(
    root,
    "pnpm-workspace.yaml",
    `packages:\n${globs.map((glob) => `  - ${glob}\n`).join("")}`,
  );
  await writeText(
    root,
    "package.json",
    JSON.stringify({ name: "fixture-workspace", private: true }),
  );
  for (const pkg of packages) {
    await writeText(
      root,
      `${pkg.dir}/package.json`,
      JSON.stringify({
        name: pkg.name,
        version: "1.0.0",
        ...(pkg.private === undefined ? {} : { private: pkg.private }),
        ...pkg.fields,
      }),
    );
    await writeText(root, `${pkg.dir}/src/index.ts`, "export {};\n");
  }
  return root;
}

/** A changeset's text: `releases` in its frontmatter, then a summary. */
export function changesetText(
  releases: Readonly<Record<string, string>> = {},
): string {
  const lines = Object.entries(releases).map(
    ([name, bump]) => `"${name}": ${bump}\n`,
  );
  return `---\n${lines.join("")}---\n\nA change.\n`;
}

/**
 * Makes the workspace at `root` a git repository whose `master` holds its
 * files, then checks out a `feature` branch; resolves with its `Git`.
 */
export async function initRepository(root: string): Promise<Git> {
  const git = gitIn(root);
  await git(["init", "--quiet", "--initial-branch", "master"]);
  await git(["config", "user.name", "Fixture"]);
  await git(["config", "user.email", "fixture@example.invalid"]);
  await git(["config", "core.autocrlf", "false"]);
  // The fixture's commits do not depend on the machine's signing setup.
  await git(["config", "commit.gpgsign", "false"]);
  await commitAll(git, "base");
  await git(["checkout", "--quiet", "-b", "feature"]);
  return git;
}

export async function commitAll(git: Git, message: string): Promise<void> {
  await git(["add", "--all"]);
  await git(["commit", "--quiet", "--allow-empty", "-m", message]);
}
