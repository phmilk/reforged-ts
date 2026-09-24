import { createHash } from "node:crypto";

/** The three Patch files vendored per Patch, under their lowercase canonical names. */
export const PATCH_FILES = ["common.j", "blizzard.j", "common.ai"] as const;

export type PatchFileName = (typeof PATCH_FILES)[number];

export interface FileRecord {
  sha256: string;
  bytes: number;
}

/**
 * Where a vendored Patch folder came from: the jass-history tag, the commit it
 * resolved to, and the sha256 and size of every stored file.
 */
export interface Provenance {
  /** Patch build, e.g. `3.0.0.24268`. */
  patch: string;
  /** jass-history tag, e.g. `Reforged-v3.0.0.24268-w3-3a9d8f2`. */
  tag: string;
  /** 40-hex commit the tag resolved to at download time. */
  commit: string;
  /** Upstream repository URL. */
  upstream: string;
  /** Folder inside the upstream repository holding the Patch files. */
  path: string;
  /** Download date, `YYYY-MM-DD` (UTC). */
  downloaded: string;
  files: Record<PatchFileName, FileRecord>;
}

export const PROVENANCE_FILE = "provenance.json";

export function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function fileRecord(bytes: Uint8Array): FileRecord {
  return { sha256: sha256(bytes), bytes: bytes.byteLength };
}

/** Serializes with a fixed key order, 2-space indent and a trailing LF. */
export function serializeProvenance(p: Provenance): string {
  const ordered: Provenance = {
    patch: p.patch,
    tag: p.tag,
    commit: p.commit,
    upstream: p.upstream,
    path: p.path,
    downloaded: p.downloaded,
    files: Object.fromEntries(
      PATCH_FILES.map((name) => [name, { sha256: p.files[name].sha256, bytes: p.files[name].bytes }]),
    ) as Provenance["files"],
  };
  return `${JSON.stringify(ordered, null, 2)}\n`;
}

/** Parses a provenance file, failing on any missing or malformed field. */
export function parseProvenance(text: string, source = PROVENANCE_FILE): Provenance {
  const fail = (what: string): never => {
    throw new Error(`${source}: ${what}`);
  };
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (error) {
    return fail(`not valid JSON (${(error as Error).message})`);
  }
  if (typeof data !== "object" || data === null) return fail("not a JSON object");
  const record = data as Record<string, unknown>;
  for (const key of ["patch", "tag", "commit", "upstream", "path", "downloaded"] as const) {
    if (typeof record[key] !== "string") fail(`field "${key}" must be a string`);
  }
  const files = record.files;
  if (typeof files !== "object" || files === null) return fail(`field "files" must be an object`);
  for (const name of PATCH_FILES) {
    const entry = (files as Record<string, unknown>)[name];
    if (typeof entry !== "object" || entry === null) return fail(`files["${name}"] is missing`);
    const { sha256: hash, bytes } = entry as Record<string, unknown>;
    if (typeof hash !== "string" || !/^[0-9a-f]{64}$/.test(hash)) {
      fail(`files["${name}"].sha256 must be 64 lowercase hex digits`);
    }
    if (typeof bytes !== "number" || !Number.isInteger(bytes) || bytes < 0) {
      fail(`files["${name}"].bytes must be a non-negative integer`);
    }
  }
  return record as unknown as Provenance;
}
