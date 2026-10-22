/**
 * A tar reader for the Template's archive, with no dependency: the GitHub
 * tarball of a ref, or one `git archive` writes. It reads ustar headers,
 * pax and GNU long names, files and folders; any other entry, a link among
 * them, is an error, since the Template holds none.
 */
import { chmod, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { gunzipSync } from "node:zlib";

/** An archive that cannot be read as a tar, or holds what the reader refuses. */
export class ArchiveError extends Error {
  override name = "ArchiveError";
}

/** A file or folder of an archive, its path `/`-separated. */
export interface ArchiveEntry {
  path: string;
  kind: "file" | "folder";
  /** The file's bytes; empty for a folder. */
  content: Uint8Array;
  /** Whether the file is executable by its owner. */
  executable: boolean;
}

const BLOCK = 512;

/** The entries of `bytes`, a tar archive, gzipped or not. */
export function readArchive(bytes: Uint8Array): ArchiveEntry[] {
  let archive: Uint8Array;
  try {
    archive =
      bytes[0] === 0x1f && bytes[1] === 0x8b
        ? new Uint8Array(gunzipSync(bytes))
        : bytes;
  } catch (error) {
    throw new ArchiveError("it is not a valid gzip file", { cause: error });
  }
  const entries: ArchiveEntry[] = [];
  // The path of the next entry, from a pax header or a GNU long name.
  let nextPath: string | undefined;
  let offset = 0;
  for (;;) {
    // Some writers leave out the two zero blocks that end an archive.
    if (offset === archive.length) break;
    if (offset + BLOCK > archive.length) {
      throw new ArchiveError("it ends before its last entry");
    }
    const header = archive.subarray(offset, offset + BLOCK);
    if (header.every((byte) => byte === 0)) break;
    const text = (start: number, length: number) =>
      Buffer.from(header.subarray(start, start + length))
        .toString("utf8")
        .replace(/\0.*$/s, "");
    const octal = (start: number, length: number) =>
      parseInt(text(start, length).trim() || "0", 8);
    if (!checksumMatches(header)) {
      throw new ArchiveError(
        `the header at byte ${String(offset)} is not a tar header`,
      );
    }
    const size = octal(124, 12);
    const type = text(156, 1);
    const start = offset + BLOCK;
    if (start + size > archive.length) {
      throw new ArchiveError("it ends before its last entry");
    }
    const content = archive.subarray(start, start + size);
    offset = start + Math.ceil(size / BLOCK) * BLOCK;
    if (type === "g") continue;
    if (type === "x") {
      nextPath = paxPath(Buffer.from(content).toString("utf8")) ?? nextPath;
      continue;
    }
    if (type === "L") {
      nextPath = Buffer.from(content).toString("utf8").replace(/\0.*$/s, "");
      continue;
    }
    const prefix = text(345, 155);
    const path = nextPath ?? (prefix === "" ? "" : `${prefix}/`) + text(0, 100);
    nextPath = undefined;
    if (type === "0" || type === "") {
      const executable = (octal(100, 8) & 0o100) !== 0;
      entries.push({ path, kind: "file", content, executable });
    } else if (type === "5") {
      entries.push({
        path: path.replace(/\/$/, ""),
        kind: "folder",
        content: new Uint8Array(),
        executable: false,
      });
    } else {
      throw new ArchiveError(
        `${path} is an entry of type '${type}', which the reader refuses`,
      );
    }
  }
  return entries;
}

/**
 * Writes the entries of the archive `bytes` into `folder`, without the one
 * top-level folder that holds them all, as GitHub's tarball of a ref and
 * `git archive --prefix` write it. Throws an `ArchiveError` on an archive
 * with no such folder, no file, or a path that leaves it.
 */
export async function extractArchive(
  bytes: Uint8Array,
  folder: string,
): Promise<void> {
  const entries = readArchive(bytes);
  const tops = new Set(entries.map(({ path }) => path.split("/")[0]));
  if (tops.size !== 1) {
    throw new ArchiveError("it does not hold one top-level folder");
  }
  let files = 0;
  for (const entry of entries) {
    const segments = entry.path.split("/").slice(1);
    if (segments.length === 0 || segments.every((segment) => segment === "")) {
      continue;
    }
    if (segments.some((segment) => segment === ".." || segment === "")) {
      throw new ArchiveError(`${entry.path} is not a path inside the archive`);
    }
    const target = join(folder, ...segments);
    if (entry.kind === "folder") {
      await mkdir(target, { recursive: true });
      continue;
    }
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, entry.content);
    if (entry.executable) await chmod(target, 0o755);
    files++;
  }
  if (files === 0) throw new ArchiveError("it holds no file");
}

/** Whether the header's checksum field matches its bytes. */
function checksumMatches(header: Uint8Array): boolean {
  let sum = 0;
  for (let i = 0; i < BLOCK; i++) {
    // The checksum field counts as eight spaces.
    sum += i >= 148 && i < 156 ? 0x20 : (header[i] ?? 0);
  }
  const field = Buffer.from(header.subarray(148, 156))
    .toString("latin1")
    .replace(/[\0 ]+$/, "")
    .trim();
  return field !== "" && parseInt(field, 8) === sum;
}

/** The `path` record of a pax extended header, when it holds one. */
function paxPath(records: string): string | undefined {
  // Each record is `<length> <key>=<value>\n`.
  for (const record of records.split("\n")) {
    const match = /^\d+ path=(.*)$/s.exec(record);
    if (match !== null) return match[1];
  }
  return undefined;
}
