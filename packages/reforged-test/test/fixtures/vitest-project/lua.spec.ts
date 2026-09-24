// The vitest file a Map project writes: one call to the glue. The outer test
// (test/map.test.ts) runs vitest on this project and provides the outDir.

import { inject } from "vitest";
import { runLuaTests } from "../../../src/index.js";

declare module "vitest" {
  export interface ProvidedContext {
    outDir: string;
  }
}

runLuaTests({ outDir: inject("outDir") });
