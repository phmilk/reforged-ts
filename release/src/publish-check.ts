/**
 * `release:publish-check`, programmatic entry point: what the publish job
 * needs before it publishes without a token, each failing with a message
 * naming what is missing.
 *
 * - The job can request an OIDC token (`id-token: write`).
 * - The publishing tool does trusted publishing: pnpm 11 or later. pnpm 10
 *   has no code path for it (its `publish` never exchanges the job's OIDC
 *   token, so npm answers ENEEDAUTH), which is why the publish job installs
 *   pnpm 11 for itself while the workspace stays on pnpm 10.
 * - Every publishable package exists on npm: trusted publishing is
 *   configured on an existing package only, so a package's first version
 *   is published by hand (the first-publish wizard) and never by the
 *   workflow.
 */
import { byCodePoint } from "./order.js";
import { parseSemver } from "./semver.js";

/** The first pnpm major whose `publish` does trusted publishing. */
export const PNPM_TRUSTED_PUBLISHING = 11;

/** The registry the packages are published to. */
export const REGISTRY = "https://registry.npmjs.org";

/** The variable GitHub Actions sets when the job may request an OIDC token. */
export const ID_TOKEN_VARIABLE = "ACTIONS_ID_TOKEN_REQUEST_URL";

export interface PublishCheckInput {
  /** Whether the job can request an OIDC token. */
  idToken: boolean;
  /** `pnpm --version`, or `null` when pnpm cannot be run. */
  pnpm: string | null;
  /** `npm --version`, or `null` when there is no npm; reported only. */
  npm: string | null;
  /** Each publishable package, and whether npm has it. */
  packages: readonly { name: string; onNpm: boolean }[];
}

export interface PublishCheckResult {
  ok: boolean;
  /** One sentence per missing prerequisite. */
  problems: string[];
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
  } else if (pnpmMajor < PNPM_TRUSTED_PUBLISHING) {
    problems.push(
      `pnpm ${String(input.pnpm)} cannot publish without a token: \`pnpm publish\` does trusted ` +
        `publishing from pnpm ${String(PNPM_TRUSTED_PUBLISHING)} (pnpm 10 never exchanges the job's ` +
        "OIDC token, and npm answers ENEEDAUTH). The publish job installs pnpm " +
        `${String(PNPM_TRUSTED_PUBLISHING)} for itself before this check.`,
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
