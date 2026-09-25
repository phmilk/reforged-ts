// The plugin's export: the rule table of #16 (as amended by spec #50), the
// recommended config, every rule's metadata and its docs page.
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, describe, expect, it, vi } from "vitest";

import { createPlugin } from "../src/index.js";
import { lintWithRecommended } from "./support/lint.js";
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

/** The rules that read another package's data file, by the package they need. */
const optionalRules = {
  "reforged-ts": "no-legacy-w3ts-names",
  "reforged-types": "no-async-value-as-state",
} as const;

const ruleNames = Object.keys(plugin.rules);

/** A module every rule of the table reports once or more. */
const everyRuleReports = `
import "w3ts";
import { MapPlayer, Unit } from "reforged-ts";

declare const player: MapPlayer;
declare const unit: Unit;

const ticker = CreateTimer();
export const kills = new Map<Unit, number>();
export const slot = GetHandleId(ticker) % 12;
export let zoom = 0;

function onTick(): void {
  TriggerSleepAction(1);
  AddSpecialEffect("war3mapImported/Fire.v2.mdx", 0, 0);
  print("100% done");
  zoom = GetCameraTargetPositionX();
  if (player.isLocal()) {
    CreateTimer();
  }
  for (const key in kills) {
    print(key);
  }
  onTick();
}
TimerStart(ticker, 1, true, onTick);
`;

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

  it("exports every rule of the decided table, and only those", () => {
    expect(Object.keys(decidedTable)).toHaveLength(12);
    expect([...ruleNames].sort()).toEqual(Object.keys(decidedTable).sort());
  });

  it("decides six errors and six warnings", () => {
    const severities = Object.values(decidedTable);
    expect(severities.filter((each) => each === "error")).toHaveLength(6);
    expect(severities.filter((each) => each === "warn")).toHaveLength(6);
  });
});

describe("loading in a project with neither optional package", () => {
  const root = mkdtempSync(path.join(tmpdir(), "eslint-plugin-reforged-"));
  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  const bare = createPlugin({ projectRoot: root });
  const warnings = warn.mock.calls.map((call) => String(call[0]));
  warn.mockRestore();

  it("warns once per missing package, naming the rule it disables", () => {
    expect([...warnings].sort()).toEqual(
      Object.entries(optionalRules).map(
        ([each, rule]) =>
          `eslint-plugin-reforged: ${each} is not installed in ${root} (resolved from the project root); disabled: reforged/${rule}.`,
      ),
    );
  });

  it("keeps every rule registered, at its decided severity", () => {
    expect(Object.keys(bare.rules).sort()).toEqual(
      Object.keys(decidedTable).sort(),
    );
    expect(bare.configs.recommended[0].rules).toEqual(
      plugin.configs.recommended[0].rules,
    );
  });

  it("disables exactly rules 6 and 9", () => {
    // Every rule reports this module on the fixture project; with neither
    // package installed, only rules 6 and 9 fall silent.
    const reported = (each: typeof plugin) =>
      new Set(lintWithRecommended(everyRuleReports, each).map((m) => m.ruleId));
    expect([...reported(plugin)].sort()).toEqual(
      Object.keys(decidedTable)
        .map((rule) => `reforged/${rule}`)
        .sort(),
    );
    expect([...reported(bare)].sort()).toEqual(
      Object.keys(decidedTable)
        .filter((rule) => !Object.values<string>(optionalRules).includes(rule))
        .map((rule) => `reforged/${rule}`)
        .sort(),
    );
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

describe.each(Object.keys(decidedTable))("rule %s", (rule) => {
  const meta = Object.hasOwn(plugin.rules, rule)
    ? plugin.rules[rule].meta
    : undefined;

  it("is exported", () => {
    expect(meta).toBeDefined();
  });

  it("links to its docs page", () => {
    expect(meta?.docs?.url).toBe(
      `https://phmilk.github.io/reforged-ts/next/lint/${rule}`,
    );
    expect(meta?.docs?.description).toBeTruthy();
  });

  it("fixes code only if it is the legacy-names rule", () => {
    expect(meta?.fixable === undefined).toBe(!fixableRules.has(rule));
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
