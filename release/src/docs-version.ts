/**
 * The docs version stamp of the version step (#186): what the published
 * packages link of the docs site names the docs version of their release.
 * The lint plugin's `reforged.docs` field (the docs version of every rule's
 * `meta.docs.url`) and the `llms.txt` links of every publishable package's
 * README get the library's `major.minor`, the label of the docs version
 * cut for its minor; a prerelease keeps `next`, the working tree's docs,
 * since a docs version is cut only on a stable minor. `release:version`
 * runs it after `changeset version`, so the Version Packages pull request
 * shows the stamp.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { DOCS_BASE_URL, minorLabel } from "./matrix-model.js";
import { LIBRARY_PACKAGE, PLUGIN_PACKAGE } from "./packages.js";
import { isPrerelease, parseSemver } from "./semver.js";
import { readPublishablePackages } from "./workspace.js";

/** The docs version of the working tree, served at `/docs/next`. */
export const NEXT_LABEL = "next";

/** The README of a package, relative to its folder. */
export const README = "README.md";

/**
 * A link of a README to the LLM files of a docs version:
 * `https://phmilk.github.io/reforged-ts/docs/<label>/llms.txt`, or
 * `llms-full.txt`.
 */
const LLMS_LINK = new RegExp(
  `${DOCS_BASE_URL.replaceAll(".", "\\.")}/[^/\\s)]+/(llms(?:-full)?\\.txt)`,
  "g",
);

/**
 * The docs version label the packages of a library version link: its
 * `major.minor` when stable, `next` for a prerelease; `undefined` when
 * `version` is not a semantic version.
 */
export function docsLabel(version: string): string | undefined {
  const parsed = parseSemver(version);
  if (parsed === undefined) return undefined;
  return isPrerelease(parsed) ? NEXT_LABEL : minorLabel(version);
}

export type DocsStampResult =
  | {
      ok: true;
      /** The docs version label stamped. */
      label: string;
      /**
       * Every stamped file, by `/`-separated path relative to the
       * repository root, with its stamped text, changed or not.
       */
      files: Map<string, string>;
    }
  | { ok: false; problems: string[] };

/**
 * The stamp of the workspace at `root`: the plugin's `package.json` and
 * every publishable package's README with the docs version label of the
 * library's version. Fails, one line per problem, when the library or the
 * plugin is missing, the library's version is not a semantic version, the
 * plugin has no `reforged.docs` field or a README has no `llms.txt` link.
 */
export async function stampDocsVersion(root: string): Promise<DocsStampResult> {
  const packages = await readPublishablePackages(root);
  const library = packages.find(({ name }) => name === LIBRARY_PACKAGE);
  const plugin = packages.find(({ name }) => name === PLUGIN_PACKAGE);
  const problems: string[] = [];
  if (library === undefined) {
    problems.push(`The workspace has no ${LIBRARY_PACKAGE} package.`);
  }
  if (plugin === undefined) {
    problems.push(`The workspace has no ${PLUGIN_PACKAGE} package.`);
  }
  const label = library === undefined ? undefined : docsLabel(library.version);
  if (library !== undefined && label === undefined) {
    problems.push(
      `${LIBRARY_PACKAGE} ${library.version} is not a semantic version.`,
    );
  }

  const files = new Map<string, string>();
  if (plugin !== undefined) {
    const path = `${plugin.dir}/package.json`;
    const reforged = plugin.manifest.reforged;
    if (
      typeof reforged !== "object" ||
      reforged === null ||
      typeof (reforged as Record<string, unknown>).docs !== "string"
    ) {
      problems.push(`${path} has no \`reforged.docs\` field.`);
    } else if (label !== undefined) {
      const manifest = {
        ...plugin.manifest,
        reforged: { ...reforged, docs: label },
      };
      files.set(path, `${JSON.stringify(manifest, null, 2)}\n`);
    }
  }
  for (const pkg of packages) {
    const path = `${pkg.dir}/${README}`;
    const text = await readFile(join(root, path), "utf8").catch(() => "");
    const links = text.match(LLMS_LINK) ?? [];
    if (!links.some((link) => link.endsWith("/llms.txt"))) {
      problems.push(`${path} has no link to the llms.txt of a docs version.`);
    } else if (label !== undefined) {
      files.set(
        path,
        text.replace(LLMS_LINK, (_, file: string) =>
          [DOCS_BASE_URL, label, file].join("/"),
        ),
      );
    }
  }

  if (problems.length > 0 || label === undefined) {
    return { ok: false, problems };
  }
  return { ok: true, label, files };
}
