import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join, posix, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { main } from "../src/cli/template-gate.js";
import {
  commandLine,
  runTemplateGate,
  templateRef,
  type Command,
  type Runner,
} from "../src/template-gate.js";
import { tempDir, writeText, writeWorkspace } from "./support/workspace.js";

const ALPHA = "1.0.0-alpha.0";

interface PlanEntry {
  name: string;
  version?: string;
  kind?: "publish" | "tag-only";
}

/**
 * A pack output as `changeset pack` writes it: a tarball per publish entry
 * under `packages/`, and the plan in chunks of one entry. `extra` tarballs
 * are written without a plan entry.
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
    const bytes = `tarball of ${name}@${version}`;
    await writeText(dir, path, bytes);
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

/** A Template checkout: the scripts and dependencies of the real one. */
async function templateCheckout(
  scripts: readonly string[] = ["build", "lint", "test"],
  fields: Record<string, unknown> = {},
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
      ...fields,
    }),
  );
  return dir;
}

async function overridesOf(template: string): Promise<unknown> {
  const manifest = JSON.parse(
    await readFile(join(template, "package.json"), "utf8"),
  ) as { pnpm?: { overrides?: unknown } };
  return manifest.pnpm?.overrides;
}

const fileUrl = (packDir: string, path: string) =>
  `file:${join(packDir, path).split(sep).join(posix.sep)}`;

/**
 * A runner standing in for pnpm: it records the commands, fails the one
 * named in `failing`, and on install puts in `node_modules` the version
 * each package's override names (or the one of `installs`).
 */
function fakePnpm(
  options: { failing?: string; installs?: Record<string, string> } = {},
): { run: Runner; commands: Command[] } {
  const commands: Command[] = [];
  const run: Runner = async (command) => {
    commands.push(command);
    if (commandLine(command) === options.failing) return 1;
    if (command.args[0] === "install") {
      const manifest = JSON.parse(
        await readFile(join(command.cwd, "package.json"), "utf8"),
      ) as { pnpm: { overrides: Record<string, string> } };
      for (const [name, spec] of Object.entries(manifest.pnpm.overrides)) {
        const version =
          options.installs?.[name] ??
          /-(\d+\.\d+\.\d+[^/]*)\.tgz$/.exec(spec)?.[1];
        await writeText(
          command.cwd,
          `node_modules/${name}/package.json`,
          JSON.stringify({ name, version }),
        );
      }
    }
    return 0;
  };
  return { run, commands };
}

const lines = (commands: readonly Command[]) => commands.map(commandLine);

const ALL_STEPS = [
  "pnpm install --no-frozen-lockfile",
  "pnpm run build --mode release",
  "pnpm run lint",
  "pnpm run test",
];

describe("runTemplateGate", () => {
  it("installs exactly the tarballs in the publish plan, as overrides", async () => {
    const packDir = await packOutput(
      [
        { name: "reforged-types" },
        { name: "reforged-ts" },
        { name: "reforged-ts-release", kind: "tag-only" },
      ],
      ["reforged-test"],
    );
    const template = await templateCheckout([], {
      pnpm: { overrides: { esbuild: "0.25.0" } },
    });

    const result = await runTemplateGate({
      template,
      packDir,
      run: fakePnpm().run,
    });

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
  });

  it("runs the install, then build in release mode, lint and tests, in the checkout", async () => {
    const packDir = await packOutput(ALL_FOUR);
    const template = await templateCheckout();
    const pnpm = fakePnpm();

    const result = await runTemplateGate({ template, packDir, run: pnpm.run });

    expect(result.ok).toBe(true);
    expect(lines(pnpm.commands)).toEqual(ALL_STEPS);
    expect(pnpm.commands.every(({ cwd }) => cwd === template)).toBe(true);
  });

  it.each(ALL_STEPS.map((failing, index) => [failing, index]))(
    "stops at `%s` when it fails, naming it",
    async (failing, index) => {
      const packDir = await packOutput(ALL_FOUR);
      const template = await templateCheckout();
      const pnpm = fakePnpm({ failing });

      const result = await runTemplateGate({
        template,
        packDir,
        run: pnpm.run,
      });

      expect(lines(pnpm.commands)).toEqual(ALL_STEPS.slice(0, index + 1));
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
    const pnpm = fakePnpm();

    const result = await runTemplateGate({ template, packDir, run: pnpm.run });

    expect(lines(pnpm.commands)).toEqual(ALL_STEPS.slice(0, 2));
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
    const pnpm = fakePnpm({ installs: { "reforged-types": "1.0.0" } });

    const result = await runTemplateGate({ template, packDir, run: pnpm.run });

    expect(lines(pnpm.commands)).toEqual(ALL_STEPS.slice(0, 1));
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
    const pnpm = fakePnpm();

    await expect(
      runTemplateGate({
        template: await templateCheckout(),
        packDir,
        run: pnpm.run,
      }),
    ).rejects.toThrow(
      `The tarball of reforged-ts@${ALPHA} does not match the publish plan's integrity`,
    );
    expect(pnpm.commands).toEqual([]);
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
  });
});

describe("release:template-gate", () => {
  async function runCli(args: string[], run: Runner = fakePnpm().run) {
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
    expect(await runCli(args)).toMatchObject({ status: 0, stderr: "" });
    expect(
      await runCli(args, fakePnpm({ failing: "pnpm run test" }).run),
    ).toMatchObject({
      status: 1,
      stderr: expect.stringContaining(
        "The Template gate failed at `pnpm run test`: exit code 1.",
      ) as unknown,
    });
  });
});
