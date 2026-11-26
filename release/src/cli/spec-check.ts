/**
 * `spec:check <spec> [owner/name] [--json]`: the coverage check of a Spec
 * before it closes (ADR 0023; the rule and the table's format are in
 * `docs/agents/issue-tracker.md`, "A Spec's coverage"). Reads the Spec and
 * every sub-issue in both Board repositories, computes the verdict by
 * `release/src/spec-check.ts` and prints it: delivered, or every gap. The
 * Spec is of the library unless `owner/name` names the Template. `--json`,
 * anywhere among the arguments, prints the verdict as one JSON object
 * (`VerdictReport`) for an Agent to read; errors stay text on standard
 * error. The token is the `gh` login's. Exit codes, with or without
 * `--json`: 0 delivered, 1 gaps or a state it cannot read (no token,
 * GitHub's error, an issue that is not a Spec), 2 usage, any other flag
 * included.
 */
import { BOARD_REPOSITORIES } from "../board.js";
import {
  coverageVerdict,
  readSpec,
  renderVerdict,
  verdictReport,
} from "../spec-check.js";
import {
  errorMessage,
  ghOutput,
  gitHubApi,
  invokedDirectly,
  PROCESS_OUTPUT,
  runGh,
  type Gh,
  type Output,
} from "./common.js";

const USAGE = "Usage: spec:check <spec> [owner/name] [--json]\n";

export interface Context {
  gh: Gh;
  fetcher: typeof fetch;
}

/** The library: the repository of a Spec when none is named. */
const DEFAULT_REPOSITORY = BOARD_REPOSITORIES[0];

/**
 * The Spec, its repository and whether `--json` is among `args`, or `null`
 * when they are no usage. `--json` may come anywhere; any other flag is no
 * usage.
 */
function argumentsOf(
  args: readonly string[],
): { number: number; repository: string; json: boolean } | null {
  const positional = args.filter((arg) => arg !== "--json");
  const [spec = "", repository = DEFAULT_REPOSITORY] = positional;
  if (
    positional.length < 1 ||
    positional.length > 2 ||
    positional.some((arg) => arg.startsWith("-")) ||
    !/^#?[1-9]\d*$/.test(spec) ||
    !/^[\w.-]+\/[\w.-]+$/.test(repository)
  ) {
    return null;
  }
  return {
    number: Number(spec.replace("#", "")),
    repository,
    json: positional.length < args.length,
  };
}

export async function main(
  args: readonly string[],
  output: Output,
  context: Context = { gh: runGh, fetcher: fetch },
): Promise<number> {
  const target = argumentsOf(args);
  if (target === null) {
    output.stderr(USAGE);
    return 2;
  }
  try {
    const token = await ghOutput(
      context.gh,
      ["auth", "token"],
      "the token of the gh login; run gh auth login",
    );
    const api = gitHubApi(context.fetcher, token, "reforged-ts-spec-check");
    const spec = await readSpec(api, target.repository, target.number);
    const verdict = coverageVerdict(spec);
    output.stdout(
      target.json
        ? `${JSON.stringify(verdictReport(spec, verdict), null, 2)}\n`
        : renderVerdict(spec, verdict),
    );
    return verdict.gaps.length === 0 ? 0 : 1;
  } catch (error) {
    output.stderr(`${errorMessage(error)}\n`);
    return 1;
  }
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
