// The docs versions as the site serves them (#40, #185). The working tree is
// "Next", at /docs/next. docs:version cuts one version per library minor,
// labelled `major.minor`, and every cut version is served at
// /docs/<label>, the newest too: a page keeps its URL when a newer version
// is cut, and the compatibility matrix links a release's docs by its label
// (docs/release.md, "The docs version URL"). The newest version also answers
// without its label, at /docs/<page>, through a redirect.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { PluginOptions as DocsPluginOptions } from "@docusaurus/plugin-content-docs";

/**
 * The cut versions, newest first, as `versions.json` in the site folder
 * lists them (docs:version writes it); none before the first cut.
 */
export function cutVersions(site: string): string[] {
  const file = join(site, "versions.json");
  if (!existsSync(file)) return [];
  return JSON.parse(readFileSync(file, "utf8")) as string[];
}

/** The docs plugin's `versions` option: Next, and the newest version at its label. */
export function docsVersions(
  cut: readonly string[],
): DocsPluginOptions["versions"] {
  const newest = cut.at(0);
  return {
    // The docs of the working tree, at /docs/next from the start: the lint
    // rules link `next` while the packages are prereleases, and the URL does
    // not move at the first cut.
    current: { label: "Next", path: "next" },
    // Docusaurus serves its last version without a label by default.
    ...(newest === undefined ? {} : { [newest]: { path: newest } }),
  };
}

/**
 * The client-redirects plugin's `createRedirects`: each page of the newest
 * version, at /docs/<newest>/<page>, is also answered at /docs/<page>, the
 * newest version's page without a label.
 */
export function newestVersionAliases(
  cut: readonly string[],
): (path: string) => string[] | undefined {
  const newest = cut.at(0);
  return (path) => {
    if (newest === undefined) return undefined;
    const prefix = `/docs/${newest}`;
    if (path !== prefix && !path.startsWith(`${prefix}/`)) return undefined;
    return [`/docs${path.slice(prefix.length)}`];
  };
}
