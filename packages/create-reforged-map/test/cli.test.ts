import { execFileSync } from "node:child_process";
import { readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { main, USAGE } from "../src/cli.js";
import { runInherited, type Runner } from "../src/process.js";
import {
  MAINTENANCE_PATHS,
  TEMPLATE_FILES,
  lines,
  listFiles,
  recordingRunner,
  tempDir,
  templateArchive,
} from "./support/template.js";

interface CliOptions {
  run?: Runner;
  /**
   * The lines an author types, in order, on a terminal; without them
   * standard input is not a terminal.
   */
  typed?: readonly (string | undefined)[];
}

async function runCli(args: readonly string[], options: CliOptions = {}) {
  let stdout = "";
  let stderr = "";
  const output = {
    stdout: (text: string) => (stdout += text),
    stderr: (text: string) => (stderr += text),
  };
  const questions: string[] = [];
  const typed = [...(options.typed ?? [])];
  const status = await main(args, output, {
    run: options.run ?? runInherited,
    interactive: options.typed !== undefined,
    ask: (question) => {
      questions.push(question);
      if (typed.length === 0) {
        throw new Error(`Asked once too many: ${question}`);
      }
      return Promise.resolve(typed.shift());
    },
  });
  return { status, stdout, stderr, questions };
}

async function packageJson(folder: string): Promise<unknown> {
  return JSON.parse(await readFile(join(folder, "package.json"), "utf8"));
}

async function exists(path: string): Promise<boolean> {
  return (await stat(path).catch(() => null)) !== null;
}

describe("create-reforged-map", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    [[]],
    [["my-map"]],
    [["my-map", "--template"]],
    [["my-map", "--template", "--skip-git"]],
    [["my-map", "other", "--template", "t.tar.gz"]],
    [["my-map", "--template", "a.tar.gz", "--template", "b.tar.gz"]],
    [["my-map", "--template", "t.tar.gz", "--skip-git", "--skip-git"]],
    [["my-map", "--template", "t.tar.gz", "--yes", "--yes"]],
    [["my-map", "--template", "t.tar.gz", "-y"]],
    [["my-map", "--template", "t.tar.gz", "--force"]],
    [["my-map", "--template", "t.tar.gz", "--name"]],
    [["my-map", "--template", "t.tar.gz", "--name", ""]],
    [["my-map", "--template", "t.tar.gz", "--name", "a", "--name", "b"]],
    [["my-map", "--template", "t.tar.gz", "--description", "--skip-git"]],
    [
      [
        "my-map",
        "--template",
        "t.tar.gz",
        "--description",
        "a",
        "--description",
        "b",
      ],
    ],
  ])("prints the usage and exits 2 on %j", async (args) => {
    const runner = recordingRunner();

    expect(await runCli(args, { run: runner.run })).toEqual({
      status: 2,
      stdout: "",
      stderr: `${USAGE}\n`,
      questions: [],
    });
    expect(runner.commands).toEqual([]);
  });

  it("passes the folder, the Template and the skip flags to the creation", async () => {
    const folder = join(await tempDir("target"), "my-map");
    const runner = recordingRunner();
    const result = await runCli(
      [
        "--skip-install",
        folder,
        "--template",
        await templateArchive(),
        "--skip-git",
      ],
      { run: runner.run },
    );

    expect(result).toMatchObject({ status: 0, stderr: "" });
    expect(result.stdout).toContain(
      `Created the Map project in ${folder}. Next steps:\n`,
    );
    expect(lines(runner.commands)).toEqual([
      "pnpm --version",
      "pnpm template:detach",
    ]);
  });

  it("passes the project name and the description to the Seeds", async () => {
    const folder = join(await tempDir("target"), "my-map");
    const result = await runCli(
      [
        folder,
        "--description",
        "A tower defense where the towers walk.",
        "--template",
        await templateArchive(),
        "--name",
        "tower-walk",
      ],
      { run: recordingRunner().run },
    );

    expect(result).toMatchObject({ status: 0, stderr: "" });
    expect(result.stdout).toContain("Preparing the Seeds for tower-walk\n");
    expect(await packageJson(folder)).toMatchObject({
      name: "tower-walk",
      description: "A tower defense where the towers walk.",
    });
  });

  it("without a terminal, names the project after the folder and keeps the Template's description, asking nothing", async () => {
    const folder = join(await tempDir("target"), "orc-siege");
    const result = await runCli(
      [folder, "--template", await templateArchive()],
      { run: recordingRunner().run },
    );

    expect(result).toMatchObject({ status: 0, stderr: "", questions: [] });
    expect(await packageJson(folder)).toMatchObject({
      name: "orc-siege",
      description: "Warcraft III 3.0.0 map project.",
    });
  });

  it("without a terminal, a missing folder names its argument and nothing runs", async () => {
    const runner = recordingRunner();

    expect(
      await runCli(["--template", await templateArchive(), "--yes"], {
        run: runner.run,
      }),
    ).toEqual({
      status: 2,
      stdout: "",
      stderr:
        "The folder is missing: pass it as the first argument, <folder> (standard input is not a terminal, so nothing is asked).\n",
      questions: [],
    });
    expect(runner.commands).toEqual([]);
  });

  it.each([
    ["Tower-Walk", "it has capital letters"],
    [".hidden", "it starts with a period"],
    ["_private", "it starts with an underscore"],
    [" spaced", "it starts or ends with a space"],
    ["node_modules", "npm reserves it"],
    ["fs", "it is the name of a Node module"],
    ["a".repeat(215), "it is longer than 214 characters"],
    [
      "tower walk",
      "it has characters a URL does not take as they are (only letters, digits, - . _ ~ and one @scope/ prefix)",
    ],
    [
      "@maps",
      "it has characters a URL does not take as they are (only letters, digits, - . _ ~ and one @scope/ prefix)",
    ],
    [
      "@maps/tower/walk",
      "it has characters a URL does not take as they are (only letters, digits, - . _ ~ and one @scope/ prefix)",
    ],
    ["tower!", "it has one of the characters ~'!()*"],
  ])("refuses the project name %j of --name: %s", async (name, reason) => {
    const folder = join(await tempDir("target"), "my-map");
    const runner = recordingRunner();

    expect(
      await runCli(
        [folder, "--template", await templateArchive(), "--name", name],
        { run: runner.run, typed: [] },
      ),
    ).toEqual({
      status: 2,
      stdout: "",
      stderr: `The project name ${JSON.stringify(name)} of --name is not a valid npm package name: ${reason}.\n`,
      questions: [],
    });
    expect(runner.commands).toEqual([]);
    expect(await exists(folder)).toBe(false);
  });

  it.each(["tower-walk", "@orc-maps/tower_walk.v2", "a".repeat(214)])(
    "takes the project name %j",
    async (name) => {
      const folder = join(await tempDir("target"), "my-map");
      const result = await runCli(
        [folder, "--template", await templateArchive(), "--name", name],
        { run: recordingRunner().run },
      );

      expect(result).toMatchObject({ status: 0, stderr: "" });
      expect(await packageJson(folder)).toMatchObject({ name });
    },
  );

  it("without a terminal, refuses a folder whose base name is not a valid project name, naming --name", async () => {
    const folder = join(await tempDir("target"), "Orc Siege");

    expect(
      await runCli([folder, "--template", await templateArchive()], {
        run: recordingRunner().run,
      }),
    ).toMatchObject({
      status: 2,
      stderr: `The project name "Orc Siege", the folder's base name, is not a valid npm package name: it has capital letters. Pass one with --name.\n`,
    });
    expect(await exists(folder)).toBe(false);
  });

  it("with --yes on a terminal, runs with the folder alone, asking nothing", async () => {
    const folder = join(await tempDir("target"), "orc-siege");
    const result = await runCli(
      [folder, "--yes", "--template", await templateArchive()],
      { run: recordingRunner().run, typed: [] },
    );

    expect(result).toMatchObject({ status: 0, stderr: "", questions: [] });
    expect(await packageJson(folder)).toMatchObject({
      name: "orc-siege",
      description: "Warcraft III 3.0.0 map project.",
    });
  });

  it("on a terminal, asks only for the answers not given", async () => {
    const folder = join(await tempDir("target"), "my-map");
    const result = await runCli(
      [folder, "--template", await templateArchive(), "--name", "tower-walk"],
      { run: recordingRunner().run, typed: ["  Towers that walk.  "] },
    );

    expect(result).toMatchObject({
      status: 0,
      stderr: "",
      questions: ["A one-line description of the map (optional): "],
    });
    expect(await packageJson(folder)).toMatchObject({
      name: "tower-walk",
      description: "Towers that walk.",
    });
  });

  it("on a terminal, asks for every answer, again for a blank folder and an invalid name, with the reason", async () => {
    const folder = join(await tempDir("target"), "orc-siege");
    const result = await runCli(["--template", await templateArchive()], {
      run: recordingRunner().run,
      typed: ["", folder, "Orc Siege", "", ""],
    });

    expect(result).toMatchObject({
      status: 0,
      stderr:
        '"Orc Siege" is not a valid npm package name: it has capital letters.\n',
      questions: [
        "Folder of the new Map project: ",
        "Folder of the new Map project: ",
        "Project name (orc-siege): ",
        "Project name (orc-siege): ",
        "A one-line description of the map (optional): ",
      ],
    });
    expect(await packageJson(folder)).toMatchObject({
      name: "orc-siege",
      description: "Warcraft III 3.0.0 map project.",
    });
  });

  it.each([0, 1, 2])(
    "on a terminal, an input ended at question %i cancels with nothing created",
    async (question) => {
      const folder = join(await tempDir("target"), "orc-siege");
      const runner = recordingRunner();
      const typed = [folder, "orc-siege"].slice(0, question);
      const result = await runCli(["--template", await templateArchive()], {
        run: runner.run,
        typed: [...typed, undefined],
      });

      expect(result).toMatchObject({
        status: 1,
        stdout: "",
        stderr: "Cancelled: nothing was created.\n",
      });
      expect(result.questions).toHaveLength(question + 1);
      expect(runner.commands).toEqual([]);
      expect(await exists(folder)).toBe(false);
    },
  );

  it("prints why the creation stopped and exits 1", async () => {
    const folder = join(await tempDir("target"), "my-map");
    const result = await runCli(
      [folder, "--template", join(folder, "missing.tar.gz")],
      { run: recordingRunner().run },
    );

    expect(result).toMatchObject({
      status: 1,
      stderr: expect.stringMatching(
        /^The creation stopped at writing the Template: there is no file or folder .+missing\.tar\.gz\.\n$/,
      ) as unknown,
    });
  });

  it("creates a Map project end to end with git and pnpm: the Template's files, the maintenance gone, one commit", async () => {
    // git reads no configuration of this machine, and has an identity.
    const config = join(await tempDir("git-config"), "gitconfig");
    await writeFile(config, "");
    vi.stubEnv("GIT_CONFIG_GLOBAL", config);
    vi.stubEnv("GIT_CONFIG_NOSYSTEM", "1");
    for (const role of ["AUTHOR", "COMMITTER"]) {
      vi.stubEnv(`GIT_${role}_NAME`, "Map Author");
      vi.stubEnv(`GIT_${role}_EMAIL`, "author@example.com");
    }
    const folder = join(await tempDir("target"), "my-map");
    const result = await runCli([
      folder,
      "--template",
      await templateArchive(),
      "--skip-install",
    ]);

    expect(result).toMatchObject({ status: 0, stderr: "" });
    const git = (...args: string[]) =>
      execFileSync("git", args, { cwd: folder, encoding: "utf8" }).trim();
    expect(git("rev-list", "--count", "HEAD")).toBe("1");
    expect(git("status", "--porcelain")).toBe("");
    const tracked = git("ls-files").split("\n").sort();
    const expected = Object.keys(TEMPLATE_FILES)
      .filter((path) => !MAINTENANCE_PATHS.includes(path))
      .sort();
    expect(tracked).toEqual(expected);
    expect(
      (await listFiles(folder)).filter((path) => !path.startsWith(".git/")),
    ).toEqual(expected);
    const manifest = JSON.parse(
      await readFile(join(folder, "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };
    expect(Object.keys(manifest.scripts)).toEqual(["build"]);
  });
});
