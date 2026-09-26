// The docs site's configuration (#40, ADR 0005), in Node; the browser never
// sees it. Two configuration files build from it: docusaurus.config.ts for
// `docs:start` and `docs:build`, docusaurus.check.config.ts, strict, for
// `docs:check`, the CI gate. A configuration file exports its configuration
// and nothing else: Docusaurus rejects any other export as an unknown field.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";

/** How the build treats what is not an error from day one. */
export interface SiteOptions {
  /**
   * Fail on what `docs:build` only warns about (broken anchors today). The
   * CI gate, `docs:check`, builds strict.
   */
  readonly strict: boolean;
}

/** What the landing page states, read at build time and never typed. */
export interface SiteFields {
  /** The Build the Typings support: their `reforged.patch` field. */
  readonly supportedPatch: string;
  [key: string]: unknown;
}

/**
 * The Typings' `reforged.patch` field, read from the installed package so
 * that a new Patch changes the landing page at the next build.
 */
export function supportedPatch(): string {
  const manifestPath = createRequire(import.meta.url).resolve(
    "reforged-types/package.json",
  );
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
    reforged?: { patch?: unknown };
  };
  const patch = manifest.reforged?.patch;
  if (typeof patch !== "string" || !/^\d+\.\d+\.\d+\.\d+$/.test(patch)) {
    throw new Error(
      `${manifestPath}: \`reforged.patch\` must be a Build such as 3.0.0.24268, got ${JSON.stringify(patch)}.`,
    );
  }
  return patch;
}

export function siteConfig(options: SiteOptions): Config {
  const customFields: SiteFields = { supportedPatch: supportedPatch() };
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

    // Docusaurus Faster (Rspack, SWC, Lightning CSS) and the v4 defaults.
    future: { v4: true, faster: true },

    // English only (#4).
    i18n: { defaultLocale: "en", locales: ["en"] },

    customFields,

    presets: [
      [
        "classic",
        {
          docs: {
            sidebarPath: "./sidebars.ts",
            editUrl:
              "https://github.com/phmilk/reforged-ts/tree/master/website/",
            versions: {
              // The docs of the working tree, at /docs/next from the start:
              // the lint rules link `next` while the packages are
              // prereleases, and the URL does not move at the first cut.
              current: { label: "Next", path: "next" },
            },
          },
          // Docs only: the pages plugin serves the landing page alone.
          blog: false,
        } satisfies Preset.Options,
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
          {
            href: "https://github.com/phmilk/reforged-ts",
            label: "GitHub",
            position: "right",
          },
        ],
      },
    } satisfies Preset.ThemeConfig,
  };
}
