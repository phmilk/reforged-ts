// Compiles the Lua-side runner to lua/ before the glue tests run, exactly as
// the package build does, so the fixtures load the artefact that ships.

import { fileURLToPath } from "node:url";
import { compileLuaProject } from "../../src/compile.js";

export default function compileRunner(): void {
  const errors = compileLuaProject(
    fileURLToPath(new URL("../../runner/tsconfig.json", import.meta.url)),
  );
  if (errors !== "") throw new Error(errors);
}
