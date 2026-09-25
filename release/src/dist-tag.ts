/**
 * `release:dist-tag`, programmatic entry point: the npm dist-tag each
 * package of a release goes out under, written into the publish plan of a
 * `changeset pack` output before the Template gate and the publish read it.
 *
 * Changesets refuses `changeset publish --tag` in pre mode and when
 * publishing from packed tarballs, and its own pre-mode choice is the pre
 * identifier (`alpha`), or `latest` for a package npm holds only alphas of.
 * The plan's `tag` of each entry is what `pnpm publish --tag` receives, so
 * while `.changeset/pre.json` is in pre mode every entry gets `next`; outside
 * pre mode the plan is left as Changesets wrote it (`latest`).
 *
 * A package at `0.0.0` has not had its versions applied and is never
 * published: a plan holding one is refused.
 */
import { readPreMode, type PreMode } from "./changesets.js";
import {
  publishEntries,
  PublishPlanError,
  readPublishPlan,
  writePublishPlan,
} from "./publish-plan.js";

/** The dist-tag of prereleases (ADR 0009): `pnpm add reforged-ts@next`. */
export const NEXT_TAG = "next";

/** The version of a package whose versions were never applied. */
export const UNVERSIONED = "0.0.0";

/** A package the plan publishes, and the dist-tag it goes out under. */
export interface TaggedRelease {
  name: string;
  version: string;
  /** The tag Changesets wrote. */
  from: string;
  /** The tag the plan now holds. */
  tag: string;
}

export interface DistTagResult {
  /** The plan, with its tags set. */
  plan: unknown;
  /** Its publish entries in plan order. */
  releases: TaggedRelease[];
}

/**
 * Sets the dist-tag of every publish entry of `plan` (the parsed
 * `publish-plan.json`) for the pre state `preMode`: `next` in pre mode,
 * unchanged otherwise. Tag-only entries are left alone. Does not modify
 * `plan`. Throws a `PublishPlanError` on a plan that is not a Changesets 3
 * one or that publishes a package at `0.0.0`.
 */
export function setDistTags(plan: unknown, preMode: PreMode): DistTagResult {
  const copy: unknown = structuredClone(plan);
  const releases = publishEntries(copy).map((entry): TaggedRelease => {
    const tag = preMode === "pre" ? NEXT_TAG : entry.tag;
    const release = {
      name: entry.name,
      version: entry.version,
      from: entry.tag,
      tag,
    };
    entry.tag = tag;
    return release;
  });
  const unversioned = releases.filter(({ version }) => version === UNVERSIONED);
  if (unversioned.length > 0) {
    throw new PublishPlanError(
      `The publish plan holds unversioned packages: ${unversioned
        .map(({ name }) => `${name}@${UNVERSIONED}`)
        .join(", ")}. A package at ${UNVERSIONED} is never published: ` +
        'apply the versions first (docs/release.md, "Applying the versions").',
    );
  }
  return { plan: copy, releases };
}

/**
 * Sets the dist-tags of the publish plan in the `changeset pack` output
 * `packDir` for the pre state of the workspace at `root`, rewriting the
 * plan file. The tarballs are untouched: their integrity is what the
 * Template gate checks.
 */
export async function distTag(
  packDir: string,
  root: string,
): Promise<DistTagResult> {
  const { file, plan } = await readPublishPlan(packDir);
  const result = setDistTags(plan, await readPreMode(root));
  await writePublishPlan(file, result.plan);
  return result;
}

/** The releases as a Markdown table, for the job summary. */
export function formatReleases(releases: readonly TaggedRelease[]): string {
  if (releases.length === 0) return "The publish plan publishes nothing.\n";
  return [
    "| Package | Version | Dist-tag |",
    "| --- | --- | --- |",
    ...releases.map(
      ({ name, version, tag }) => `| ${name} | ${version} | \`${tag}\` |`,
    ),
    "",
  ].join("\n");
}
