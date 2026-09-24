/**
 * `verify [patchDir]`: recomputes the sha256 and size of the Patch files of a
 * vendored Patch folder and compares them with its provenance file; without
 * an argument, of every Patch folder under the package's `vendor/`. Prints
 * one line per folder, plus one per problem. Exit codes: 0 when every folder
 * verifies, 1 otherwise.
 */
import { join } from "node:path";
import { verifyPatchDir, type VerifyResult } from "../vendor/index.js";
import {
  invokedDirectly,
  packageRoot,
  PROCESS_OUTPUT,
  vendoredPatchDirs,
  type Output,
} from "./common.js";

export async function main(
  args: readonly string[],
  output: Output,
): Promise<number> {
  const [patchDir] = args;
  return runVerify(
    patchDir
      ? [patchDir]
      : await vendoredPatchDirs(join(packageRoot, "vendor")),
    output,
  );
}

/** Verifies each Patch folder in turn; 0 when all verify, 1 otherwise. */
export async function runVerify(
  patchDirs: readonly string[],
  output: Output,
): Promise<number> {
  if (patchDirs.length === 0) {
    output.stderr("verify: no vendored Patch folder to verify\n");
    return 1;
  }
  let exitCode = 0;
  for (const dir of patchDirs) {
    let result: VerifyResult;
    try {
      result = await verifyPatchDir(dir);
    } catch (error) {
      output.stderr(`FAIL ${dir}: ${(error as Error).message}\n`);
      exitCode = 1;
      continue;
    }
    const { provenance, problems } = result;
    const { patch, tag, commit } = provenance;
    if (problems.length === 0) {
      output.stdout(`ok   ${patch} (${tag}, commit ${commit})\n`);
    } else {
      exitCode = 1;
      output.stderr(
        `FAIL ${patch} (${tag})\n` +
          problems.map((problem) => `  ${problem}\n`).join(""),
      );
    }
  }
  return exitCode;
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
