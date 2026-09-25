// The plugin's export: the rule table of #16 (as amended by spec #50), the
// recommended config, every rule's metadata and its docs page.
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { plugin } from "./support/plugin.js";

/** #16's rule table: every rule the plugin may export, at its decided severity. */
const decidedTable: Readonly<Record<string, "error" | "warn">> = {
  "no-game-state-in-local-branch": "error",
  "no-handles-at-module-top-level": "error",
  "no-unsafe-natives": "error",
  "no-unused-handle-result": "error",
  "no-dotted-asset-paths": "error",
  "no-legacy-w3ts-names": "error",
  "no-unordered-iteration": "warn",
  "no-handle-id-as-data": "warn",
  "no-async-value-as-state": "warn",
  "no-percent-in-display-strings": "warn",
  "prefer-handle-map": "warn",
  "no-self-recursion": "warn",
};

/** The one rule allowed to fix code (spec #50: rule 6, one-to-one renames). */
const fixableRules = new Set(["no-legacy-w3ts-names"]);

/** The fixed sections of a rule's docs page, in order. */
const docsSections = [
  "## Why",
  "## Incorrect",
  "## Correct",
  "## Options",
  "## Suggestions and fixes",
  "## When not to use it",
];

const ruleNames = Object.keys(plugin.rules);

function docsPage(rule: string): URL {
  return new URL(`../docs/${rule}.md`, import.meta.url);
}

describe("the plugin object", () => {
  it("names itself with the package name and version", () => {
    const packageJson = JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf8"),
    ) as { name: string; version: string };
    expect(plugin.meta).toEqual({
      name: packageJson.name,
      version: packageJson.version,
    });
  });

  it("exports rules only from the decided table", () => {
    expect(ruleNames.length).toBeGreaterThan(0);
    for (const rule of ruleNames) {
      expect(decidedTable, rule).toHaveProperty([rule]);
    }
  });
});

describe("configs.recommended", () => {
  const entry = plugin.configs.recommended[0];

  it("is one flat-config entry that registers the plugin as reforged", () => {
    expect(plugin.configs.recommended).toHaveLength(1);
    expect(entry.plugins?.reforged).toBe(plugin);
  });

  it("sets no parser and no project options", () => {
    expect(entry).not.toHaveProperty("languageOptions");
    expect(entry).not.toHaveProperty("files");
  });

  it("sets every exported rule, and only those, at its decided severity", () => {
    expect(entry.rules).toEqual(
      Object.fromEntries(
        ruleNames.map((rule) => [`reforged/${rule}`, decidedTable[rule]]),
      ),
    );
  });
});

describe.each(ruleNames)("rule %s", (rule) => {
  const { meta } = plugin.rules[rule];

  it("links to its docs page", () => {
    expect(meta.docs?.url).toBe(
      `https://phmilk.github.io/reforged-ts/next/lint/${rule}`,
    );
    expect(meta.docs?.description).toBeTruthy();
  });

  it("fixes code only if it is the legacy-names rule", () => {
    expect(meta.fixable === undefined).toBe(!fixableRules.has(rule));
  });

  it("has a docs page with the fixed sections in order", () => {
    const page = docsPage(rule);
    expect(existsSync(page), `docs/${rule}.md`).toBe(true);
    const text = readFileSync(page, "utf8");
    const [title, blank, summary] = text.split("\n");
    expect(title).toBe(`# ${rule}`);
    expect(blank).toBe("");
    expect(summary, "the summary paragraph").toMatch(/\S/);
    const headings = text.split("\n").filter((line) => line.startsWith("## "));
    expect(headings).toEqual(docsSections);
  });
});
