// The site's files for AI agents (#186): one set per docs version and one
// for the Typings, and the check of what docusaurus-plugin-llms wrote, on a
// build folder written here.
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { llmsProblems, llmsTargets, llmsUrl } from "../../llms";

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
