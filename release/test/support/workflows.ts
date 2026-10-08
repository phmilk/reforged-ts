/**
 * What the workflow shape tests share: this repository's workflows, read
 * from `.github/workflows` and parsed, with the keys the tests look at.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";
import { repositoryRoot } from "../../src/workspace.js";

export interface Step {
  id?: string;
  if?: string;
  uses?: string;
  with?: Partial<Record<string, unknown>>;
  env?: Partial<Record<string, string>>;
  run?: string;
}

export interface Job {
  if?: string;
  needs?: string;
  uses?: string;
  with?: Partial<Record<string, unknown>>;
  environment?: unknown;
  concurrency?: unknown;
  permissions?: unknown;
  outputs?: unknown;
  "timeout-minutes"?: number;
  steps?: Step[];
}

export interface Workflow {
  on: Partial<Record<string, unknown>>;
  permissions?: unknown;
  concurrency?: unknown;
  jobs: Partial<Record<string, Job>>;
}

const FOLDER = join(repositoryRoot, ".github", "workflows");

/** The workflow `file` of this repository, as text and parsed. */
export async function readWorkflow(
  file: string,
): Promise<{ file: string; text: string; workflow: Workflow }> {
  const text = await readFile(join(FOLDER, file), "utf8");
  const parsed = parse(text) as Omit<Workflow, "jobs"> & {
    jobs?: Workflow["jobs"];
  };
  return { file, text, workflow: { ...parsed, jobs: parsed.jobs ?? {} } };
}

/** Every workflow of this repository, by file name, as text and parsed. */
export async function readWorkflows(): Promise<
  { file: string; text: string; workflow: Workflow }[]
> {
  const files = (await readdir(FOLDER))
    .filter((file) => /\.ya?ml$/.test(file))
    .sort();
  return Promise.all(files.map(readWorkflow));
}
