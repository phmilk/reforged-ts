import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main } from "../src/cli/template-gate.js";
import type { Runner } from "../src/process.js";
import { runTemplateGate } from "../src/template-gate.js";
import {
  ALL_FOUR,
  ALPHA,
  CLI,
  allSteps,
  creationSteps,
  fakeRunner,
  fileUrl,
  gate,
  lines,
  overridesOf,
  packOutput,
  STEP_LABELS,
  TEMPLATE_STEPS,
  templateCheckout,
} from "./support/template-gate.js";
import { tempDir, writeText, writeWorkspace } from "./support/workspace.js";

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
        templateRef: "main",
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

  it("prints the usage and exits 2 without a Template, a pack output and a branch", async () => {
    for (const args of [
      ["--template", "t", "--pack-dir", "p"],
      ["--template", "t", "--branch", "master"],
      ["--pack-dir", "p", "--branch", "master"],
      ["--print-ref", "--pack-dir", "p"],
    ]) {
      expect(await runCli(args)).toEqual({
        status: 2,
        stdout: "",
        stderr:
          "Usage: release:template-gate --template <path> --pack-dir <dir> --branch <name>\n",
      });
    }
  });

  it("checks the plan's create-reforged-map against the Template ref of the branch's channel", async () => {
    const template = await templateCheckout();
    const packDir = await packOutput([
      ...ALL_FOUR,
      { name: CLI, templateRef: "next" },
    ]);
    const args = ["--template", template, "--pack-dir", packDir];

    expect(await runCli([...args, "--branch", "next"])).toMatchObject({
      status: 0,
    });
    expect(await runCli([...args, "--branch", "master"])).toMatchObject({
      status: 1,
      stderr: expect.stringContaining(
        "downloads the Template at next, not at main, the Template ref of the release's channel",
      ) as unknown,
    });
  });

  it("refuses a branch with no channel, running nothing", async () => {
    const runner = fakeRunner();
    expect(
      await runCli(
        [
          "--template",
          await templateCheckout(),
          "--pack-dir",
          await packOutput(ALL_FOUR),
          "--branch",
          "feat/x",
        ],
        runner.run,
      ),
    ).toMatchObject({
      status: 1,
      stderr: expect.stringContaining(
        'A release runs from master or next, and "feat/x" is neither',
      ) as unknown,
    });
    expect(runner.commands).toEqual([]);
  });

  it("exits 0 when the Template passes and 1 naming the failing command", async () => {
    const packDir = await packOutput(ALL_FOUR);
    const args = [
      "--template",
      await templateCheckout(),
      "--pack-dir",
      packDir,
      "--branch",
      "master",
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
