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
 * package.json, always a label, since the plugin cannot know which docs
 * version is the newest: `next` (the working tree) before the first release,
 * then the library's `major.minor`, which the release process stamps. The
 * site answers at `/docs/<label>` for every version it keeps.
 */
export const docsVersion = packageJson.reforged.docs;

/**
 * The documentation page of a rule, linked from the editor's Problems panel:
 * its page under the Lint rules guide, the URL pattern of the docs site (#40).
 */
export function docsUrl(ruleName: string): string {
  return `https://phmilk.github.io/reforged-ts/docs/${docsVersion}/guides/lint-rules/${ruleName}`;
}
