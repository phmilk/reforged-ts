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
import { publishEntries, readPublishPlan } from "./publish-plan.js";
import { readPublishablePackages } from "./workspace.js";

/** The event type the Template's sync workflow listens for. */
export const TEMPLATE_DISPATCH_EVENT = "reforged-ts-release";

/** Where the raw files of this repository are served, by git ref. */
const RAW_BASE_URL = "https://raw.githubusercontent.com/phmilk/reforged-ts";

/** The `client_payload` of the dispatch. */
export interface ReleasePayload {
  /** The release's git tag: `<package>@<version>`. */
  tag: string;
  /** The version on npm of each of the four packages, after the release. */
  versions: Record<string, string>;
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
 * library version names no docs version, and a
 * `PublishPlanError` on a plan that cannot be read.
 */
export async function templateDispatch(
  packDir: string,
  root: string,
): Promise<TemplateDispatch> {
  const { file, plan } = await readPublishPlan(packDir);
  const published = publishEntries(plan, file);
  const workspace = await readPublishablePackages(root);
  const names = Object.values(ROW_PACKAGES);

  const released = names.find((name) =>
    published.some((pkg) => pkg.name === name),
  );
  if (released === undefined) {
    throw new TemplateDispatchError(
      `The publish plan publishes none of ${names.join(", ")}: there is no release to dispatch.`,
    );
  }
  const versions: Record<string, string> = {};
  for (const name of names) {
    const found =
      published.find((pkg) => pkg.name === name) ??
      workspace.find((pkg) => pkg.name === name);
    if (found === undefined) {
      throw new TemplateDispatchError(
        `Neither the publish plan nor the workspace has ${name}.`,
      );
    }
    versions[name] = found.version;
  }

  const tag = `${released}@${versions[released] ?? ""}`;
  const library = versions[ROW_PACKAGES.library] ?? "";
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
