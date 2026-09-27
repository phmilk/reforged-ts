// The docs versions as the site serves them (#40, #185). The working tree is
// "Next", at /docs/next. docs:version cuts one version per library minor,
// labelled `major.minor`, and every cut version is served at
// /docs/<label>, the newest too: a page keeps its URL when a newer version
// is cut, and the compatibility matrix links a release's docs by its label
// (docs/release.md, "The docs version URL"). The newest version also answers
// without its label, at /docs/<page>, through a redirect.
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { PluginOptions as DocsPluginOptions } from "@docusaurus/plugin-content-docs";
import type { Plugin } from "@docusaurus/types";

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

/**
 * Writes each cut version's root page, `docs/<label>.html` in the build
 * `outDir`, again as `docs/<label>/index.html`. With `trailingSlash: false` a
 * version root is only the former, next to its version's `docs/<label>/`
 * folder, and a static server may take the dot of `1.0` for a file
 * extension, find the folder and redirect to `/docs/1.0/`, which the index
 * answers: the compatibility matrix's `/docs/<label>` links hold on GitHub
 * Pages either way. `docusaurus serve` still answers 404 there: its
 * serve-handler lists no folder and redirects `/docs/1.0/` back.
 */
export function writeVersionRootIndexes(
  outDir: string,
  cut: readonly string[],
): void {
  for (const label of cut) {
    const page = join(outDir, "docs", `${label}.html`);
    if (!existsSync(page)) continue;
    const folder = join(outDir, "docs", label);
    mkdirSync(folder, { recursive: true });
    copyFileSync(page, join(folder, "index.html"));
  }
}

/** The site plugin of {@link writeVersionRootIndexes}. */
export function versionRootIndexesPlugin(cut: readonly string[]): Plugin {
  return {
    name: "reforged-version-root-indexes",
    postBuild({ outDir }) {
      writeVersionRootIndexes(outDir, cut);
      return Promise.resolve();
    },
  };
}
