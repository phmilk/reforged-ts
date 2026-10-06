// The API reference (#40): the docusaurus-plugin-typedoc instances that
// generate it, the library's into the docs tree, the Typings' into the
// Typings' own docs instance, which is not versioned (#185), and their
// sidebars. The site's own TypeDoc plugin (typedoc/plugin.mts) runs in each
// instance.
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
import { gameVersionRoute, TYPINGS_ROUTE_BASE } from "./typedoc/typings.mts";

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
   * Its folder, relative to the docs folder of its instance, POSIX slashes.
   * A subfolder: TypeDoc empties it at every run, and the section's own
   * index page and category file must survive.
   */
  readonly dir: string;
  /**
   * The docs folder of the docs instance it is written into, absolute: the
   * site's docs tree when not given.
   */
  readonly docsPath?: string;
  /** The entry points, absolute. */
  readonly entryPoints: readonly string[];
  /** The tsconfig TypeDoc compiles them with, absolute. */
  readonly tsconfig: string;
  /**
   * For the Typings of a Game version: the Patch's `manifest.json`, absolute.
   * The reference then has a page per entry of the manifest where
   * `typedoc/typings.mts` routes it, in the Typings' docs instance, and none
   * of them in the sidebar.
   */
  readonly typingsManifest?: string;
  /**
   * The Typings reference the `@native` tags of this one link: each tag
   * becomes a link to the page of the Native, or of the Handle type, there,
   * then to jassbot, and a tag naming neither an entry of its manifest nor a
   * Handle type of its `common.j.d.ts` fails the run. Without it, the tags
   * are left as written.
   */
  readonly nativeTypings?: Reference;
  /**
   * The names of types its declarations reference but its entry points
   * leave unexported on purpose: TypeDoc's `intentionallyNotExported`, so
   * they raise no notExported warning.
   */
  readonly intentionallyNotExported?: readonly string[];
}

/** jassbot's page of a Native is this followed by the Native's name. */
export const JASSBOT = "https://lep.duckdns.org/jassbot/doc/";

/** The library, from its index, with its own tsconfig. */
export const LIBRARY_REFERENCE: Reference = {
  id: "reforged-ts",
  label: "reforged-ts",
  dir: "api/reforged-ts",
  entryPoints: [join(WORKSPACE, "packages/reforged-ts/src/index.ts")],
  tsconfig: join(WORKSPACE, "packages/reforged-ts/tsconfig.json"),
  // Type-level helpers a public type is computed from: exporting one would
  // publish machinery, and TypeDoc would document what it expands to. One
  // name per line.
  intentionallyNotExported: [
    // events/unit: the payload type of a row.
    "PayloadOf",
    // events/unit: a twin's entry, which `UnitEventDescriptors` maps.
    "UnitEventTwin",
    // events/unit: the payload of the order members.
    "OrderPayload",
    // utils/color: the numbers below a bound, behind `NumberRange`.
    "Enumerate",
  ],
};

/**
 * The docs folder of the Typings' docs instance, in the site folder: one
 * subfolder per Game version, served under `TYPINGS_ROUTE_BASE`. Not
 * versioned: a docs version cut never copies the Typings' thousands of pages
 * (#185), and every docs version links the same.
 */
export const TYPINGS_FOLDER = "typings";

/** The id of the Typings' docs instance. */
export const TYPINGS_DOCS_ID = "typings";

/**
 * The hand-written declarations of the Rawcode types (`Rawcode`,
 * `ObjectKind`, `UnknownRawcode`), at the root of the reforged-types package:
 * every Game version's Jass files use them.
 */
export const RAWCODE_TYPES_FILE = "rawcode.d.ts";

/**
 * The reference of the Typings of each Game version `typings` holds (the
 * reforged-types package), oldest first: every folder with a `manifest.json`,
 * so a new Patch adds its subsection. The entry points are the Game version's
 * Jass files, which declare every entry of its manifest, and the package's
 * `RAWCODE_TYPES_FILE` when it has one, which declares the Rawcode types the
 * Jass files use: each Game version's reference documents them too. Each
 * Game version gets a tsconfig of its own, written to `tsconfigs`, with its
 * files alone: the Typings of two Game versions declare the same globals and
 * never share a program.
 */
export function typingsReferences(
  typings: string,
  tsconfigs: string,
  docsPath: string = join(SITE, TYPINGS_FOLDER),
): Reference[] {
  const gameVersions = gameVersionFolders(typings).filter((gameVersion) =>
    existsSync(join(typings, gameVersion, "manifest.json")),
  );
  const rawcodeTypes = join(typings, RAWCODE_TYPES_FILE);
  return gameVersions.map((gameVersion) => {
    const folder = join(typings, gameVersion);
    const entryPoints = [
      ...readdirSync(folder)
        .filter((file) => file.endsWith(".d.ts"))
        .sort()
        .map((file) => join(folder, file)),
      ...(existsSync(rawcodeTypes) ? [rawcodeTypes] : []),
    ];
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
      dir: gameVersion,
      docsPath,
      entryPoints,
      tsconfig,
      typingsManifest: join(folder, "manifest.json"),
    };
  });
}

/** The Game version folders (`3.0.0`) in `folder`, oldest first. */
function gameVersionFolders(folder: string): string[] {
  return readdirSync(folder, { withFileTypes: true })
    .filter(
      (entry) => entry.isDirectory() && /^\d+\.\d+\.\d+$/.test(entry.name),
    )
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
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
 * Every reference the site generates, in sidebar order: the library, its
 * `@native` tags linked to the Typings of the newest Game version, then the
 * Typings of each Game version.
 */
export function siteReferences(): Reference[] {
  const typings = typingsReferences(
    join(WORKSPACE, "packages/reforged-types"),
    join(SITE, "node_modules/.cache/typings-reference"),
  );
  const newest = typings.at(-1);
  if (newest === undefined) {
    throw new Error(
      "packages/reforged-types holds no Game version with a manifest.json: the library's @native tags have no Typings to link. Run `pnpm typings:generate`.",
    );
  }
  return [{ ...LIBRARY_REFERENCE, nativeTypings: newest }, ...typings];
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
 * The options of a reference's TypeDoc run: TypeDoc's, with the ones the
 * site's TypeDoc plugin declares.
 */
export type ReferenceTypedocOptions = Partial<TypeDocOptions> & {
  readonly typingsManifest?: string;
  readonly nativeManifest?: string;
  readonly nativeRoute?: string;
  readonly nativeJassbot?: string;
};

/**
 * The options of a reference's TypeDoc run as docusaurus-plugin-typedoc
 * takes them: with its instance's id and the Markdown theme's options.
 */
export type ReferencePluginOptions = ReferenceTypedocOptions &
  Partial<MarkdownOptions> & {
    readonly id: string;
  };

export function referencePluginOptions(
  reference: Reference,
  options: ReferenceOptions,
): ReferencePluginOptions {
  const docsPath = referenceDocsPath(reference, options);
  return {
    id: reference.id,
    docsPath,
    ...referenceTypedocOptions(reference, { ...options, docsPath }),
  };
}

/** Where a reference's docs tree is: the option's, the reference's, or the site's `docs`. */
function referenceDocsPath(
  reference: Reference,
  options: ReferenceOptions,
): string {
  return options.docsPath ?? reference.docsPath ?? join(SITE, "docs");
}

/**
 * The options of a reference's TypeDoc run that TypeDoc itself and the
 * site's TypeDoc plugin take: the docs audit runs TypeDoc with these alone.
 */
export function referenceTypedocOptions(
  reference: Reference,
  options: ReferenceOptions,
): ReferenceTypedocOptions {
  const docsPath = referenceDocsPath(reference, options);
  return {
    // TypeDoc reads entry points as globs, which take POSIX slashes only.
    entryPoints: reference.entryPoints.map((path) =>
      path.replaceAll("\\", "/"),
    ),
    name: reference.label,
    tsconfig: reference.tsconfig,
    out: join(docsPath, reference.dir),
    plugin: [SITE_TYPEDOC_PLUGIN],
    readme: "none",
    // An `@example` whose body is only an `{@includeCode}` is parsed as
    // TSDoc, not taken as literal code the JSDoc way: TypeDoc then expands the
    // include into a fenced block. The line on the tag is the example's title.
    jsDocCompatibility: { exampleTag: false },
    // A Map project sees neither private nor protected members (#43): they
    // are left off the pages, and the docs audit lists the same members.
    excludePrivate: true,
    excludeProtected: true,
    validation: { notDocumented: true },
    treatValidationWarningsAsErrors: options.strict,
    ...(reference.intentionallyNotExported === undefined
      ? {}
      : { intentionallyNotExported: [...reference.intentionallyNotExported] }),
    ...(reference.typingsManifest === undefined
      ? {}
      : {
          typingsManifest: reference.typingsManifest,
          // Generated from the Patch: the doc comments are the Jass types,
          // and a handle type's brand has none.
          validation: { notDocumented: false },
        }),
    ...(reference.nativeTypings?.typingsManifest === undefined
      ? {}
      : {
          nativeManifest: reference.nativeTypings.typingsManifest,
          // A route, not a Markdown file link: the Typings are another docs
          // instance, the same for every docs version.
          nativeRoute: gameVersionRoute(reference.nativeTypings.dir),
          nativeJassbot: JASSBOT,
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
 * The docs tree's sidebar generator: the autogenerated sidebar, where the
 * library's reference folder is replaced by the sidebar its TypeDoc run wrote
 * (`typedoc-sidebar.cjs`), as a category linked to its index page, first in
 * the section that holds the folder, in the order of `references`. The
 * Typings' references are in their own docs instance: the section gets a
 * link to it after the library's, `Typings`.
 */
export function referenceSidebars(
  references: readonly Reference[],
): SidebarItemsGenerator {
  const inTree = references.filter(
    (reference) => reference.typingsManifest === undefined,
  );
  const typings = references.length !== inTree.length;
  return async ({ defaultSidebarItemsGenerator, ...args }) => {
    const inReference = (dir: string) =>
      inTree.some(
        (reference) =>
          dir === reference.dir || dir.startsWith(`${reference.dir}/`),
      );
    const items = await defaultSidebarItemsGenerator({
      ...args,
      docs: args.docs.filter((doc) => !inReference(doc.sourceDirName)),
    });
    const placed = new Map<SidebarCategory, SidebarItem[]>();
    for (const reference of inTree) {
      const section = findSection(items, posix.dirname(reference.dir));
      if (section === undefined) {
        throw new Error(
          `The reference of ${reference.label} goes in docs/${posix.dirname(reference.dir)}, which has no index page in the sidebar.`,
        );
      }
      placed.set(section, [
        ...(placed.get(section) ?? []),
        {
          type: "category",
          label: reference.label,
          link: { type: "doc", id: `${reference.dir}/index` },
          items: generatedSidebar(args.version.contentPath, reference),
        },
      ]);
    }
    for (const [section, placedItems] of placed) {
      section.items.unshift(
        ...placedItems,
        ...(typings
          ? [
              {
                type: "link" as const,
                label: "Typings",
                href: `/${TYPINGS_ROUTE_BASE}`,
              },
            ]
          : []),
      );
    }
    return items;
  };
}

type SidebarCategory = Extract<SidebarItem, { type: "category" }>;

/**
 * The Typings' docs instance's sidebar generator: its index page, as a
 * category of the index page of each Game version's reference. The pages of
 * the entries are left out: thousands, and a sidebar listing them is
 * rendered into each of them, which takes the site past the size GitHub
 * Pages serves. Each index page lists them.
 */
export function typingsSidebar(
  references: readonly Reference[],
): SidebarItemsGenerator {
  return ({ version }) =>
    Promise.resolve([
      {
        type: "category",
        label: "Typings",
        collapsible: false,
        link: { type: "doc", id: "index" },
        items: references.map((reference) => ({
          type: "doc" as const,
          id: generatedIndex(version.contentPath, reference),
          label: reference.label,
        })),
      },
    ]);
}

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
