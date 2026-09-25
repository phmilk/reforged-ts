/**
 * Semantic versions (semver 2.0.0) as the release scripts read them: the
 * versions of the packages, the library version the Template ref is named
 * after, and the versions of the tools the publish job runs. One parser, so
 * every script accepts the same strings and orders them the same way:
 * `major.minor.patch` without leading zeros, then an optional prerelease
 * (`-alpha.0`) and optional build metadata (`+sha.1`).
 */
import { byCodePoint } from "./order.js";

export interface SemVer {
  major: number;
  minor: number;
  patch: number;
  /** The prerelease identifiers (`["alpha", "0"]`); empty when stable. */
  prerelease: readonly string[];
  /** The build metadata identifiers; never part of the order. */
  build: readonly string[];
}

const NUMBER = "0|[1-9]\\d*";
/** A prerelease identifier: a number without leading zeros, or not a number. */
const PRERELEASE_ID = `${NUMBER}|\\d*[A-Za-z-][0-9A-Za-z-]*`;
const BUILD_ID = "[0-9A-Za-z-]+";

const SEMVER = new RegExp(
  `^(${NUMBER})\\.(${NUMBER})\\.(${NUMBER})` +
    `(?:-((?:${PRERELEASE_ID})(?:\\.(?:${PRERELEASE_ID}))*))?` +
    `(?:\\+(${BUILD_ID}(?:\\.${BUILD_ID})*))?$`,
);

/** `version` read as a semantic version, or `undefined` when it is not one. */
export function parseSemver(version: string): SemVer | undefined {
  const match = SEMVER.exec(version);
  if (match === null) return undefined;
  // The optional groups are undefined when absent, which the type omits.
  const groups: (string | undefined)[] = match.slice(1);
  const [major, minor, patch] = groups.map(Number);
  const identifiers = (group: string | undefined) =>
    group === undefined ? [] : group.split(".");
  return {
    major,
    minor,
    patch,
    prerelease: identifiers(groups[3]),
    build: identifiers(groups[4]),
  };
}

/** Whether `version` is a prerelease (`1.0.0-alpha.0`). */
export function isPrerelease(version: SemVer): boolean {
  return version.prerelease.length > 0;
}

const NUMERIC = /^\d+$/;

function compareIdentifiers(a: string, b: string): number {
  const aNumeric = NUMERIC.test(a);
  const bNumeric = NUMERIC.test(b);
  if (aNumeric && bNumeric) return Number(a) - Number(b);
  // Numeric identifiers sort before alphanumeric ones.
  if (aNumeric !== bNumeric) return aNumeric ? -1 : 1;
  return byCodePoint(a, b);
}

/**
 * Orders two versions by semver precedence: `major.minor.patch`
 * numerically, then a prerelease before its release, then the prerelease
 * identifiers one by one. Build metadata is ignored.
 */
export function compareSemver(a: SemVer, b: SemVer): number {
  const core = a.major - b.major || a.minor - b.minor || a.patch - b.patch;
  if (core !== 0) return core;
  if (!isPrerelease(a) || !isPrerelease(b)) {
    return Number(isPrerelease(b)) - Number(isPrerelease(a));
  }
  const shared = Math.min(a.prerelease.length, b.prerelease.length);
  for (let i = 0; i < shared; i++) {
    const order = compareIdentifiers(a.prerelease[i], b.prerelease[i]);
    if (order !== 0) return order;
  }
  // A shorter set of identifiers sorts first when all before are equal.
  return a.prerelease.length - b.prerelease.length;
}
