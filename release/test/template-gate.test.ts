import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, posix, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { main } from "../src/cli/template-gate.js";
import { commandLine, type Command, type Runner } from "../src/process.js";
import {
  CREATED_PROJECT,
  runTemplateGate,
  templateRef,
  type TemplateGateResult,
} from "../src/template-gate.js";
import { packageTarball } from "./support/tarball.js";
import { tempDir, writeText, writeWorkspace } from "./support/workspace.js";

const ALPHA = "1.0.0-alpha.0";

const CLI = "create-reforged-map";

interface PlanEntry {
  name: string;
  version?: string;
  kind?: "publish" | "tag-only";
}

async function writeBytes(
  root: string,
  path: string,
  bytes: string | Buffer,
): Promise<void> {
  const target = join(root, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, bytes);
}

/** A tarball of the creation CLI, as `pnpm pack` writes it. */
const cliTarball = (version: string) =>
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
 * are written without a plan entry. The creation CLI's tarball is a real
 * one; the others hold a line of text.
 */
async function packOutput(
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

const ALL_FOUR: readonly PlanEntry[] = [
  { name: "reforged-test" },
  { name: "reforged-types" },
  { name: "reforged-ts" },
  { name: "eslint-plugin-reforged" },
];

/** The paths of the Template's maintenance manifest in a checkout. */
const MAINTENANCE = [
  "docs/agents/issue-tracker.md",
  "scripts/detach.ts",
  "template-maintenance.json",
];

/**
 * A Template checkout: the scripts and dependencies of the real one, its
 * maintenance manifest unless `maintenance` is false, and the pnpm settings
 * `workspace` when given.
 */
async function templateCheckout(
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
async function overridesOf(template: string): Promise<Record<string, string>> {
  const settings = parse(
    await readFile(join(template, "pnpm-workspace.yaml"), "utf8"),
  ) as { overrides?: Record<string, string> } | null;
  return settings?.overrides ?? {};
}

const fileUrl = (packDir: string, path: string) =>
  `file:${join(packDir, path).split(sep).join(posix.sep)}`;

/** The files of the Map project the creation CLI makes, as it makes them. */
const CREATED_FILES: Readonly<Record<string, string>> = {
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
 * on. `pnpm pack` writes the creation CLI's tarball into its destination,
 * and the creation CLI writes its project, with `created` over its files.
 */
function fakeRunner(
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

const lines = (commands: readonly Command[]) => commands.map(commandLine);

/** The Template's commands, in the checkout. */
const TEMPLATE_STEPS = [
  "pnpm install --no-frozen-lockfile",
  "pnpm run build --mode release",
  "pnpm run lint",
  "pnpm run test",
];

/** The commands of the creation step, the workspace's CLI packed. */
const creationSteps = (scratch: string) => [
  `git archive --format=tar --prefix=reforged-ts-template/ --output ${join(scratch, "template.tar")} HEAD`,
  `pnpm pack --config.ignore-scripts=true --pack-destination ${scratch}`,
  creationLine(scratch),
];

/** The creation CLI's command line. */
const creationLine = (scratch: string) =>
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

const allSteps = (scratch: string) => [
  ...TEMPLATE_STEPS,
  ...creationSteps(scratch),
];

/** The label of each command of a gate run, for the tests' names. */
const STEP_LABELS = [...TEMPLATE_STEPS, "git archive", "pnpm pack", "node"];

/**
 * Runs the gate on `template` with the pack output `packDir`, over a
 * fixture workspace and a new scratch folder.
 */
async function gate(
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

describe("runTemplateGate", () => {
  it("installs exactly the tarballs in the publish plan, as overrides in pnpm-workspace.yaml, keeping its settings", async () => {
    const packDir = await packOutput(
      [
        { name: "reforged-types" },
        { name: "reforged-ts" },
        { name: "reforged-ts-release", kind: "tag-only" },
      ],
      ["reforged-test"],
    );
    const template = await templateCheckout(
      [],
      "# No lockfile yet.\nlockfile: false\n\noverrides:\n  esbuild: 0.25.0\n",
    );
    const manifest = await readFile(join(template, "package.json"), "utf8");

    const { result } = await gate(template, packDir);

    expect(result.installed.map(({ name }) => name)).toEqual([
      "reforged-ts",
      "reforged-types",
    ]);
    expect(await overridesOf(template)).toEqual({
      esbuild: "0.25.0",
      "reforged-ts": fileUrl(packDir, `packages/reforged-ts-${ALPHA}.tgz`),
      "reforged-types": fileUrl(
        packDir,
        `packages/reforged-types-${ALPHA}.tgz`,
      ),
    });
    const workspace = await readFile(
      join(template, "pnpm-workspace.yaml"),
      "utf8",
    );
    expect(workspace).toMatch(/^# No lockfile yet\.\nlockfile: false\n/);
    // pnpm 11 and later read no setting from package.json.
    expect(await readFile(join(template, "package.json"), "utf8")).toBe(
      manifest,
    );
  });

  it("writes pnpm-workspace.yaml when the Template has none", async () => {
    const packDir = await packOutput([{ name: "reforged-ts" }]);
    const template = await templateCheckout([]);

    await gate(template, packDir);

    expect(await overridesOf(template)).toEqual({
      "reforged-ts": fileUrl(packDir, `packages/reforged-ts-${ALPHA}.tgz`),
    });
  });

  it("passes a plan holding a package the Template does not depend on yet, overriding it all the same", async () => {
    const packDir = await packOutput([...ALL_FOUR, { name: "reforged-map" }]);
    const template = await templateCheckout();
    const runner = fakeRunner({ absent: ["reforged-map"] });

    const { result, scratch } = await gate(template, packDir, runner.run);

    expect(result.ok).toBe(true);
    expect(lines(runner.commands)).toEqual(allSteps(scratch));
    expect(result.installed.map(({ name }) => name)).toContain("reforged-map");
    expect(await overridesOf(template)).toMatchObject({
      "reforged-map": fileUrl(packDir, `packages/reforged-map-${ALPHA}.tgz`),
    });
  });

  it("runs the install, build in release mode, lint and tests in the checkout, then the creation step", async () => {
    const packDir = await packOutput(ALL_FOUR);
    const template = await templateCheckout();
    const runner = fakeRunner();

    const { result, root, scratch } = await gate(template, packDir, runner.run);

    expect(result.ok).toBe(true);
    expect(lines(runner.commands)).toEqual(allSteps(scratch));
    expect(runner.commands.map(({ cwd }) => cwd)).toEqual([
      ...TEMPLATE_STEPS.map(() => template),
      template,
      join(root, "packages", CLI),
      scratch,
    ]);
  });

  it("runs the Template's commands on the pnpm it pins, which a pnpm script's environment turns off", async () => {
    const packDir = await packOutput(ALL_FOUR);
    const runner = fakeRunner();

    const { scratch } = await gate(
      await templateCheckout(),
      packDir,
      runner.run,
    );

    expect(runner.commands.map(({ env }) => env)).toEqual([
      ...TEMPLATE_STEPS.map(() => ({
        npm_config_manage_package_manager_versions: "true",
      })),
      ...creationSteps(scratch).map(() => undefined),
    ]);
  });

  it.each(STEP_LABELS.map((label, index) => [label, index]))(
    "stops at `%s` when it fails, naming it",
    async (_label, index) => {
      const packDir = await packOutput(ALL_FOUR);
      const template = await templateCheckout();
      const root = await writeWorkspace();
      const scratch = await tempDir("scratch");
      const failing = allSteps(scratch)[index] ?? "";
      const runner = fakeRunner({ failing });

      const result = await runTemplateGate({
        template,
        packDir,
        root,
        scratch,
        run: runner.run,
      });

      expect(lines(runner.commands)).toEqual(
        allSteps(scratch).slice(0, index + 1),
      );
      expect(result).toMatchObject({
        ok: false,
        failed: failing,
        message: `The Template gate failed at \`${failing}\`: exit code 1.`,
      });
    },
  );

  it("stops at a script the Template lacks, naming it", async () => {
    const packDir = await packOutput(ALL_FOUR);
    const template = await templateCheckout(["build", "test"]);
    const runner = fakeRunner();

    const { result } = await gate(template, packDir, runner.run);

    expect(lines(runner.commands)).toEqual(TEMPLATE_STEPS.slice(0, 2));
    expect(result).toMatchObject({
      ok: false,
      failed: "pnpm run lint",
      message:
        "The Template gate failed at `pnpm run lint`: the Template has no `lint` script.",
    });
  });

  it("fails when the install did not put the packed versions in place", async () => {
    const packDir = await packOutput(ALL_FOUR);
    const template = await templateCheckout();
    const runner = fakeRunner({ installs: { "reforged-types": "1.0.0" } });

    const { result } = await gate(template, packDir, runner.run);

    expect(lines(runner.commands)).toEqual(TEMPLATE_STEPS.slice(0, 1));
    expect(result).toMatchObject({
      ok: false,
      failed: "pnpm install --no-frozen-lockfile",
      message: expect.stringContaining(
        `reforged-types 1.0.0 in node_modules, not the packed ${ALPHA}`,
      ) as unknown,
    });
  });

  it("refuses a tarball that does not match the plan's integrity, before running anything", async () => {
    const packDir = await packOutput(ALL_FOUR);
    await writeText(packDir, `packages/reforged-ts-${ALPHA}.tgz`, "rebuilt");
    const runner = fakeRunner();

    await expect(
      gate(await templateCheckout(), packDir, runner.run),
    ).rejects.toThrow(
      `The tarball of reforged-ts@${ALPHA} does not match the publish plan's integrity`,
    );
    expect(runner.commands).toEqual([]);
  });
});

describe("the creation step", () => {
  it("runs the plan's create-reforged-map when the plan publishes it, packing nothing", async () => {
    const packDir = await packOutput([...ALL_FOUR, { name: CLI }]);
    const runner = fakeRunner();

    const { result, scratch } = await gate(
      await templateCheckout(),
      packDir,
      runner.run,
    );

    expect(result.ok).toBe(true);
    expect(lines(runner.commands)).toEqual(
      allSteps(scratch).filter((line) => !line.startsWith("pnpm pack")),
    );
  });

  it("stops when the project keeps a path of the Template's maintenance manifest, naming it", async () => {
    const packDir = await packOutput(ALL_FOUR);
    const runner = fakeRunner({ created: { "scripts/detach.ts": "" } });

    const { result, scratch } = await gate(
      await templateCheckout(),
      packDir,
      runner.run,
    );

    expect(result).toEqual({
      ok: false,
      installed: expect.any(Array) as unknown,
      failed: creationLine(scratch),
      message: `The Template gate failed at \`${creationLine(scratch)}\`: the project keeps scripts/detach.ts, which the Template's template-maintenance.json lists.`,
    });
  });

  it("stops when the project keeps the template:detach script", async () => {
    const packDir = await packOutput(ALL_FOUR);
    const manifest = JSON.parse(CREATED_FILES["package.json"] ?? "") as {
      scripts: Record<string, string>;
    };
    manifest.scripts["template:detach"] = "node scripts/detach.ts";
    const runner = fakeRunner({
      created: { "package.json": JSON.stringify(manifest) },
    });

    const { result } = await gate(
      await templateCheckout(),
      packDir,
      runner.run,
    );

    expect(result).toMatchObject({
      ok: false,
      message: expect.stringMatching(
        /: the project's package\.json keeps the `template:detach` script\.$/,
      ) as unknown,
    });
  });

  it.each([
    [
      "package.json",
      JSON.stringify({ name: "reforged-ts-template" }),
      `the project's package.json does not have the name "gate-map" and the description "${CREATED_PROJECT.description}": the Seeds were not prepared.`,
    ],
    [
      "README.md",
      "# gate-map\n\nA Map project template.\n",
      'the project\'s README.md does not have the title "# gate-map" over the description: the Seeds were not prepared.',
    ],
    [
      "AGENTS.md",
      "# Map project\n\n## Your project\n\nThis section belongs to the map's author.\n",
      'the project\'s AGENTS.md does not have the description under "## Your project": the Seeds were not prepared.',
    ],
  ])(
    "stops when the project's %s is not prepared",
    async (file, text, reason) => {
      const packDir = await packOutput(ALL_FOUR);
      const runner = fakeRunner({ created: { [file]: text } });

      const { result, scratch } = await gate(
        await templateCheckout(),
        packDir,
        runner.run,
      );

      expect(result).toMatchObject({
        ok: false,
        failed: creationLine(scratch),
        message: `The Template gate failed at \`${creationLine(scratch)}\`: ${reason}`,
      });
    },
  );

  it("stops before running the CLI on a Template without template:detach or without its manifest", async () => {
    const packDir = await packOutput(ALL_FOUR);
    const cases = [
      {
        template: await templateCheckout(["build", "lint", "test"]),
        reason: "the Template has no `template:detach` script.",
      },
      {
        template: await templateCheckout(undefined, undefined, false),
        reason:
          "the Template has no template-maintenance.json listing its maintenance `paths`.",
      },
    ];
    for (const { template, reason } of cases) {
      const runner = fakeRunner();

      const { result, scratch } = await gate(template, packDir, runner.run);

      expect(lines(runner.commands)).toEqual(allSteps(scratch).slice(0, -1));
      expect(result).toMatchObject({
        ok: false,
        message: `The Template gate failed at \`${creationLine(scratch)}\`: ${reason}`,
      });
    }
  });
});

describe("templateRef", () => {
  it.each([
    ["1.0.0-alpha.0", "v1"],
    ["1.0.0-alpha.12", "v1"],
    ["1.0.0", "v1"],
    ["1.4.2", "v1"],
    ["2.0.0-alpha.3", "v2"],
    ["10.1.0", "v10"],
  ])("maps library %s to the Template's %s", (version, ref) => {
    expect(templateRef(version)).toBe(ref);
  });

  it("refuses a version that is not semver", () => {
    expect(() => templateRef("1.0")).toThrow('"1.0" is not a semver version.');
    expect(() => templateRef("01.0.0")).toThrow(
      '"01.0.0" is not a semver version.',
    );
  });
});

describe("release:template-gate", () => {
  async function runCli(args: string[], run: Runner = fakeRunner().run) {
    let stdout = "";
    let stderr = "";
    const cwd = await tempDir("cwd");
    const status = await main(
      args,
      {
        stdout: (text) => (stdout += text),
        stderr: (text) => (stderr += text),
      },
      { cwd, root: await writeWorkspace(), run },
    );
    return { status, stdout, stderr };
  }

  it("prints the usage and exits 2 without a pack output", async () => {
    expect(await runCli(["--template", "t"])).toMatchObject({
      status: 2,
      stderr: expect.stringContaining(
        "Usage: release:template-gate",
      ) as unknown,
    });
  });

  it("prints the Template ref of the library version the plan publishes", async () => {
    const packDir = await packOutput([
      { name: "reforged-ts", version: "2.0.0-alpha.1" },
    ]);
    expect(await runCli(["--print-ref", "--pack-dir", packDir])).toEqual({
      status: 0,
      stdout: "v2\n",
      stderr: "",
    });
  });

  it("prints the Template ref of the workspace's library when the plan lacks it", async () => {
    const packDir = await packOutput([{ name: "reforged-types" }]);
    expect(await runCli(["--print-ref", "--pack-dir", packDir])).toEqual({
      status: 0,
      stdout: "v1\n",
      stderr: "",
    });
  });

  it("exits 0 when the Template passes and 1 naming the failing command", async () => {
    const packDir = await packOutput(ALL_FOUR);
    const args = [
      "--template",
      await templateCheckout(),
      "--pack-dir",
      packDir,
    ];
    expect(await runCli(args)).toMatchObject({
      status: 0,
      stdout: expect.stringContaining(
        "The Template builds, lints and passes its tests with eslint-plugin-reforged@1.0.0-alpha.0, reforged-test@1.0.0-alpha.0, reforged-ts@1.0.0-alpha.0, reforged-types@1.0.0-alpha.0, and create-reforged-map creates a Map project from it.\n",
      ) as unknown,
      stderr: "",
    });
    expect(
      await runCli(args, fakeRunner({ failing: "pnpm run test" }).run),
    ).toMatchObject({
      status: 1,
      stderr: expect.stringContaining(
        "The Template gate failed at `pnpm run test`: exit code 1.",
      ) as unknown,
    });
  });
});
