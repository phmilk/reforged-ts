/**
 * The Template gate's fixtures for its tests and the creation step's: a
 * pack output, a Template checkout, a runner standing in for pnpm, git and
 * node, and the commands a gate run makes.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, posix, sep } from "node:path";
import { parse } from "yaml";
import { CREATED_PROJECT } from "../../src/creation-step.js";
import { commandLine, type Command, type Runner } from "../../src/process.js";
import {
  runTemplateGate,
  type TemplateGateResult,
} from "../../src/template-gate.js";
import { packageTarball } from "./tarball.js";
import { tempDir, writeText, writeWorkspace } from "./workspace.js";

export const ALPHA = "1.0.0-alpha.0";

export const CLI = "create-reforged-map";

export interface PlanEntry {
  name: string;
  version?: string;
  kind?: "publish" | "tag-only";
}

export async function writeBytes(
  root: string,
  path: string,
  bytes: string | Buffer,
): Promise<void> {
  const target = join(root, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, bytes);
}

/** A tarball of the Creation CLI, as `pnpm pack` writes it. */
export const cliTarball = (version: string) =>
  packageTarball({
    "package.json": JSON.stringify({
      name: CLI,
      version,
      bin: { [CLI]: "./dist/cli.js" },
    }),
    "dist/cli.js": "#!/usr/bin/env node\n",
  });

/**
 * A pack output as `changeset pack` writes it: a tarball per publish entry
 * under `packages/`, and the plan in chunks of one entry. `extra` tarballs
 * are written without a plan entry. The Creation CLI's tarball is a real
 * one; the others hold a line of text.
 */
export async function packOutput(
  entries: readonly PlanEntry[],
  extra: readonly string[] = [],
): Promise<string> {
  const dir = await tempDir("pack");
  const plan = [];
  for (const { name, version = ALPHA, kind = "publish" } of entries) {
    if (kind === "tag-only") {
      plan.push([{ kind, name, version }]);
      continue;
    }
    const path = `packages/${name}-${version}.tgz`;
    const bytes =
      name === CLI ? cliTarball(version) : `tarball of ${name}@${version}`;
    await writeBytes(dir, path, bytes);
    const integrity = `sha256-${createHash("sha256").update(bytes).digest("base64")}`;
    plan.push([
      {
        kind,
        name,
        version,
        access: "public",
        tag: "alpha",
        tarball: { path, integrity },
      },
    ]);
  }
  for (const name of extra) {
    await writeText(dir, `packages/${name}-${ALPHA}.tgz`, "not in the plan");
  }
  await writeText(
    dir,
    "publish-plan.json",
    JSON.stringify({ version: 1, plan }),
  );
  return dir;
}

export const ALL_FOUR: readonly PlanEntry[] = [
  { name: "reforged-test" },
  { name: "reforged-types" },
  { name: "reforged-ts" },
  { name: "eslint-plugin-reforged" },
];

/** The paths of the Template's maintenance manifest in a checkout. */
export const MAINTENANCE = [
  "docs/agents/issue-tracker.md",
  "scripts/detach.ts",
  "template-maintenance.json",
];

/**
 * A Template checkout: the scripts and dependencies of the real one, its
 * maintenance manifest unless `maintenance` is false, and the pnpm settings
 * `workspace` when given.
 */
export async function templateCheckout(
  scripts: readonly string[] = ["build", "lint", "test", "template:detach"],
  workspace?: string,
  maintenance = true,
): Promise<string> {
  const dir = await tempDir("template");
  await writeText(
    dir,
    "package.json",
    JSON.stringify({
      name: "reforged-ts-template",
      private: true,
      scripts: Object.fromEntries(
        scripts.map((script) => [script, `node scripts/${script}.ts`]),
      ),
      dependencies: { "reforged-ts": "^1.0.0", "reforged-types": "^1.0.0" },
      devDependencies: { "reforged-test": "^1.0.0", typescript: "6.0.2" },
    }),
  );
  if (maintenance) {
    await writeText(
      dir,
      "template-maintenance.json",
      JSON.stringify({ paths: MAINTENANCE }),
    );
  }
  if (workspace !== undefined)
    await writeText(dir, "pnpm-workspace.yaml", workspace);
  return dir;
}

/** The overrides the Template's pnpm-workspace.yaml holds. */
export async function overridesOf(
  template: string,
): Promise<Record<string, string>> {
  const settings = parse(
    await readFile(join(template, "pnpm-workspace.yaml"), "utf8"),
  ) as { overrides?: Record<string, string> } | null;
  return settings?.overrides ?? {};
}

export const fileUrl = (packDir: string, path: string) =>
  `file:${join(packDir, path).split(sep).join(posix.sep)}`;

/** The files of the Map project the Creation CLI makes, as it makes them. */
export const CREATED_FILES: Readonly<Record<string, string>> = {
  "package.json": JSON.stringify(
    {
      name: CREATED_PROJECT.name,
      description: CREATED_PROJECT.description,
      scripts: { build: "node scripts/build.ts" },
    },
    null,
    2,
  ),
  "README.md": `# ${CREATED_PROJECT.name}\n\n${CREATED_PROJECT.description}\n\nA Map project template.\n`,
  "AGENTS.md": `# Map project\n\n## Your project\n\n${CREATED_PROJECT.description}\n`,
  "scripts/build.ts": "",
};

/**
 * A runner standing in for pnpm, git and node: it records the commands,
 * fails the one named in `failing`, and on install puts in `node_modules`
 * the version each package's override names (or the one of `installs`),
 * except the packages of `absent`, which nothing in the Template depends
 * on. `pnpm pack` writes the Creation CLI's tarball into its destination,
 * and the Creation CLI writes its project, with `created` over its files.
 */
export function fakeRunner(
  options: {
    failing?: string;
    installs?: Record<string, string>;
    absent?: readonly string[];
    created?: Readonly<Record<string, string>>;
  } = {},
): { run: Runner; commands: Command[] } {
  const commands: Command[] = [];
  const run: Runner = async (command) => {
    commands.push(command);
    if (commandLine(command) === options.failing) return 1;
    const [subcommand] = command.args;
    if (command.command === "pnpm" && subcommand === "install") {
      // The gate runs every pnpm command of the Template in the checkout.
      const cwd = command.cwd ?? "";
      for (const [name, spec] of Object.entries(await overridesOf(cwd))) {
        if (options.absent?.includes(name)) continue;
        const version =
          options.installs?.[name] ??
          /-(\d+\.\d+\.\d+[^/]*)\.tgz$/.exec(spec)?.[1];
        await writeText(
          cwd,
          `node_modules/${name}/package.json`,
          JSON.stringify({ name, version }),
        );
      }
    }
    if (command.command === "pnpm" && subcommand === "pack") {
      const destination = command.args.at(-1) ?? "";
      await writeBytes(destination, `${CLI}-1.0.0.tgz`, cliTarball("1.0.0"));
    }
    if (command.command === "node") {
      const project = command.args[1] ?? "";
      const files = { ...CREATED_FILES, ...options.created };
      for (const [path, text] of Object.entries(files)) {
        await writeText(project, path, text);
      }
    }
    return 0;
  };
  return { run, commands };
}

export const lines = (commands: readonly Command[]) =>
  commands.map(commandLine);

/** The Template's commands, in the checkout. */
export const TEMPLATE_STEPS = [
  "pnpm install --no-frozen-lockfile",
  "pnpm run build --mode release",
  "pnpm run lint",
  "pnpm run test",
];

/** The commands of the creation step, the workspace's CLI packed. */
export const creationSteps = (scratch: string) => [
  `git archive --format=tar --prefix=reforged-ts-template/ --output ${join(scratch, "template.tar")} HEAD`,
  `pnpm pack --config.ignore-scripts=true --pack-destination ${scratch}`,
  creationLine(scratch),
];

/** The Creation CLI's command line. */
export const creationLine = (scratch: string) =>
  [
    "node",
    join(scratch, CLI, "package", "dist", "cli.js"),
    join(scratch, CREATED_PROJECT.folder),
    "--template",
    join(scratch, "template.tar"),
    "--name",
    CREATED_PROJECT.name,
    "--description",
    CREATED_PROJECT.description,
    "--skip-install",
  ].join(" ");

export const allSteps = (scratch: string) => [
  ...TEMPLATE_STEPS,
  ...creationSteps(scratch),
];

/** The label of each command of a gate run, for the tests' names. */
export const STEP_LABELS = [
  ...TEMPLATE_STEPS,
  "git archive",
  "pnpm pack",
  "node",
];

/**
 * Runs the gate on `template` with the pack output `packDir`, over a
 * fixture workspace and a new scratch folder.
 */
export async function gate(
  template: string,
  packDir: string,
  run: Runner = fakeRunner().run,
): Promise<{ result: TemplateGateResult; root: string; scratch: string }> {
  const root = await writeWorkspace();
  const scratch = await tempDir("scratch");
  const result = await runTemplateGate({
    template,
    packDir,
    root,
    scratch,
    run,
  });
  return { result, root, scratch };
}
