import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main } from "../src/cli/template-clone.js";
import type { GitCommand } from "../src/git.js";
import { cloneTemplate, GIT_ENVIRONMENT } from "../src/template-clone.js";
import { tempDir, writeWorkspace } from "./support/workspace.js";

const URL = "https://github.com/phmilk/reforged-ts-template.git";

/** A git that records its commands and answers with `codes` per command. */
function fakeGit(codes: { "ls-remote"?: number; clone?: number } = {}) {
  const commands: GitCommand[] = [];
  return {
    commands,
    git: (command: GitCommand) => {
      commands.push(command);
      const name = command.args[0] as "ls-remote" | "clone";
      return Promise.resolve(codes[name] ?? 0);
    },
  };
}

describe("cloneTemplate", () => {
  it("looks the branch up, then clones it shallow, never interactively", async () => {
    const { commands, git } = fakeGit();
    expect(await cloneTemplate({ ref: "main", into: "/tmp/t", git })).toEqual({
      ok: true,
    });
    expect(commands.map(({ args }) => args)).toEqual([
      ["ls-remote", "--exit-code", URL, "refs/heads/main"],
      ["clone", "--quiet", "--depth", "1", "--branch", "main", URL, "/tmp/t"],
    ]);
    for (const { env } of commands) {
      expect(env).toEqual({ GIT_TERMINAL_PROMPT: "0" });
    }
  });

  it("names the missing branch and does not clone", async () => {
    const { commands, git } = fakeGit({ "ls-remote": 2 });
    const result = await cloneTemplate({ ref: "next", into: "/tmp/t", git });
    expect(result).toEqual({
      ok: false,
      message:
        "The Template (phmilk/reforged-ts-template) has no branch next. " +
        "A release is gated against the Template's branch of its Release channel, " +
        'main from master and next from next (docs/release.md, "Release channels"): ' +
        "cut next on the Template, then re-run this job.",
    });
    expect(commands).toHaveLength(1);
  });

  it("says it cannot read the Template, and does not clone", async () => {
    const { commands, git } = fakeGit({ "ls-remote": 128 });
    expect(await cloneTemplate({ ref: "main", into: "/tmp/t", git })).toEqual({
      ok: false,
      message:
        "Cannot read the Template (phmilk/reforged-ts-template), git ls-remote exit code 128. " +
        "The gate clones it without a token: check that the repository exists and is public.",
    });
    expect(commands).toHaveLength(1);
  });

  it("reports a failed clone", async () => {
    const { git } = fakeGit({ clone: 128 });
    expect(await cloneTemplate({ ref: "main", into: "/tmp/t", git })).toEqual({
      ok: false,
      message:
        "git clone of the Template (phmilk/reforged-ts-template) at main into /tmp/t failed with exit code 128.",
    });
  });
});

describe("release:template-clone", () => {
  async function runCli(args: string[], fake = fakeGit()) {
    let stdout = "";
    let stderr = "";
    const cwd = await tempDir("cwd");
    const status = await main(
      args,
      {
        stdout: (text) => (stdout += text),
        stderr: (text) => (stderr += text),
      },
      { cwd, root: await writeWorkspace(), git: fake.git },
    );
    return { status, stdout, stderr, cwd };
  }

  it.each([
    ["master", "main"],
    ["next", "next"],
  ])(
    "clones the Template at the Template ref of %s's channel, %s",
    async (branch, ref) => {
      const fake = fakeGit();
      const result = await runCli(["--branch", branch, "--into", "t"], fake);
      const into = join(result.cwd, "t");
      expect(result).toMatchObject({
        status: 0,
        stdout: `Cloned phmilk/reforged-ts-template at ${ref} into ${into}.\n`,
        stderr: "",
      });
      expect(fake.commands[1]?.args).toEqual([
        "clone",
        "--quiet",
        "--depth",
        "1",
        "--branch",
        ref,
        URL,
        into,
      ]);
      expect(fake.commands[0]?.env).toEqual(GIT_ENVIRONMENT);
    },
  );

  it("refuses a branch with no channel, cloning nothing", async () => {
    const fake = fakeGit();
    expect(
      await runCli(["--branch", "feat/x", "--into", "t"], fake),
    ).toMatchObject({
      status: 1,
      stderr: expect.stringContaining(
        'A release runs from master or next, and "feat/x" is neither',
      ) as unknown,
    });
    expect(fake.commands).toEqual([]);
  });

  it("exits 1 with the message of a missing branch", async () => {
    expect(
      await runCli(
        ["--branch", "next", "--into", "t"],
        fakeGit({ "ls-remote": 2 }),
      ),
    ).toMatchObject({
      status: 1,
      stderr: expect.stringContaining("has no branch next") as unknown,
    });
  });

  it("prints the usage and exits 2 without a branch and a folder", async () => {
    for (const args of [
      ["--branch", "master"],
      ["--into", "t"],
      ["--branch", "master", "--into"],
      ["--pack-dir", "p", "--into", "t"],
      ["--branch", "master", "--into", "t", "--branch", "next"],
    ]) {
      expect(await runCli(args)).toMatchObject({
        status: 2,
        stderr: "Usage: release:template-clone --branch <name> --into <dir>\n",
      });
    }
  });
});
