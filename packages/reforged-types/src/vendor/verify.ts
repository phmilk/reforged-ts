/**
 * Checks a vendored Patch folder against its provenance file: every Patch
 * file present, with the recorded sha256 and size.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SOURCES } from "../model.js";
import {
  parseProvenance,
  PROVENANCE_FILE,
  sha256,
  type Provenance,
} from "../provenance.js";

export interface VerifyResult {
  patchDir: string;
  provenance: Provenance;
  /** One line per mismatch or missing file; empty when the folder verifies. */
  problems: string[];
}

/**
 * Recomputes the sha256 and byte size of every Patch file in a vendored Patch
 * folder and compares them with its provenance file. Throws when the
 * provenance file itself is missing or malformed.
 */
export async function verifyPatchDir(patchDir: string): Promise<VerifyResult> {
  const provenancePath = join(patchDir, PROVENANCE_FILE);
  const provenance = parseProvenance(
    await readFile(provenancePath, "utf8"),
    provenancePath,
  );
  const problems: string[] = [];
  for (const name of SOURCES) {
    const expected = provenance.files[name];
    let bytes: Uint8Array;
    try {
      bytes = await readFile(join(patchDir, name));
    } catch {
      problems.push(`${name}: missing`);
      continue;
    }
    const actual = sha256(bytes);
    if (actual !== expected.sha256) {
      problems.push(
        `${name}: sha256 ${actual} does not match recorded ${expected.sha256}`,
      );
    }
    if (bytes.byteLength !== expected.bytes) {
      problems.push(
        `${name}: ${bytes.byteLength} bytes, recorded ${expected.bytes}`,
      );
    }
  }
  return { patchDir, provenance, problems };
}
