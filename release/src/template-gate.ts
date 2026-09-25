/**
 * `release:template-gate`, programmatic entry point: the Template, as the
 * Reference consumer, built against the packed packages before they are
 * published (ADR 0006). It installs the tarballs the publish plan lists into
 * a Template checkout as overrides, then runs the Template's build in
 * release mode, its lint and its tests, and stops at the first failure.
 */
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { isAbsolute, join, posix, relative, resolve, sep } from "node:path";
import { byCodePoint } from "./order.js";
import { LIBRARY_PACKAGE } from "./packages.js";
import { readPublishablePackages } from "./workspace.js";

/** The file `changeset pack` writes at the root of its output folder. */
export const PUBLISH_PLAN = "publish-plan.json";

/** The publish plan format the gate reads (Changesets 3). */
const PLAN_VERSION = 1;

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
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:[-+].+)?$/.exec(
    libraryVersion,
  );
  if (match === null) {
    throw new TemplateGateError(`"${libraryVersion}" is not a semver version.`);
  }
  return `v${match[1]}`;
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
  const planPath = join(packDir, PUBLISH_PLAN);
  let plan: unknown;
  try {
    plan = JSON.parse(await readFile(planPath, "utf8"));
  } catch (error) {
    throw new TemplateGateError(
      `Cannot read the publish plan ${planPath}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
  if (!isRecord(plan) || plan.version !== PLAN_VERSION) {
    throw new TemplateGateError(
      `${planPath} is not a version ${String(PLAN_VERSION)} publish plan.`,
    );
  }
  if (!Array.isArray(plan.plan)) {
    throw new TemplateGateError(`${planPath} has no plan.`);
  }
  const packed: PackedPackage[] = [];
  for (const entry of plan.plan.flat() as unknown[]) {
    if (isRecord(entry) && entry.kind === "tag-only") continue;
    if (
      !isRecord(entry) ||
      entry.kind !== "publish" ||
      typeof entry.name !== "string" ||
      typeof entry.version !== "string"
    ) {
      throw new TemplateGateError(
        `${planPath} holds an entry that is neither a publish nor a tag-only one: ${JSON.stringify(entry)}`,
      );
    }
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

/** A command the gate runs, in a folder. */
export interface Command {
  command: string;
  args: readonly string[];
  cwd: string;
}

/**
 * Runs a command to completion, its output going to the gate's own, and
 * resolves with its exit code.
 */
export type Runner = (command: Command) => Promise<number>;

/** The command as a shell line, for messages. */
export function commandLine({ command, args }: Command): string {
  return [command, ...args].join(" ");
}

/**
 * The install: not frozen, because the overrides change the lockfile's
 * configuration.
 */
const INSTALL = ["install", "--no-frozen-lockfile"] as const;

/** The Template's scripts the gate runs, by name, in order. */
export const TEMPLATE_STEPS: readonly {
  script: string;
  args: readonly string[];
}[] = [
  { script: "build", args: ["--mode", "release"] },
  { script: "lint", args: [] },
  { script: "test", args: [] },
];

export interface TemplateGateInput {
  /** The Template checkout. */
  template: string;
  /** The output folder of `changeset pack`. */
  packDir: string;
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
 * checkout, as `pnpm.overrides` entries in its `package.json`, then runs its
 * build in release mode, its lint and its tests. Stops at the first command
 * that fails, or at the first script the Template lacks, and names it.
 * Throws a `TemplateGateError` when the pack output or the checkout cannot
 * be read. The checkout keeps the overrides and the lockfile they produce:
 * gate a throwaway clone.
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
      `${input.template} is not a Template checkout: cannot read ${manifestPath}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }

  await writeFile(
    manifestPath,
    `${JSON.stringify(withOverrides(manifest, installed), null, 2)}\n`,
  );

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
  return { ok: true, installed };
}

/**
 * The manifest with an override per packed package, pointing at its
 * tarball; the Template's other overrides are kept.
 */
function withOverrides(
  manifest: Manifest,
  packed: readonly PackedPackage[],
): Manifest {
  const pnpm = isRecord(manifest.pnpm) ? manifest.pnpm : {};
  const overrides = isRecord(pnpm.overrides) ? { ...pnpm.overrides } : {};
  for (const pkg of packed) {
    overrides[pkg.name] = `file:${pkg.tarball.split(sep).join(posix.sep)}`;
  }
  return { ...manifest, pnpm: { ...pnpm, overrides } };
}

const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
] as const;

/**
 * Why the install did not put the packed version of a package the Template
 * depends on in its `node_modules` (pnpm ignoring `pnpm.overrides`, as pnpm
 * 11 does, or a `pnpm-workspace.yaml` whose own `overrides` replace them),
 * if it did not.
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
        `not the packed ${pkg.version}: pnpm did not apply the overrides in package.json.`
      );
    }
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
