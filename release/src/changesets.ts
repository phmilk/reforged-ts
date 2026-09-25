/**
 * Reading changesets. A changeset is a Markdown file under `.changeset/`
 * whose frontmatter maps package names to bumps; an empty changeset has an
 * empty frontmatter and publishes nothing. Parsing goes through
 * `@changesets/parse`, the parser Changesets itself uses, so a file the
 * scripts accept is one `changeset version` accepts.
 */
import { parseChangesetFile } from "@changesets/parse";
import { readdir, readFile } from "node:fs/promises";
import { join, posix } from "node:path";
import { byCodePoint } from "./order.js";
import { errorMessage } from "./unknown.js";

/** The folder that holds the pending changesets, relative to the root. */
export const CHANGESET_DIR = ".changeset";

/** One package a changeset releases, and its bump. */
export type Release = ReturnType<typeof parseChangesetFile>["releases"][number];

/** The bump of a release: `major`, `minor`, `patch` or `none`. */
export type Bump = Release["type"];

export interface Changeset {
  /** Where the changeset was read from, as the caller named it. */
  file: string;
  /** Empty for an empty changeset. */
  releases: readonly Release[];
  summary: string;
}

/** A changeset that `@changesets/parse` rejects, naming its file. */
export class ChangesetError extends Error {
  constructor(
    readonly file: string,
    cause: unknown,
  ) {
    super(`${file}: ${errorMessage(cause)}`, { cause });
    this.name = "ChangesetError";
  }
}

/** Parses the text of the changeset at `file`; throws a `ChangesetError`. */
export function parseChangeset(file: string, text: string): Changeset {
  try {
    const { releases, summary } = parseChangesetFile(text);
    return { file, releases, summary };
  } catch (error) {
    throw new ChangesetError(file, error);
  }
}

/**
 * Whether the `/`-separated, root-relative `path` is a pending changeset:
 * a Markdown file directly under `.changeset/` other than its README.
 */
export function isChangesetPath(path: string): boolean {
  return (
    posix.dirname(path) === CHANGESET_DIR &&
    path.endsWith(".md") &&
    posix.basename(path) !== "README.md"
  );
}

/**
 * Every changeset directly in the folder `dir` (the Markdown files other
 * than its README), in code-point order of the file name; none when the
 * folder does not exist. Each `file` is `dir` joined with the file name.
 */
export async function readChangesetFolder(dir: string): Promise<Changeset[]> {
  let names: string[];
  try {
    const items = await readdir(dir, { withFileTypes: true });
    names = items
      .filter(
        (item) =>
          item.isFile() &&
          item.name.endsWith(".md") &&
          item.name !== "README.md",
      )
      .map((item) => item.name)
      .sort(byCodePoint);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const changesets: Changeset[] = [];
  for (const name of names) {
    const file = join(dir, name);
    changesets.push(parseChangeset(file, await readFile(file, "utf8")));
  }
  return changesets;
}

/** The pre state of `.changeset/pre.json`: absent, active or exited. */
export type PreMode = "none" | "pre" | "exit";

/** The pre state of the workspace at `root`. */
export async function readPreMode(root: string): Promise<PreMode> {
  const file = join(root, CHANGESET_DIR, "pre.json");
  let text: string;
  try {
    text = await readFile(file, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "none";
    throw error;
  }
  const mode = (JSON.parse(text) as { mode?: unknown }).mode;
  if (mode !== "pre" && mode !== "exit") {
    throw new Error(
      `${CHANGESET_DIR}/pre.json: mode must be "pre" or "exit", not ${JSON.stringify(mode)}.`,
    );
  }
  return mode;
}
