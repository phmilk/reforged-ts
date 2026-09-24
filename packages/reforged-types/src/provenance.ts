/**
 * The provenance file of a vendored Patch folder (`provenance.json`), written
 * by the vendor step. The generator reads it for the banner and the output
 * folder.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Diagnostic } from "./diagnostics.js";

export const PROVENANCE_FILE = "provenance.json";

export interface Provenance {
  /** Full build, e.g. `3.0.0.24268`. */
  patch: string;
  /** jass-history tag the files were taken from. */
  tag: string;
  commit: string;
  upstream: string;
  path: string;
  downloaded: string;
  files: Record<string, { sha256: string; bytes: number }>;
}

/** The fields the generator relies on, checked when read. */
export type PatchIdentity = Pick<Provenance, "patch" | "tag" | "commit">;

export async function readPatchIdentity(
  patchDir: string
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
  const record = (
    typeof json === "object" && json !== null ? json : {}
  ) as Record<string, unknown>;
  const { patch, tag, commit } = record;
  if (typeof patch !== "string" || !/^\d+\.\d+\.\d+\.\d+$/.test(patch)) {
    return fail("patch must be a four-part build such as 3.0.0.24268");
  }
  if (typeof tag !== "string" || tag === "")
    return fail("tag must be a jass-history tag");
  if (typeof commit !== "string" || !/^[0-9a-f]{40}$/.test(commit)) {
    return fail("commit must be a 40-character commit hash");
  }
  return { identity: { patch, tag, commit }, diagnostics: [] };
}

/** The game version a build belongs to: its first three components. */
export function gameVersion(patch: string): string {
  return patch.split(".").slice(0, 3).join(".");
}
