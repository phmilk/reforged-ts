/**
 * The Template's copy of what the library shares (ADR 0024): the files the
 * library's `.claude/shared.json` names, the record of origin the Template
 * keeps beside them (`.claude/shared.lock.json`), and the comparison and
 * refresh the weekly skills workflow (`skills-update.yml`) runs on a
 * checkout of the library's default branch and one of the Template.
 *
 * The Template's `tests/pipeline/shared-skills.test.ts` holds its copy to
 * the record: every file the record names, with the sha256 of its bytes.
 */
import { createHash } from "node:crypto";
import {
  mkdir,
  readdir,
  readFile,
  rm,
  rmdir,
  writeFile,
} from "node:fs/promises";
import { dirname, join, posix } from "node:path";
import { byCodePoint } from "./order.js";
import type { Report } from "./patch-watch-report.js";
import { LIBRARY_REPOSITORY } from "./template-clone.js";
import { isRecord, isStringList } from "./unknown.js";

/** The library's list of what both repositories share, from its root. */
export const SHARED_LIST = ".claude/shared.json";
/** The Template's record of its copy, from its root. */
export const COPY_RECORD = ".claude/shared.lock.json";
/** The folder of the Agent skills, from either root. */
export const SKILLS_FOLDER = ".claude/skills";

/** The library's `.claude/shared.json`. */
export interface SharedList {
  /** The Upstream skills' lock; every skill it names is shared. */
  lock: string;
  /** The repository's own skills that are shared, by folder name. */
  skills: string[];
  /** Any other shared file, by its path from the root. */
  files: string[];
}

/** The Template's `.claude/shared.lock.json`. */
export interface CopyRecord {
  $comment: string;
  /** The library, `owner/name`. */
  repository: string;
  /** The library commit the copy came from, 40 hex digits. */
  commit: string;
  /** The sha256 of each copied file's bytes, by its path from the root. */
  files: Record<string, string>;
}

/** How the Template's copy differs from the library, by path, each sorted. */
export interface CopyDifference {
  /** Shared by the library, absent from the record. */
  added: string[];
  /** In the record, no longer shared by the library. */
  removed: string[];
  /** In both, with other bytes in the Template or in its record. */
  modified: string[];
}

/** The library's list of what is shared, read from its root. */
export async function readSharedList(libraryRoot: string): Promise<SharedList> {
  const parsed: unknown = JSON.parse(
    await readFile(join(libraryRoot, SHARED_LIST), "utf8"),
  );
  if (
    !isRecord(parsed) ||
    typeof parsed.lock !== "string" ||
    !isStringList(parsed.skills) ||
    !isStringList(parsed.files)
  ) {
    throw new Error(
      `${SHARED_LIST} is not { lock: string, skills: string[], files: string[] }.`,
    );
  }
  return { lock: parsed.lock, skills: parsed.skills, files: parsed.files };
}

/** The Template's record of its copy, read from its root. */
export async function readCopyRecord(
  templateRoot: string,
): Promise<CopyRecord> {
  const text = await readFile(join(templateRoot, COPY_RECORD), "utf8").catch(
    (error: unknown) => {
      throw new Error(
        `The Template has no record of its copy at ${COPY_RECORD}: the first copy is made by hand (ADR 0024).`,
        { cause: error },
      );
    },
  );
  const parsed: unknown = JSON.parse(text);
  if (
    !isRecord(parsed) ||
    typeof parsed.$comment !== "string" ||
    typeof parsed.repository !== "string" ||
    typeof parsed.commit !== "string" ||
    !isRecord(parsed.files) ||
    !Object.values(parsed.files).every((hash) => typeof hash === "string")
  ) {
    throw new Error(
      `${COPY_RECORD} is not { $comment, repository, commit, files: { <path>: <sha256> } }.`,
    );
  }
  return {
    $comment: parsed.$comment,
    repository: parsed.repository,
    commit: parsed.commit,
    files: parsed.files as Record<string, string>,
  };
}

/** The files under `folder` of `root`, by their `/`-separated path from `root`. */
async function filesUnder(root: string, folder: string): Promise<string[]> {
  const entries = await readdir(join(root, folder), { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = posix.join(folder, entry.name);
      if (entry.isDirectory()) return filesUnder(root, path);
      return entry.isFile() ? [path] : [];
    }),
  );
  return nested.flat();
}

/**
 * Every file the library shares, by its path from its root, in code-point
 * order: the lock, every file of each skill folder the lock names and of
 * each shared repository skill, and the other shared files.
 */
export async function sharedFiles(libraryRoot: string): Promise<string[]> {
  const list = await readSharedList(libraryRoot);
  const lock: unknown = JSON.parse(
    await readFile(join(libraryRoot, list.lock), "utf8"),
  );
  if (!isRecord(lock) || !isRecord(lock.skills)) {
    throw new Error(`${list.lock} has no skills.`);
  }
  const folders = [...Object.keys(lock.skills), ...list.skills].map((name) =>
    posix.join(SKILLS_FOLDER, name),
  );
  const inFolders = await Promise.all(
    folders.map((folder) => filesUnder(libraryRoot, folder)),
  );
  return [...new Set([list.lock, ...inFolders.flat(), ...list.files])].sort(
    byCodePoint,
  );
}

const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

/** The sha256 of each file of `paths` under `root`; a missing file has none. */
async function hashes(
  root: string,
  paths: readonly string[],
): Promise<Map<string, string>> {
  const pairs = await Promise.all(
    paths.map(async (path) => {
      const bytes = await readFile(join(root, path)).catch(() => undefined);
      return bytes === undefined ? [] : [[path, sha256(bytes)] as const];
    }),
  );
  return new Map(pairs.flat());
}

/** The library's shared files and the sha256 of each, in code-point order. */
export async function libraryFiles(
  libraryRoot: string,
): Promise<Record<string, string>> {
  const paths = await sharedFiles(libraryRoot);
  const found = await hashes(libraryRoot, paths);
  const missing = paths.filter((path) => !found.has(path));
  if (missing.length > 0) {
    throw new Error(
      `${SHARED_LIST} names files that do not exist: ${missing.join(", ")}.`,
    );
  }
  return Object.fromEntries(paths.map((path) => [path, found.get(path) ?? ""]));
}

/**
 * How the Template's copy differs from the library's `files`: a path is
 * modified when the Template's file or its record holds other bytes than the
 * library's, so a copy edited in the Template is restored too.
 */
export async function compareCopy(
  files: Readonly<Record<string, string>>,
  templateRoot: string,
  record: CopyRecord,
): Promise<CopyDifference> {
  const recorded = Object.keys(record.files);
  const onDisk = await hashes(templateRoot, recorded);
  const shared = Object.keys(files);
  return {
    added: shared.filter((path) => !Object.hasOwn(record.files, path)),
    removed: recorded
      .filter((path) => !Object.hasOwn(files, path))
      .sort(byCodePoint),
    modified: shared.filter(
      (path) =>
        Object.hasOwn(record.files, path) &&
        (record.files[path] !== files[path] ||
          onDisk.get(path) !== files[path]),
    ),
  };
}

/** Whether a difference has nothing in it. */
export const isSame = ({ added, removed, modified }: CopyDifference): boolean =>
  added.length + removed.length + modified.length === 0;

/** The record as the Template commits it: two-space JSON and a newline. */
export const formatRecord = (record: CopyRecord): string =>
  `${JSON.stringify(record, null, 2)}\n`;

/** Removes `path` under `root`, then each folder above it left empty. */
async function remove(root: string, path: string): Promise<void> {
  await rm(join(root, path), { force: true });
  for (
    let folder = posix.dirname(path);
    folder !== ".";
    folder = posix.dirname(folder)
  ) {
    const left = await readdir(join(root, folder)).catch(() => undefined);
    if (left === undefined || left.length > 0) return;
    await rmdir(join(root, folder));
  }
}

/** What `refreshCopy` found and did. */
export interface CopyRefresh {
  difference: CopyDifference;
  /** The record it wrote; absent when the copy was the library's already. */
  record?: CopyRecord;
}

/**
 * Brings the Template's copy at `templateRoot` to the library's files at
 * `libraryRoot`, a checkout of `commit`, when they differ: deletes what the
 * library no longer shares, writes every shared file's bytes and rewrites
 * the record's `commit` and `files`, keeping its `$comment`. Writes nothing
 * when they are the same, whatever commit the record names.
 */
export async function refreshCopy(
  libraryRoot: string,
  templateRoot: string,
  commit: string,
): Promise<CopyRefresh> {
  if (!/^[0-9a-f]{40}$/.test(commit)) {
    throw new Error(`${commit} is not a full commit hash of the library.`);
  }
  const files = await libraryFiles(libraryRoot);
  const current = await readCopyRecord(templateRoot);
  const difference = await compareCopy(files, templateRoot, current);
  if (isSame(difference)) return { difference };

  for (const path of difference.removed) await remove(templateRoot, path);
  for (const path of [...difference.added, ...difference.modified]) {
    const target = join(templateRoot, path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, await readFile(join(libraryRoot, path)));
  }
  const record: CopyRecord = {
    $comment: current.$comment,
    repository: LIBRARY_REPOSITORY,
    commit,
    files,
  };
  await writeFile(join(templateRoot, COPY_RECORD), formatRecord(record));
  return { difference, record };
}

/** The Template's pull request, from a refresh that changed the copy. */
export function copyPullRequest(
  difference: CopyDifference,
  commit: string,
  runUrl?: string,
): Report {
  const short = commit.slice(0, 8);
  const commitUrl = `https://github.com/${LIBRARY_REPOSITORY}/commit/${commit}`;
  const section = (heading: string, paths: readonly string[]): string[] =>
    paths.length === 0
      ? []
      : [
          `<details><summary>${heading} (${String(paths.length)})</summary>`,
          "",
          ...paths.map((path) => `- \`${path}\``),
          "",
          "</details>",
          "",
        ];
  const body = [
    `The copy of what the library shares, brought to [${LIBRARY_REPOSITORY}@${short}](${commitUrl}), whose \`${SHARED_LIST}\` names it (ADR 0024 of the library). \`${COPY_RECORD}\` records the commit and each file's sha256; \`tests/pipeline/shared-skills.test.ts\` checks the copy against it.`,
    "",
    "A change to a shared file is reviewed in the library: this pull request only carries it here. Never edit the copy on this branch; the next run replaces it.",
    "",
    ...section("Added", difference.added),
    ...section("Modified", difference.modified),
    ...section("Removed", difference.removed),
    ...(runUrl === undefined
      ? []
      : [`Opened by the library's skills update: ${runUrl}`, ""]),
  ].join("\n");
  return {
    title: `chore(skills): the copy of what the library shares, from ${LIBRARY_REPOSITORY}@${short}`,
    body,
  };
}
