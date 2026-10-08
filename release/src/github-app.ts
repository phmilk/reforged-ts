/**
 * The repository's GitHub App (#48): the permissions the workflows mint its
 * tokens with, the registration page that asks for exactly those, and the
 * checks the setup wizard (`release/repo-setup.sh`) runs with the App's own
 * credentials, which `gh` cannot: that a client ID and a private key belong
 * to one App, its permissions, and its installation on the repository.
 */
import { createPrivateKey, createSign, type KeyObject } from "node:crypto";
import { isRecord } from "./unknown.js";

/**
 * The repository permissions of the App, as the API names them: the union
 * of what the workflows request (the version, publish and
 * template-dispatch jobs of `release.yml`, the Patch watch, the docs version
 * cut), plus `metadata`,
 * which every App holds.
 */
export const APP_PERMISSIONS: Readonly<Record<string, "read" | "write">> = {
  contents: "write",
  issues: "write",
  metadata: "read",
  pull_requests: "write",
};

/** The repository variable holding the App's client ID. */
export const CLIENT_ID_VARIABLE = "APP_CLIENT_ID";
/**
 * The secret holding a private key of the App, in the environment
 * `APP_ENVIRONMENT`.
 */
export const PRIVATE_KEY_SECRET = "APP_PRIVATE_KEY";
/**
 * The environment every job minting the App's token runs in, the home of
 * `PRIVATE_KEY_SECRET`: its deployment branch policy admits master alone.
 */
export const APP_ENVIRONMENT = "app";

/**
 * The page registering the App on the personal account `owner/…` of
 * `repository`, pre-filled: its name, a description, the repository as
 * homepage, private, no webhook, and `APP_PERMISSIONS` (`metadata` is
 * implied). GitHub reads these from the query.
 */
export function registrationUrl(repository: string): string {
  const name = repository.slice(repository.indexOf("/") + 1);
  const query = new URLSearchParams({
    name: `${name}-bot`,
    description: `Opens the release, docs and Patch-watch pull requests and issues of ${repository}.`,
    url: `https://github.com/${repository}`,
    public: "false",
    webhook_active: "false",
  });
  for (const [permission, access] of Object.entries(APP_PERMISSIONS)) {
    if (permission !== "metadata") query.set(permission, access);
  }
  return `https://github.com/settings/apps/new?${query.toString()}`;
}

/** The page installing the App of slug `slug`. */
export function installationUrl(slug: string): string {
  return `https://github.com/apps/${slug}/installations/new`;
}

/**
 * The JSON Web Token the App authenticates as itself with: RS256, issued by
 * its client ID a minute before `now` (against clock drift), valid nine
 * minutes after (GitHub accepts ten at most).
 */
export function appJwt(
  clientId: string,
  privateKey: KeyObject | string,
  now: Date,
): string {
  const seconds = Math.floor(now.getTime() / 1000);
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
    iat: seconds - 60,
    exp: seconds + 540,
    iss: clientId,
  })}`;
  const signature = createSign("RSA-SHA256")
    .update(unsigned)
    .sign(
      typeof privateKey === "string"
        ? createPrivateKey(privateKey)
        : privateKey,
    )
    .toString("base64url");
  return `${unsigned}.${signature}`;
}

/** Permissions as a person reads them: `contents write, issues write`. */
export function formatPermissions(
  permissions: Readonly<Record<string, string>>,
) {
  const entries = Object.entries(permissions).toSorted(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0,
  );
  return entries.length === 0
    ? "none"
    : entries.map(([name, access]) => `${name} ${access}`).join(", ");
}

function samePermissions(
  actual: Readonly<Record<string, string>>,
  expected: Readonly<Record<string, string>>,
): boolean {
  return formatPermissions(actual) === formatPermissions(expected);
}

function permissionsOf(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

const ownerOf = (repository: string) =>
  repository.slice(0, repository.indexOf("/"));

/** What `GET /app` says of the App, and what is wrong with it. */
export interface AppCheck {
  slug: string;
  name: string;
  owner: string;
  permissions: Record<string, string>;
  events: string[];
  problems: string[];
}

/**
 * Checks the App (the body of `GET /app`, as the App) against what the
 * workflows of `repository` need: owned by the repository's owner, exactly
 * `APP_PERMISSIONS`, no webhook events.
 */
export function checkApp(app: unknown, repository: string): AppCheck {
  const record = isRecord(app) ? app : {};
  const text = (value: unknown) => (typeof value === "string" ? value : "");
  const slug = text(record.slug);
  const owner = text(isRecord(record.owner) ? record.owner.login : undefined);
  const permissions = permissionsOf(record.permissions);
  const events = Array.isArray(record.events)
    ? record.events.filter(
        (event): event is string => typeof event === "string",
      )
    : [];
  const problems: string[] = [];
  const settings = `https://github.com/settings/apps/${slug}`;

  if (owner.toLowerCase() !== ownerOf(repository).toLowerCase()) {
    problems.push(
      `The App is owned by ${owner || "an unknown account"}, not ${ownerOf(repository)}: register it on ${ownerOf(repository)}'s account.`,
    );
  }
  if (!samePermissions(permissions, APP_PERMISSIONS)) {
    problems.push(
      `The App's repository permissions are ${formatPermissions(permissions)}; the workflows need exactly ${formatPermissions(APP_PERMISSIONS)}, and no organization or account permission. Change them under Permissions & events: ${settings}/permissions`,
    );
  }
  if (events.length > 0) {
    problems.push(
      `The App subscribes to webhook events (${events.join(", ")}); it needs none. Untick Webhook → Active: ${settings}`,
    );
  }
  return {
    slug,
    name: text(record.name),
    owner,
    permissions,
    events,
    problems,
  };
}

/** What `GET /repos/{repository}/installation` says, and what is wrong. */
export interface InstallationCheck {
  id: number | null;
  account: string;
  selection: string;
  problems: string[];
}

/**
 * Checks the App's installation on `repository` (the body of
 * `GET /repos/{repository}/installation`, as the App): on the repository
 * owner's account, on selected repositories (which ones, the API tells an
 * installation token only), with `APP_PERMISSIONS` accepted.
 */
export function checkInstallation(
  installation: unknown,
  repository: string,
): InstallationCheck {
  const record = isRecord(installation) ? installation : {};
  const id = typeof record.id === "number" ? record.id : null;
  const account =
    isRecord(record.account) && typeof record.account.login === "string"
      ? record.account.login
      : "";
  const selection =
    typeof record.repository_selection === "string"
      ? record.repository_selection
      : "";
  const permissions = permissionsOf(record.permissions);
  const problems: string[] = [];
  const page = `https://github.com/settings/installations/${String(id)}`;

  if (account.toLowerCase() !== ownerOf(repository).toLowerCase()) {
    problems.push(
      `The App is installed on ${account || "an unknown account"}, not ${ownerOf(repository)}.`,
    );
  }
  if (selection !== "selected") {
    problems.push(
      `The installation has access to ${selection === "all" ? "all the repositories" : `"${selection}" repositories`} of ${account}; choose Only select repositories → ${repository}: ${page}`,
    );
  }
  if (!samePermissions(permissions, APP_PERMISSIONS)) {
    problems.push(
      `The installation grants ${formatPermissions(permissions)}, not ${formatPermissions(APP_PERMISSIONS)}: accept the App's new permissions on ${page}`,
    );
  }
  return { id, account, selection, problems };
}
