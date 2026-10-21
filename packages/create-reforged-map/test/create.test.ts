import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  COMMIT_MESSAGE,
  create,
  type Answers,
  type CreateResult,
} from "../src/create.js";
import { commandLine, type Runner } from "../src/process.js";
import { localTemplate } from "../src/template.js";
import {
  LONG_PATH,
  MAINTENANCE_PATHS,
  TEMPLATE_FILES,
  lines,
  listFiles,
  recordingRunner,
  tempDir,
  templateArchive,
  writeFiles,
} from "./support/template.js";

const COMMIT = commandLine({
  command: "git",
  args: ["commit", "--quiet", "--message", COMMIT_MESSAGE],
});

/** Every command of a creation that skips nothing, in order. */
const ALL_COMMANDS = [
  "pnpm --version",
  "git --version",
  "git init",
  "pnpm install",
  "pnpm template:detach",
  "git add --all",
  "git var GIT_AUTHOR_IDENT",
  "git var GIT_COMMITTER_IDENT",
  COMMIT,
];

/** The fixture's files once `template:detach` has run. */
const DETACHED_FILES = Object.keys(TEMPLATE_FILES)
  .filter((path) => !MAINTENANCE_PATHS.includes(path))
  .sort();

/**
 * Runs `create` into `folder` under a new temporary folder, from the
 * fixture's archive unless `template` names another source.
 */
async function runCreate(
  options: {
    answers?: Partial<Answers>;
    run?: Runner;
    template?: string;
    folder?: string;
    nodeVersion?: string;
  } = {},
): Promise<{ result: CreateResult; folder: string; printed: string[] }> {
  const folder = join(await tempDir("target"), options.folder ?? "my-map");
  const printed: string[] = [];
  const result = await create({
    answers: {
      folder,
      skipInstall: false,
      skipGit: false,
      ...options.answers,
    },
    template: localTemplate(options.template ?? (await templateArchive())),
    run: options.run ?? recordingRunner().run,
    print: (line) => printed.push(line),
    // A Node the fixture's engines (>=24) admits, whatever runs the tests.
    nodeVersion: options.nodeVersion ?? "v24.0.0",
  });
  return { result, folder, printed };
}

/** The entries of `folder`, or `null` when it does not exist. */
async function entries(folder: string): Promise<string[] | null> {
  return readdir(folder).catch(() => null);
}

describe("create", () => {
  it("creates the project from an archive: the Template's files, without its top-level folder", async () => {
    const runner = recordingRunner();
    const { result, folder } = await runCreate({ run: runner.run });

    expect(result).toEqual({ ok: true, folder, committed: true });
    expect(await listFiles(folder)).toEqual(DETACHED_FILES);
    expect(await readFile(join(folder, ...LONG_PATH.split("/")), "utf8")).toBe(
      TEMPLATE_FILES[LONG_PATH],
    );
    expect(
      await readFile(join(folder, "maps/fixture.w3m/war3map.w3i")),
    ).toEqual(Buffer.from(TEMPLATE_FILES["maps/fixture.w3m/war3map.w3i"]));
    const manifest = JSON.parse(
      await readFile(join(folder, "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };
    expect(manifest.scripts).not.toHaveProperty("template:detach");
  });

  it("runs the checks, then git, the install, the detach and the commit in the new folder", async () => {
    const runner = recordingRunner();
    const { folder } = await runCreate({ run: runner.run });

    expect(lines(runner.commands)).toEqual(ALL_COMMANDS);
    expect(runner.commands.map(({ cwd }) => cwd)).toEqual([
      undefined,
      undefined,
      ...ALL_COMMANDS.slice(2).map(() => folder),
    ]);
    expect(
      runner.commands
        .filter(({ command }) => command === "pnpm")
        .map(({ env }) => env),
    ).toEqual([
      undefined,
      { npm_config_manage_package_manager_versions: "true" },
      { npm_config_manage_package_manager_versions: "true" },
    ]);
  });

  it("prints each stage as it runs, then the next steps", async () => {
    const { printed, folder } = await runCreate();

    expect(printed).toEqual([
      "Checking the folder, pnpm and git",
      expect.stringMatching(/^Writing the Template from .+template\.tar\.gz$/),
      `Moving it into ${folder}`,
      "Initialising git: git init",
      "Installing the dependencies: pnpm install",
      "Removing the Template maintenance: pnpm template:detach",
      "Staging the files: git add --all",
      `Committing: ${COMMIT}`,
      "",
      `Created the Map project in ${folder}. Next steps:`,
      `  cd ${folder}`,
      "  open maps/fixture.w3m in the World Editor",
      "  pnpm build",
      "  pnpm test:map",
    ]);
  });

  it("warns, once the Template is written, when the running Node is below its engines, and goes on", async () => {
    const { result, printed, folder } = await runCreate({
      nodeVersion: "v22.13.0",
    });

    expect(result).toMatchObject({ ok: true });
    expect(printed.slice(1, 4)).toEqual([
      expect.stringMatching(/^Writing the Template from /),
      "Warning: Node v22.13.0 does not satisfy the Template's engines requirement, node >=24: its scripts may fail on it. Install a Node it admits (https://nodejs.org) before you build the project.",
      `Moving it into ${folder}`,
    ]);
  });

  it.each([
    ["v24.0.0", TEMPLATE_FILES],
    ["v25.2.1", TEMPLATE_FILES],
    [
      "v18.0.0",
      {
        ...TEMPLATE_FILES,
        "package.json": JSON.stringify({
          name: "reforged-ts-template",
          scripts: { "template:detach": "node scripts/detach.mjs" },
        }),
      },
    ],
  ])(
    "does not warn with Node %s, which the Template's engines admit or leave unsaid",
    async (nodeVersion, files) => {
      const { result, printed } = await runCreate({
        nodeVersion,
        template: await templateArchive(files),
      });

      expect(result).toMatchObject({ ok: true });
      expect(printed.filter((line) => line.startsWith("Warning"))).toEqual([]);
    },
  );

  it("leaves the install out with skipInstall, and names it in the next steps", async () => {
    const runner = recordingRunner();
    const { result, printed } = await runCreate({
      answers: { skipInstall: true },
      run: runner.run,
    });

    expect(result).toMatchObject({ ok: true, committed: true });
    expect(lines(runner.commands)).toEqual(
      ALL_COMMANDS.filter((line) => line !== "pnpm install"),
    );
    expect(printed.slice(-5)).toEqual([
      expect.stringMatching(/^ {2}cd /),
      "  pnpm install",
      "  open maps/fixture.w3m in the World Editor",
      "  pnpm build",
      "  pnpm test:map",
    ]);
  });

  it("leaves git out with skipGit, the detach still run", async () => {
    const runner = recordingRunner();
    const { result, folder } = await runCreate({
      answers: { skipGit: true },
      run: runner.run,
    });

    expect(result).toEqual({ ok: true, folder, committed: false });
    expect(lines(runner.commands)).toEqual([
      "pnpm --version",
      "pnpm install",
      "pnpm template:detach",
    ]);
    expect(await listFiles(folder)).toEqual(DETACHED_FILES);
  });

  it("runs the detach alone in the new folder with both skipped", async () => {
    const runner = recordingRunner();
    await runCreate({
      answers: { skipGit: true, skipInstall: true },
      run: runner.run,
    });

    expect(lines(runner.commands)).toEqual([
      "pnpm --version",
      "pnpm template:detach",
    ]);
  });

  it("creates the project from a folder, leaving out its .git and node_modules", async () => {
    const template = await tempDir("template");
    await writeFiles(template, {
      ...TEMPLATE_FILES,
      ".git/HEAD": "ref: refs/heads/main\n",
      "node_modules/x/package.json": "{}\n",
    });
    const { result, folder } = await runCreate({ template });

    expect(result).toMatchObject({ ok: true });
    expect(await listFiles(folder)).toEqual(DETACHED_FILES);
  });

  it("creates the project in an empty folder that exists, and in one whose parents do not", async () => {
    const parent = await tempDir("parent");
    const empty = join(parent, "empty");
    await mkdir(empty);
    const deep = join(parent, "a", "b", "map");
    for (const folder of [empty, deep]) {
      const printed: string[] = [];
      const result = await create({
        answers: { folder, skipInstall: false, skipGit: false },
        template: localTemplate(await templateArchive()),
        run: recordingRunner().run,
        print: (line) => printed.push(line),
      });

      expect(result, folder).toMatchObject({ ok: true });
      expect(await listFiles(folder)).toEqual(DETACHED_FILES);
    }
    expect((await entries(parent))?.sort()).toEqual(["a", "empty"]);
  });

  it("refuses a folder that is not empty, writing nothing and running nothing", async () => {
    const parent = await tempDir("parent");
    const folder = join(parent, "my-map");
    await writeFiles(folder, { "notes.txt": "mine\n" });
    const runner = recordingRunner();
    const result = await create({
      answers: { folder, skipInstall: false, skipGit: false },
      template: localTemplate(await templateArchive()),
      run: runner.run,
      print: () => undefined,
    });

    expect(result).toEqual({
      ok: false,
      stage: "check",
      message: `The creation stopped at the checks: ${folder} exists and is not empty: choose another folder, or empty this one.`,
    });
    expect(runner.commands).toEqual([]);
    expect(await entries(parent)).toEqual(["my-map"]);
    expect(await entries(folder)).toEqual(["notes.txt"]);
  });

  it("refuses a file in the folder's place", async () => {
    const parent = await tempDir("parent");
    const folder = join(parent, "my-map");
    await writeFile(folder, "a file\n");
    const result = await create({
      answers: { folder, skipInstall: false, skipGit: false },
      template: localTemplate(await templateArchive()),
      run: recordingRunner().run,
      print: () => undefined,
    });

    expect(result).toMatchObject({
      ok: false,
      stage: "check",
      message: expect.stringContaining(
        `${folder} exists and is not a folder.`,
      ) as unknown,
    });
  });

  it.each([
    ["pnpm", "https://pnpm.io/installation", ["pnpm --version"]],
    [
      "git",
      "https://git-scm.com/downloads",
      ["pnpm --version", "git --version"],
    ],
  ])(
    "refuses to start when %s does not run, saying how to install it",
    async (program, url, commands) => {
      for (const runner of [
        recordingRunner({ missing: [program] }),
        recordingRunner({ exitCodes: { [`${program} --version`]: 1 } }),
      ]) {
        const { result, folder } = await runCreate({ run: runner.run });

        expect(result).toMatchObject({
          ok: false,
          stage: "check",
          message: expect.stringContaining(url) as unknown,
        });
        expect(lines(runner.commands)).toEqual(commands);
        expect(await entries(dirname(folder))).toEqual([]);
      }
    },
  );

  it("leaves no target and no temporary folder when the archive cannot be read", async () => {
    const archive = join(await tempDir("archive"), "broken.tar.gz");
    await writeFile(archive, Buffer.from([0x1f, 0x8b, 1, 2, 3]));
    const runner = recordingRunner();
    const { result, folder } = await runCreate({
      template: archive,
      run: runner.run,
      folder: "a/b/my-map",
    });

    expect(result).toEqual({
      ok: false,
      stage: "template",
      message: `The creation stopped at writing the Template: ${archive} cannot be read: it is not a valid gzip file.`,
    });
    expect(lines(runner.commands)).toEqual(ALL_COMMANDS.slice(0, 2));
    expect(await entries(dirname(dirname(dirname(folder))))).toEqual([]);
  });

  it.each([
    ["not a tar", Buffer.from("not a tar archive at all".repeat(40))],
    ["no file", new Uint8Array(1024)],
  ])("leaves no target when the archive holds %s", async (_what, bytes) => {
    const archive = join(await tempDir("archive"), "template.tar");
    await writeFile(archive, bytes);
    const { result, folder } = await runCreate({ template: archive });

    expect(result).toMatchObject({ ok: false, stage: "template" });
    expect(await entries(dirname(folder))).toEqual([]);
  });

  it("leaves no target when the Template has no template:detach script", async () => {
    const files = {
      ...TEMPLATE_FILES,
      "package.json": JSON.stringify({ name: "old-template", scripts: {} }),
    };
    const { result, folder } = await runCreate({
      template: await templateArchive(files),
    });

    expect(result).toEqual({
      ok: false,
      stage: "template",
      message:
        "The creation stopped at writing the Template: the Template's package.json has no `template:detach` script, which removes its maintenance files.",
    });
    expect(await entries(dirname(folder))).toEqual([]);
  });

  it("leaves no target when the source does not exist", async () => {
    const missing = join(await tempDir("archive"), "missing.tar.gz");
    const { result, folder } = await runCreate({ template: missing });

    expect(result).toMatchObject({
      ok: false,
      stage: "template",
      message: expect.stringContaining(
        `there is no file or folder ${missing}.`,
      ) as unknown,
    });
    expect(await entries(dirname(folder))).toEqual([]);
  });

  it.each([
    ["git init", "git", "git init", 2],
    ["pnpm install", "install", "the install", 3],
    ["pnpm template:detach", "detach", "the detach", 4],
    ["git add --all", "commit", "the first commit", 5],
    [COMMIT, "commit", "the first commit", 8],
  ] as const)(
    "stops at `%s` when it fails, naming its stage and the commands to finish by hand",
    async (failing, stage, stageName, index) => {
      const runner = recordingRunner({ exitCodes: { [failing]: 1 } });
      const { result, folder } = await runCreate({ run: runner.run });

      const remaining = ALL_COMMANDS.slice(index).filter(
        (line) => !line.startsWith("git var"),
      );
      expect(result).toEqual({
        ok: false,
        stage,
        message: [
          `The creation stopped at ${stageName}: \`${failing}\` failed with exit code 1. The project is in ${folder}; to finish it by hand, run there:`,
          ...remaining.map((line) => `  ${line}`),
        ].join("\n"),
      });
      expect(lines(runner.commands)).toEqual(ALL_COMMANDS.slice(0, index + 1));
      expect(await entries(folder)).toContain("package.json");
    },
  );

  it("names a command that cannot start", async () => {
    const runner = recordingRunner();
    const run: Runner = (command) =>
      commandLine(command) === "pnpm install"
        ? Promise.reject(new Error("spawn pnpm ENOENT"))
        : runner.run(command);
    const { result } = await runCreate({ run });

    expect(result).toMatchObject({
      ok: false,
      stage: "install",
      message: expect.stringContaining(
        "`pnpm install` did not start: spawn pnpm ENOENT",
      ) as unknown,
    });
  });

  it.each(["git var GIT_AUTHOR_IDENT", "git var GIT_COMMITTER_IDENT"])(
    "leaves the files staged and succeeds when `%s` finds no identity",
    async (failing) => {
      const runner = recordingRunner({ exitCodes: { [failing]: 128 } });
      const { result, folder, printed } = await runCreate({ run: runner.run });

      expect(result).toEqual({ ok: true, folder, committed: false });
      expect(lines(runner.commands)).toEqual(
        ALL_COMMANDS.slice(0, ALL_COMMANDS.indexOf(failing) + 1),
      );
      expect(printed).toEqual(
        expect.arrayContaining([
          "git has no identity yet, so the files are staged but not committed. Set one, then commit:",
          '  git config --global user.name "Your Name"',
          '  git config --global user.email "you@example.com"',
          `  ${COMMIT}`,
          "  pnpm test:map",
        ]),
      );
      expect(await listFiles(folder)).toEqual(DETACHED_FILES);
    },
  );
});
