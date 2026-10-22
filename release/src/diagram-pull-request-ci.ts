/**
 * The CI diagram of a pull request: the workflows a `pull_request` or
 * `pull_request_target` event triggers, each with its jobs (a matrix job as
 * one node per leg, a job calling a workflow of this repository as that
 * workflow's jobs), the `needs:` between them, and the checks the committed
 * ruleset requires highlighted; then a table of the steps of `ci.yml`, in
 * order, to compare with `pnpm check`. A Collaborator and Renovate open the
 * pull request, as fixed nodes. It lands in CONTRIBUTING.md's "Pull
 * requests".
 *
 * Each node is labelled with the name GitHub gives its check: a job's
 * `name` (its id without one), `<name> (<values>)` for a matrix leg, and
 * `<caller job> / <called job>` for a job of a called workflow.
 */
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { Diagram } from "./diagrams.js";
import {
  assertDistinctIds,
  mermaidBlock,
  mermaidId,
  mermaidLabel,
} from "./mermaid.js";
import { markdownTable } from "./markdown-table.js";
import { byCodePoint } from "./order.js";
import {
  readRuleset,
  requiredStatusChecks,
  RULESET_FILE,
} from "./repo-settings.js";
import { isRecord } from "./unknown.js";
import {
  localWorkflow,
  readWorkflow,
  stringList,
  WORKFLOW_FOLDER,
  type Workflow,
  type WorkflowStep,
} from "./workflows.js";

/** The workflow whose steps the table lists. */
const STEPS_WORKFLOW = "ci.yml";
const PULL_REQUEST_EVENTS = ["pull_request", "pull_request_target"] as const;

const COLLABORATOR = "collaborator";
const RENOVATE = "renovate";
const PULL_REQUEST = "pull_request";

/** The label of each pull-request event of `on` that triggers the workflow. */
function pullRequestEvents(on: unknown): string[] {
  return PULL_REQUEST_EVENTS.flatMap((event) => {
    if (on === event || (Array.isArray(on) && on.includes(event))) {
      return [event];
    }
    if (!isRecord(on) || !(event in on)) return [];
    const filter = on[event];
    const branches = stringList(isRecord(filter) ? filter.branches : undefined);
    const types = stringList(isRecord(filter) ? filter.types : undefined);
    return [
      event +
        (branches.length > 0 ? ` into ${branches.join(", ")}` : "") +
        (types.length > 0 ? `: ${types.join(", ")}` : ""),
    ];
  });
}

/**
 * The values of each leg of the matrix of the job `id` of `file`, in
 * GitHub's order; one leg of no value without a matrix.
 */
function matrixLegs(file: string, id: string, matrix: unknown): string[][] {
  if (matrix === undefined) return [[]];
  const lists = isRecord(matrix) ? Object.entries(matrix) : [];
  if (
    lists.length === 0 ||
    lists.some(
      ([key, values]) =>
        key === "include" || key === "exclude" || !Array.isArray(values),
    )
  ) {
    throw new Error(
      `${file}: the matrix of the job ${id} is not a set of lists (include, exclude or an expression), whose check names the CI diagram cannot tell.`,
    );
  }
  return lists.reduce<string[][]>(
    (legs, [, values]) =>
      legs.flatMap((leg) =>
        (values as unknown[]).map((value) => [...leg, String(value)]),
      ),
    [[]],
  );
}

/** What the jobs of one workflow draw. */
interface Drawn {
  lines: string[];
  edges: string[];
  /** Each check node: its raw key and the check name GitHub shows. */
  checks: { key: string; name: string }[];
  /** Every raw key a node or subgraph takes, for the id clash check. */
  keys: string[];
}

/**
 * The jobs of `workflow`, their nodes keyed under `path`, their check names
 * under `prefix`, indented by `indent`.
 */
async function drawJobs(
  root: string,
  workflow: Workflow,
  path: string,
  prefix: string,
  indent: string,
): Promise<Drawn> {
  const drawn: Drawn = { lines: [], edges: [], checks: [], keys: [] };
  const anchors = new Map<string, string[]>();
  for (const job of workflow.jobs) {
    const { id } = job;
    const name = prefix + (job.name ?? id);
    const key = `${path}/${id}`;
    const called = job.uses === undefined ? undefined : localWorkflow(job.uses);
    if (called !== undefined) {
      const inner = await drawJobs(
        root,
        await readWorkflow(root, called),
        key,
        `${name} / `,
        `${indent}  `,
      );
      drawn.lines.push(
        `${indent}subgraph ${mermaidId(key)}[${mermaidLabel(
          `${called}, called by the job ${name}`,
        )}]`,
        ...inner.lines,
        `${indent}end`,
      );
      drawn.edges.push(...inner.edges);
      drawn.checks.push(...inner.checks);
      drawn.keys.push(key, ...inner.keys);
      anchors.set(id, [key]);
      continue;
    }
    const nodes = matrixLegs(workflow.file, id, job.matrix).map((values) => ({
      key: [key, ...values].join("/"),
      name: values.length > 0 ? `${name} (${values.join(", ")})` : name,
    }));
    for (const node of nodes) {
      drawn.lines.push(
        `${indent}${mermaidId(node.key)}[${mermaidLabel(node.name)}]`,
      );
    }
    drawn.checks.push(...nodes);
    drawn.keys.push(...nodes.map((node) => node.key));
    anchors.set(
      id,
      nodes.map((node) => node.key),
    );
  }
  for (const job of workflow.jobs) {
    for (const from of job.needs.flatMap((need) => anchors.get(need) ?? [])) {
      for (const to of anchors.get(job.id) ?? []) {
        drawn.edges.push(`${mermaidId(from)} --> ${mermaidId(to)}`);
      }
    }
  }
  return drawn;
}

const code = (text: string) => `\`${text.replaceAll("|", "\\|")}\``;

/** What a step is called: its name, the action it uses, or its first command. */
function stepLabel(step: WorkflowStep): string {
  if (step.name !== undefined) return step.name;
  if (step.uses !== undefined) return step.uses.replace(/@.*$/, "");
  const lines = (step.run ?? "").split("\n");
  return lines.find((line) => line.trim() !== "")?.trim() ?? "";
}

/** The table of the steps of `ci.yml`, whose one job holds them. */
async function stepsTable(root: string): Promise<string> {
  const workflow = await readWorkflow(root, STEPS_WORKFLOW);
  const jobs = workflow.jobs.filter((job) => job.steps !== undefined);
  if (jobs.length !== 1) {
    throw new Error(
      `${workflow.file}: ${String(jobs.length)} jobs with steps; the steps table of the CI diagram lists the steps of one job.`,
    );
  }
  const rows = jobs
    .flatMap((job) => job.steps ?? [])
    .map((step, index) => [
      String(index + 1),
      code(stepLabel(step)),
      step.if === undefined ? "" : code(step.if.replace(/\s+/g, " ")),
    ]);
  return markdownTable(
    ["#", `Step of ${code(STEPS_WORKFLOW)}`, code("if")],
    rows,
  );
}

async function render(root: string): Promise<string> {
  const files = (await readdir(join(root, WORKFLOW_FOLDER)))
    .filter((file) => /\.ya?ml$/.test(file))
    .sort(byCodePoint);
  const lines: string[] = [];
  const triggers: string[] = [];
  const edges: string[] = [];
  const checks: { key: string; name: string }[] = [];
  const keys: string[] = [];
  for (const file of files) {
    const workflow = await readWorkflow(root, file);
    const events = pullRequestEvents(workflow.on);
    if (events.length === 0) continue;
    const drawn = await drawJobs(root, workflow, file, "", "  ");
    lines.push(
      `subgraph ${mermaidId(file)}[${mermaidLabel(file)}]`,
      ...drawn.lines,
      "end",
    );
    for (const event of events) {
      triggers.push(
        `${PULL_REQUEST} -->|${mermaidLabel(event)}| ${mermaidId(file)}`,
      );
    }
    edges.push(...drawn.edges);
    checks.push(...drawn.checks);
    keys.push(file, ...drawn.keys);
  }
  assertDistinctIds(keys, [COLLABORATOR, RENOVATE, PULL_REQUEST]);

  const required = requiredStatusChecks(await readRuleset(root));
  const names = new Set(checks.map(({ name }) => name));
  const orphan = required.filter((name) => !names.has(name));
  if (orphan.length > 0) {
    throw new Error(
      `${RULESET_FILE} requires ${orphan.map((name) => `"${name}"`).join(", ")}, which no job of the workflows a pull request triggers reports: rename the job back, or update the ruleset.`,
    );
  }
  const highlighted = checks
    .filter(({ name }) => required.includes(name))
    .map(({ key }) => mermaidId(key));

  const block = mermaidBlock("pull-request-ci", "flowchart LR", [
    "%% Generated from the workflows a pull_request or pull_request_target event triggers, and the required checks of the committed ruleset.",
    `${COLLABORATOR}([${mermaidLabel("Collaborator")}])`,
    `${RENOVATE}([${mermaidLabel("Renovate")}])`,
    `${PULL_REQUEST}([${mermaidLabel("pull request")}])`,
    `${COLLABORATOR} -->|${mermaidLabel("opens, with a changeset")}| ${PULL_REQUEST}`,
    `${RENOVATE} -->|${mermaidLabel(
      "opens a dependency upgrade, with no changeset",
    )}| ${PULL_REQUEST}`,
    ...lines,
    ...triggers,
    ...edges,
    ...(highlighted.length > 0
      ? [
          "classDef required stroke-width:4px",
          `class ${highlighted.join(",")} required`,
        ]
      : []),
  ]);
  return `${block}\n${await stepsTable(root)}`;
}

export const pullRequestCiDiagram: Diagram = {
  name: "pull-request-ci",
  document: "CONTRIBUTING.md",
  render,
};
