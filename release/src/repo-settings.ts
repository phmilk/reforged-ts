/**
 * `repo:settings`, programmatic entry point: the repository's protection and
 * settings as code. The ruleset on `master` is committed as the JSON body
 * of GitHub's rulesets API (`.github/rulesets/master.json`); the merge
 * settings, the Pages source and the labels are the constants below.
 * `planRepositorySettings` turns them and the repository's current state
 * into the API requests that make the repository match; the CLI reads the
 * state and sends the requests with the maintainer's `gh` authentication.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { errorMessage, isRecord } from "./unknown.js";

/** The committed ruleset, `/`-separated from the repository root. */
export const RULESET_FILE = ".github/rulesets/master.json";

/** A ruleset as the rulesets API takes it; found on GitHub by its name. */
export interface Ruleset {
  name: string;
  [field: string]: unknown;
}

/** The merge settings: squash merge only, auto-merge, head branches deleted. */
export const MERGE_SETTINGS = {
  allow_squash_merge: true,
  allow_merge_commit: false,
  allow_rebase_merge: false,
  allow_auto_merge: true,
  delete_branch_on_merge: true,
} as const;

/** The Pages source: a workflow (docs.yml) deploys the site. */
const PAGES_BUILD_TYPE = "workflow";

export interface Label {
  name: string;
  /** Six hex digits, no `#`. */
  color: string;
  description: string;
}

/**
 * The labels the issue forms and the triage skills apply. `game-patch` is
 * this repository's own and kept as committed; the others are GitHub's
 * defaults or the skills' and are only created when missing, so an existing
 * one keeps its colour and description.
 */
export const LABELS: readonly (Label & { owned: boolean })[] = [
  {
    name: "bug",
    color: "d73a4a",
    description: "Something isn't working",
    owned: false,
  },
  {
    name: "enhancement",
    color: "a2eeef",
    description: "New feature or request",
    owned: false,
  },
  {
    name: "game-patch",
    color: "c2e0c6",
    description:
      "A new game Patch: its Typings to generate and its Overlay to curate",
    owned: true,
  },
  {
    name: "needs-triage",
    color: "d93f0b",
    description: "Maintainer needs to evaluate this issue",
    owned: false,
  },
  {
    name: "needs-info",
    color: "fbca04",
    description: "Waiting on reporter for more information",
    owned: false,
  },
  {
    name: "ready-for-agent",
    color: "0e8a16",
    description: "Fully specified, ready for an AFK agent",
    owned: false,
  },
  {
    name: "ready-for-human",
    color: "5319e7",
    description: "Requires human implementation",
    owned: false,
  },
  {
    name: "wontfix",
    color: "ffffff",
    description: "This will not be worked on",
    owned: false,
  },
  {
    name: "spec",
    color: "5319e7",
    description:
      "A spec, written with the to-spec skill; its tickets are sub-issues",
    owned: false,
  },
  {
    name: "ticket",
    color: "c5def5",
    description: "A ticket of a spec, written with the to-tickets skill",
    owned: false,
  },
];

/** What the plan needs to know of the repository, as the API answers it. */
export interface RepositoryState {
  /** The repository (`GET /repos/{owner}/{repo}`). */
  settings: Readonly<Record<string, unknown>>;
  /** The repository's own rulesets, not those of its owner. */
  rulesets: readonly { id: number; name: string }[];
  /** The Pages site; `null` when Pages is off. */
  pages: { build_type: string | null } | null;
  labels: readonly {
    name: string;
    color: string;
    description: string | null;
  }[];
}

/** One request that changes the repository. */
export interface ApiRequest {
  method: "POST" | "PUT" | "PATCH";
  /** The path under the API root, with a leading `/`. */
  endpoint: string;
  body: unknown;
  /** What it does, in one sentence. */
  summary: string;
}

export interface RepositorySettingsPlan {
  /** The requests to send, in order. */
  requests: ApiRequest[];
  /** What already matches, one sentence each. */
  unchanged: string[];
}

/** Configuration the script cannot use, or a repository it cannot change. */
export class RepoSettingsError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "RepoSettingsError";
  }
}

/** Whether `value` names a repository as `owner/name`. */
export function isRepository(value: string): boolean {
  return /^[\w.-]+\/[\w.-]+$/.test(value);
}

/** The contexts the ruleset's `required_status_checks` rule requires. */
export function requiredStatusChecks(ruleset: Ruleset): string[] {
  const rules = Array.isArray(ruleset.rules)
    ? (ruleset.rules as unknown[])
    : [];
  return rules.flatMap((rule) => {
    if (!isRecord(rule) || rule.type !== "required_status_checks") return [];
    const checks = isRecord(rule.parameters)
      ? rule.parameters.required_status_checks
      : undefined;
    return Array.isArray(checks)
      ? checks.flatMap((check: unknown) =>
          isRecord(check) && typeof check.context === "string"
            ? [check.context]
            : [],
        )
      : [];
  });
}

/** The ruleset of `text`, the content of `file`. */
export function parseRuleset(text: string, file: string): Ruleset {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new RepoSettingsError(`${file}: ${errorMessage(error)}`, {
      cause: error,
    });
  }
  if (!isRecord(value) || typeof value.name !== "string" || value.name === "") {
    throw new RepoSettingsError(
      `${file}: not a ruleset (a JSON object with a name).`,
    );
  }
  return value as Ruleset;
}

/** The committed ruleset of the repository at `root`. */
export async function readRuleset(root: string): Promise<Ruleset> {
  const file = join(root, RULESET_FILE);
  let text: string;
  try {
    text = await readFile(file, "utf8");
  } catch (error) {
    throw new RepoSettingsError(`${file}: ${errorMessage(error)}`, {
      cause: error,
    });
  }
  return parseRuleset(text, file);
}

const sameName = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/**
 * The requests that make `repository` (`owner/name`) match the committed
 * `ruleset` and the constants of this module, given its current `state`:
 * the merge settings when one differs; the ruleset created, or updated in
 * place when one of its name exists (always sent: the list does not show
 * its rules); the Pages source when Pages is off or not on GitHub Actions;
 * the missing labels created and `game-patch` updated when it differs.
 */
export function planRepositorySettings(
  repository: string,
  ruleset: Ruleset,
  state: RepositoryState,
): RepositorySettingsPlan {
  if (!isRepository(repository)) {
    throw new RepoSettingsError(
      `"${repository}" is not a repository; name it as owner/name.`,
    );
  }
  const root = `/repos/${repository}`;
  const requests: ApiRequest[] = [];
  const unchanged: string[] = [];

  const merge = "squash merge only, auto-merge, head branches deleted";
  if (
    Object.entries(MERGE_SETTINGS).every(
      ([key, value]) => state.settings[key] === value,
    )
  ) {
    unchanged.push(`Merge settings: ${merge}.`);
  } else {
    requests.push({
      method: "PATCH",
      endpoint: root,
      body: { ...MERGE_SETTINGS },
      summary: `Set the merge settings: ${merge}.`,
    });
  }

  const existing = state.rulesets.find(({ name }) => name === ruleset.name);
  requests.push(
    existing === undefined
      ? {
          method: "POST",
          endpoint: `${root}/rulesets`,
          body: ruleset,
          summary: `Create the ruleset "${ruleset.name}".`,
        }
      : {
          method: "PUT",
          endpoint: `${root}/rulesets/${String(existing.id)}`,
          body: ruleset,
          summary: `Update the ruleset "${ruleset.name}" (id ${String(existing.id)}).`,
        },
  );

  if (state.pages?.build_type === PAGES_BUILD_TYPE) {
    unchanged.push("Pages source: GitHub Actions.");
  } else {
    requests.push({
      method: state.pages === null ? "POST" : "PUT",
      endpoint: `${root}/pages`,
      body: { build_type: PAGES_BUILD_TYPE },
      summary:
        state.pages === null
          ? "Turn Pages on with the GitHub Actions source."
          : "Set the Pages source to GitHub Actions.",
    });
  }

  const kept: string[] = [];
  for (const { owned, ...label } of LABELS) {
    const current = state.labels.find(({ name }) => sameName(name, label.name));
    if (current === undefined) {
      requests.push({
        method: "POST",
        endpoint: `${root}/labels`,
        body: label,
        summary: `Create the label ${label.name}.`,
      });
    } else if (
      owned &&
      (current.name !== label.name ||
        current.color.toLowerCase() !== label.color ||
        current.description !== label.description)
    ) {
      requests.push({
        method: "PATCH",
        endpoint: `${root}/labels/${encodeURIComponent(current.name)}`,
        body: {
          new_name: label.name,
          color: label.color,
          description: label.description,
        },
        summary: `Update the label ${label.name}.`,
      });
    } else {
      kept.push(label.name);
    }
  }
  if (kept.length > 0) unchanged.push(`Labels: ${kept.join(", ")}.`);

  return { requests, unchanged };
}

/** A GitHub API answer: its status and its parsed JSON body (`null` when empty). */
export interface ApiResponse {
  status: number;
  body: unknown;
}

/** Sends one request to the GitHub REST API as the maintainer. */
export type GitHubApi = (request: {
  method: "GET" | ApiRequest["method"];
  endpoint: string;
  body?: unknown;
}) => Promise<ApiResponse>;

/** GitHub's own message of an error answer, else its status. */
function apiMessage({ status, body }: ApiResponse): string {
  return isRecord(body) && typeof body.message === "string"
    ? `${String(status)} ${body.message}`
    : String(status);
}

/** The body of a `GET` that must answer 200 (or 404, as `null`, when `missing` allows). */
async function get(
  api: GitHubApi,
  endpoint: string,
  missing = false,
): Promise<unknown> {
  const response = await api({ method: "GET", endpoint });
  if (missing && response.status === 404) return null;
  if (response.status !== 200) {
    throw new RepoSettingsError(
      `GET ${endpoint} answered ${apiMessage(response)}.`,
    );
  }
  return response.body;
}

const PAGE_SIZE = 100;

/** More pages than any repository's labels or rulesets fill. */
const MAX_PAGES = 50;

/** Every item of the paginated list at `endpoint` (a path and a query). */
async function getAll(api: GitHubApi, endpoint: string): Promise<unknown[]> {
  const items: unknown[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const batch = await get(
      api,
      `${endpoint}${endpoint.includes("?") ? "&" : "?"}per_page=${String(PAGE_SIZE)}&page=${String(page)}`,
    );
    if (!Array.isArray(batch)) {
      throw new RepoSettingsError(`GET ${endpoint} answered no list.`);
    }
    items.push(...(batch as unknown[]));
    if (batch.length < PAGE_SIZE) return items;
  }
  throw new RepoSettingsError(
    `GET ${endpoint} answered more than ${String(MAX_PAGES)} pages.`,
  );
}

/**
 * The current state of `repository`, read through `api`. Stops with a
 * `RepoSettingsError` when the authentication cannot see the repository or
 * is not one of its administrators: every change needs that role.
 */
export async function readRepositoryState(
  api: GitHubApi,
  repository: string,
): Promise<RepositoryState> {
  const root = `/repos/${repository}`;
  const settings = await get(api, root, true);
  if (settings === null) {
    throw new RepoSettingsError(
      `GET ${root} answered 404: ${repository} does not exist or the gh authentication cannot see it.`,
    );
  }
  if (!isRecord(settings)) {
    throw new RepoSettingsError(`GET ${root} answered no repository.`);
  }
  if (!isRecord(settings.permissions) || settings.permissions.admin !== true) {
    throw new RepoSettingsError(
      `The gh authentication has no administrator rights on ${repository}, ` +
        "and every change repo:settings makes needs them. Run it as an " +
        "administrator of the repository (gh auth login, or gh auth switch " +
        "to that account).",
    );
  }

  const rulesets = await getAll(api, `${root}/rulesets?includes_parents=false`);
  const pages = await get(api, `${root}/pages`, true);
  const labels = await getAll(api, `${root}/labels`);

  return {
    settings,
    rulesets: rulesets.flatMap((ruleset) =>
      isRecord(ruleset) &&
      typeof ruleset.id === "number" &&
      typeof ruleset.name === "string"
        ? [{ id: ruleset.id, name: ruleset.name }]
        : [],
    ),
    pages: isRecord(pages)
      ? {
          build_type:
            typeof pages.build_type === "string" ? pages.build_type : null,
        }
      : null,
    labels: labels.flatMap((label) =>
      isRecord(label) &&
      typeof label.name === "string" &&
      typeof label.color === "string"
        ? [
            {
              name: label.name,
              color: label.color,
              description:
                typeof label.description === "string"
                  ? label.description
                  : null,
            },
          ]
        : [],
    ),
  };
}

/**
 * Sends `requests` in order through `api`, calling `sent` after each one
 * that succeeds; stops with a `RepoSettingsError` at the first error answer.
 */
export async function applyRequests(
  api: GitHubApi,
  requests: readonly ApiRequest[],
  sent: (request: ApiRequest) => void = () => undefined,
): Promise<void> {
  for (const request of requests) {
    const response = await api(request);
    if (response.status < 200 || response.status >= 300) {
      throw new RepoSettingsError(
        `${request.method} ${request.endpoint} answered ${apiMessage(response)}. ` +
          `Not done: ${request.summary}`,
      );
    }
    sent(request);
  }
}
