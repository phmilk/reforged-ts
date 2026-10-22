/**
 * The release diagram: the jobs of `release.yml` and their `needs`, a
 * reusable workflow a job calls as its own node, and the Template's
 * `sync.yml`, which the release dispatches to, as the one external node. It
 * lands in docs/release.md's "The release workflow".
 */
import type { Diagram } from "./diagrams.js";
import {
  assertDistinctIds,
  mermaidBlock,
  mermaidId,
  mermaidLabel,
} from "./mermaid.js";
import { TEMPLATE_REPOSITORY } from "./template-clone.js";
import { jobModes } from "./workflow-modes.js";
import { localWorkflow, readWorkflow } from "./workflows.js";

const WORKFLOW = "release.yml";
/** The job whose outputs decide the mode of a run. */
const SELECT = "select";
const WORKFLOW_ID = "release_yml";

/** The Template's sync workflow, which the release dispatches to. */
const TEMPLATE_SYNC = {
  repository: TEMPLATE_REPOSITORY,
  workflow: "sync.yml",
  /** The job of `release.yml` that sends the dispatch. */
  dispatchedBy: "template-dispatch",
};
const TEMPLATE_ID = "template";
const SYNC_ID = mermaidId(TEMPLATE_SYNC.workflow);

/** The node of a reusable workflow a job calls: its id and its label. */
function calledWorkflow(uses: string): { id: string; label: string } {
  const local = localWorkflow(uses);
  if (local !== undefined) return { id: mermaidId(local), label: local };
  const [path = uses] = uses.split("@");
  const [owner = "", repository = ""] = path.split("/");
  const file = path.split("/").at(-1) ?? path;
  const label = `${file} of ${owner}/${repository}`;
  return { id: mermaidId(`${owner}/${repository}/${file}`), label };
}

async function render(root: string): Promise<string> {
  const { file, jobs } = await readWorkflow(root, WORKFLOW);
  const byId = new Map(jobs.map((job) => [job.id, job]));
  for (const { id, needs } of jobs) {
    for (const need of needs) {
      if (!byId.has(need)) {
        throw new Error(
          `The job ${id} of ${file} needs ${need}, which the workflow does not hold.`,
        );
      }
    }
  }
  if (!byId.has(TEMPLATE_SYNC.dispatchedBy)) {
    throw new Error(
      `${file} holds no job ${TEMPLATE_SYNC.dispatchedBy}, which dispatches the release to the Template's ${TEMPLATE_SYNC.workflow}: update the external node of release/src/diagram-release.ts.`,
    );
  }

  const called = new Map(
    jobs.flatMap(({ uses }) =>
      uses === undefined ? [] : [[uses, calledWorkflow(uses)] as const],
    ),
  );
  assertDistinctIds(
    jobs.map(({ id }) => id),
    [
      WORKFLOW_ID,
      TEMPLATE_ID,
      SYNC_ID,
      ...[...called.values()].map(({ id }) => id),
    ],
  );

  const modes = jobModes(jobs, SELECT);
  const edges: string[] = [];
  for (const job of jobs) {
    const label = mermaidLabel(modes.get(job.id) ?? "always");
    edges.push(
      ...job.needs.map(
        (need) => `${mermaidId(need)} -->|${label}| ${mermaidId(job.id)}`,
      ),
    );
    const workflow = job.uses === undefined ? undefined : called.get(job.uses);
    if (workflow !== undefined) {
      edges.push(
        `${mermaidId(job.id)} -->|${mermaidLabel("calls")}| ${workflow.id}`,
      );
    }
    if (job.id === TEMPLATE_SYNC.dispatchedBy) {
      edges.push(
        `${mermaidId(job.id)} -.->|${mermaidLabel("dispatches the release")}| ${SYNC_ID}`,
      );
    }
  }

  return mermaidBlock("release", "flowchart LR", [
    `%% Generated from ${WORKFLOW}: its jobs and their needs, each edge labelled by the modes, as the select job decides them, in which the job it leads to runs, then "if" and what else its condition reads, which select does not decide.`,
    `subgraph ${WORKFLOW_ID}[${mermaidLabel(WORKFLOW)}]`,
    ...jobs.map((job) => `  ${mermaidId(job.id)}[${mermaidLabel(job.id)}]`),
    "end",
    ...[...called.values()].map(
      ({ id: node, label }) => `${node}[[${mermaidLabel(label)}]]`,
    ),
    `subgraph ${TEMPLATE_ID}[${mermaidLabel(`Template: ${TEMPLATE_SYNC.repository}`)}]`,
    `  ${SYNC_ID}([${mermaidLabel(TEMPLATE_SYNC.workflow)}])`,
    "end",
    ...edges,
  ]);
}

export const releaseDiagram: Diagram = {
  name: "release",
  document: "docs/release.md",
  render,
};
