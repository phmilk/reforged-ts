/**
 * `spec:check <spec> [owner/name]`: the coverage check of a Spec before it
 * closes (ADR 0023; the rule and the table's format are in
 * `docs/agents/issue-tracker.md`, "A Spec's coverage"). Reads the Spec and
 * every sub-issue in both Board repositories, computes the verdict by
 * `release/src/spec-check.ts` and prints it: delivered, or every gap. The
 * Spec is of the library unless `owner/name` names the Template. The token
 * is the `gh` login's. Exit codes: 0 delivered, 1 gaps or a state it cannot
 * read (no token, GitHub's error, an issue that is not a Spec), 2 usage.
 */
import { BOARD_REPOSITORIES, issueKey, type IssueRef } from "../board.js";
import {
  coverageVerdict,
  readSpec,
  type FetchedSpec,
  type Gap,
  type Verdict,
} from "../spec-check.js";
import {
  errorMessage,
  ghOutput,
  gitHubApi,
  invokedDirectly,
  plural,
  PROCESS_OUTPUT,
  runGh,
  type Gh,
  type Output,
} from "./common.js";

const USAGE = "Usage: spec:check <spec> [owner/name]\n";

/** `ref` as printed for a Spec of repository `home`: `#n` there, else in full. */
const displayRef = (home: string, ref: IssueRef): string =>
  ref.repository === home ? `#${String(ref.number)}` : issueKey(ref);

/** One gap as a line of the verdict, its Tickets named from repository `home`. */
function describeGap(home: string, gap: Gap): string {
  switch (gap.kind) {
    case "no-table":
      return "No Coverage table: the Spec's body has no ## Coverage table section with a table.";
    case "no-row":
      return `No row for the item "${gap.item}".`;
    case "no-item":
      return `The row of "${gap.item}" quotes no item of the Spec.`;
    case "ambiguous-row":
      return `The row of "${gap.item}" quotes words found in ${plural(gap.items, "item", "items")} of different texts, so it covers none: quote enough to name one.`;
    case "no-ticket":
      return `The row of "${gap.item}" names no Ticket.`;
    case "not-sub-issue":
      return `The row of "${gap.item}" names ${displayRef(home, gap.ticket)}, which is not a sub-issue of the Spec.`;
    case "outside-board":
      return `The row of "${gap.item}" names ${displayRef(home, gap.ticket)}, a sub-issue of the Spec outside the Board repositories (${BOARD_REPOSITORIES.join(", ")}), so no Ticket.`;
    case "no-criterion":
      return `The row of "${gap.item}" quotes the criterion "${gap.criterion}", which ${displayRef(home, gap.ticket)} does not hold.`;
    case "open":
      return `${displayRef(home, gap.ticket)} is open, held by ${
        gap.assignees.length === 0
          ? "nobody"
          : gap.assignees.map((login) => `@${login}`).join(", ")
      }, ${
        gap.unchecked === 0
          ? "with every criterion checked"
          : `with ${plural(gap.unchecked, "criterion", "criteria")} unchecked`
      }.`;
    case "not-completed":
      return `${displayRef(home, gap.ticket)} closed as ${gap.reason ?? "no reason GitHub gives"}, not as completed.`;
    case "unchecked":
      return `${displayRef(home, gap.ticket)} leaves a criterion unchecked: "${gap.criterion}".`;
    case "no-outcome":
      return `${displayRef(home, gap.ticket)} has a "check whether…" without its Outcome: line: "${gap.criterion}".`;
  }
}

/** The verdict on `spec`, as the CLI prints it. */
function renderVerdict(spec: FetchedSpec, verdict: Verdict): string {
  const head =
    `Spec #${String(spec.number)} of ${spec.repository}, "${spec.title}": ` +
    `${plural(verdict.items, "item", "items")}, ${plural(verdict.rows, "row", "rows")}, ` +
    `${plural(verdict.tickets, "Ticket", "Tickets")}.\n`;
  if (verdict.gaps.length === 0) {
    return (
      head +
      "Delivered: every item has a row, every Ticket closed as completed, " +
      'every criterion is checked and every "check whether…" carries its Outcome. ' +
      "The Spec may close.\n"
    );
  }
  return (
    head +
    `Not delivered, ${plural(verdict.gaps.length, "gap", "gaps")}:\n` +
    verdict.gaps
      .map((gap) => `- ${describeGap(spec.repository, gap)}\n`)
      .join("")
  );
}

export interface Context {
  gh: Gh;
  fetcher: typeof fetch;
}

/** The library: the repository of a Spec when none is named. */
const DEFAULT_REPOSITORY = BOARD_REPOSITORIES[0];

/** The Spec and its repository named by `args`, or `null` when they are no usage. */
function argumentsOf(
  args: readonly string[],
): { number: number; repository: string } | null {
  const [spec = "", repository = DEFAULT_REPOSITORY] = args;
  if (
    args.length < 1 ||
    args.length > 2 ||
    !/^#?[1-9]\d*$/.test(spec) ||
    !/^[\w.-]+\/[\w.-]+$/.test(repository)
  ) {
    return null;
  }
  return { number: Number(spec.replace("#", "")), repository };
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
    output.stdout(renderVerdict(spec, verdict));
    return verdict.gaps.length === 0 ? 0 : 1;
  } catch (error) {
    output.stderr(`${errorMessage(error)}\n`);
    return 1;
  }
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
