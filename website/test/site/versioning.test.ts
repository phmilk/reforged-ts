// The docs versions as the site serves them (#185): the cut versions of
// versions.json, the newest at its label as well as without it, and the
// compatibility matrix's docs links.
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { docsVersionLabel } from "../../src/docsVersionUrl";
import {
  cutVersions,
  docsVersions,
  newestVersionAliases,
} from "../../versioning";

let site: string;

beforeEach(async () => {
  site = await mkdtemp(join(tmpdir(), "reforged-website-versioning-"));
});

afterEach(async () => {
  await rm(site, { recursive: true, force: true });
});

describe("the cut versions", () => {
  it("are none before the first cut", () => {
    expect(cutVersions(site)).toEqual([]);
    expect(docsVersions([])).toEqual({
      current: { label: "Next", path: "next" },
    });
  });

  it("are read from versions.json, the newest served at its label", async () => {
    await writeFile(join(site, "versions.json"), '["1.1", "1.0"]\n');

    const cut = cutVersions(site);

    expect(cut).toEqual(["1.1", "1.0"]);
    expect(docsVersions(cut)).toEqual({
      current: { label: "Next", path: "next" },
      "1.1": { path: "1.1" },
    });
  });
});

describe("the newest version without its label", () => {
  const aliases = newestVersionAliases(["1.1", "1.0"]);

  it("answers for each page of the newest version", () => {
    expect(aliases("/docs/1.1")).toEqual(["/docs"]);
    expect(aliases("/docs/1.1/guides/lint-rules/no-sleep")).toEqual([
      "/docs/guides/lint-rules/no-sleep",
    ]);
    expect(aliases("/docs/1.1/api/reforged-ts/classes/Unit")).toEqual([
      "/docs/api/reforged-ts/classes/Unit",
    ]);
  });

  it("leaves out the other versions and the other routes", () => {
    expect(aliases("/typings/3.0.0/functions/KillUnit")).toBe(undefined);
    expect(aliases("/docs/1.0/guides")).toBe(undefined);
    expect(aliases("/docs/1.10/guides")).toBe(undefined);
    expect(aliases("/docs/next/guides")).toBe(undefined);
    expect(aliases("/")).toBe(undefined);
  });

  it("is nothing before the first cut", () => {
    expect(newestVersionAliases([])("/docs/next")).toBe(undefined);
  });
});

describe("a docs link of the compatibility matrix", () => {
  const site = { url: "https://phmilk.github.io", baseUrl: "/reforged-ts/" };

  it("names the docs version of its release", () => {
    expect(
      docsVersionLabel("https://phmilk.github.io/reforged-ts/docs/1.0", site),
    ).toBe("1.0");
  });

  it("is told apart from any other link", () => {
    for (const href of [
      "https://phmilk.github.io/reforged-ts/docs/next",
      "https://phmilk.github.io/reforged-ts/docs/1.0/guides",
      "https://github.com/phmilk/reforged-ts",
      "/docs/1.0",
    ]) {
      expect(docsVersionLabel(href, site)).toBe(undefined);
    }
  });
});
