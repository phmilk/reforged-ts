/**
 * `release:gate`, programmatic entry point: the major-changeset gate. No
 * stable major of `reforged-ts` ships without its migration guide.
 *
 * When a pending changeset or a changeset of the pre folder bumps
 * `reforged-ts` by a major, or when its next stable version would be its
 * first (1.0.0, a major relative to nothing), the gate requires, for the
 * version pair of that major:
 *
 * - the migration page in the website docs, at `migrationPagePath(pair)`;
 * - at least one `renames.json` entry for the pair, or the pair's
 *   no-renames marker.
 *
 * While pre mode is active the version produced is a prerelease, so what is
 * missing is reported and the gate passes; once pre mode is exited, or with
 * no pre state, it is enforced.
 */
import { readdir, readFile } from "node:fs/promises";
import { join, posix, relative, sep } from "node:path";
import {
  CHANGESET_DIR,
  readChangesetFolder,
  readPreMode,
  type Changeset,
  type PreMode,
} from "./changesets.js";
import { byCodePoint } from "./order.js";
import { readPublishablePackages } from "./workspace.js";

export type { PreMode } from "./changesets.js";

/** The package the gate guards. */
export const LIBRARY = "reforged-ts";

/** What the first major of `reforged-ts` migrates from: w3ts 3.x. */
export const PREDECESSOR = "w3ts@3";

/** The migration section of the website docs, relative to the root. */
export const MIGRATION_DIR = "website/docs/migration";

/** The rename map, relative to the library's folder. */
export const RENAMES_FILE = "migration/renames.json";

/** The kind of the no-renames marker in the rename map. */
export const NO_RENAMES_KIND = "noRenames";

/** A version pair as the rename map writes it: `w3ts@3` to `reforged-ts@1`. */
export interface VersionPair {
  from: string;
  to: string;
}

/**
 * The page the migration section holds for `pair`, relative to the root:
 * `website/docs/migration/<from>-to-<to>.md`, each side the package and its
 * major joined by a dash (`w3ts-3-to-reforged-ts-1.md`). Docusaurus serves
 * it at `/docs/<version segment>/migration/w3ts-3-to-reforged-ts-1`. The
 * same name with `.mdx` also counts.
 */
export function migrationPagePath(pair: VersionPair): string {
  const side = (version: string) => version.replace("@", "-");
  return `${MIGRATION_DIR}/${side(pair.from)}-to-${side(pair.to)}.md`;
}

/** `w3ts@3 to reforged-ts@1`, as the messages name a pair. */
export function formatPair(pair: VersionPair): string {
  return `${pair.from} to ${pair.to}`;
}

export interface GateInput {
  /** The version of `reforged-ts` in its manifest. */
  version: string;
  /**
   * The pending changesets and those of the pre folder, each `file`
   * `/`-separated and root-relative.
   */
  changesets: readonly Pick<Changeset, "file" | "releases">[];
  preMode: PreMode;
  /** The files of the migration section, `/`-separated and root-relative. */
  pages: ReadonlySet<string>;
  /** The rename map's items (entries and markers), unvalidated. */
  renames: readonly unknown[];
  /** The rename map's path, relative to the root, for the messages. */
  renamesFile: string;
}

/** Why the gate requires the artefacts of a pair. */
export type Reason =
  { kind: "major"; changesets: string[] } | { kind: "first-stable" };

export interface Requirement {
  pair: VersionPair;
  reason: Reason;
  /** The page expected, relative to the root. */
  page: string;
}

export type Missing =
  { kind: "page"; path: string } | { kind: "renames"; file: string };

export interface GateResult {
  /**
   * `pass`: nothing required, or everything required present. `report`:
   * something missing while pre mode is active. `fail`: something missing
   * for a stable version.
   */
  verdict: "pass" | "report" | "fail";
  /** Undefined when no major and no first stable is pending. */
  requirement: Requirement | undefined;
  missing: Missing[];
  preMode: PreMode;
}

interface Semver {
  major: number;
  minor: number;
  patch: number;
  prerelease: boolean;
}

function parseVersion(version: string): Semver {
  const match =
    /^(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/.exec(version);
  if (match === null) {
    throw new Error(
      `${LIBRARY} has version "${version}", which is not semver.`,
    );
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    // A `-` before any build metadata starts the prerelease.
    prerelease: /^[^+]*-/.test(version),
  };
}

/**
 * The major a major bump gives: `X.0.0-pre` becomes `X.0.0`, as Changesets
 * computes it, and any other version `X+1.0.0`.
 */
function majorAfterBump(version: Semver): number {
  return version.prerelease && version.minor === 0 && version.patch === 0
    ? version.major
    : version.major + 1;
}

function pairTo(major: number): VersionPair {
  return {
    from: major === 1 ? PREDECESSOR : `${LIBRARY}@${String(major - 1)}`,
    to: `${LIBRARY}@${String(major)}`,
  };
}

/** Whether the rename map has an entry or the marker for `pair`. */
function hasRenames(renames: readonly unknown[], pair: VersionPair): boolean {
  return renames.some((item) => {
    if (typeof item !== "object" || item === null) return false;
    const versions = (item as { versions?: unknown }).versions;
    if (typeof versions !== "object" || versions === null) return false;
    const { from, to } = versions as { from?: unknown; to?: unknown };
    return from === pair.from && to === pair.to;
  });
}

/** The gate's verdict on its inputs. */
export function evaluateGate(input: GateInput): GateResult {
  const version = parseVersion(input.version);
  const majors = input.changesets
    .filter((changeset) =>
      changeset.releases.some(
        (release) => release.name === LIBRARY && release.type === "major",
      ),
    )
    .map((changeset) => changeset.file)
    .sort(byCodePoint);
  const releasesLibrary =
    version.prerelease ||
    input.changesets.some((changeset) =>
      changeset.releases.some(
        (release) => release.name === LIBRARY && release.type !== "none",
      ),
    );
  // Below 1.0.0: `0.x`, or a prerelease of 1.0.0 (the alphas).
  const beforeFirstStable =
    version.major < 1 ||
    (version.major === 1 &&
      version.minor === 0 &&
      version.patch === 0 &&
      version.prerelease);
  const firstStable = beforeFirstStable && releasesLibrary;

  let requirement: Requirement | undefined;
  if (majors.length > 0 || firstStable) {
    const pair = pairTo(firstStable ? 1 : majorAfterBump(version));
    requirement = {
      pair,
      reason: firstStable
        ? { kind: "first-stable" }
        : { kind: "major", changesets: majors },
      page: migrationPagePath(pair),
    };
  }

  const missing: Missing[] = [];
  if (requirement !== undefined) {
    const mdx = `${requirement.page}x`;
    if (!input.pages.has(requirement.page) && !input.pages.has(mdx)) {
      missing.push({ kind: "page", path: requirement.page });
    }
    if (!hasRenames(input.renames, requirement.pair)) {
      missing.push({ kind: "renames", file: input.renamesFile });
    }
  }

  return {
    verdict:
      missing.length === 0
        ? "pass"
        : input.preMode === "pre"
          ? "report"
          : "fail",
    requirement,
    missing,
    preMode: input.preMode,
  };
}

async function readRenames(file: string): Promise<unknown[]> {
  let text: string;
  try {
    text = await readFile(file, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const map: unknown = JSON.parse(text);
  if (!Array.isArray(map)) {
    throw new Error(`${file}: the rename map must be an array.`);
  }
  return map as unknown[];
}

async function readPages(root: string): Promise<Set<string>> {
  try {
    const names = await readdir(join(root, MIGRATION_DIR));
    return new Set(names.map((name) => `${MIGRATION_DIR}/${name}`));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return new Set();
    throw error;
  }
}

/**
 * Reads the gate's inputs from the workspace at `root`: the version of
 * `reforged-ts`, the changesets of `.changeset/` and `.changeset/pre/`, the
 * pre state, the migration section and the rename map.
 */
export async function readGateInput(root: string): Promise<GateInput> {
  const packages = await readPublishablePackages(root);
  const library = packages.find((pkg) => pkg.name === LIBRARY);
  if (library === undefined) {
    throw new Error(`The workspace has no publishable package ${LIBRARY}.`);
  }
  const changesets = [
    ...(await readChangesetFolder(join(root, CHANGESET_DIR))),
    ...(await readChangesetFolder(join(root, CHANGESET_DIR, "pre"))),
  ].map((changeset) => ({
    ...changeset,
    file: relative(root, changeset.file).split(sep).join(posix.sep),
  }));
  const renamesFile = `${library.dir}/${RENAMES_FILE}`;
  return {
    version: library.version,
    changesets,
    preMode: await readPreMode(root),
    pages: await readPages(root),
    renames: await readRenames(join(root, renamesFile)),
    renamesFile,
  };
}

/** The gate on the workspace at `root`. */
export async function majorChangesetGate(root: string): Promise<GateResult> {
  return evaluateGate(await readGateInput(root));
}

/**
 * The gate's verdict as Markdown lines, for the terminal and the job
 * summary: what is required and why, then a checklist of what is missing.
 */
export function formatGate(result: GateResult): string {
  const { requirement } = result;
  if (requirement === undefined) {
    return `No major of ${LIBRARY} is pending and its next stable version is not its first: no migration page is required.\n`;
  }
  const pair = formatPair(requirement.pair);
  const why =
    requirement.reason.kind === "first-stable"
      ? `The next stable version of ${LIBRARY} is its first (1.0.0), a major relative to ${PREDECESSOR}`
      : `A major of ${LIBRARY} is pending (${requirement.reason.changesets.map((file) => `\`${file}\``).join(", ")})`;
  const lines = [`${why}: version pair ${pair}.`];
  if (result.missing.length === 0) {
    lines.push(
      `The migration page and the rename map's entries for ${pair} are present.`,
    );
    return `${lines.join("\n")}\n`;
  }
  lines.push("");
  for (const missing of result.missing) {
    lines.push(
      missing.kind === "page"
        ? `- [ ] Missing migration page for ${pair}: \`${missing.path}\`.`
        : `- [ ] Missing renames for ${pair}: \`${missing.file}\` has no entry with \`versions\` \`${requirement.pair.from}\` to \`${requirement.pair.to}\` and no no-renames marker (\`{ "kind": "${NO_RENAMES_KIND}", "versions", "note" }\`) for the pair.`,
    );
  }
  lines.push("");
  lines.push(
    result.verdict === "report"
      ? "Pre mode is active (`.changeset/pre.json`): reported only. The gate fails once pre mode is exited and the version is stable."
      : `The next version of ${LIBRARY} is stable, so this blocks the release. See "The major-changeset gate" in docs/release.md.`,
  );
  return `${lines.join("\n")}\n`;
}
