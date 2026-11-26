// The build's last step: expands every `{@includeCode}` of the emitted
// declarations into a fenced block holding the included code, so a Map
// project author hovering a symbol in the editor reads the example rather
// than the tag. TypeDoc resolves the tag for the docs site from the sources,
// which keep it; this reads the same forms TypeDoc reads (a whole file, one
// or more `#regions`, `:line` ranges), the path relative to the source file
// holding the comment. An include whose file, region or lines do not exist
// fails the build. Exit code 0 when every declaration file was expanded, 1
// on an include that cannot be, 2 on arguments.
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  expandDeclarations,
  IncludeCodeError,
} from "./include-code-reader.mts";

export {
  expandDeclarations,
  expandIncludeCode,
  IncludeCodeError,
  includedCode,
  type IncludedCode,
} from "./include-code-reader.mts";

export interface Output {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

export const PROCESS_OUTPUT: Output = {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
};

export async function main(
  args: readonly string[],
  output: Output,
): Promise<number> {
  const [declarationsDir, sourcesDir, ...rest] = args;
  if (
    declarationsDir === undefined ||
    sourcesDir === undefined ||
    rest.length > 0
  ) {
    output.stderr(
      "Usage: include-code.mts <declarations folder> <sources folder>\n",
    );
    return 2;
  }
  try {
    const expanded = await expandDeclarations(declarationsDir, sourcesDir);
    output.stdout(
      `include-code: {@includeCode} expanded in ${String(expanded.length)} declaration files.\n`,
    );
    return 0;
  } catch (error) {
    if (!(error instanceof IncludeCodeError)) throw error;
    output.stderr(`include-code: ${error.message}\n`);
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
