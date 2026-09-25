/**
 * The publish plan: `publish-plan.json`, which `changeset pack` writes at
 * the root of its output folder next to the tarballs, and from which
 * `changeset publish --from-pack-dir` publishes. `release:dist-tag` rewrites
 * its tags; the Template gate installs its tarballs. Both read it here, so
 * they accept the same plans.
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { errorMessage, isRecord } from "./unknown.js";

/** The file `changeset pack` writes at the root of its output folder. */
export const PUBLISH_PLAN = "publish-plan.json";

/** The publish plan format the scripts read (Changesets 3). */
export const PLAN_VERSION = 1;

/** A publish plan that cannot be read, or that is not a Changesets 3 one. */
export class PublishPlanError extends Error {
  override name = "PublishPlanError";
}

/**
 * A publish entry of the plan. It is the plan's own object, so changing a
 * field changes the plan.
 */
export interface PublishEntry extends Record<string, unknown> {
  kind: "publish";
  name: string;
  version: string;
  /** The dist-tag `pnpm publish --tag` receives. */
  tag: string;
  /** Where the tarball is, and its integrity; checked by its reader. */
  tarball?: unknown;
}

/**
 * The publish entries of `plan` (a parsed `publish-plan.json`), in plan
 * order. Tag-only entries (private packages, which get a git tag and no
 * upload) are left out. Throws a `PublishPlanError` naming `source` on a
 * plan that is not a Changesets 3 one.
 */
export function publishEntries(
  plan: unknown,
  source = "The publish plan",
): PublishEntry[] {
  if (
    !isRecord(plan) ||
    plan.version !== PLAN_VERSION ||
    !Array.isArray(plan.plan) ||
    !plan.plan.every((chunk) => Array.isArray(chunk))
  ) {
    throw new PublishPlanError(
      `${source} is not a version ${String(PLAN_VERSION)} Changesets plan.`,
    );
  }
  const entries: PublishEntry[] = [];
  for (const entry of (plan.plan as unknown[][]).flat()) {
    if (isRecord(entry) && entry.kind === "tag-only") continue;
    if (
      !isRecord(entry) ||
      entry.kind !== "publish" ||
      typeof entry.name !== "string" ||
      typeof entry.version !== "string" ||
      typeof entry.tag !== "string"
    ) {
      throw new PublishPlanError(
        `${source} holds an entry that is neither a publish nor a tag-only one: ${JSON.stringify(entry)}`,
      );
    }
    entries.push(entry as PublishEntry);
  }
  return entries;
}

/**
 * The parsed publish plan of the `changeset pack` output `packDir`, and its
 * path. Throws a `PublishPlanError` when the file cannot be read or is not
 * JSON; the shape is checked by `publishEntries`.
 */
export async function readPublishPlan(
  packDir: string,
): Promise<{ file: string; plan: unknown }> {
  const file = join(packDir, PUBLISH_PLAN);
  try {
    return { file, plan: JSON.parse(await readFile(file, "utf8")) as unknown };
  } catch (error) {
    throw new PublishPlanError(
      `Cannot read the publish plan ${file}: ${errorMessage(error)}`,
      { cause: error },
    );
  }
}

/** Writes `plan` to `file` as Changesets writes it: indented JSON. */
export async function writePublishPlan(
  file: string,
  plan: unknown,
): Promise<void> {
  await writeFile(file, `${JSON.stringify(plan, null, 2)}\n`);
}
