// The plugin's own package metadata, read once from package.json (one level
// above both src/ and dist/): the name and version ESLint caches the plugin
// by, and the docs version every rule's documentation URL carries.
import { readFileSync } from "node:fs";

interface PackageJson {
  name: string;
  version: string;
  reforged: { docs: string };
}

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as PackageJson;

/** The package name and version, as the plugin's `meta`. */
export const pluginMeta = {
  name: packageJson.name,
  version: packageJson.version,
} as const;

/**
 * The docs version segment of every rule URL: `reforged.docs` in
 * package.json, kept by the release process equal to the library version the
 * plugin was released with; `next` before the first release.
 */
export const docsVersion = packageJson.reforged.docs;

/** The documentation page of a rule, linked from the editor's Problems panel. */
export function docsUrl(ruleName: string): string {
  return `https://phmilk.github.io/reforged-ts/${docsVersion}/lint/${ruleName}`;
}
