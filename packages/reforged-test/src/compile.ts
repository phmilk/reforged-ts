// Compiles a typescript-to-lua project from Node, for a vitest global setup
// that builds the tests before the glue runs them.

import { DiagnosticCategory, formatDiagnostics } from "typescript";
import { transpileProject } from "typescript-to-lua";

/**
 * Compiles the typescript-to-lua project of `tsconfigPath` and returns its
 * errors formatted as text, or "" when it compiled. typescript-to-lua's
 * warnings do not count. A relative path resolves against the current
 * working directory.
 */
export function compileLuaProject(tsconfigPath: string): string {
  const { diagnostics } = transpileProject(tsconfigPath);
  const errors = diagnostics.filter(
    (diagnostic) => diagnostic.category === DiagnosticCategory.Error,
  );
  return formatDiagnostics(errors, {
    getCanonicalFileName: (name) => name,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => "\n",
  });
}
