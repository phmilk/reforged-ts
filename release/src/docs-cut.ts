/**
 * `release:docs-cut`, programmatic entry point: whether a tag cuts a docs
 * version (#196), the check of `docs.yml`'s `cut-version` job. A docs
 * version is cut on each stable minor of the library,
 * `reforged-ts@<major>.<minor>.0`; its patches keep the docs version of
 * their minor and a prerelease's docs are Next. The tag filter
 * of the workflow cannot say "ends in `.0` without a prerelease suffix", so
 * every `reforged-ts@` tag starts the job and this decides.
 */
import { minorLabel } from "./matrix-model.js";
import { LIBRARY_PACKAGE } from "./packages.js";
import { isPrerelease, parseSemver } from "./semver.js";

export type DocsCut =
  | {
      cut: true;
      /** The library version, `1.1.0`. */
      version: string;
      /** The docs version label, its `major.minor`. */
      label: string;
    }
  | {
      cut: false;
      /** Why the tag cuts none, one sentence. */
      reason: string;
    };

/** What `tag` (`reforged-ts@1.1.0`, a git tag of the publish job) cuts. */
export function docsCut(tag: string): DocsCut {
  const prefix = `${LIBRARY_PACKAGE}@`;
  if (!tag.startsWith(prefix)) {
    return { cut: false, reason: `${tag} is not a tag of ${LIBRARY_PACKAGE}.` };
  }
  const version = tag.slice(prefix.length);
  const parsed = parseSemver(version);
  if (parsed === undefined) {
    return { cut: false, reason: `${tag} does not name a semantic version.` };
  }
  if (isPrerelease(parsed)) {
    return {
      cut: false,
      reason: `${tag} is a prerelease: a docs version is cut on a stable minor only, and a prerelease's docs are Next.`,
    };
  }
  const label = minorLabel(version);
  if (parsed.patch !== 0) {
    return {
      cut: false,
      reason: `${tag} is a patch release: the docs version ${label} is cut on ${prefix}${label}.0.`,
    };
  }
  if (parsed.build.length > 0) {
    return {
      cut: false,
      reason: `${tag} carries build metadata: a docs version is cut on ${prefix}<major>.<minor>.0 only.`,
    };
  }
  return { cut: true, version, label };
}
