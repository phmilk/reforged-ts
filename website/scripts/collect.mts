// docs:collect, run before every build and every version cut: populates the
// generated parts of the docs tree from their sources of truth (#40), the
// list in sources.mts. Exit code 0 when every source was collected or
// skipped with its reason, 1 when one is missing or wrong, 2 on arguments.
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { collect, CollectError, type CollectOptions } from "./collector.mts";
import { SOURCES } from "./sources.mts";

export interface Output {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

const PROCESS_OUTPUT: Output = {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
};

/** This repository, its docs tree and the sources of sources.mts. */
export const WORKSPACE: CollectOptions = {
  root: fileURLToPath(new URL("../../", import.meta.url)),
  docs: fileURLToPath(new URL("../docs/", import.meta.url)),
  sources: SOURCES,
};

export async function main(
  args: readonly string[],
  output: Output,
  workspace: CollectOptions = WORKSPACE,
): Promise<number> {
  if (args.length > 0) {
    output.stderr("Usage: docs:collect (no arguments)\n");
    return 2;
  }
  try {
    const report = await collect(workspace);
    const lines = [
      ...report.collected.map(
        ({ source, paths }) => `collected ${source}: ${paths.join(", ")}`,
      ),
      ...report.skipped.map(
        ({ source, reason }) => `skipped ${source}: ${reason}`,
      ),
    ];
    output.stdout(
      `docs:collect: ${String(report.collected.length)} sources collected, ${String(report.skipped.length)} skipped.\n${lines.map((line) => `  ${line}\n`).join("")}`,
    );
    return 0;
  } catch (error) {
    if (!(error instanceof CollectError)) throw error;
    output.stderr(`${error.message}\n`);
    return 1;
  }
}

const script = process.argv.at(1);
if (
  script !== undefined &&
  pathToFileURL(resolve(script)).href === import.meta.url
) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
