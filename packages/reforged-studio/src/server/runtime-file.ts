/**
 * The Studio's runtime file (#833, settling #468): `.reforged-studio.json`
 * at the Map project's root, one per Map project, which says that a
 * Studio runs, where, and on which map folder. The Studio writes it once
 * its server listens and removes it on a clean stop; a second Studio on the
 * same map folder reads it to open the first one's URL instead of starting,
 * and the hover of `reforged-map`'s TypeScript plugin reads it for its
 * "Open in the Studio" link, with the same rule for a live one.
 */
import fs from "node:fs";
import path from "node:path";

/** The runtime file's name, at the Map project's root: `.reforged-studio.json`, git-ignored. */
export const STUDIO_RUNTIME_FILE = ".reforged-studio.json";

/** The runtime file's format, in its `format` field. */
export const STUDIO_RUNTIME_FORMAT = 1;

/** What the runtime file holds, as UTF-8 JSON. */
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

/** Whether a process runs: a signal-0 check, which signals nothing. */
function isRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM: the process runs, as another user's.
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

/** Whether two paths name the same folder, through links and, on Windows, without regard to case. */
function sameFolder(a: string, b: string): boolean {
  const normalize = (folder: string): string => {
    let resolved = path.resolve(folder);
    try {
      resolved = fs.realpathSync.native(resolved);
    } catch {
      // A folder that does not exist is compared as it is written.
    }
    return process.platform === "win32" ? resolved.toLowerCase() : resolved;
  };
  return normalize(a) === normalize(b);
}

/**
 * The runtime file of a Map project when it is live for a map folder: its
 * `pid` is a running process and its `mapFolder` is that folder.
 *
 * @param projectRoot - The Map project's root.
 * @param mapFolder - The map folder.
 * @returns The record; undefined when there is no file, it cannot be read
 *   as the format, its process has ended or it names another map folder.
 */
export function liveStudio(
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
  } = record as Record<string, unknown>;
  if (
    format !== STUDIO_RUNTIME_FORMAT ||
    typeof url !== "string" ||
    typeof folder !== "string" ||
    typeof pid !== "number" ||
    !Number.isInteger(pid) ||
    pid <= 0
  ) {
    return undefined;
  }
  return isRunning(pid) && sameFolder(folder, mapFolder)
    ? (record as StudioRuntimeFile)
    : undefined;
}

/**
 * Writes the runtime file of a running Studio, replacing the one there.
 *
 * @param projectRoot - The Map project's root.
 * @param record - What it holds.
 */
export function writeRuntimeFile(
  projectRoot: string,
  record: StudioRuntimeFile,
): void {
  fs.writeFileSync(
    path.join(projectRoot, STUDIO_RUNTIME_FILE),
    `${JSON.stringify(record, null, 2)}\n`,
    "utf8",
  );
}

/**
 * Removes the runtime file of a Studio that stops, when it is still that
 * Studio's: a Studio started on another map folder since then replaced it,
 * and keeps it.
 *
 * @param projectRoot - The Map project's root.
 * @param record - What the stopping Studio wrote.
 */
export function removeRuntimeFile(
  projectRoot: string,
  record: StudioRuntimeFile,
): void {
  const file = path.join(projectRoot, STUDIO_RUNTIME_FILE);
  try {
    const current = JSON.parse(fs.readFileSync(file, "utf8")) as Partial<
      Record<keyof StudioRuntimeFile, unknown>
    >;
    if (current.pid !== record.pid || current.url !== record.url) return;
    fs.rmSync(file, { force: true });
  } catch {
    // No file, or one that is not this Studio's record: nothing to remove.
  }
}
