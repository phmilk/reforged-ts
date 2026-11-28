/**
 * `release:dist-tag`, programmatic entry point: the npm dist-tag each
 * package of a release goes out under, written into the publish plan of a
 * `changeset pack` output before the Template gate and the publish read it.
 *
 * The tag is the Release channel's (ADR 0031): `latest` for a release from
 * `master`, the alphas of the build phase among them, and `next` for one
 * from `next`. The workspace's pre state does not decide it. Changesets
 * refuses `changeset publish --tag` in pre mode and when publishing from
 * packed tarballs, and its own pre-mode choice is the pre identifier
 * (`alpha`), so the plan's `tag` of each entry, what `pnpm publish --tag`
 * receives, is rewritten here.
 *
 * A package at `0.0.0` has not had its versions applied and is never
 * published: a plan holding one is refused. So is a stable version on
 * `next`, whose releases are prereleases only: one reaches `next` when
 * `next-sync` merges `master`'s Version Packages commit before `master`'s
 * release published it, or when a Version Packages pull request is merged
 * into `next` after pre mode exited there.
 */
import {
  publishEntries,
  PublishPlanError,
  readPublishPlan,
  writePublishPlan,
} from "./publish-plan.js";
import { readReleaseChannel, type DistTag } from "./release-channel.js";
import { isPrerelease, parseSemver } from "./semver.js";

/** The version of a package whose versions were never applied. */
export const UNVERSIONED = "0.0.0";

/** A package the plan publishes, and the dist-tag it goes out under. */
export interface TaggedRelease {
  name: string;
  version: string;
  /** The tag Changesets wrote. */
  from: string;
  /** The tag the plan now holds. */
  tag: DistTag;
}

export interface DistTagResult {
  /** The plan, with its tags set. */
  plan: unknown;
  /** Its publish entries in plan order. */
  releases: TaggedRelease[];
}

/**
 * Sets the dist-tag of every publish entry of `plan` (the parsed
 * `publish-plan.json`) to `tag`, a Release channel's dist-tag. Tag-only
 * entries are left alone. Does not modify `plan`. Throws a
 * `PublishPlanError` on a plan that is not a Changesets 3 one, that
 * publishes a package at `0.0.0`, or that publishes a stable version under
 * `next`.
 */
export function setDistTags(plan: unknown, tag: DistTag): DistTagResult {
  const copy: unknown = structuredClone(plan);
  const releases = publishEntries(copy).map((entry): TaggedRelease => {
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
  if (tag === "next") {
    const stable = releases.filter(({ version }) => {
      const parsed = parseSemver(version);
      return parsed === undefined || !isPrerelease(parsed);
    });
    if (stable.length > 0) {
      throw new PublishPlanError(
        `A release from next publishes prereleases only, and the publish plan holds stable versions: ${stable
          .map(({ name, version }) => `${name}@${version}`)
          .join(", ")}. A stable version goes out from master, on latest: ` +
          "re-run this job once master's release has published it " +
          '(docs/release.md, "Release channels").',
      );
    }
  }
  return { plan: copy, releases };
}

/**
 * Sets the dist-tags of the publish plan in the `changeset pack` output
 * `packDir` to the dist-tag of the Release channel of `branch`, for the
 * workspace at `root`, rewriting the plan file. The tarballs are
 * untouched: their integrity is what the Template gate checks. Throws a
 * `ReleaseChannelError` on a branch with no channel, before reading the
 * plan.
 */
export async function distTag(
  packDir: string,
  root: string,
  branch: string,
): Promise<DistTagResult> {
  const channel = await readReleaseChannel(branch, root);
  const { file, plan } = await readPublishPlan(packDir);
  const result = setDistTags(plan, channel.distTag);
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
