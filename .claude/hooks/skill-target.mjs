// @ts-check
// The skill-target check of ADR 0025 (#743), registered in
// .claude/settings.json on two events: a typed /implement, /implement-spec,
// /ship-spec or /split-spec (UserPromptSubmit), and a call of the Skill
// tool with one of them (PreToolUse), so that a skill another skill invokes
// is held to the same rule as one a human typed. The Upstream skills cannot
// carry the rule in their steps (ADR 0022), and the claim check stops a
// merge, not the work before it.
//
// It reads the first issue of the skill's arguments (734, #734,
// owner/repo#734 or an issue URL) and stops the skill, saying what to run
// instead, when:
//
// - /implement names an open issue with an open blocker: the blockers, and
//   the Tickets its Spec offers now, as `pnpm spec:frontier` reads them;
// - /implement, /implement-spec or /ship-spec names an open Spec with no
//   sub-issue: /split-spec first;
// - /split-spec names a Spec with Tickets and a Coverage table: nothing to
//   split. A split Spec with no table is split-spec's existing-split path.
//
// With no issue reference it is silent; when `gh` or the network fails it
// lets the skill run with a one-line warning, since the claim check still
// holds the rule on the pull request. requestOf, issueRefOf and verdict are
// pure; the rest reads GitHub through `gh` and prints the event's output.
// It always exits 0.
//
// Dependency-free: it runs on the Node that runs the session, before any
// `pnpm install`. Both repositories run it (.claude/shared.json, ADR 0024).
// The takeable Tickets come from the library's release/src/spec-frontier.ts,
// imported when the project holds it; the Template's run names the command.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL, URL } from "node:url";

/** @typedef {"implement" | "implement-spec" | "ship-spec" | "split-spec"} Skill */

/**
 * What the check looks at: the event, the skill and its arguments.
 *
 * @typedef {{ event: "UserPromptSubmit" | "PreToolUse", skill: string, args: string }} Request
 */

/** @typedef {{ repository: string, number: number }} IssueRef */

/**
 * An issue as the check reads it.
 *
 * @typedef {object} IssueFacts
 * @property {string} repository `owner/name`
 * @property {number} number
 * @property {boolean} open
 * @property {boolean} isSpec Labelled `spec`.
 * @property {number} subIssues How many sub-issues it has, open or closed.
 * @property {boolean} coverageTable Whether its body holds a `## Coverage table` section.
 * @property {readonly IssueRef[]} openBlockers
 * @property {IssueRef | null} spec Its parent, when that is a Spec.
 */

/**
 * A pass, or a block with the reason and the output its event takes.
 *
 * @typedef {{ verdict: "pass" } | { verdict: "block", reason: string, output: object }} Verdict
 */

/** The skills the check holds, by the name a prompt or the Skill tool gives. */
const SKILLS = ["implement", "implement-spec", "ship-spec", "split-spec"];

const SOURCE = "ADR 0025, .claude/hooks/skill-target.mjs";

/**
 * The skill and its arguments of a hook input, or `null` when it is none
 * of the check's: a prompt that opens with one of the skills, or a Skill
 * tool call of one (a plugin's `name:` prefix aside).
 *
 * @param {Record<string, unknown>} input
 * @returns {Request | null}
 */
export function requestOf(input) {
  if (
    input.hook_event_name === "UserPromptSubmit" &&
    typeof input.prompt === "string"
  ) {
    const match = /^\s*\/([\w-]+)(?:\s+([\s\S]*))?$/.exec(input.prompt);
    const skill = match?.[1] ?? "";
    if (!SKILLS.includes(skill)) return null;
    return {
      event: "UserPromptSubmit",
      skill,
      args: (match?.[2] ?? "").trim(),
    };
  }
  if (input.hook_event_name === "PreToolUse" && input.tool_name === "Skill") {
    const toolInput = /** @type {Record<string, unknown>} */ (
      input.tool_input ?? {}
    );
    const name =
      typeof toolInput.skill === "string"
        ? toolInput.skill.slice(toolInput.skill.indexOf(":") + 1)
        : "";
    if (!SKILLS.includes(name)) return null;
    return {
      event: "PreToolUse",
      skill: name,
      args: typeof toolInput.args === "string" ? toolInput.args.trim() : "",
    };
  }
  return null;
}

/**
 * The first issue `args` names, in `repository` unless it says another:
 * an issue URL, `owner/repo#n`, `#n` or a bare number. `null` when none.
 *
 * @param {string} args
 * @param {string} repository
 * @returns {IssueRef | null}
 */
export function issueRefOf(args, repository) {
  const match =
    /https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/issues\/(\d+)|([\w.-]+\/[\w.-]+)#(\d+)|#(\d+)|(?<![\w.#/-])(\d+)(?![\w.])/.exec(
      args,
    );
  if (match === null) return null;
  const owned = match[1] ?? match[3];
  const number = match[2] ?? match[4] ?? match[5] ?? match[6];
  return { repository: owned ?? repository, number: Number(number) };
}

/**
 * `ref` as said from `home`: `#n` there, `owner/name#n` elsewhere.
 *
 * @param {IssueRef} ref
 * @param {string} home
 */
function refName(ref, home) {
  return ref.repository === home
    ? `#${String(ref.number)}`
    : `${ref.repository}#${String(ref.number)}`;
}

/**
 * `a`, `a and b`, `a, b and c`.
 *
 * @param {readonly string[]} items
 */
function andList(items) {
  return items.length <= 1
    ? items.join("")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * The output that stops `event` with `reason`.
 *
 * @param {Request["event"]} event
 * @param {string} reason
 * @returns {Verdict}
 */
function block(event, reason) {
  return {
    verdict: "block",
    reason,
    output:
      event === "UserPromptSubmit"
        ? { decision: "block", reason }
        : {
            hookSpecificOutput: {
              hookEventName: "PreToolUse",
              permissionDecision: "deny",
              permissionDecisionReason: reason,
            },
          },
  };
}

/**
 * The check's verdict on `request` for the issue `issue`. `takeable` lists
 * the Tickets of the issue's Spec takeable now, each as a line, or is
 * `null` when the Frontier could not be read here.
 *
 * @param {Request} request
 * @param {IssueFacts} issue
 * @param {readonly string[] | null} takeable
 * @returns {Verdict}
 */
export function verdict(request, issue, takeable) {
  const { skill } = request;
  const home = issue.repository;
  const n = String(issue.number);
  if (!issue.open) return { verdict: "pass" };
  if (skill === "implement" && issue.openBlockers.length > 0) {
    const blockers = andList(
      issue.openBlockers.map((ref) => refName(ref, home)),
    );
    const spec = issue.spec === null ? null : refName(issue.spec, home);
    const specNumber = issue.spec === null ? "" : String(issue.spec.number);
    const next =
      spec === null
        ? "Deliver the blockers first."
        : takeable === null
          ? `Run pnpm spec:frontier ${specNumber}${issue.spec?.repository === home ? "" : ` ${issue.spec?.repository ?? ""}`} in a clone of the library for the Tickets to take instead, or deliver the blockers first.`
          : takeable.length === 0
            ? `No Ticket of its Spec ${spec} is takeable now: deliver the blockers first.`
            : `Takeable now in its Spec ${spec}: ${takeable.join("; ")}. Run /implement on one of them instead, or deliver the blockers first.`;
    return block(
      request.event,
      `#${n} is blocked by ${blockers}, still open: a Ticket is implemented once its blockers are closed (${SOURCE}). ${next}`,
    );
  }
  if (
    (skill === "implement" ||
      skill === "implement-spec" ||
      skill === "ship-spec") &&
    issue.isSpec &&
    issue.subIssues === 0
  ) {
    return block(
      request.event,
      `#${n} is a Spec with no Ticket yet (needs-split): an unsplit Spec is not worked, whole or in part (${SOURCE}). Run /split-spec ${n} first.`,
    );
  }
  if (
    skill === "split-spec" &&
    issue.isSpec &&
    issue.subIssues > 0 &&
    issue.coverageTable
  ) {
    return block(
      request.event,
      `#${n} is already split: it has Tickets and a Coverage table, so there is nothing to split (${SOURCE}). Take a Ticket of its Frontier (pnpm spec:frontier ${n}) with /implement, or check its coverage with pnpm spec:check ${n}.`,
    );
  }
  return { verdict: "pass" };
}

// GitHub, through `gh`.

/** How long one `gh` call may take: the session waits on it. */
const GH_TIMEOUT_MS = 20_000;

/**
 * `gh`'s standard output for `args` (constants and a checked repository
 * name only), with `input` on its standard input; throws with `gh`'s own
 * message when it fails. On Windows the shell finds `gh.exe` or a `gh.cmd`.
 *
 * @param {readonly string[]} args
 * @param {string} [input]
 * @returns {string}
 */
function gh(args, input) {
  const windows = process.platform === "win32";
  const result = windows
    ? spawnSync(`gh ${args.join(" ")}`, {
        input,
        encoding: "utf8",
        shell: true,
        timeout: GH_TIMEOUT_MS,
      })
    : spawnSync("gh", args, {
        input,
        encoding: "utf8",
        timeout: GH_TIMEOUT_MS,
      });
  if (result.error !== undefined) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      (result.stderr || `gh ${args[0] ?? ""} exited ${String(result.status)}`)
        .trim()
        .split("\n")[0],
    );
  }
  return result.stdout;
}

/**
 * The `data` of a GraphQL query sent through `gh api graphql`.
 *
 * @param {string} query
 * @param {Record<string, unknown>} variables
 * @returns {Record<string, unknown>}
 */
function graphql(query, variables) {
  /** @type {any} */
  const body = JSON.parse(
    gh(
      ["api", "graphql", "--input", "-"],
      JSON.stringify({ query, variables }),
    ),
  );
  if (Array.isArray(body?.errors) && body.errors.length > 0) {
    throw new Error(String(body.errors[0]?.message ?? "GraphQL error"));
  }
  return body?.data ?? {};
}

const ISSUE = `query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    issue(number: $number) {
      state
      body
      labels(first: 50) { nodes { name } }
      subIssues(first: 1) { totalCount }
      blockedBy(first: 50) { nodes { number state repository { nameWithOwner } } }
      parent { number repository { nameWithOwner } labels(first: 50) { nodes { name } } }
    }
  }
}`;

/**
 * @param {unknown} labels
 * @returns {boolean}
 */
function hasSpecLabel(labels) {
  /** @type {any} */
  const connection = labels;
  return (connection?.nodes ?? []).some(
    (/** @type {any} */ label) => label?.name === "spec",
  );
}

/**
 * The facts of issue `ref`, read from GitHub.
 *
 * @param {IssueRef} ref
 * @returns {IssueFacts}
 */
function readIssue(ref) {
  const [owner, name] = ref.repository.split("/");
  /** @type {any} */
  const data = graphql(ISSUE, { owner, name, number: ref.number });
  const issue = data?.repository?.issue;
  if (issue === null || issue === undefined) {
    throw new Error(
      `${ref.repository}#${String(ref.number)} could not be read`,
    );
  }
  const parent = issue.parent;
  return {
    repository: ref.repository,
    number: ref.number,
    open: issue.state === "OPEN",
    isSpec: hasSpecLabel(issue.labels),
    subIssues: Number(issue.subIssues?.totalCount ?? 0),
    coverageTable: /^## Coverage table[ \t]*$/m.test(String(issue.body ?? "")),
    openBlockers: (issue.blockedBy?.nodes ?? [])
      .filter((/** @type {any} */ node) => node?.state === "OPEN")
      .map((/** @type {any} */ node) => ({
        repository: String(node.repository?.nameWithOwner),
        number: Number(node.number),
      })),
    spec:
      parent !== null && parent !== undefined && hasSpecLabel(parent.labels)
        ? {
            repository: String(parent.repository?.nameWithOwner),
            number: Number(parent.number),
          }
        : null,
  };
}

/**
 * The takeable Tickets of Spec `spec`, one line each, as the library's
 * Frontier query reads them for the `gh` login; `null` when the project
 * holds no release/src/spec-frontier.ts (the Template) or it fails.
 *
 * @param {string} projectDir
 * @param {IssueRef} spec
 * @returns {Promise<string[] | null>}
 */
async function takeableOf(projectDir, spec) {
  const module = join(projectDir, "release", "src", "spec-frontier.ts");
  if (!existsSync(module)) return null;
  try {
    /** @type {any} */
    const frontier = await import(pathToFileURL(module).href);
    const [owner, name] = spec.repository.split("/");
    const read = frontier.specOf(
      graphql(frontier.SPEC_QUERY, { owner, name, number: spec.number }),
      spec.repository,
      spec.number,
    );
    const answer = frontier.frontierQuery(read.spec, read.login);
    return answer.takeable.map(
      (/** @type {any} */ ticket) =>
        `${refName(ticket, spec.repository)} ${String(ticket.title)}`,
    );
  } catch {
    return null;
  }
}

/** The repository of the clone the session runs in, `owner/name`. */
function currentRepository() {
  const name = gh([
    "repo",
    "view",
    "--json",
    "nameWithOwner",
    "--jq",
    ".nameWithOwner",
  ]).trim();
  if (!/^[\w.-]+\/[\w.-]+$/.test(name)) {
    throw new Error("gh repo view named no repository");
  }
  return name;
}

/**
 * The output that lets the skill run and says why the check could not.
 *
 * @param {string} message
 */
function warning(message) {
  return {
    systemMessage: `The skill-target check could not read GitHub (${message}); the skill runs, and the claim check still holds the rule on its pull request.`,
  };
}

/**
 * Runs the check on `input`; resolves with the output to print, or `null`.
 *
 * @param {Record<string, unknown>} input
 * @param {string} projectDir
 * @returns {Promise<object | null>}
 */
export async function run(input, projectDir) {
  const request = requestOf(input);
  if (request === null) return null;
  // A bare number or #n names an issue of this clone's repository.
  const named = issueRefOf(request.args, "");
  if (named === null) return null;
  try {
    const ref =
      named.repository === ""
        ? { repository: currentRepository(), number: named.number }
        : named;
    const issue = readIssue(ref);
    const takeable =
      request.skill === "implement" &&
      issue.open &&
      issue.openBlockers.length > 0 &&
      issue.spec !== null
        ? await takeableOf(projectDir, issue.spec)
        : null;
    const result = verdict(request, issue, takeable);
    return result.verdict === "block" ? result.output : null;
  } catch (error) {
    return warning(error instanceof Error ? error.message : String(error));
  }
}

function isMain() {
  const entry = process.argv[1];
  if (entry === undefined) return false;
  const self = fileURLToPath(import.meta.url);
  try {
    return (
      realpathSync(entry).toLowerCase() === realpathSync(self).toLowerCase()
    );
  } catch {
    return false;
  }
}

if (isMain()) {
  try {
    /** @type {Record<string, unknown>} */
    const input = JSON.parse(readFileSync(0, "utf8"));
    const projectDir =
      process.env.CLAUDE_PROJECT_DIR ??
      fileURLToPath(new URL("../../", import.meta.url));
    const output = await run(input, projectDir);
    if (output !== null) process.stdout.write(`${JSON.stringify(output)}\n`);
  } catch {
    // Never a failed prompt or call on the check's own error.
  }
  process.exitCode = 0;
}
