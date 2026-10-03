/**
 * The Typings' manifest, as the Probe runner's commands read it: the Patch
 * it names, the one `probe:build` bakes into a Probe and whose vendored
 * `common.j` `probe:nullability-converters` reads.
 */
import fs from "node:fs";
import { AuthorError } from "./errors.js";

/** A Patch, as its Build names it: `3.0.0.24268`. */
const PATCH_PATTERN = /^[0-9]+(\.[0-9]+)*$/;

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
