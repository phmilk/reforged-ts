/**
 * `release:template-gate`, programmatic entry point: the Template, as the
 * Reference consumer, built against the packed packages before they are
 * published (ADR 0006). It installs the tarballs the publish plan lists into
 * a Template checkout as overrides in its pnpm-workspace.yaml, then runs
 * the Template's build in release mode, its lint and its tests, then has the
 * packed creation CLI make a Map project from it (ADR 0018), and stops at
 * the first failure.
 */
import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { isAbsolute, join, posix, relative, resolve, sep } from "node:path";
import { parseDocument } from "yaml";
import { byCodePoint } from "./order.js";
import { commandLine, type Command, type Runner } from "./process.js";
import { CREATION_PACKAGE, LIBRARY_PACKAGE } from "./packages.js";
import { publishEntries, readPublishPlan } from "./publish-plan.js";
import { parseSemver } from "./semver.js";
import { unpackTarball } from "./tarball.js";
import { errorMessage, isRecord } from "./unknown.js";
import { readPublishablePackages } from "./workspace.js";

/** A package of the publish plan, and its tarball in the pack output. */
export interface PackedPackage {
  name: string;
  version: string;
  /** The tarball, absolute. */
  tarball: string;
}

/** Inputs the gate cannot work from: the pack output or the checkout. */
export class TemplateGateError extends Error {
  override name = "TemplateGateError";
}

/**
 * The Template ref a library version is gated against: the Template keeps
 * one line per library major, named `v<major>` (a tag or a branch; both
 * check out the same way). Prereleases map to their major: every 1.x,
 * alphas included, maps to `v1`.
 */
export function templateRef(libraryVersion: string): string {
  const version = parseSemver(libraryVersion);
  if (version === undefined) {
    throw new TemplateGateError(`"${libraryVersion}" is not a semver version.`);
  }
  return `v${String(version.major)}`;
}

/**
 * The Template ref a release is gated against: `templateRef` of the library
 * version the publish plan in `packDir` publishes, else of the library in
 * the workspace at `root` (a release that leaves the library alone).
 */
export async function releaseTemplateRef(
  packDir: string,
  root: string,
): Promise<string> {
  const packed = await readPackedPackages(packDir);
  const library =
    packed.find(({ name }) => name === LIBRARY_PACKAGE) ??
    (await readPublishablePackages(root)).find(
      ({ name }) => name === LIBRARY_PACKAGE,
    );
  if (library === undefined) {
    throw new TemplateGateError(
      `Neither the plan nor the workspace has ${LIBRARY_PACKAGE}.`,
    );
  }
  return templateRef(library.version);
}

/**
 * The packages the publish plan in `packDir` publishes, each with its
 * tarball, checked against the plan's integrity, in code-point order of
 * their names. Tag-only entries (private packages) have no tarball and are
 * left out.
 */
export async function readPackedPackages(
  packDir: string,
): Promise<PackedPackage[]> {
  const { file: planPath, plan } = await readPublishPlan(packDir);
  const packed: PackedPackage[] = [];
  for (const entry of publishEntries(plan, planPath)) {
    const label = `${entry.name}@${entry.version}`;
    const tarball = entry.tarball;
    if (
      !isRecord(tarball) ||
      typeof tarball.path !== "string" ||
      typeof tarball.integrity !== "string"
    ) {
      throw new TemplateGateError(
        `${label} has no tarball in ${planPath}: the plan was not written by \`changeset pack\`.`,
      );
    }
    const path = resolve(packDir, tarball.path);
    const inside = relative(resolve(packDir), path);
    if (inside.startsWith("..") || isAbsolute(inside)) {
      throw new TemplateGateError(
        `The tarball of ${label} (${tarball.path}) is outside ${packDir}.`,
      );
    }
    await checkIntegrity(label, path, tarball.integrity);
    packed.push({ name: entry.name, version: entry.version, tarball: path });
  }
  if (packed.length === 0) {
    throw new TemplateGateError(`${planPath} publishes no package.`);
  }
  return packed.sort((a, b) => byCodePoint(a.name, b.name));
}

async function checkIntegrity(
  label: string,
  path: string,
  integrity: string,
): Promise<void> {
  const [algorithm, expected] = integrity.split("-", 2);
  if (!["sha256", "sha384", "sha512"].includes(algorithm) || !expected) {
    throw new TemplateGateError(
      `The tarball of ${label} has an integrity the gate cannot check: ${integrity}`,
    );
  }
  let bytes: Buffer;
  try {
    bytes = await readFile(path);
  } catch (error) {
    throw new TemplateGateError(`The tarball of ${label} is missing: ${path}`, {
      cause: error,
    });
  }
  const actual = createHash(algorithm).update(bytes).digest("base64");
  if (actual !== expected) {
    throw new TemplateGateError(
      `The tarball of ${label} does not match the publish plan's integrity: ${path}`,
    );
  }
}

/**
 * The install: not frozen, because the overrides change the lockfile's
 * configuration.
 */
const INSTALL = ["install", "--no-frozen-lockfile"] as const;

/**
 * What the Template's commands add to the environment: pnpm switches to the
 * version the Template's `packageManager` pins, as in a Map project. The gate
 * runs under `pnpm release:template-gate`, and pnpm turns that switch off in
 * the environment of its scripts.
 */
const TEMPLATE_ENV = {
  npm_config_manage_package_manager_versions: "true",
} as const;

/** The Template's scripts the gate runs, by name, in order. */
export const TEMPLATE_STEPS: readonly {
  script: string;
  args: readonly string[];
}[] = [
  { script: "build", args: ["--mode", "release"] },
  { script: "lint", args: [] },
  { script: "test", args: [] },
];

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
 * tarball of a ref, which the creation CLI leaves out.
 */
const ARCHIVE_PREFIX = "reforged-ts-template/";

export interface TemplateGateInput {
  /** The Template checkout, a git repository. */
  template: string;
  /** The output folder of `changeset pack`. */
  packDir: string;
  /** The workspace, whose creation CLI is packed when the plan lacks it. */
  root: string;
  /**
   * An empty folder for the creation step: the Template's archive, the
   * unpacked creation CLI and the Map project it creates.
   */
  scratch: string;
  run: Runner;
}

export type TemplateGateResult =
  | { ok: true; installed: PackedPackage[] }
  | {
      ok: false;
      installed: PackedPackage[];
      /** The command the gate stopped at. */
      failed: string;
      message: string;
    };

type Manifest = Record<string, unknown>;

/**
 * Installs the tarballs of the publish plan in `packDir` into the Template
 * checkout, as `overrides` entries in its `pnpm-workspace.yaml`, then runs its
 * build in release mode, its lint and its tests, each on the pnpm the
 * Template pins. Then the creation step: the packed creation CLI makes a Map
 * project in `scratch` from an archive of the checkout, which the step
 * checks (`creationFailure`). Stops at the first command that fails, or at
 * the first script the Template lacks, and names it. Throws a
 * `TemplateGateError` when the pack output, the checkout or the creation
 * CLI's tarball cannot be read. The checkout keeps the overrides and any
 * lockfile the install writes: gate a throwaway clone.
 */
export async function runTemplateGate(
  input: TemplateGateInput,
): Promise<TemplateGateResult> {
  const installed = await readPackedPackages(input.packDir);
  const manifestPath = join(input.template, "package.json");
  let manifest: Manifest;
  try {
    const parsed: unknown = JSON.parse(await readFile(manifestPath, "utf8"));
    if (!isRecord(parsed)) throw new Error("not a JSON object");
    manifest = parsed;
  } catch (error) {
    throw new TemplateGateError(
      `${input.template} is not a Template checkout: cannot read ${manifestPath}: ${errorMessage(error)}`,
      { cause: error },
    );
  }

  await writeOverrides(input.template, installed);

  const fail = (failed: string, message: string): TemplateGateResult => ({
    ok: false,
    installed,
    failed,
    message: `The Template gate failed at \`${failed}\`: ${message}`,
  });

  const install: Command = {
    command: "pnpm",
    args: INSTALL,
    cwd: input.template,
    env: TEMPLATE_ENV,
  };
  const installStatus = await input.run(install);
  if (installStatus !== 0) {
    return fail(commandLine(install), `exit code ${String(installStatus)}.`);
  }
  const ignored = await overridesIgnored(input.template, manifest, installed);
  if (ignored !== undefined) return fail(commandLine(install), ignored);

  const scripts = isRecord(manifest.scripts) ? manifest.scripts : {};
  for (const step of TEMPLATE_STEPS) {
    const command: Command = {
      command: "pnpm",
      args: ["run", step.script, ...step.args],
      cwd: input.template,
      env: TEMPLATE_ENV,
    };
    if (typeof scripts[step.script] !== "string") {
      return fail(
        commandLine(command),
        `the Template has no \`${step.script}\` script.`,
      );
    }
    const status = await input.run(command);
    if (status !== 0)
      return fail(commandLine(command), `exit code ${String(status)}.`);
  }

  const creation = await creationFailure(input, installed, scripts);
  if (creation !== undefined) return fail(creation.failed, creation.message);
  return { ok: true, installed };
}

/** Why a step failed: the command it stopped at, and the reason. */
interface StepFailure {
  failed: string;
  message: string;
}

const exitCode = (command: Command, status: number): StepFailure => ({
  failed: commandLine(command),
  message: `exit code ${String(status)}.`,
});

/**
 * The creation step, which runs on every release, whether or not the plan
 * publishes the creation CLI: the plan's tarball of it, or else the
 * workspace's packed, makes a Map project from an archive of the checkout's
 * HEAD, as it would from GitHub's tarball of the ref, with the install
 * skipped. The project must then have its Seeds prepared (the name and the
 * description in `package.json`, under the README's title and in
 * `AGENTS.md`'s "Your project"), no path the Template's maintenance manifest
 * lists, and no `template:detach` script. Resolves with the first failure,
 * or `undefined`.
 */
async function creationFailure(
  input: TemplateGateInput,
  installed: readonly PackedPackage[],
  scripts: Readonly<Record<string, unknown>>,
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
  if (archived !== 0) return exitCode(archiving, archived);

  let tarball = installed.find(
    ({ name }) => name === CREATION_PACKAGE,
  )?.tarball;
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
    if (packed !== 0) return exitCode(packing, packed);
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
  if (typeof scripts[DETACH_SCRIPT] !== "string") {
    return failure(`the Template has no \`${DETACH_SCRIPT}\` script.`);
  }
  const paths = await maintenancePaths(input.template);
  if (typeof paths === "string") return failure(paths);
  const created = await input.run(creating);
  if (created !== 0) return exitCode(creating, created);
  const problem = await createdProblem(project, paths);
  return problem === undefined ? undefined : failure(problem);
}

/**
 * Unpacks the creation CLI's `tarball` into `folder` and resolves with its
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
 * What the Map project the creation CLI made in `project` lacks, if
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

/**
 * Sets an override per packed package, pointing at its tarball, in the
 * Template's `pnpm-workspace.yaml`, written when it has none: the one place
 * pnpm 11 and later read settings from, and pnpm 10 reads too. The file's
 * other settings, other overrides and comments are kept.
 */
async function writeOverrides(
  template: string,
  packed: readonly PackedPackage[],
): Promise<void> {
  const path = join(template, "pnpm-workspace.yaml");
  let text = "";
  try {
    text = await readFile(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const settings = parseDocument(text);
  if (settings.errors.length > 0) {
    const [parseError] = settings.errors;
    throw new TemplateGateError(`Cannot read ${path}: ${parseError.message}`, {
      cause: parseError,
    });
  }
  try {
    // Throws when `overrides` is not a map.
    for (const pkg of packed) {
      settings.setIn(
        ["overrides", pkg.name],
        `file:${pkg.tarball.split(sep).join(posix.sep)}`,
      );
    }
  } catch (error) {
    throw new TemplateGateError(
      `Cannot set the overrides in ${path}: ${errorMessage(error)}`,
      { cause: error },
    );
  }
  await writeFile(path, settings.toString());
}

const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
] as const;

/**
 * Why the install did not put the packed version of a package the Template
 * depends on in its `node_modules`, if it did not: a pnpm that ignores the
 * overrides of `pnpm-workspace.yaml`, or a pnpmfile that replaces them.
 */
async function overridesIgnored(
  template: string,
  manifest: Manifest,
  packed: readonly PackedPackage[],
): Promise<string | undefined> {
  const direct = new Set(
    DEPENDENCY_FIELDS.flatMap((field) => {
      const deps = manifest[field];
      return isRecord(deps) ? Object.keys(deps) : [];
    }),
  );
  for (const pkg of packed.filter(({ name }) => direct.has(name))) {
    let found = "(none)";
    try {
      const text = await readFile(
        join(template, "node_modules", pkg.name, "package.json"),
        "utf8",
      );
      const installedManifest: unknown = JSON.parse(text);
      if (
        isRecord(installedManifest) &&
        typeof installedManifest.version === "string"
      ) {
        found = installedManifest.version;
      }
    } catch {
      // Not installed.
    }
    if (found !== pkg.version) {
      return (
        `the install put ${pkg.name} ${found} in node_modules, ` +
        `not the packed ${pkg.version}: pnpm did not apply the overrides in pnpm-workspace.yaml.`
      );
    }
  }
  return undefined;
}
