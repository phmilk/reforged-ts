/**
 * Reading a workflow of a repository root's `.github/workflows/`, for the
 * generated diagrams: its jobs in the order the file writes them, with the
 * fields a diagram draws.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";
import { isRecord } from "./unknown.js";

/** The folder of the workflows, from a repository root. */
export const WORKFLOW_FOLDER = ".github/workflows";

/** A job of a workflow, as a diagram reads it. */
export interface WorkflowJob {
  /** Its key under `jobs`. */
  id: string;
  /** Its `needs`, a string or a list in the file, as a list. */
  needs: string[];
  /** Its `if`, as text without `${{ }}`; absent when it has none. */
  if?: string;
  /** The reusable workflow it calls (`uses`), as written. */
  uses?: string;
  /** Its `name`; absent when it has none, and GitHub shows its id. */
  name?: string;
  /** Its `strategy.matrix`, as parsed; absent when it has none. */
  matrix?: unknown;
  /** Its steps, in order; absent for a job that calls a workflow. */
  steps?: WorkflowStep[];
}

/** A step of a job, as a diagram reads it. */
export interface WorkflowStep {
  name?: string;
  /** The action it uses, as written. */
  uses?: string;
  /** Its command, as written. */
  run?: string;
  /** Its `if`, as text without `${{ }}`; absent when it has none. */
  if?: string;
}

export interface Workflow {
  /** Its `/`-separated path from the root. */
  file: string;
  /** Its `on`, as parsed. */
  on: unknown;
  /** Its jobs, in the order of the file. */
  jobs: WorkflowJob[];
}

const strings = (value: unknown): string[] =>
  typeof value === "string"
    ? [value]
    : Array.isArray(value)
      ? value.filter((item) => typeof item === "string")
      : [];

/** The text of an `if`: a string or a boolean, its `${{ }}` taken off. */
function condition(value: unknown): string | undefined {
  if (typeof value === "boolean") return String(value);
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  const wrapped = /^\$\{\{([\s\S]*)\}\}$/.exec(text)?.[1];
  return (wrapped ?? text).trim();
}

/** A step's fields a diagram reads. */
function readStep(fields: Record<string, unknown>): WorkflowStep {
  const step: WorkflowStep = {};
  if (typeof fields.name === "string") step.name = fields.name;
  if (typeof fields.uses === "string") step.uses = fields.uses;
  if (typeof fields.run === "string") step.run = fields.run;
  const ifText = condition(fields.if);
  if (ifText !== undefined) step.if = ifText;
  return step;
}

/**
 * The workflow `name` (`release.yml`) of the repository at `root`. Throws
 * when it cannot be read or holds no `jobs` mapping.
 */
export async function readWorkflow(
  root: string,
  name: string,
): Promise<Workflow> {
  const file = `${WORKFLOW_FOLDER}/${name}`;
  const parsed: unknown = parse(await readFile(join(root, file), "utf8"));
  const jobs = isRecord(parsed) ? parsed.jobs : undefined;
  if (!isRecord(jobs)) throw new Error(`${file} holds no jobs.`);
  return {
    file,
    on: isRecord(parsed) ? parsed.on : undefined,
    jobs: Object.entries(jobs).map(([id, job]) => {
      const fields = isRecord(job) ? job : {};
      const ifText = condition(fields.if);
      const matrix = isRecord(fields.strategy)
        ? fields.strategy.matrix
        : undefined;
      return {
        id,
        needs: strings(fields.needs),
        ...(ifText === undefined ? {} : { if: ifText }),
        ...(typeof fields.uses === "string" ? { uses: fields.uses } : {}),
        ...(typeof fields.name === "string" ? { name: fields.name } : {}),
        ...(matrix === undefined ? {} : { matrix }),
        ...(Array.isArray(fields.steps)
          ? { steps: fields.steps.filter(isRecord).map(readStep) }
          : {}),
      };
    }),
  };
}
