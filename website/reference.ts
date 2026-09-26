// The API reference (#40): the docusaurus-plugin-typedoc instances that
// generate it into the docs tree, and their place in the sidebar. The site's
// own TypeDoc plugin (typedoc/plugin.mts) runs in each instance.
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";
import type { PluginConfig } from "@docusaurus/types";
import type { PluginOptions as DocsPluginOptions } from "@docusaurus/plugin-content-docs";
import type { PluginOptions as MarkdownOptions } from "docusaurus-plugin-typedoc";
import type { TypeDocOptions } from "typedoc";

const SITE = dirname(fileURLToPath(import.meta.url));
const WORKSPACE = join(SITE, "..");

/**
 * The site's TypeDoc plugin, by path: TypeDoc imports it itself, so it runs
 * against TypeDoc's own module instance.
 */
export const SITE_TYPEDOC_PLUGIN = join(SITE, "typedoc", "plugin.mts");

/** One API reference: a TypeDoc run whose Markdown goes into the docs tree. */
export interface Reference {
  /** The docusaurus-plugin-typedoc instance's plugin id. */
  readonly id: string;
  /** The sidebar label of its category. */
  readonly label: string;
  /**
   * Its folder in the docs tree, relative to the docs folder, POSIX slashes.
   * A subfolder of a section: TypeDoc empties it at every run, and the
   * section's own index page and category file must survive.
   */
  readonly dir: string;
  /** The entry points, absolute. */
  readonly entryPoints: readonly string[];
  /** The tsconfig TypeDoc compiles them with, absolute. */
  readonly tsconfig: string;
  /**
   * For the Typings of a Game version: the Patch's `manifest.json`, absolute.
   * The reference then has a page per entry of the manifest where
   * `typedoc/typings.mts` routes it, and none of them in the sidebar.
   */
  readonly typingsManifest?: string;
}

/** The library, from its index, with its own tsconfig. */
export const LIBRARY_REFERENCE: Reference = {
  id: "reforged-ts",
  label: "reforged-ts",
  dir: "api/reforged-ts",
  entryPoints: [join(WORKSPACE, "packages/reforged-ts/src/index.ts")],
  tsconfig: join(WORKSPACE, "packages/reforged-ts/tsconfig.json"),
};

/** The folder of the Typings' references in the docs tree: one subfolder per Game version. */
export const TYPINGS_DIR = "api/typings";

/**
 * The reference of the Typings of each Game version `typings` holds (the
 * reforged-types package), oldest first: every folder with a `manifest.json`,
 * so a new Patch adds its subsection. The entry points are the Game version's
 * Jass files, which declare every entry of its manifest and need nothing
 * else. Each Game version gets a tsconfig of its own, written to `tsconfigs`,
 * with its files alone: the Typings of two Game versions declare the same
 * globals and never share a program.
 */
export function typingsReferences(
  typings: string,
  tsconfigs: string,
): Reference[] {
  const gameVersions = readdirSync(typings, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        /^\d+\.\d+\.\d+$/.test(entry.name) &&
        existsSync(join(typings, entry.name, "manifest.json")),
    )
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  return gameVersions.map((gameVersion) => {
    const folder = join(typings, gameVersion);
    const entryPoints = readdirSync(folder)
      .filter((file) => file.endsWith(".d.ts"))
      .sort()
      .map((file) => join(folder, file));
    const tsconfig = join(tsconfigs, gameVersion, "tsconfig.json");
    writeIfChanged(
      tsconfig,
      `${JSON.stringify(
        {
          compilerOptions: TYPINGS_COMPILER_OPTIONS,
          files: entryPoints,
        },
        null,
        2,
      )}\n`,
    );
    return {
      id: `typings-${gameVersion}`,
      label: gameVersion,
      dir: `${TYPINGS_DIR}/${gameVersion}`,
      entryPoints,
      tsconfig,
      typingsManifest: join(folder, "manifest.json"),
    };
  });
}

/**
 * The Jass files as declarations alone: they need no type package, and
 * their own build type-checks them, so library files go unchecked.
 */
const TYPINGS_COMPILER_OPTIONS = {
  target: "ESNext",
  lib: ["ESNext"],
  module: "esnext",
  moduleResolution: "bundler",
  types: [],
  strict: true,
  noEmit: true,
  skipLibCheck: true,
};

/** Writes a file unless it holds the text already: a rerun changes nothing. */
function writeIfChanged(file: string, text: string): void {
  if (existsSync(file) && readFileSync(file, "utf8") === text) return;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
}

/**
 * Every reference the site generates, in sidebar order: the library, then the
 * Typings of each Game version.
 */
export function siteReferences(): Reference[] {
  return [
    LIBRARY_REFERENCE,
    ...typingsReferences(
      join(WORKSPACE, "packages/reforged-types"),
      join(SITE, "node_modules/.cache/typings-reference"),
    ),
  ];
}

/** How a reference is generated. */
export interface ReferenceOptions {
  /**
   * Fail on TypeDoc's validation warnings, an undocumented member first,
   * instead of reporting them.
   */
  readonly strict: boolean;
  /** Where the docs tree is, absolute. The site's `docs` by default. */
  readonly docsPath?: string;
}

/**
 * The options of a reference's TypeDoc run, as docusaurus-plugin-typedoc
 * takes them, with the one the site's TypeDoc plugin declares.
 */
export type ReferencePluginOptions = Partial<TypeDocOptions> &
  Partial<MarkdownOptions> & {
    readonly id: string;
    readonly typingsManifest?: string;
  };

export function referencePluginOptions(
  reference: Reference,
  options: ReferenceOptions,
): ReferencePluginOptions {
  const docsPath = options.docsPath ?? join(SITE, "docs");
  return {
    id: reference.id,
    // TypeDoc reads entry points as globs, which take POSIX slashes only.
    entryPoints: reference.entryPoints.map((path) =>
      path.replaceAll("\\", "/"),
    ),
    name: reference.label,
    tsconfig: reference.tsconfig,
    out: join(docsPath, reference.dir),
    docsPath,
    plugin: [SITE_TYPEDOC_PLUGIN],
    readme: "none",
    // An `@example` whose body is only an `{@includeCode}` is parsed as
    // TSDoc, not taken as literal code the JSDoc way: TypeDoc then expands the
    // include into a fenced block. The line on the tag is the example's title.
    jsDocCompatibility: { exampleTag: false },
    validation: { notDocumented: true },
    treatValidationWarningsAsErrors: options.strict,
    ...(reference.typingsManifest === undefined
      ? {}
      : {
          typingsManifest: reference.typingsManifest,
          // Generated from the Patch: the doc comments are the Jass types,
          // and a handle type's brand has none.
          validation: { notDocumented: false },
        }),
  };
}

/** A reference's docusaurus-plugin-typedoc instance, for the site's `plugins`. */
export function referencePlugin(
  reference: Reference,
  options: ReferenceOptions,
): PluginConfig {
  return [
    "docusaurus-plugin-typedoc",
    referencePluginOptions(reference, options),
  ];
}

type SidebarItemsGenerator = NonNullable<
  DocsPluginOptions["sidebarItemsGenerator"]
>;
type SidebarItem = Awaited<ReturnType<SidebarItemsGenerator>>[number];

/**
 * The docs plugin's sidebar generator: the autogenerated sidebar, where each
 * reference's folder is replaced by the sidebar its TypeDoc run wrote
 * (`typedoc-sidebar.cjs`), as a category linked to its index page, first in
 * the section that holds the folder, in the order of `references`. A Typings
 * reference is its index page alone: a page per entry, thousands, and a
 * sidebar listing them is rendered into each of them, which takes the site
 * past the size GitHub Pages serves. The index page lists them.
 */
export function referenceSidebars(
  references: readonly Reference[],
): SidebarItemsGenerator {
  return async ({ defaultSidebarItemsGenerator, ...args }) => {
    const inReference = (dir: string) =>
      references.some(
        (reference) =>
          dir === reference.dir || dir.startsWith(`${reference.dir}/`),
      );
    const items = await defaultSidebarItemsGenerator({
      ...args,
      docs: args.docs.filter((doc) => !inReference(doc.sourceDirName)),
    });
    const placed = new Map<SidebarCategory, SidebarItem[]>();
    for (const reference of references) {
      const section = findSection(items, posix.dirname(reference.dir));
      if (section === undefined) {
        throw new Error(
          `The reference of ${reference.label} goes in docs/${posix.dirname(reference.dir)}, which has no index page in the sidebar.`,
        );
      }
      const index = `${reference.dir}/index`;
      const item: SidebarItem =
        reference.typingsManifest === undefined
          ? {
              type: "category",
              label: reference.label,
              link: { type: "doc", id: index },
              items: generatedSidebar(args.version.contentPath, reference),
            }
          : {
              type: "doc",
              id: generatedIndex(args.version.contentPath, reference),
              label: reference.label,
            };
      placed.set(section, [...(placed.get(section) ?? []), item]);
    }
    for (const [section, placedItems] of placed) {
      section.items.unshift(...placedItems);
    }
    return items;
  };
}

type SidebarCategory = Extract<SidebarItem, { type: "category" }>;

/** The category whose link is the index page of `dir`. */
function findSection(
  items: readonly SidebarItem[],
  dir: string,
): SidebarCategory | undefined {
  for (const item of items) {
    if (item.type !== "category") continue;
    if (item.link?.type === "doc" && item.link.id === `${dir}/index`) {
      return item;
    }
    const found = findSection(item.items, dir);
    if (found !== undefined) return found;
  }
  return undefined;
}

/** The doc id of a reference's index page, once its TypeDoc run wrote it. */
function generatedIndex(contentPath: string, reference: Reference): string {
  const file = join(contentPath, reference.dir, "index.md");
  if (!existsSync(file)) {
    throw new Error(notGenerated(file, reference));
  }
  return `${reference.dir}/index`;
}

function notGenerated(file: string, reference: Reference): string {
  return `${file} does not exist: the reference of ${reference.label} was not generated. TypeDoc's log above says why.`;
}

/** The sidebar a reference's TypeDoc run wrote, read afresh at every call. */
function generatedSidebar(
  contentPath: string,
  reference: Reference,
): SidebarItem[] {
  const file = join(contentPath, reference.dir, "typedoc-sidebar.cjs");
  if (!existsSync(file)) {
    throw new Error(notGenerated(file, reference));
  }
  const require = createRequire(import.meta.url);
  // A rerun of `docs:start` regenerates the file: never serve a cached one.
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- the require cache is keyed by path
  delete require.cache[file];
  return require(file) as SidebarItem[];
}
