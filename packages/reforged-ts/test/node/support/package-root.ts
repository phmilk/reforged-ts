// The root of the reforged-ts package (the folder holding its package.json),
// as an absolute path with a trailing separator, for the Node support
// modules that read the package's own files or run tools from it.

import { fileURLToPath } from "node:url";

export const packageRoot = fileURLToPath(new URL("../../../", import.meta.url));
