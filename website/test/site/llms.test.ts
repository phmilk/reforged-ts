// The site's files for AI agents (#186): one set per docs version and one
// for the Typings, and the check of what docusaurus-plugin-llms wrote, on a
// build folder written here.
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import type { LoadContext, Plugin } from "@docusaurus/types";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  llmsFilesPlugin,
  llmsProblems,
  llmsTargets,
  llmsUrl,
} from "../../llms";

const SITE_URL = "https://phmilk.github.io/reforged-ts";

let build: string;

beforeEach(async () => {
  build = await mkdtemp(join(tmpdir(), "reforged-website-llms-"));
});

afterEach(async () => {
  await rm(build, { recursive: true, force: true });
});

async function write(path: string, text: string): Promise<void> {
  await mkdir(dirname(join(build, path)), { recursive: true });
  await writeFile(join(build, path), text);
}

describe("the LLM files", () => {
  it("are written for Next, each cut version and the Typings once", () => {
    expect(
      llmsTargets(["1.1", "1.0"]).map(({ label, folder, route }) => ({
        label,
        folder,
        route,
      })),
    ).toEqual([
      { label: "Next", folder: "docs", route: "docs/next" },
      { label: "1.1", folder: "versioned_docs/version-1.1", route: "docs/1.1" },
      { label: "1.0", folder: "versioned_docs/version-1.0", route: "docs/1.0" },
      { label: undefined, folder: "typings", route: "typings" },
    ]);
    expect(llmsUrl("next")).toBe(
      "https://phmilk.github.io/reforged-ts/docs/next/llms.txt",
    );
  });

  describe("check", () => {
    const next = llmsTargets([]).at(0);
    if (next === undefined) throw new Error("No Next target.");
    const routes = new Set([
      "/reforged-ts/docs/next",
      "/reforged-ts/docs/next/guides/events",
    ]);
    const index = (...urls: string[]) =>
      `# reforged-ts\n\n## Table of Contents\n\n${urls.map((url) => `- [Page](${url}): A page.\n`).join("")}`;

    it("accepts a Markdown copy of each linked page", async () => {
      await write(
        "docs/next/llms.txt",
        index(
          `${SITE_URL}/docs/next.md`,
          `${SITE_URL}/docs/next/guides/events.md`,
        ),
      );
      await write("docs/next/llms-full.txt", "# reforged-ts\n");
      await write("docs/next.md", "# reforged-ts\n");
      await write("docs/next/guides/events.md", "# Events\n");

      expect(llmsProblems(build, SITE_URL, routes, next)).toEqual([]);
    });

    it("names a missing file, a missing copy and a link to no page of the version", async () => {
      await write(
        "docs/next/llms.txt",
        index(
          `${SITE_URL}/docs/next/guides/events.md`,
          `${SITE_URL}/docs/next/migration/_generated/renames.md`,
          `${SITE_URL}/docs/1.0/guides/events.md`,
        ),
      );
      await write("docs/next/migration/_generated/renames.md", "# Renames\n");
      await write("docs/1.0/guides/events.md", "# Events\n");

      expect(llmsProblems(build, SITE_URL, routes, next)).toEqual([
        `${join(build, "docs/next/llms-full.txt")} is missing.`,
      ]);

      await write("docs/next/llms-full.txt", "# reforged-ts\n");

      expect(
        llmsProblems(build, SITE_URL, routes, next).map((line) =>
          line.replace(/^.* links /, ""),
        ),
      ).toEqual(
        [
          "docs/next/guides/events.md",
          "docs/next/migration/_generated/renames.md",
          "docs/1.0/guides/events.md",
        ].map(
          (path) =>
            `${SITE_URL}/${path}, which is not the Markdown copy of a page of /docs/next.`,
        ),
      );
    });
  });
});

describe("the Markdown copy of a page", () => {
  /** A `mermaid` block, as a page of the site holds it. */
  const DIAGRAM = [
    "```mermaid",
    "%% diagram: packages",
    "flowchart LR",
    '  library["reforged-ts"] --> typings["reforged-types"]',
    "```",
  ].join("\n");

  it("keeps a mermaid block's source as text", async () => {
    const site = join(build, "site");
    const outDir = join(build, "out");
    await write(
      "site/docs/contributing/guide.md",
      `---\ntitle: Contributing guide\nmdx:\n  format: md\n---\n\nThe packages:\n\n${DIAGRAM}\n\nEach package has its README.\n`,
    );
    await write("site/typings/index.md", "# reforged-types\n\nThe Typings.\n");
    const plugin = llmsFilesPlugin([]);
    if (typeof plugin !== "function") throw new Error("Not a plugin module.");
    const context = {
      siteDir: site,
      outDir,
      siteConfig: {
        title: "reforged-ts",
        tagline: "TypeScript for Warcraft III maps, compiled to Lua.",
        url: "https://phmilk.github.io",
        baseUrl: "/reforged-ts/",
      },
    } as unknown as LoadContext;
    const { postBuild } = (await plugin(context, undefined)) as Plugin;

    await postBuild?.({
      ...context,
      outDir,
      routesPaths: [
        "/reforged-ts/docs/next/contributing/guide",
        "/reforged-ts/typings",
      ],
    } as unknown as Parameters<NonNullable<Plugin["postBuild"]>>[0]);

    const copy = await readFile(
      join(outDir, "docs/next/contributing/guide.md"),
      "utf8",
    );
    const full = await readFile(
      join(outDir, "docs/next/llms-full.txt"),
      "utf8",
    );
    expect(copy).toContain(DIAGRAM);
    expect(full).toContain(DIAGRAM);
  });
});

describe("the Typings' LLM files", () => {
  /** The site plugin's postBuild over the site folder written here. */
  async function postBuild(routesPaths: string[]): Promise<void> {
    const site = join(build, "site");
    const plugin = llmsFilesPlugin([]);
    if (typeof plugin !== "function") throw new Error("Not a plugin module.");
    const context = {
      siteDir: site,
      outDir: join(build, "out"),
      siteConfig: {
        title: "reforged-ts",
        tagline: "TypeScript for Warcraft III maps, compiled to Lua.",
        url: "https://phmilk.github.io",
        baseUrl: "/reforged-ts/",
      },
    } as unknown as LoadContext;
    const plugged = (await plugin(context, undefined)) as Plugin;
    await plugged.postBuild?.({
      ...context,
      routesPaths,
    } as unknown as Parameters<NonNullable<Plugin["postBuild"]>>[0]);
  }

  beforeEach(async () => {
    await write("site/docs/index.md", "# reforged-ts\n\nThe docs.\n");
    await write("site/typings/index.mdx", "# reforged-types\n\nThe Typings.\n");
    await write(
      "site/typings/3.0.1/functions/AbilityId.md",
      "# Function: AbilityId()\n\nAn ability's id.\n",
    );
    await write(
      "site/typings/3.0.1/interfaces/ability.md",
      "# Interface: ability\n\nAn ability.\n",
    );
  });

  const DOCS = ["/reforged-ts/docs/next"];
  const TYPINGS = [
    "/reforged-ts/typings",
    "/reforged-ts/typings/3.0.1/functions/AbilityId",
    "/reforged-ts/typings/3.0.1/interfaces/ability",
  ];

  it("link each page at its file's path, which is its route", async () => {
    await postBuild([...DOCS, ...TYPINGS]);

    const index = await readFile(join(build, "out/typings/llms.txt"), "utf8");
    expect(
      [...index.matchAll(/^- \[.*?\]\((\S+?)\)/gm)]
        .map(([, url]) => url)
        .sort(),
    ).toEqual(
      [
        "typings.md",
        "typings/3.0.1/functions/AbilityId.md",
        "typings/3.0.1/interfaces/ability.md",
      ]
        .map((path) => `${SITE_URL}/${path}`)
        .sort(),
    );
  });

  it("fail the build when a page's path is no route", async () => {
    await expect(
      postBuild([
        ...DOCS,
        ...TYPINGS.filter((route) => !route.endsWith("ability")),
      ]),
    ).rejects.toThrow(
      `${SITE_URL}/typings/3.0.1/interfaces/ability.md, which is not the Markdown copy of a page of /typings.`,
    );
  });
});
