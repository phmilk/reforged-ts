import {
  flattenDiagnosticMessageText,
  getParsedCommandLineOfConfigFile,
  sys,
} from "typescript";
import { describe, expect, it } from "vitest";

import { root } from "./repository.js";

// The compiler options a tsconfig.json takes effect with, its `extends`
// resolved, as tsc and typescript-to-lua read them.
function effectiveOptions(path: string): Record<string, unknown> {
  const errors: string[] = [];
  const parsed = getParsedCommandLineOfConfigFile(`${root}${path}`, undefined, {
    ...sys,
    onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
      errors.push(flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
    },
  });
  if (!parsed || errors.length > 0) {
    throw new Error(`${path}: ${errors.join("\n")}`);
  }
  return parsed.options;
}

describe("packages/reforged-ts/tsconfig.json", () => {
  it("fails the build on an unused parameter", () => {
    // A setter that never reads its value (#256, #315):
    // @typescript-eslint/no-unused-vars skips setter parameters, so the
    // compiler is the only check that sees one.
    expect(
      effectiveOptions("packages/reforged-ts/tsconfig.json").noUnusedParameters,
      "noUnusedParameters in the library's effective compiler options",
    ).toBe(true);
  });
});
