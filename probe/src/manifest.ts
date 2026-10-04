/**
 * The Typings' manifest, as the Probe runner's commands read it: which one
 * the Probes compile against, and the Patch it names, the one `probe:build`
 * bakes into a Probe and whose vendored `common.j`
 * `probe:nullability-converters` reads.
 */
import fs from "node:fs";
import path from "node:path";
import { AuthorError } from "./errors.js";

/** A Patch, as its Build names it: `3.0.0.24268`. */
const PATCH_PATTERN = /^[0-9]+(\.[0-9]+)*$/;

/** A vendored Build's folder name: four components, as reforged-types names them. */
const BUILD_PATTERN = /^\d+\.\d+\.\d+\.\d+$/;

// gameVersion and compareBuilds mirror packages/reforged-types/src/build.ts,
// which the package does not export: change both together.

/** The Game version a Build belongs to: its first three components. */
export function gameVersion(build: string): string {
  return build.split(".").slice(0, 3).join(".");
}

/** Orders two Builds numerically, component by component. */
function compareBuilds(a: string, b: string): number {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const difference = (left[i] ?? 0) - (right[i] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

/**
 * The manifest of the Typings the Probes compile against, under the
 * reforged-types folder `typesFolder`: the one of the Game version of the
 * newest Build vendored under its `vendor/`, so a Patch that opens a new
 * Game version is probed against its own Typings. A vendor folder without
 * a Build, or none, is an AuthorError.
 */
export function typingsManifest(typesFolder: string): string {
  const vendor = path.join(typesFolder, "vendor");
  const entries = fs.statSync(vendor, { throwIfNoEntry: false })?.isDirectory()
    ? fs.readdirSync(vendor, { withFileTypes: true })
    : [];
  const newest = entries
    .filter((entry) => entry.isDirectory() && BUILD_PATTERN.test(entry.name))
    .map((entry) => entry.name)
    .sort(compareBuilds)
    .at(-1);
  if (newest === undefined) {
    throw new AuthorError(
      `${vendor} holds no vendored Build, such as 3.0.0.24268: the Probes compile against the Typings of the newest.`,
    );
  }
  return path.join(typesFolder, gameVersion(newest), "manifest.json");
}

/**
 * The Patch the Typings' manifest names, its `patch`. A manifest that
 * cannot be read, or whose `patch` is not a Build, is an AuthorError.
 */
export function readPatch(manifest: string): string {
  let patch: unknown;
  try {
    ({ patch } = JSON.parse(fs.readFileSync(manifest, "utf8")) as {
      patch?: unknown;
    });
  } catch (error) {
    throw new AuthorError(
      `${manifest} could not be read as JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (typeof patch !== "string" || !PATCH_PATTERN.test(patch)) {
    throw new AuthorError(`${manifest} names no Patch, such as 3.0.0.24268.`);
  }
  return patch;
}
