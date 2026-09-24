/**
 * The provenance file of a vendored Patch folder (`provenance.json`): where
 * its Patch files came from, and the sha256 and size of each. The vendor step
 * writes it and `verify` checks the files against it; the generator reads
 * only the Patch's identity from it, for the banner and the output folder.
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { isBuild, isCommit } from "./build.js";
import type { Diagnostic } from "./diagnostics.js";
import { SOURCES, type SourceName } from "./model.js";

export const PROVENANCE_FILE = "provenance.json";

export interface FileRecord {
  sha256: string;
  bytes: number;
}

export interface Provenance {
  /** The Build, e.g. `3.0.0.24268`. */
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
  files: Record<SourceName, FileRecord>;
}

/** The fields the generator relies on. */
export type PatchIdentity = Pick<Provenance, "patch" | "tag" | "commit">;

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
      SOURCES.map((name) => [
        name,
        { sha256: p.files[name].sha256, bytes: p.files[name].bytes },
      ]),
    ) as Provenance["files"],
  };
  return `${JSON.stringify(ordered, null, 2)}\n`;
}

/**
 * Parses a whole provenance file, throwing on any missing or malformed
 * field; `source` names the file in the error.
 */
export function parseProvenance(
  text: string,
  source = PROVENANCE_FILE,
): Provenance {
  const fail = (what: string): never => {
    throw new Error(`${source}: ${what}`);
  };
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (error) {
    return fail(`not valid JSON (${(error as Error).message})`);
  }
  if (typeof data !== "object" || data === null) {
    return fail("not a JSON object");
  }
  const record = data as Record<string, unknown>;
  for (const key of [
    "patch",
    "tag",
    "commit",
    "upstream",
    "path",
    "downloaded",
  ] as const) {
    if (typeof record[key] !== "string") {
      fail(`field "${key}" must be a string`);
    }
  }
  const identity = parseIdentity(record);
  if (typeof identity === "string") fail(identity);
  const files = record.files;
  if (typeof files !== "object" || files === null) {
    return fail(`field "files" must be an object`);
  }
  for (const name of SOURCES) {
    const entry = (files as Record<string, unknown>)[name];
    if (typeof entry !== "object" || entry === null) {
      return fail(`files["${name}"] is missing`);
    }
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

/**
 * Reads only the Patch's identity from the provenance file of `patchDir`,
 * reporting a problem as a diagnostic: the generator needs no more of it.
 */
export async function readPatchIdentity(
  patchDir: string,
): Promise<{ identity?: PatchIdentity; diagnostics: Diagnostic[] }> {
  const fail = (problem: string) => ({
    diagnostics: [
      {
        severity: "error" as const,
        kind: "patch-invalid" as const,
        file: PROVENANCE_FILE,
        message: `${PROVENANCE_FILE}: ${problem}`,
      },
    ],
  });

  let json: unknown;
  try {
    json = JSON.parse(await readFile(join(patchDir, PROVENANCE_FILE), "utf8"));
  } catch (error) {
    return fail(`cannot read the provenance file: ${(error as Error).message}`);
  }
  const identity = parseIdentity(
    (typeof json === "object" && json !== null ? json : {}) as Record<
      string,
      unknown
    >,
  );
  return typeof identity === "string"
    ? fail(identity)
    : { identity, diagnostics: [] };
}

/** The identity fields of a provenance record, or the first problem. */
function parseIdentity(
  record: Record<string, unknown>,
): PatchIdentity | string {
  const { patch, tag, commit } = record;
  if (typeof patch !== "string" || !isBuild(patch)) {
    return "patch must be a four-part build such as 3.0.0.24268";
  }
  if (typeof tag !== "string" || tag === "") {
    return "tag must be a jass-history tag";
  }
  if (typeof commit !== "string" || !isCommit(commit)) {
    return "commit must be a 40-character commit hash";
  }
  return { patch, tag, commit };
}
