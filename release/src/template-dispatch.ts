/**
 * `release:template-dispatch`, programmatic entry point: the
 * `repository_dispatch` a release sends the Template (#229), whose sync
 * workflow applies it and opens the sync pull request. The payload is the
 * one the Template's `scripts/sync.ts` (`parsePayload`) accepts, and the
 * Template computes none of it.
 */
import { docsLabel } from "./docs-version.js";
import { DOCS_BASE_URL, FRAGMENT_FILE } from "./matrix-model.js";
import { ROW_PACKAGES } from "./packages.js";
import { REGISTRY } from "./publish-check.js";
import { publishEntries, readPublishPlan } from "./publish-plan.js";
import { readPublishablePackages } from "./workspace.js";

/** The event type the Template's sync workflow listens for. */
export const TEMPLATE_DISPATCH_EVENT = "reforged-ts-release";

/** Where the raw files of this repository are served, by git ref. */
const RAW_BASE_URL = "https://raw.githubusercontent.com/phmilk/reforged-ts";

/** One of the four packages of a release, which the Template depends on. */
export type ReleasedPackage = (typeof ROW_PACKAGES)[keyof typeof ROW_PACKAGES];

/** The `client_payload` of the dispatch. */
export interface ReleasePayload {
  /** The release's git tag: `<package>@<version>`. */
  tag: string;
  /** The version on npm of each of the four packages, after the release. */
  versions: Record<ReleasedPackage, string>;
  /** The raw URL of `CONTEXT.md` at the tag. */
  contextUrl: string;
  /** The raw URL of the compatibility-matrix fragment at the tag. */
  matrixUrl: string;
  /** The `llms.txt` of the library version's docs version. */
  llmsUrl: string;
}

/** The body of `POST /repos/{template}/dispatches`. */
export interface TemplateDispatch {
  event_type: typeof TEMPLATE_DISPATCH_EVENT;
  client_payload: ReleasePayload;
}

/** A release that cannot be dispatched. */
export class TemplateDispatchError extends Error {
  override name = "TemplateDispatchError";
}

/**
 * The dispatch of the release in the `changeset pack` output `packDir`,
 * over the workspace at `root`.
 *
 * - `tag`: the git tag of the first of the four packages, in matrix order
 *   (the library, the Typings, the harness, the plugin), the plan publishes.
 *   A release without the library dispatches too: its versions change the
 *   Template's ranges.
 * - `versions`: the plan's version of each package it publishes, the
 *   workspace's of the others, which npm already holds.
 * - `llmsUrl`: the docs version the packages of the library version link
 *   (`docsLabel`): its `major.minor`, or `next` for a prerelease.
 *
 * Throws a `TemplateDispatchError` when the plan publishes none of the four
 * packages, one of them is in neither the plan nor the workspace, or the
 * library version names no docs version, and a `PublishPlanError` on a plan
 * that cannot be read.
 */
export async function templateDispatch(
  packDir: string,
  root: string,
): Promise<TemplateDispatch> {
  const { file, plan } = await readPublishPlan(packDir);
  const planned = new Map(
    publishEntries(plan, file).map(({ name, version }) => [name, version]),
  );
  const workspace = new Map(
    (await readPublishablePackages(root)).map(({ name, version }) => [
      name,
      version,
    ]),
  );
  const names = Object.values(ROW_PACKAGES);

  const tagPackage = names.find((name) => planned.has(name));
  if (tagPackage === undefined) {
    throw new TemplateDispatchError(
      `The publish plan publishes none of ${names.join(", ")}: there is no release to dispatch.`,
    );
  }
  const version = (name: ReleasedPackage): string => {
    const found = planned.get(name) ?? workspace.get(name);
    if (found === undefined) {
      throw new TemplateDispatchError(
        `Neither the publish plan nor the workspace has ${name}.`,
      );
    }
    return found;
  };
  const versions = Object.fromEntries(
    names.map((name) => [name, version(name)]),
  ) as Record<ReleasedPackage, string>;

  const tag = `${tagPackage}@${versions[tagPackage]}`;
  const library = versions[ROW_PACKAGES.library];
  const label = docsLabel(library);
  if (label === undefined) {
    throw new TemplateDispatchError(
      `${ROW_PACKAGES.library} ${library} is not a semantic version: it names no docs version for the llmsUrl.`,
    );
  }
  return {
    event_type: TEMPLATE_DISPATCH_EVENT,
    client_payload: {
      tag,
      versions,
      contextUrl: `${RAW_BASE_URL}/${tag}/CONTEXT.md`,
      matrixUrl: `${RAW_BASE_URL}/${tag}/${FRAGMENT_FILE}`,
      llmsUrl: `${DOCS_BASE_URL}/${label}/llms.txt`,
    },
  };
}

/** How `awaitOnNpm` asks the registry, and how long it keeps asking. */
export interface NpmWait {
  fetcher: typeof fetch;
  sleep: (ms: number) => Promise<void>;
  /** How long to keep asking before failing. */
  timeoutMs: number;
  /** The pause between two rounds of requests. */
  intervalMs: number;
}

/**
 * The versions of `versions` the registry does not list yet, as
 * `<package>@<version>`: read from the install metadata, the document a
 * `pnpm update` resolves from. A package the registry does not know lists
 * none; any answer but 200 or 404 throws.
 */
async function missingOnNpm(
  versions: Readonly<Record<string, string>>,
  fetcher: typeof fetch,
): Promise<string[]> {
  const missing: string[] = [];
  for (const [name, version] of Object.entries(versions)) {
    const response = await fetcher(`${REGISTRY}/${encodeURIComponent(name)}`, {
      method: "GET",
      headers: { accept: "application/vnd.npm.install-v1+json" },
    });
    if (response.status !== 404 && !response.ok) {
      throw new Error(
        `${REGISTRY} answered ${String(response.status)} for ${name}.`,
      );
    }
    const listed =
      response.status === 404
        ? {}
        : (((await response.json()) as { versions?: Record<string, unknown> })
            .versions ?? {});
    if (!(version in listed)) missing.push(`${name}@${version}`);
  }
  return missing;
}

/**
 * Resolves once the registry lists every version of `versions`, asking
 * every `intervalMs` for at most `timeoutMs`. npm lists a version it
 * accepted after a delay, and the Template's sync starts at once: it would
 * install the versions before them. Throws a `TemplateDispatchError`
 * naming the versions still missing when the time is up.
 */
export async function awaitOnNpm(
  versions: Readonly<Record<string, string>>,
  wait: NpmWait,
): Promise<void> {
  for (let waited = 0; ; waited += wait.intervalMs) {
    const missing = await missingOnNpm(versions, wait.fetcher);
    if (missing.length === 0) return;
    if (waited + wait.intervalMs > wait.timeoutMs) {
      const minutes = Math.round(wait.timeoutMs / 60_000);
      throw new TemplateDispatchError(
        `npm does not list ${missing.join(", ")} after ${String(minutes)} minute${minutes === 1 ? "" : "s"}: ` +
          "the Template's sync would install the versions before them. " +
          "Re-run this job once `npm view <package>@<version>` answers.",
      );
    }
    await wait.sleep(wait.intervalMs);
  }
}
