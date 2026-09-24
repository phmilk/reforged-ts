/** @noSelfInFile */

// The map header load position with a `_G` metatable the map installed
// ahead of the library, as an undeclared-global warner does: it logs the
// reads of absent globals and the writes of new ones on `mapMetatableLog`
// and does the write itself with a raw set. A test imports this file ahead
// of the library, and compares `getmetatable(_G)` with `mapMetatable`.

import { defineEditorScript } from "./editor-script";

export { editorLog } from "./editor-script";

/** What the map's metatable saw, in order: `read key` or `write key`. */
export const mapMetatableLog: string[] = [];

/** The map's metatable of `_G`, installed before the library loads. */
export const mapMetatable = {
  __index: (_table: Record<string, unknown>, key: string) => {
    mapMetatableLog.push(`read ${key}`);
    return undefined;
  },
  __newindex: (table: Record<string, unknown>, key: string, value: unknown) => {
    mapMetatableLog.push(`write ${key}`);
    rawset(table, key, value);
  },
};

defineEditorScript(["InitBlizzard", "InitGlobals", "MarkGameStarted"]);
setmetatable(_G, mapMetatable);
