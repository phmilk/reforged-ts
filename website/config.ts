// The docs site's configuration (#40, ADR 0005), in Node; the browser never
// sees it. Two configuration files build from it: docusaurus.config.ts for
// `docs:start` and `docs:build`, docusaurus.check.config.ts, strict, for
// `docs:check`, the CI gate. A configuration file exports its configuration
// and nothing else: Docusaurus rejects any other export as an unknown field.
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import {
  referencePlugin,
  referenceSidebars,
  siteReferences,
  TYPINGS_DOCS_ID,
  TYPINGS_FOLDER,
  typingsSidebar,
} from "./reference";
import { llmsFilesPlugin } from "./llms";
import { TYPINGS_ROUTE_BASE } from "./typedoc/typings.mts";
import {
  cutVersions,
  docsVersions,
  newestVersionAliases,
  versionRootIndexesPlugin,
} from "./versioning";

/** What differs between the two configuration files. */
export interface SiteOptions {
  /**
   * Fail on what `docs:build` only warns about: broken anchors, and, once
   * `STRICT_REFERENCE` is on, TypeDoc's validation warnings in the API
   * reference (an undocumented member). The CI gate, `docs:check`, builds
   * strict.
   */
  readonly strict: boolean;
}

/**
 * Whether `strict` also fails the API reference on TypeDoc's validation
 * warnings. Off while the library's TSDoc pass is under way: `docs:check`
 * lists each undocumented member as a warning and stays green. The last
 * build step, #43, turns it on when every member is documented.
 */
const STRICT_REFERENCE = false;

const REPOSITORY = "https://github.com/phmilk/reforged-ts";

/** The site folder, where Docusaurus keeps the cut versions. */
const SITE = dirname(fileURLToPath(import.meta.url));

export function siteConfig(options: SiteOptions): Config {
  const cut = cutVersions(SITE);
  const reference = { strict: options.strict && STRICT_REFERENCE };
  const references = siteReferences();
  return {
    title: "reforged-ts",
    tagline: "TypeScript for Warcraft III maps, compiled to Lua.",

    url: "https://phmilk.github.io",
    baseUrl: "/reforged-ts/",
    trailingSlash: false,
    organizationName: "phmilk",
    projectName: "reforged-ts",

    onBrokenLinks: "throw",
    onBrokenAnchors: options.strict ? "throw" : "warn",
    markdown: {
      hooks: { onBrokenMarkdownLinks: "throw" },
    },

    // Docusaurus Faster (Rspack, SWC, Lightning CSS). Its worker threads
    // require the v4 flags, which Docusaurus recommends with it.
    future: { v4: true, faster: true },

    // English only (#4).
    i18n: { defaultLocale: "en", locales: ["en"] },

    presets: [
      [
        "classic",
        {
          docs: {
            sidebarPath: "./sidebars.ts",
            sidebarItemsGenerator: referenceSidebars(references),
            editUrl: `${REPOSITORY}/tree/master/website/`,
            versions: docsVersions(cut),
          },
          // Docs only: the pages plugin serves the landing page alone.
          blog: false,
          pages: { include: ["index.mdx"] },
        } satisfies Preset.Options,
      ],
    ],

    plugins: [
      // The API reference, generated before the docs load.
      ...references.map((each) => referencePlugin(each, reference)),
      // The Typings' references, a docs instance of their own, not versioned.
      [
        "@docusaurus/plugin-content-docs",
        {
          id: TYPINGS_DOCS_ID,
          path: TYPINGS_FOLDER,
          routeBasePath: TYPINGS_ROUTE_BASE,
          sidebarItemsGenerator: typingsSidebar(
            references.filter((each) => each.typingsManifest !== undefined),
          ),
          editUrl: `${REPOSITORY}/tree/master/website/`,
        },
      ],
      // The newest docs version's pages without its label.
      [
        "@docusaurus/plugin-client-redirects",
        { createRedirects: newestVersionAliases(cut) },
      ],
      // Each cut version's root also as a folder index (/docs/<label>).
      () => versionRootIndexesPlugin(cut),
      // llms.txt, llms-full.txt and each page as Markdown, per docs version
      // and once for the Typings.
      llmsFilesPlugin(cut),
    ],

    themes: [
      // Offline search over the docs version being read: one index per docs
      // version, the one of the version shown loaded by the search bar. The
      // Typings, not versioned, are indexed once, apart: their pages search
      // their own index, and a docs version's search does not load it.
      [
        "@easyops-cn/docusaurus-search-local",
        {
          indexDocs: true,
          indexBlog: false,
          indexPages: false,
          docsRouteBasePath: ["docs", TYPINGS_ROUTE_BASE],
          searchContextByPaths: [TYPINGS_ROUTE_BASE],
          language: ["en"],
        },
      ],
    ],

    themeConfig: {
      colorMode: { respectPrefersColorScheme: true },
      navbar: {
        title: "reforged-ts",
        items: [
          {
            type: "docSidebar",
            sidebarId: "docs",
            position: "left",
            label: "Docs",
          },
          // The docs versions, from the first cut on.
          ...(cut.length === 0
            ? []
            : [{ type: "docsVersionDropdown", position: "right" } as const]),
          {
            href: REPOSITORY,
            label: "GitHub",
            position: "right",
          },
        ],
      },
    } satisfies Preset.ThemeConfig,
  };
}
