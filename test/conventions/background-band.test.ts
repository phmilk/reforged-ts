// The band of background work (#769), a project mod kept under .claude/mods/
// and listed by the repository's marketplace (.claude-plugin/marketplace.json):
// the shared project settings declare that marketplace by its GitHub source,
// at its default branch, and enable the mod, so the Template, which carries a
// copy of those settings (ADR 0024), runs the library's copy of the mod with
// no file of it copied. The mod's own tests run under `claude plugin test`
// (.claude/mods/background-band/README.md).
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { read, root } from "./repository.js";

const MOD = "background-band";
const REPOSITORY = "phmilk/reforged-ts";

interface Settings {
  extraKnownMarketplaces?: Record<
    string,
    { source: { source: string; repo?: string; ref?: string } } | undefined
  >;
  enabledPlugins?: Record<string, unknown>;
}

interface Marketplace {
  name: string;
  plugins: { name: string; source: unknown }[];
}

const settings = JSON.parse(read(".claude/settings.json")) as Settings;
const marketplace = JSON.parse(
  read(".claude-plugin/marketplace.json"),
) as Marketplace;

describe("the band of background work", () => {
  it("is listed by the repository's marketplace, from a folder holding the mod", () => {
    const entry = marketplace.plugins.find(({ name }) => name === MOD);
    expect(entry, `the entry of ${MOD} in the marketplace`).toBeDefined();
    const source = entry?.source;
    expect(
      typeof source === "string" && source.startsWith("./"),
      `the source of ${MOD} is a folder of the repository, "./<path>"`,
    ).toBe(true);
    const manifest = join(String(source), ".claude-plugin", "plugin.json");
    expect(existsSync(join(root, manifest)), `${manifest} exists`).toBe(true);
    expect(
      (JSON.parse(read(manifest)) as { name: string }).name,
      `the name in ${manifest}`,
    ).toBe(MOD);
  });

  it("is enabled by the shared settings, from the marketplace they declare by its GitHub source", () => {
    expect(
      settings.extraKnownMarketplaces?.[marketplace.name]?.source,
      `the marketplace ${marketplace.name} in extraKnownMarketplaces: ${REPOSITORY} on GitHub, at its default branch (no ref)`,
    ).toEqual({ source: "github", repo: REPOSITORY });
    expect(
      settings.enabledPlugins?.[`${MOD}@${marketplace.name}`],
      `enabledPlugins["${MOD}@${marketplace.name}"]`,
    ).toBe(true);
  });
});
