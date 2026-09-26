/**
 * `release:publish-check`, programmatic entry point: what the publish job
 * needs before it publishes without a token, each failing with a message
 * naming what is missing.
 *
 * - The job can request an OIDC token (`id-token: write`).
 * - The publishing tool does trusted publishing. pnpm 11 and later do it
 *   themselves; pnpm 10 hands the upload to the npm CLI, which does it
 *   from 11.5.1.
 * - Every publishable package exists on npm: trusted publishing is
 *   configured on an existing package only, so a package's first version
 *   is published by hand (the first-publish wizard) and never by the
 *   workflow.
 */
import { byCodePoint } from "./order.js";
import { compareSemver, parseSemver } from "./semver.js";

/** The first npm CLI release with trusted publishing. */
export const NPM_TRUSTED_PUBLISHING = "11.5.1";

/** The first pnpm major that does trusted publishing itself. */
export const PNPM_NATIVE_TRUSTED_PUBLISHING = 11;

/** The registry the packages are published to. */
export const REGISTRY = "https://registry.npmjs.org";

/** The variable GitHub Actions sets when the job may request an OIDC token. */
export const ID_TOKEN_VARIABLE = "ACTIONS_ID_TOKEN_REQUEST_URL";

export interface PublishCheckInput {
  /** Whether the job can request an OIDC token. */
  idToken: boolean;
  /** `pnpm --version`, or `null` when pnpm cannot be run. */
  pnpm: string | null;
  /** `npm --version`, or `null` when there is no npm. */
  npm: string | null;
  /** Each publishable package, and whether npm has it. */
  packages: readonly { name: string; onNpm: boolean }[];
}

export interface PublishCheckResult {
  ok: boolean;
  /** One sentence per missing prerequisite. */
  problems: string[];
}

/**
 * Whether the version `version` is at least `floor`, by semver precedence
 * (so `11.5.1-rc.0` is below `11.5.1`); `false` when either is not a
 * version.
 */
export function atLeast(version: string, floor: string): boolean {
  const actual = parseSemver(version.trim());
  const minimum = parseSemver(floor.trim());
  if (actual === undefined || minimum === undefined) return false;
  return compareSemver(actual, minimum) >= 0;
}

export function checkPublish(input: PublishCheckInput): PublishCheckResult {
  const problems: string[] = [];
  if (!input.idToken) {
    problems.push(
      `The job cannot request an OIDC token (${ID_TOKEN_VARIABLE} is not set): ` +
        "trusted publishing needs `permissions: id-token: write` on the publish job.",
    );
  }
  const pnpmMajor =
    input.pnpm === null ? undefined : parseSemver(input.pnpm.trim())?.major;
  if (pnpmMajor === undefined) {
    problems.push(
      input.pnpm === null
        ? "pnpm cannot be run: `pnpm --version` failed."
        : `\`pnpm --version\` printed "${input.pnpm}", not a version.`,
    );
  } else if (
    pnpmMajor < PNPM_NATIVE_TRUSTED_PUBLISHING &&
    (input.npm === null || !atLeast(input.npm, NPM_TRUSTED_PUBLISHING))
  ) {
    problems.push(
      `pnpm ${String(input.pnpm)} hands the upload to the npm CLI, which does trusted publishing ` +
        `from ${NPM_TRUSTED_PUBLISHING}; found ${input.npm === null ? "no npm" : `npm ${input.npm}`}. ` +
        "Run the publish job on Node 24, whose npm is recent enough, or install a newer npm in it.",
    );
  }
  const absent = input.packages
    .filter(({ onNpm }) => !onNpm)
    .map(({ name }) => name)
    .sort(byCodePoint);
  if (absent.length > 0) {
    problems.push(
      `Not on npm yet: ${absent.join(", ")}. Trusted publishing is configured on an ` +
        "existing package only, so the first version of a package is published by hand " +
        "with the first-publish wizard (bash release/first-publish.sh), which also configures " +
        "its trusted publisher; " +
        "then re-run this job.",
    );
  }
  return { ok: problems.length === 0, problems };
}

/**
 * Whether the registry has the package `name`: its packument answers 200,
 * or 404 when it does not exist. Throws on any other answer.
 */
export async function onNpm(
  name: string,
  fetcher: typeof fetch = fetch,
): Promise<boolean> {
  const response = await fetcher(`${REGISTRY}/${encodeURIComponent(name)}`, {
    method: "GET",
    headers: { accept: "application/vnd.npm.install-v1+json" },
  });
  if (response.status === 404) return false;
  if (response.ok) return true;
  throw new Error(
    `${REGISTRY} answered ${String(response.status)} for ${name}.`,
  );
}
