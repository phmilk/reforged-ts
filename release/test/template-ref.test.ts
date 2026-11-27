import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { main } from "../src/cli/template-ref.js";
import { readReleaseChannel } from "../src/release-channel.js";
import { TEMPLATE_REPOSITORY } from "../src/template-clone.js";
import { TEMPLATE_REF_MODULE } from "../src/template-ref.js";
import { writeText, writeWorkspace } from "./support/workspace.js";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

/**
 * The Creation CLI's source module that carries the Template ref it
 * downloads and the Template's repository. Imported by URL: the CLI is
 * another package, outside this one's sources, and its tests type-check it.
 */
const CLI_TEMPLATE = pathToFileURL(
  fileURLToPath(
    new URL(
      "../../packages/create-reforged-map/src/template.ts",
      import.meta.url,
    ),
  ),
).href;

/** The constants of the CLI's source module. */
const cliTemplate = () =>
  import(CLI_TEMPLATE) as Promise<{
    TEMPLATE_REF: unknown;
    TEMPLATE_REPOSITORY: unknown;
  }>;

describe("the Creation CLI's Template", () => {
  it("is at the Template ref of master's channel in its source, the one a local build downloads", async () => {
    const channel = await readReleaseChannel("master", ROOT);
    const cli = await cliTemplate();

    expect(channel.templateRef).toBe("main");
    expect(cli.TEMPLATE_REF).toBe(channel.templateRef);
  });

  it("is the repository the Template gate clones", async () => {
    expect((await cliTemplate()).TEMPLATE_REPOSITORY).toBe(TEMPLATE_REPOSITORY);
  });
});

describe("release:template-ref", () => {
  /** The Creation CLI's module holding its Template ref, in the workspace. */
  const BUILT_MODULE = `packages/create-reforged-map/${TEMPLATE_REF_MODULE}`;

  /** The Creation CLI's build output as tsc writes it from the source. */
  const BUILT = [
    'export const TEMPLATE_REPOSITORY = "phmilk/reforged-ts-template";',
    "/**",
    " * The Template ref the CLI downloads.",
    " */",
    'export const TEMPLATE_REF = "main";',
    "export function githubTemplate(options = {}) {",
    "    const ref = options.ref ?? TEMPLATE_REF;",
    "    return ref;",
    "}",
    "",
  ].join("\n");

  /** A workspace whose Creation CLI's build output holds `built`, or none. */
  async function workspace(built: string | null = BUILT) {
    const root = await writeWorkspace();
    if (built !== null) {
      await writeText(root, BUILT_MODULE, built);
    }
    return root;
  }

  const builtOutput = (root: string) =>
    readFile(join(root, BUILT_MODULE), "utf8");

  async function runCli(args: string[], root: string) {
    let stdout = "";
    let stderr = "";
    const status = await main(
      args,
      {
        stdout: (text) => (stdout += text),
        stderr: (text) => (stderr += text),
      },
      { root },
    );
    return { status, stdout, stderr };
  }

  it.each([
    ["master", "main"],
    ["next", "next"],
  ])(
    "writes the Template ref of %s's channel, %s, into the Creation CLI's build output",
    async (branch, ref) => {
      const root = await workspace();

      expect(await runCli(["--branch", branch], root)).toEqual({
        status: 0,
        stdout: `create-reforged-map downloads the Template at ${ref}, the Template ref of ${branch}'s Release channel.\n`,
        stderr: "",
      });
      expect(await builtOutput(root)).toBe(
        BUILT.replace('TEMPLATE_REF = "main";', `TEMPLATE_REF = "${ref}";`),
      );
    },
  );

  it("refuses a branch with no channel and writes nothing", async () => {
    const root = await workspace();

    expect(await runCli(["--branch", "feat/x"], root)).toMatchObject({
      status: 1,
      stderr: expect.stringContaining(
        'A release runs from master or next, and "feat/x" is neither',
      ) as unknown,
    });
    expect(await builtOutput(root)).toBe(BUILT);
  });

  it("fails on a Creation CLI that is not built, naming the build", async () => {
    const root = await workspace(null);

    expect(await runCli(["--branch", "master"], root)).toMatchObject({
      status: 1,
      stderr: expect.stringContaining(
        `${join(root, BUILT_MODULE)} cannot be read: build create-reforged-map first (pnpm build).`,
      ) as unknown,
    });
  });

  it("fails on a build output without one TEMPLATE_REF declaration", async () => {
    for (const built of [
      "export const OTHER = 1;\n",
      `${BUILT}export const TEMPLATE_REF = "main";\n`,
    ]) {
      const root = await workspace(built);
      expect(await runCli(["--branch", "next"], root)).toMatchObject({
        status: 1,
        stderr: expect.stringContaining(
          'does not declare `export const TEMPLATE_REF = "…";` once',
        ) as unknown,
      });
      expect(await builtOutput(root)).toBe(built);
    }
  });

  it("prints the usage and exits 2 without a branch", async () => {
    const root = await workspace();
    for (const args of [[], ["--branch"], ["--branch", "master", "--x"]]) {
      expect(await runCli(args, root)).toEqual({
        status: 2,
        stdout: "",
        stderr: "Usage: release:template-ref --branch <name>\n",
      });
    }
  });
});
