/**
 * `patch-watch:plan`: whether jass-history tags a live game Patch newer than
 * the supported one. Fetches the full tag list through the paginated tags
 * API, reads the supported Patch and the vendored Builds from the
 * repository, and prints the plan; changes nothing. `--json` prints the plan
 * as one JSON object for the Patch-watch workflow. Exit codes: 0 the plan
 * (empty or not), 1 the tags or the repository cannot be read, 2 usage.
 */
import { compareBuilds, isBuild } from "../build.js";
import { fetchTags } from "../jass-history.js";
import {
  planPatchWatch,
  readWatchRepository,
  type IgnoredTag,
  type NewPatch,
  type PatchWatchPlan,
} from "../patch-watch.js";
import { TYPINGS_PACKAGE } from "../packages.js";
import { repositoryRoot } from "../workspace.js";
import {
  errorMessage,
  invokedDirectly,
  PROCESS_OUTPUT,
  type Output,
} from "./common.js";

const USAGE =
  "Usage: patch-watch:plan [--simulate-current-patch <build>] [--reported <build>]... [--json]\n";

export interface Context {
  root: string;
  env: Readonly<Record<string, string | undefined>>;
  fetcher: typeof fetch;
}

interface Options {
  simulated: string | null;
  reported: string[];
  json: boolean;
}

/** The options of the arguments; `undefined` on a usage error. */
function parseArgs(args: readonly string[]): Options | undefined {
  const options: Options = { simulated: null, reported: [], json: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--json") {
      options.json = true;
      continue;
    }
    const value = args.at(i + 1);
    if (!isBuild(value)) return undefined;
    if (arg === "--reported") options.reported.push(value);
    // Given once: a second value would silently win.
    else if (arg === "--simulate-current-patch" && options.simulated === null)
      options.simulated = value;
    else return undefined;
    i++;
  }
  return options;
}

/** The JSON the workflow reads: the plan and the inputs it came from. */
export interface PlanReport extends PatchWatchPlan {
  /** Whether `supported` is the `--simulate-current-patch` override. */
  simulated: boolean;
  /** The vendored Builds the plan skips (the simulation forgets some). */
  vendored: string[];
  reported: string[];
  /** How many tags jass-history has. */
  tags: number;
}

/** Ignored tags printed as one count, not one line each. */
const COUNTED: Partial<Record<IgnoredTag["reason"], string>> = {
  "no-build":
    "without a four-number Build (baseline, locale-only tags, old betas)",
  "not-newer": "not above the supported Patch",
};

function describePatch(patch: NewPatch): string {
  return `${patch.build} (tag ${patch.tag}, commit ${patch.commit})`;
}

const tagCount = (count: number) =>
  `${String(count)} ${count === 1 ? "tag" : "tags"}`;

/** The plan for a person to read. */
function describeReport(report: PlanReport): string {
  const supported = report.simulated
    ? `${report.supported} (simulated)`
    : `${report.supported} (${TYPINGS_PACKAGE} reforged.patch)`;
  const lines = [
    `jass-history: ${tagCount(report.tags)}. Supported Patch: ${supported}. ` +
      `Vendored: ${report.vendored.join(", ") || "none"}. Reported: ${report.reported.join(", ") || "none"}.`,
  ];
  if (report.patch === null) {
    lines.push("No new live Patch.");
  } else {
    const { links } = report.patch;
    lines.push(
      `New live Patch: ${describePatch(report.patch)}.`,
      `  ${links.tag}`,
      `  ${links.commit}`,
      `  ${links.scripts}`,
    );
  }
  if (report.superseded.length > 0) {
    lines.push(
      "Superseded:",
      ...report.superseded.map((older) => `- ${describePatch(older)}`),
    );
  }
  if (report.ignored.length > 0) lines.push("Ignored:");
  for (const { reason, message } of report.ignored) {
    if (!(reason in COUNTED)) lines.push(`- ${message}`);
  }
  for (const [reason, what] of Object.entries(COUNTED)) {
    const count = report.ignored.filter((tag) => tag.reason === reason).length;
    if (count > 0) lines.push(`- ${tagCount(count)} ${what}.`);
  }
  return lines.map((line) => `${line}\n`).join("");
}

/** The token of the environment, as GitHub Actions and `gh` name it. */
function token(
  env: Readonly<Record<string, string | undefined>>,
): string | undefined {
  return [env.GITHUB_TOKEN, env.GH_TOKEN].find(
    (value) => value !== undefined && value !== "",
  );
}

export async function main(
  args: readonly string[],
  output: Output,
  context: Context = { root: repositoryRoot, env: process.env, fetcher: fetch },
): Promise<number> {
  const options = parseArgs(args);
  if (options === undefined) {
    output.stderr(USAGE);
    return 2;
  }

  let report: PlanReport;
  try {
    const repository = await readWatchRepository(context.root);
    const tags = await fetchTags(context.fetcher, token(context.env));
    const supported = options.simulated ?? repository.supported;
    // Simulating an older Patch also forgets the Builds vendored after it,
    // so the vendored Build itself can be planned again.
    const vendored =
      options.simulated === null
        ? repository.vendored
        : repository.vendored.filter(
            (build) => compareBuilds(build, supported) <= 0,
          );
    const plan = planPatchWatch({
      tags,
      supported,
      vendored,
      reported: options.reported,
    });
    report = {
      supported: plan.supported,
      simulated: options.simulated !== null,
      vendored,
      reported: options.reported,
      tags: tags.length,
      patch: plan.patch,
      superseded: plan.superseded,
      ignored: plan.ignored,
    };
  } catch (error) {
    output.stderr(`${errorMessage(error)}\n`);
    return 1;
  }

  output.stdout(
    options.json
      ? `${JSON.stringify(report, null, 2)}\n`
      : describeReport(report),
  );
  return 0;
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
