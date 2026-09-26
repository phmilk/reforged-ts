/**
 * Fixture workspaces for the collector: a repository's Markdown sources and
 * an empty docs tree in a temporary folder.
 */
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import type { CollectOptions, Source } from "../../scripts/collector.mts";
import { SOURCES } from "../../scripts/sources.mts";

/** Writes `text` at the `/`-separated `path` under `root`. */
export async function writeText(
  root: string,
  path: string,
  text: string,
): Promise<void> {
  const target = join(root, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, text);
}

/** The text at the `/`-separated `path` under `root`. */
export const readText = (root: string, path: string) =>
  readFile(join(root, path), "utf8");

export const GLOSSARY = `# reforged-ts (fixture)

The words of the fixture. Decisions are [ADRs](docs/adr/); the tracker is [#20](../../issues/20).

## Language

**Native**:
A function the game exposes.
`;

export const ADR_1 = `---
status: accepted
date: 2026-09-23
---

# Typings are generated

Context of the first decision.
`;

export const ADR_2 = `---
status: proposed
date: 2026-09-24
---

# The site links | its sources

It follows [ADR 0001](0001-typings-generated.md#context), the [release docs](../release.md#the-website), the [glossary][words] and the [Typings](../../packages/reforged-types/).

\`[not a link](0001-typings-generated.md)\`

\`\`\`md
[not a link either](../release.md)
\`\`\`

[words]: ../../CONTEXT.md
`;

export const CHANGELOG = `# reforged-ts

## 1.0.0-alpha.1

### Patch Changes

- A fix for \`Map<K, V>\` {braces}.

## 1.0.0-alpha.0

### Major Changes

- First release.
`;

/** The lint plugin's folder, where its rule registry and rule pages are. */
export const PLUGIN = "packages/eslint-plugin-reforged";

/** The registry of a fixture lint plugin with two rules. */
export const RULE_REGISTRY = `// The registry: every rule of the plugin, one line each, sorted by name.
import type { RuleEntry } from "../rule-entry.js";
import noSleep from "./no-sleep.js";
import preferTimer from "./prefer-timer.js";

export const ruleEntries: readonly RuleEntry[] = [noSleep, preferTimer];
`;

export const NO_SLEEP_PAGE = `# no-sleep

Reports a call to \`TriggerSleepAction\`.
An error in the recommended config; the replacement is [\`prefer-timer\`](prefer-timer.md).

## Why

A sleep in a callback kills the thread.

## When not to use it

\`\`\`ts
// eslint-disable-next-line reforged/no-sleep -- a trigger action
TriggerSleepAction(1);
\`\`\`
`;

export const PREFER_TIMER_PAGE = `# prefer-timer

Reports a wait loop. A warning in the recommended config; the replacement is a Timer.

## Why

A loop that waits blocks the thread.
`;

/**
 * The files of a fixture repository with every required source of
 * `SOURCES`: a glossary, two ADRs, one changelog (reforged-ts's), the agent
 * conventions and a lint plugin with two rules; no CONTRIBUTING.md, no Agent
 * skill, no other changelog.
 */
export const REPOSITORY_FILES: Readonly<Record<string, string>> = {
  [`${PLUGIN}/src/rules/index.ts`]: RULE_REGISTRY,
  [`${PLUGIN}/docs/no-sleep.md`]: NO_SLEEP_PAGE,
  [`${PLUGIN}/docs/prefer-timer.md`]: PREFER_TIMER_PAGE,
  "CONTEXT.md": GLOSSARY,
  "docs/adr/0001-typings-generated.md": ADR_1,
  "docs/adr/0002-site-links.md": ADR_2,
  "docs/adr/README.txt": "Not an ADR.\n",
  "docs/release.md": "# Release\n",
  "packages/reforged-ts/CHANGELOG.md": CHANGELOG,
  "AGENTS.md": "# fixture\n\n## Commands\n\nRun `pnpm check`.\n",
  "packages/eslint-plugin-reforged/AGENTS.md":
    "# eslint-plugin-reforged\n\n## Adding or changing a rule\n\nSee the [glossary](../../CONTEXT.md) and [a bad escape](%zz.md).\n",
  "packages/reforged-types/AGENTS.md":
    "# reforged-types\n\n## New Patch loop\n\nVendor, then generate.\n",
};

/** A fixture repository with `files` and an empty docs tree beside it. */
export async function fixture(
  files: Readonly<Record<string, string>> = REPOSITORY_FILES,
  sources: readonly Source[] = SOURCES,
): Promise<CollectOptions> {
  const dir = await mkdtemp(join(tmpdir(), "reforged-website-collect-"));
  const root = join(dir, "repository");
  const docs = join(dir, "docs");
  await mkdir(docs, { recursive: true });
  for (const [path, text] of Object.entries(files)) {
    await writeText(root, path, text);
  }
  return { root, docs, sources };
}
