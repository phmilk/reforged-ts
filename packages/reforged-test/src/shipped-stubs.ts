// The Shipped stubs as the glue runs them, shared with the test that holds
// their declarations (reforged-test/stubs) to the Lua.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Chunk } from "./lua-state.js";

const STUBS_DIR = fileURLToPath(new URL("../stubs/", import.meta.url));
const BASE_STUB = "base.lua";
// The generated file of the Natives without a Stub: it defines only what no
// Shipped stub did, so it runs after all of them.
const UNSTUBBED_FILE = "unstubbed.lua";

/**
 * The Shipped stubs in the order the glue runs them: base.lua, the others
 * sorted, then unstubbed.lua.
 */
export function shippedStubs(): Chunk[] {
  const others = readdirSync(STUBS_DIR)
    .filter(
      (file) =>
        file.endsWith(".lua") && file !== BASE_STUB && file !== UNSTUBBED_FILE,
    )
    .sort();
  return [BASE_STUB, ...others, UNSTUBBED_FILE].map((file) => ({
    name: `reforged-test/stubs/${file}`,
    source: readFileSync(join(STUBS_DIR, file), "utf8"),
  }));
}
