// The Studio's runtime file, as the hover reads it (#833): the
// `.reforged-studio.json` that `reforged-studio` writes at the Map
// project's root while it runs, `{ "format": 1, "url", "pid", "mapFolder",
// "startedAt" }`. tsserver's API is synchronous and cannot probe a port, so
// the file is how the plugin knows a Studio runs (#468). It is live only
// when its `pid` is a running process and its `mapFolder` is the folder the
// plugin reads; a Studio that crashed may leave it, and then it is not.

import fs from "node:fs";
import path from "node:path";
import { DEFAULT_MIN_INTERVAL } from "../lookup.js";

/** The runtime file's name, at the Map project's root. */
export const STUDIO_RUNTIME_FILE = ".reforged-studio.json";

/** A live Studio on the map folder the plugin reads: its origin. */
export interface LiveStudio {
  /** Its origin, `http://localhost:<port>`. */
  readonly url: string;
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
 * The live Studio a Map project's runtime file names for a map folder, read
 * now.
 *
 * @param root - The Map project's root.
 * @param mapFolder - The map folder the plugin reads.
 * @returns The Studio; undefined when there is no file, it is not of
 *   format 1, its process has ended or it names another map folder.
 */
export function readLiveStudio(
  root: string,
  mapFolder: string,
): LiveStudio | undefined {
  let record: unknown;
  try {
    record = JSON.parse(
      fs.readFileSync(path.join(root, STUDIO_RUNTIME_FILE), "utf8"),
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
  } = record as Record<string, unknown>;
  if (
    format !== 1 ||
    typeof url !== "string" ||
    !/^https?:\/\//.test(url) ||
    typeof folder !== "string" ||
    typeof pid !== "number" ||
    !Number.isInteger(pid) ||
    pid <= 0
  ) {
    return undefined;
  }
  return isRunning(pid) && folderKey(folder) === folderKey(mapFolder)
    ? { url: url.replace(/\/+$/, "") }
    : undefined;
}

/**
 * The live Studio of a Map project's map folder, read again at most once
 * per `minInterval`, as the lookup checks its files.
 *
 * @param root - The Map project's root.
 * @param minInterval - The minimum interval between two reads, in
 *   milliseconds.
 * @returns A function of the map folder giving its live Studio, undefined
 *   when none holds it.
 */
export function liveStudioReader(
  root: string,
  minInterval: number = DEFAULT_MIN_INTERVAL,
): (mapFolder: string) => LiveStudio | undefined {
  let last:
    | { at: number; mapFolder: string; studio: LiveStudio | undefined }
    | undefined;
  return (mapFolder) => {
    const now = Date.now();
    if (
      last?.mapFolder !== mapFolder ||
      now < last.at ||
      now - last.at >= minInterval
    ) {
      last = { at: now, mapFolder, studio: readLiveStudio(root, mapFolder) };
    }
    return last.studio;
  };
}
