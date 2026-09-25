// The plugin's cost over typescript-eslint's type-checked preset (spec #50:
// expected below one fifth). Lints a corpus of Map code on the fixture
// project twice per round, each run in a fresh Node process: once with
// `recommendedTypeChecked` alone, once with the plugin's recommended config
// after it. Prints the median wall-clock times and the overhead.
//
// The corpus is every TypeScript block of the docs pages (the incorrect and
// correct examples of the twelve rules), written as modules to a temporary
// folder of the fixture project and removed afterwards.
//
// Usage (builds first; 10 rounds by default, about a minute):
//   pnpm --filter eslint-plugin-reforged measure-cost [rounds]
import { execFileSync } from "node:child_process";
import console from "node:console";
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const projectRoot = path.join(packageRoot, "test/fixture-project");
const corpusDir = path.join(projectRoot, ".cost");
const self = fileURLToPath(import.meta.url);

/** One lint run in this process; prints `{ ms, messages, rulesMs }`. */
async function child(variant) {
  const start = performance.now();
  const { ESLint } = await import("eslint");
  const tseslint = (await import("typescript-eslint")).default;
  const config = [
    ...tseslint.configs.recommendedTypeChecked,
    {
      languageOptions: {
        parserOptions: { projectService: true, tsconfigRootDir: corpusDir },
      },
    },
  ];
  if (variant === "plugin") {
    const { createPlugin } = await import("../dist/index.js");
    config.push(...createPlugin({ projectRoot }).configs.recommended);
  }
  const eslint = new ESLint({
    cwd: corpusDir,
    overrideConfigFile: true,
    overrideConfig: config,
    stats: true,
  });
  const results = await eslint.lintFiles(["*.ts"]);
  const ms = performance.now() - start;
  const messages = results.reduce((sum, each) => sum + each.messages.length, 0);
  // The time ESLint's stats charge to the plugin's rules, over all files.
  let rulesMs = 0;
  for (const result of results) {
    for (const pass of result.stats?.times.passes ?? []) {
      for (const [rule, time] of Object.entries(pass.rules ?? {})) {
        if (rule.startsWith("reforged/")) rulesMs += time.total;
      }
    }
  }
  process.stdout.write(JSON.stringify({ ms, messages, rulesMs }));
}

function writeCorpus() {
  rmSync(corpusDir, { recursive: true, force: true });
  mkdirSync(corpusDir);
  writeFileSync(
    path.join(corpusDir, "tsconfig.json"),
    JSON.stringify({ extends: "../tsconfig.json", include: ["*.ts"] }),
  );
  const docs = path.join(packageRoot, "docs");
  let count = 0;
  let lines = 0;
  for (const page of readdirSync(docs).sort()) {
    const text = readFileSync(path.join(docs, page), "utf8");
    for (const [, block] of text.matchAll(/```ts\n([\s\S]*?)```/g)) {
      count += 1;
      lines += block.split("\n").length;
      // A module, so its declarations do not merge with the global Natives.
      writeFileSync(
        path.join(corpusDir, `sample-${String(count).padStart(2, "0")}.ts`),
        `${block}\nexport {};\n`,
      );
    }
  }
  return { count, lines };
}

function run(variant) {
  return JSON.parse(
    // From the project root, so the default export finds the fixture's
    // optional packages too and stays silent.
    execFileSync(process.execPath, [self, "--child", variant], {
      cwd: projectRoot,
      encoding: "utf8",
    }),
  );
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

async function main() {
  const rounds = Number(process.argv[2] ?? 10);
  const corpus = writeCorpus();
  try {
    const times = { baseline: [], plugin: [] };
    const rules = [];
    let last;
    for (let round = 0; round < rounds; round += 1) {
      for (const variant of round % 2 === 0
        ? ["baseline", "plugin"]
        : ["plugin", "baseline"]) {
        last = { ...last, [variant]: run(variant) };
        times[variant].push(last[variant].ms);
        if (variant === "plugin") rules.push(last.plugin.rulesMs);
      }
    }
    const baseline = median(times.baseline);
    const plugin = median(times.plugin);
    console.log(
      `corpus: ${String(corpus.count)} modules, ${String(corpus.lines)} lines (the docs examples)`,
    );
    console.log(
      `messages: ${String(last.baseline.messages)} with the preset alone, ${String(last.plugin.messages)} with the plugin`,
    );
    console.log(
      `median of ${String(rounds)} cold runs: preset ${baseline.toFixed(0)} ms, preset + plugin ${plugin.toFixed(0)} ms`,
    );
    console.log(
      `the plugin's rules alone (ESLint stats): median ${median(rules).toFixed(0)} ms`,
    );
    console.log(
      `overhead: ${(((plugin - baseline) / baseline) * 100).toFixed(1)}%`,
    );
  } finally {
    rmSync(corpusDir, { recursive: true, force: true });
  }
}

if (process.argv[2] === "--child") {
  await child(process.argv[3]);
} else {
  await main();
}
