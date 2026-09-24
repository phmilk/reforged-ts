// Compiles the Lua-side runner to lua/ before the glue tests run, exactly as
// the package build does, so the fixtures load the artefact that ships.

import { fileURLToPath } from "node:url";
import ts from "typescript";
import tstl from "typescript-to-lua";

export default function compileRunner(): void {
  const project = fileURLToPath(
    new URL("../../runner/tsconfig.json", import.meta.url),
  );
  const { diagnostics } = tstl.transpileProject(project);
  const errors = diagnostics.filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  if (errors.length > 0) {
    throw new Error(
      ts.formatDiagnostics(errors, {
        getCanonicalFileName: (name) => name,
        getCurrentDirectory: () => process.cwd(),
        getNewLine: () => "\n",
      }),
    );
  }
}
