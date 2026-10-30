// The Studio's runtime file (#833, settling #468): `.reforged-studio.json`
// at the Map project's root, which `reforged-studio` writes while it runs
// and removes on a clean stop. Its reader lives here, with the rule for a
// live one, so that the Studio and the hover of this package's TypeScript
// plugin apply one rule: tsserver's API is synchronous and cannot probe a
// port, and a Studio that crashed may leave the file behind.

import fs from "node:fs";
import path from "node:path";

/** The Studio's runtime file, at the Map project's root: `.reforged-studio.json`, git-ignored. */
export const STUDIO_RUNTIME_FILE = ".reforged-studio.json";

/** The runtime file's format, in its `format` field. */
export const STUDIO_RUNTIME_FORMAT = 1;

/** What the Studio's runtime file holds, as UTF-8 JSON. */
export interface StudioRuntimeFile {
  /** The format, {@link STUDIO_RUNTIME_FORMAT}. */
  readonly format: typeof STUDIO_RUNTIME_FORMAT;
  /** The Studio's origin, `http://localhost:<port>`. */
  readonly url: string;
  /** The process the Studio runs in. */
  readonly pid: number;
  /** The map folder it edits, an absolute path. */
  readonly mapFolder: string;
  /** When it started listening, in ISO 8601. */
  readonly startedAt: string;
}

/** Whether a process runs: a signal-0 check, synchronous, which signals nothing. */
function isRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM: the process runs, as another user's.
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

/** A folder resolved through its links and, on Windows, lowercased, so that two spellings of it compare equal. */
function folderKey(folder: string): string {
  let resolved = path.resolve(folder);
  try {
    resolved = fs.realpathSync.native(resolved);
  } catch {
    // A folder that does not exist is compared as it is written.
  }
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

/**
 * Reads the Studio's runtime file of a Map project, and returns it when it
 * is live for a map folder: its `pid` a running process and its
 * `mapFolder` that folder, through links and, on Windows, without regard
 * to case.
 *
 * @param projectRoot - The Map project's root.
 * @param mapFolder - The map folder the reader reads.
 * @returns What the file holds, its `url` without a trailing slash;
 *   undefined when there is no file, it is not JSON of the format (format
 *   1, an `http:` or `https:` `url`, a positive integer `pid`, a string
 *   `mapFolder` and `startedAt`), its process has ended or it names
 *   another map folder.
 */
export function readLiveStudio(
  projectRoot: string,
  mapFolder: string,
): StudioRuntimeFile | undefined {
  let record: unknown;
  try {
    record = JSON.parse(
      fs.readFileSync(path.join(projectRoot, STUDIO_RUNTIME_FILE), "utf8"),
    );
  } catch {
    return undefined;
  }
  if (typeof record !== "object" || record === null) return undefined;
  const {
    format,
    url,
    pid,
    mapFolder: folder,
    startedAt,
  } = record as Record<string, unknown>;
  if (
    format !== STUDIO_RUNTIME_FORMAT ||
    typeof url !== "string" ||
    !/^https?:\/\//.test(url) ||
    typeof folder !== "string" ||
    typeof startedAt !== "string" ||
    typeof pid !== "number" ||
    !Number.isInteger(pid) ||
    pid <= 0
  ) {
    return undefined;
  }
  return isRunning(pid) && folderKey(folder) === folderKey(mapFolder)
    ? {
        format,
        url: url.replace(/\/+$/, ""),
        pid,
        mapFolder: folder,
        startedAt,
      }
    : undefined;
}
