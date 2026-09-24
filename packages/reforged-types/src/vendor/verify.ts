import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PATCH_FILES, PROVENANCE_FILE, parseProvenance, sha256, type Provenance } from "./provenance.js";

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
  const provenance = parseProvenance(await readFile(provenancePath, "utf8"), provenancePath);
  const problems: string[] = [];
  for (const name of PATCH_FILES) {
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
      problems.push(`${name}: sha256 ${actual} does not match recorded ${expected.sha256}`);
    }
    if (bytes.byteLength !== expected.bytes) {
      problems.push(`${name}: ${bytes.byteLength} bytes, recorded ${expected.bytes}`);
    }
  }
  return { patchDir, provenance, problems };
}

export interface VerifyOutput {
  log(line: string): void;
  error(line: string): void;
}

/**
 * The verify command: verifies each Patch folder, reports one line per folder
 * (plus one per problem) and returns the process exit code, 0 when every
 * folder verifies and 1 otherwise.
 */
export async function runVerify(patchDirs: readonly string[], out: VerifyOutput = console): Promise<number> {
  if (patchDirs.length === 0) {
    out.error("verify: no vendored Patch folder to verify");
    return 1;
  }
  let exitCode = 0;
  for (const dir of patchDirs) {
    let result: VerifyResult;
    try {
      result = await verifyPatchDir(dir);
    } catch (error) {
      out.error(`FAIL ${dir}: ${(error as Error).message}`);
      exitCode = 1;
      continue;
    }
    const { provenance, problems } = result;
    if (problems.length === 0) {
      out.log(`ok   ${provenance.patch} (${provenance.tag}, commit ${provenance.commit})`);
    } else {
      exitCode = 1;
      out.error(`FAIL ${provenance.patch} (${provenance.tag})`);
      for (const problem of problems) out.error(`  ${problem}`);
    }
  }
  return exitCode;
}
