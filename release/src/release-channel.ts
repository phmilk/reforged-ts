/**
 * The Release channel (ADR 0031): what a release publishes and checks
 * against, decided by the branch it runs from. The one module that knows
 * the rule; the dist-tag of the publish plan, the Template ref and the
 * verdict on a major changeset (`release:check-changeset`, on a pull
 * request's base branch) are read from it.
 *
 * - `master` is the stable channel: the `latest` dist-tag and the
 *   Template's `main`. A package may take a major there only while it is
 *   not yet at its first stable version (a prerelease of `1.0.0`, or
 *   below it): during the build phase every package may.
 * - `next` is the channel of a major in preparation: the `next` dist-tag
 *   and the Template's `next`, and a major for every package.
 *
 * Any other branch has no channel and a release from it is refused; the
 * changeset check of a pull request based on it refuses no major.
 */
import { compareSemver, parseSemver, type SemVer } from "./semver.js";
import { readPublishablePackages } from "./workspace.js";

/** The branches a release runs from, each with its channel. */
export const CHANNEL_BRANCHES = ["master", "next"] as const;

/** A branch a release runs from. */
export type ChannelBranch = (typeof CHANNEL_BRANCHES)[number];

/** The dist-tag of the stable channel, which `pnpm add <package>` installs. */
export const LATEST_TAG = "latest";

/** The dist-tag of the Next branch: `pnpm add reforged-ts@next`. */
export const NEXT_TAG = "next";

/** The dist-tag of a channel: `latest` or `next`. */
export type DistTag = typeof LATEST_TAG | typeof NEXT_TAG;

/** A package of the workspace, as the channel reads it. */
export interface ChannelPackage {
  name: string;
  /** Its current version, in its manifest. */
  version: string;
}

/** What a release from one branch publishes and checks against. */
export interface ReleaseChannel {
  /** The branch the release runs from. */
  branch: ChannelBranch;
  /** The npm dist-tag every package of the release goes out under. */
  distTag: DistTag;
  /**
   * The Template's branch the release checks against and the packed
   * Creation CLI downloads.
   */
  templateRef: "main" | "next";
  /** Whether each package, by name, may take a major changeset. */
  majors: Readonly<Record<string, boolean>>;
}

/** A branch with no channel, or a workspace the channel cannot read. */
export class ReleaseChannelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReleaseChannelError";
  }
}

/** The first stable version, which `master` refuses a major after. */
const FIRST_STABLE: SemVer = {
  major: 1,
  minor: 0,
  patch: 0,
  prerelease: [],
  build: [],
};

/** Whether `branch` has a channel: `master` or `next`. */
export function isChannelBranch(branch: string): branch is ChannelBranch {
  return (CHANNEL_BRANCHES as readonly string[]).includes(branch);
}

/**
 * The channel of a release from `branch` for the workspace whose packages
 * are `packages`. Throws a `ReleaseChannelError` on a branch other than
 * `master` and `next`, naming both, and on a package whose version is not
 * a semantic version.
 */
export function releaseChannel(
  branch: string,
  packages: readonly ChannelPackage[],
): ReleaseChannel {
  if (!isChannelBranch(branch)) {
    throw new ReleaseChannelError(
      `A release runs from master or next, and ${branch === "" ? "an empty branch name" : `"${branch}"`} is neither: ` +
        "master publishes on latest, next on next " +
        '(docs/release.md, "Release channels").',
    );
  }
  const majors = Object.fromEntries(
    packages.map(({ name, version }) => {
      const parsed = parseSemver(version);
      if (parsed === undefined) {
        throw new ReleaseChannelError(
          `${name}: its version "${version}" is not a semantic version.`,
        );
      }
      return [
        name,
        branch === "next" || compareSemver(parsed, FIRST_STABLE) < 0,
      ];
    }),
  );
  return branch === "master"
    ? { branch, distTag: LATEST_TAG, templateRef: "main", majors }
    : { branch, distTag: NEXT_TAG, templateRef: "next", majors };
}

/**
 * The channel of a release from `branch` for the publishable packages of
 * the workspace at `root`, as `releaseChannel` answers it.
 */
export async function readReleaseChannel(
  branch: string,
  root: string,
): Promise<ReleaseChannel> {
  return releaseChannel(branch, await readPublishablePackages(root));
}
