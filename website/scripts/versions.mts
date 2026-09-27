// The docs versions (#40, #185): one per library minor, labelled by the
// library's `major.minor` (`1.0`), cut by docs:version and kept by the
// retention rule: the last three minors of each major. Docusaurus keeps a
// version in three places under the site folder, all committed by the
// version cut's pull request: its label in `versions.json` (newest first),
// its docs tree in `versioned_docs/version-<label>/` and its sidebars in
// `versioned_sidebars/version-<label>-sidebars.json`.
import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

/** How many minors of each major the site keeps. */
export const MINORS_KEPT = 3;

/** A docs version label: the library's `major.minor`, without leading zeros. */
const LABEL = /^(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function isLabel(text: string): boolean {
  return LABEL.test(text);
}

/** A version the site's files hold that is not a label, or a file it cannot read. */
export class VersionsError extends Error {
  override name = "VersionsError";
}

/** What the retention rule keeps and removes, each newest first. */
export interface Retention {
  readonly kept: readonly string[];
  readonly pruned: readonly string[];
}

/** The major and minor of a label, which must be one. */
function parts(label: string): readonly [number, number] {
  const match = LABEL.exec(label);
  if (match === null) {
    throw new VersionsError(
      `\`${label}\` is not a docs version label: a label is the library's major.minor, such as 1.0.`,
    );
  }
  return [Number(match[1]), Number(match[2])];
}

/** Newest first: by major, then by minor. */
function newestFirst(a: string, b: string): number {
  const [majorA, minorA] = parts(a);
  const [majorB, minorB] = parts(b);
  return majorB - majorA || minorB - minorA;
}

/**
 * The retention rule on a list of labels in any order: the last three minors
 * of each major stay, every major keeps its own, so the newest version always
 * stays.
 */
export function retain(versions: readonly string[]): Retention {
  const kept: string[] = [];
  const pruned: string[] = [];
  const perMajor = new Map<number, number>();
  for (const label of [...new Set(versions)].sort(newestFirst)) {
    const [major] = parts(label);
    const count = perMajor.get(major) ?? 0;
    perMajor.set(major, count + 1);
    (count < MINORS_KEPT ? kept : pruned).push(label);
  }
  return { kept, pruned };
}

/** The file Docusaurus lists the cut versions in. */
export const versionsFile = (site: string) => join(site, "versions.json");

/** The frozen docs tree of a cut version. */
export const versionedDocs = (site: string, label: string) =>
  join(site, "versioned_docs", `version-${label}`);

/** The frozen sidebars of a cut version. */
export const versionedSidebars = (site: string, label: string) =>
  join(site, "versioned_sidebars", `version-${label}-sidebars.json`);

/** The cut versions, as `versions.json` lists them; none before the first cut. */
export async function readVersions(site: string): Promise<string[]> {
  let text: string;
  try {
    text = await readFile(versionsFile(site), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const versions: unknown = JSON.parse(text);
  if (
    !Array.isArray(versions) ||
    !versions.every((each) => typeof each === "string")
  ) {
    throw new VersionsError(
      `${versionsFile(site)} must be an array of labels, got ${text.trim()}.`,
    );
  }
  return versions;
}

/**
 * Applies the retention rule to the site's cut versions: removes the docs
 * tree and the sidebars of each version it does not keep, and rewrites
 * `versions.json` with the others, newest first, as Docusaurus writes it.
 * Before the first cut there is nothing to prune and nothing is written.
 */
export async function prune(site: string): Promise<Retention> {
  const versions = await readVersions(site);
  if (versions.length === 0) return { kept: [], pruned: [] };
  const retention = retain(versions);
  for (const label of retention.pruned) {
    await rm(versionedDocs(site, label), { recursive: true, force: true });
    await rm(versionedSidebars(site, label), { force: true });
  }
  await writeFile(
    versionsFile(site),
    `${JSON.stringify(retention.kept, null, 2)}\n`,
  );
  return retention;
}
