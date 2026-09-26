// The URL contract of the lint rule pages (#40): every rule's
// `meta.docs.url`, as the plugin's sources build it, is the route of a page
// docs:collect writes from this repository, under the site's configuration.
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type * as Preset from "@docusaurus/preset-classic";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { siteConfig } from "../../config";
import { WORKSPACE } from "../../scripts/collect.mts";
import { collect } from "../../scripts/collector.mts";

/** The part of the plugin's export the test reads. */
interface LintPlugin {
  readonly rules: Readonly<
    Record<string, { readonly meta: { readonly docs?: { url?: string } } }>
  >;
}

const PLUGIN_ENTRY = fileURLToPath(
  new URL(
    "../../../packages/eslint-plugin-reforged/src/index.ts",
    import.meta.url,
  ),
);

/** The plugin's default export, the object ESLint loads, from its sources. */
async function lintPlugin(): Promise<LintPlugin> {
  // It warns about the optional packages the working directory lacks, which
  // disables two rules' reports; their metadata stays.
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  try {
    const module = (await import(PLUGIN_ENTRY)) as { default: LintPlugin };
    return module.default;
  } finally {
    vi.restoreAllMocks();
  }
}

/** Where the site serves the current docs version, from its configuration. */
function currentDocsUrl(): string {
  const config = siteConfig({ strict: false });
  const [, preset] = config.presets?.[0] as [string, Preset.Options];
  const docs = preset.docs === false ? undefined : preset.docs;
  const versions: Partial<Record<string, { path?: string }>> =
    docs?.versions ?? {};
  const path = versions.current?.path;
  if (path === undefined) {
    throw new Error("The site gives the current docs version no path.");
  }
  return `${config.url}${config.baseUrl}${docs?.routeBasePath ?? "docs"}/${path}/`;
}

/** The URL of the docs tree page at `path`, under the version at `base`. */
function routeOf(path: string, base: string): string {
  return base + path.replace(/\.md$/, "").replace(/(?:^|\/)index$/, "");
}

describe("the lint rule pages", () => {
  let docs: string;
  beforeAll(async () => {
    docs = await mkdtemp(join(tmpdir(), "reforged-website-lint-rules-"));
  });
  afterAll(async () => {
    await rm(docs, { recursive: true, force: true });
  });

  // The routes are the current version's: the plugin links `next` while the
  // packages are prereleases. Once the release stamps a `major.minor` label
  // into `reforged.docs` (#186), the label's routes are those of the newest
  // cut version, which the site answers at `/docs/<label>` (#185).
  it("are served at the URL of every rule's meta.docs.url", async () => {
    const report = await collect({ ...WORKSPACE, docs });
    const base = currentDocsUrl();
    const routes = report.collected
      .flatMap(({ paths }) => paths)
      .filter((path) => path.endsWith(".md"))
      .map((path) => routeOf(path, base));
    const plugin = await lintPlugin();
    const urls = Object.values(plugin.rules).map((rule) => rule.meta.docs?.url);
    expect(urls.length).toBeGreaterThan(0);
    expect(
      urls.filter((url) => url === undefined || !routes.includes(url)),
    ).toEqual([]);
    expect(routes).toContain(`${base}guides/lint-rules/no-self-recursion`);
  });
});
