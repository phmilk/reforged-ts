/**
 * The creation step of the Template gate (ADR 0018): the packed Creation
 * CLI makes a Map project from an archive of the Template checkout, and the
 * step checks what it made. The gate runs it after the Template's own
 * scripts (`template-gate.ts`).
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { CREATION_PACKAGE } from "./packages.js";
import { commandLine, type Command, type Runner } from "./process.js";
import { unpackTarball } from "./tarball.js";
import {
  exitFailure,
  TemplateGateError,
  type StepFailure,
} from "./template-gate-failure.js";
import { errorMessage, isRecord } from "./unknown.js";
import { readPublishablePackages } from "./workspace.js";

/**
 * The Map project the creation step makes: its folder under the scratch
 * folder, its name and its description.
 */
export const CREATED_PROJECT = {
  folder: "gate-map",
  name: "gate-map",
  description: "The Map project the Template gate creates.",
} as const;

/** The Template's list of the files `template:detach` removes. */
const MAINTENANCE_MANIFEST = "template-maintenance.json";

/** The Template's script that removes its maintenance files. */
const DETACH_SCRIPT = "template:detach";

/**
 * The one top-level folder of the Template's archive, as in GitHub's
 * tarball of a ref, which the Creation CLI leaves out.
 */
const ARCHIVE_PREFIX = "reforged-ts-template/";

export interface CreationStepInput {
  /** The Template checkout, a git repository. */
  template: string;
  /** The scripts of the checkout's `package.json`. */
  scripts: Readonly<Record<string, unknown>>;
  /**
   * The publish plan's tarball of the Creation CLI, absolute; the
   * workspace's is packed when absent.
   */
  tarball: string | undefined;
  /** The workspace, whose Creation CLI is packed when the plan lacks it. */
  root: string;
  /**
   * An empty folder: the Template's archive, the unpacked Creation CLI and
   * the Map project it creates.
   */
  scratch: string;
  run: Runner;
}

/**
 * The creation step, which runs on every release, whether or not the plan
 * publishes the Creation CLI: the plan's tarball of it, or else the
 * workspace's packed, makes a Map project from an archive of the checkout's
 * HEAD, as it would from GitHub's tarball of the ref, with the install
 * skipped. The project must then have its Seeds prepared (the name and the
 * description in `package.json`, under the README's title and in
 * `AGENTS.md`'s "Your project"), no path the Template's maintenance manifest
 * lists, and no `template:detach` script. Resolves with the first failure,
 * or `undefined`. Throws a `TemplateGateError` when the workspace has no
 * Creation CLI or its tarball cannot be read.
 */
export async function creationFailure(
  input: CreationStepInput,
): Promise<StepFailure | undefined> {
  const archive = join(input.scratch, "template.tar");
  const archiving: Command = {
    command: "git",
    args: [
      "archive",
      "--format=tar",
      `--prefix=${ARCHIVE_PREFIX}`,
      "--output",
      archive,
      "HEAD",
    ],
    cwd: input.template,
  };
  const archived = await input.run(archiving);
  if (archived !== 0) return exitFailure(archiving, archived);

  let tarball = input.tarball;
  if (tarball === undefined) {
    const cli = (await readPublishablePackages(input.root)).find(
      ({ name }) => name === CREATION_PACKAGE,
    );
    if (cli === undefined) {
      throw new TemplateGateError(
        `Neither the plan nor the workspace has ${CREATION_PACKAGE}.`,
      );
    }
    // Its build output is there already: the workspace's install builds it.
    const packing: Command = {
      command: "pnpm",
      args: [
        "pack",
        "--config.ignore-scripts=true",
        "--pack-destination",
        input.scratch,
      ],
      cwd: join(input.root, cli.dir),
    };
    const packed = await input.run(packing);
    if (packed !== 0) return exitFailure(packing, packed);
    const file = (await readdir(input.scratch)).find(
      (name) =>
        name.startsWith(`${CREATION_PACKAGE}-`) && name.endsWith(".tgz"),
    );
    if (file === undefined) {
      return {
        failed: commandLine(packing),
        message: `it wrote no tarball of ${CREATION_PACKAGE} into ${input.scratch}.`,
      };
    }
    tarball = join(input.scratch, file);
  }
  const binary = await unpackBinary(
    tarball,
    join(input.scratch, CREATION_PACKAGE),
  );

  const project = join(input.scratch, CREATED_PROJECT.folder);
  const creating: Command = {
    command: "node",
    args: [
      binary,
      project,
      "--template",
      archive,
      "--name",
      CREATED_PROJECT.name,
      "--description",
      CREATED_PROJECT.description,
      "--skip-install",
    ],
    cwd: input.scratch,
  };
  const failure = (message: string): StepFailure => ({
    failed: commandLine(creating),
    message,
  });
  if (typeof input.scripts[DETACH_SCRIPT] !== "string") {
    return failure(`the Template has no \`${DETACH_SCRIPT}\` script.`);
  }
  const paths = await maintenancePaths(input.template);
  if (typeof paths === "string") return failure(paths);
  const created = await input.run(creating);
  if (created !== 0) return exitFailure(creating, created);
  const problem = await createdProblem(project, paths);
  return problem === undefined ? undefined : failure(problem);
}

/**
 * Unpacks the Creation CLI's `tarball` into `folder` and resolves with its
 * binary, absolute: Node runs it from the tarball's files alone, since the
 * package has no dependency.
 */
async function unpackBinary(tarball: string, folder: string): Promise<string> {
  const label = `The tarball of ${CREATION_PACKAGE} (${tarball})`;
  let bin: unknown;
  try {
    await unpackTarball(tarball, folder);
    const manifest: unknown = JSON.parse(
      await readFile(join(folder, "package", "package.json"), "utf8"),
    );
    bin = isRecord(manifest) ? manifest.bin : undefined;
  } catch (error) {
    throw new TemplateGateError(
      `${label} cannot be read: ${errorMessage(error)}`,
      { cause: error },
    );
  }
  const path = isRecord(bin) ? bin[CREATION_PACKAGE] : bin;
  if (typeof path !== "string") {
    throw new TemplateGateError(
      `${label} has no \`${CREATION_PACKAGE}\` binary in its package.json.`,
    );
  }
  return join(folder, "package", path);
}

/**
 * The paths of the Template's maintenance manifest in the checkout, or why
 * there are none.
 */
async function maintenancePaths(template: string): Promise<string[] | string> {
  try {
    const manifest: unknown = JSON.parse(
      await readFile(join(template, MAINTENANCE_MANIFEST), "utf8"),
    );
    const paths = isRecord(manifest) ? manifest.paths : undefined;
    if (
      Array.isArray(paths) &&
      paths.every((path) => typeof path === "string")
    ) {
      return paths;
    }
  } catch {
    // Missing, or not JSON.
  }
  return `the Template has no ${MAINTENANCE_MANIFEST} listing its maintenance \`paths\`.`;
}

/**
 * What the Map project the Creation CLI made in `project` lacks, if
 * anything: its Seeds prepared with `CREATED_PROJECT`, none of the
 * maintenance `paths` and no `template:detach` script.
 */
async function createdProblem(
  project: string,
  paths: readonly string[],
): Promise<string | undefined> {
  const { name, description } = CREATED_PROJECT;
  const lines = async (file: string) =>
    (await readFile(join(project, file), "utf8").catch(() => "")).split(
      /\r?\n/,
    );
  let manifest: unknown;
  try {
    manifest = JSON.parse(
      await readFile(join(project, "package.json"), "utf8"),
    );
  } catch {
    // Checked below.
  }
  if (!isRecord(manifest)) {
    return "the project it created has no readable package.json.";
  }
  if (manifest.name !== name || manifest.description !== description) {
    return `the project's package.json does not have the name "${name}" and the description "${description}": the Seeds were not prepared.`;
  }
  if (isRecord(manifest.scripts) && DETACH_SCRIPT in manifest.scripts) {
    return `the project's package.json keeps the \`${DETACH_SCRIPT}\` script.`;
  }
  const readme = await lines("README.md");
  const title = readme.indexOf(`# ${name}`);
  if (title === -1 || readme[title + 2] !== description) {
    return `the project's README.md does not have the title "# ${name}" over the description: the Seeds were not prepared.`;
  }
  const agents = await lines("AGENTS.md");
  const yours = agents.indexOf("## Your project");
  if (yours === -1 || agents[yours + 2] !== description) {
    return `the project's AGENTS.md does not have the description under "## Your project": the Seeds were not prepared.`;
  }
  for (const path of paths) {
    if ((await stat(join(project, path)).catch(() => null)) !== null) {
      return `the project keeps ${path}, which the Template's ${MAINTENANCE_MANIFEST} lists.`;
    }
  }
  return undefined;
}
