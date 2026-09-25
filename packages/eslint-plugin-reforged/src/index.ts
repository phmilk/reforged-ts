// The package's entry point. A Map project enables every rule with two lines:
//
//   import reforged from "eslint-plugin-reforged";
//   export default defineConfig(
//     tseslint.configs.strictTypeChecked, // or any type-checked preset
//     { languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } } },
//     ...reforged.configs.recommended,
//   );
import { createPlugin } from "./plugin.js";

const plugin = createPlugin();

export default plugin;
export { createPlugin, pluginPrefix } from "./plugin.js";
export type { PluginOptions, ReforgedPlugin } from "./plugin.js";
export { DataFileError } from "./data/index.js";
export type { DataFiles } from "./data/index.js";
