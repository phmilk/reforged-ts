/**
 * Where the report's real inputs and outputs are in the repository: the
 * manifest of the library's Patch, the library sources, and the committed
 * configuration, exclusions and report files of this package.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { errorMessage, InputError, isRecord } from "./input-error.js";
import type { CoverageInput } from "./report.js";

/** The repository root, from `src/` in tests and `build/` when built. */
export const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));

/** The committed report files, relative to the repository root. */
export const REPORT_JSON_FILE = "wrapper-coverage/report.json";
export const REPORT_MARKDOWN_FILE = "wrapper-coverage/report.md";

/** The committed configuration files, relative to the repository root. */
export const WRAPPERS_FILE = "wrapper-coverage/wrappers.json";
export const EXCLUSIONS_FILE = "wrapper-coverage/exclusions.json";

const LIBRARY_DIR = "packages/reforged-ts";
const TYPINGS_DIR = "packages/reforged-types";

/**
 * The real inputs under `root`: the manifest is the one of the Game version
 * of the library's `reforged.patch`, so a new Patch moves it.
 */
export async function realInput(
  root: string = repositoryRoot,
): Promise<CoverageInput> {
  const libraryManifest = join(root, LIBRARY_DIR, "package.json");
  let patch: unknown;
  try {
    const json = JSON.parse(await readFile(libraryManifest, "utf8")) as unknown;
    patch = isRecord(json) && isRecord(json.reforged) && json.reforged.patch;
  } catch (error) {
    throw new InputError(
      `Cannot read the library's package.json: ${errorMessage(error)}`,
    );
  }
  const gameVersion =
    typeof patch === "string" ? /^\d+\.\d+\.\d+(?=\.\d+$)/.exec(patch) : null;
  if (gameVersion === null)
    throw new InputError(
      "The library's package.json has no `reforged.patch` Build.",
    );
  return {
    manifestFile: join(root, TYPINGS_DIR, gameVersion[0], "manifest.json"),
    sourceDir: join(root, LIBRARY_DIR, "src"),
    wrappersFile: join(root, WRAPPERS_FILE),
    exclusionsFile: join(root, EXCLUSIONS_FILE),
  };
}
