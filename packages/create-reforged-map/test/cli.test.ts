import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { main, USAGE } from "../src/cli.js";
import type { Runner } from "../src/process.js";
import { TEMPLATE_REF, type Fetch } from "../src/template.js";
import {
  MAINTENANCE_PATHS,
  TEMPLATE_FILES,
  lines,
  listFiles,
  recordingRunner,
  tempDir,
  templateArchive,
} from "./support/template.js";

async function runCli(args: readonly string[], run?: Runner, fetch?: Fetch) {
  let stdout = "";
  let stderr = "";
  const output = {
    stdout: (text: string) => (stdout += text),
    stderr: (text: string) => (stderr += text),
  };
  const status = await main(
    args,
    output,
    ...(run === undefined ? [] : [{ run, fetch }]),
  );
  return { status, stdout, stderr };
}

describe("create-reforged-map", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    [[]],
    [["--template", "t.tar.gz"]],
    [["my-map", "--template"]],
    [["my-map", "--template", "--skip-git"]],
    [["my-map", "other", "--template", "t.tar.gz"]],
    [["my-map", "--template", "a.tar.gz", "--template", "b.tar.gz"]],
    [["my-map", "--template", "t.tar.gz", "--skip-git", "--skip-git"]],
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

    expect(await runCli(args, runner.run)).toEqual({
      status: 2,
      stdout: "",
      stderr: `${USAGE}\n`,
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
      runner.run,
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
      recordingRunner().run,
    );

    expect(result).toMatchObject({ status: 0, stderr: "" });
    expect(result.stdout).toContain("Preparing the Seeds for tower-walk\n");
    expect(
      JSON.parse(await readFile(join(folder, "package.json"), "utf8")),
    ).toMatchObject({
      name: "tower-walk",
      description: "A tower defense where the towers walk.",
    });
  });

  it("names the project after the folder without --name", async () => {
    const folder = join(await tempDir("target"), "orc-siege");
    const result = await runCli(
      [folder, "--template", await templateArchive()],
      recordingRunner().run,
    );

    expect(result).toMatchObject({ status: 0, stderr: "" });
    expect(
      JSON.parse(await readFile(join(folder, "package.json"), "utf8")),
    ).toMatchObject({ name: "orc-siege" });
  });

  it("downloads the Template from GitHub at the CLI's ref without --template", async () => {
    const folder = join(await tempDir("target"), "my-map");
    const archive = new Uint8Array(await readFile(await templateArchive()));
    const urls: string[] = [];
    const fetch: Fetch = (url) => {
      urls.push(url);
      return Promise.resolve(new Response(archive));
    };
    const runner = recordingRunner();
    const result = await runCli(
      [folder, "--skip-install", "--skip-git"],
      runner.run,
      fetch,
    );

    expect(result).toMatchObject({ status: 0, stderr: "" });
    expect(urls).toEqual([
      `https://codeload.github.com/phmilk/reforged-ts-template/tar.gz/${TEMPLATE_REF}`,
    ]);
    expect(lines(runner.commands)).toEqual([
      "pnpm --version",
      "pnpm template:detach",
    ]);
  });

  it("prints why the creation stopped and exits 1", async () => {
    const folder = join(await tempDir("target"), "my-map");
    const result = await runCli(
      [folder, "--template", join(folder, "missing.tar.gz")],
      recordingRunner().run,
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
