import { createHash } from "node:crypto";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main } from "../src/cli/template-clone.js";
import type { GitCommand } from "../src/git.js";
import { cloneTemplate, gitEnvironment } from "../src/template-clone.js";
import { tempDir, writeText, writeWorkspace } from "./support/workspace.js";

const TOKEN = "github_pat_secret";
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

describe("gitEnvironment", () => {
  it("authenticates through configuration variables, never interactively", () => {
    const basic = Buffer.from(`x-access-token:${TOKEN}`).toString("base64");
    expect(gitEnvironment(TOKEN)).toEqual({
      GIT_TERMINAL_PROMPT: "0",
      GIT_CONFIG_COUNT: "1",
      GIT_CONFIG_KEY_0: "http.https://github.com/.extraheader",
      GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${basic}`,
    });
    expect(gitEnvironment(undefined)).toEqual({ GIT_TERMINAL_PROMPT: "0" });
    expect(gitEnvironment("")).toEqual({ GIT_TERMINAL_PROMPT: "0" });
  });
});

describe("cloneTemplate", () => {
  it("looks the ref up, then clones it shallow, with the token out of every argument", async () => {
    const { commands, git } = fakeGit();
    expect(
      await cloneTemplate({ ref: "v1", into: "/tmp/t", token: TOKEN, git }),
    ).toEqual({ ok: true });
    expect(commands.map(({ args }) => args)).toEqual([
      ["ls-remote", "--exit-code", URL, "refs/tags/v1", "refs/heads/v1"],
      ["clone", "--quiet", "--depth", "1", "--branch", "v1", URL, "/tmp/t"],
    ]);
    for (const { args, env } of commands) {
      expect(args.join(" ")).not.toContain(TOKEN);
      expect(env).toEqual(gitEnvironment(TOKEN));
    }
  });

  it("names the missing ref and does not clone", async () => {
    const { commands, git } = fakeGit({ "ls-remote": 2 });
    const result = await cloneTemplate({
      ref: "v1",
      into: "/tmp/t",
      token: TOKEN,
      git,
    });
    expect(result).toEqual({
      ok: false,
      message: expect.stringContaining(
        "The Template (phmilk/reforged-ts-template) has no v1 tag or branch.",
      ) as unknown,
    });
    expect(commands).toHaveLength(1);
  });

  it("names the missing token when the Template cannot be read without one", async () => {
    const { git } = fakeGit({ "ls-remote": 128 });
    expect(
      await cloneTemplate({ ref: "v1", into: "/tmp/t", token: undefined, git }),
    ).toEqual({
      ok: false,
      message: expect.stringContaining(
        "set the repository secret TEMPLATE_READ_TOKEN",
      ) as unknown,
    });
  });

  it("names the token when it cannot read the Template", async () => {
    const { git } = fakeGit({ "ls-remote": 128 });
    const result = await cloneTemplate({
      ref: "v1",
      into: "/tmp/t",
      token: TOKEN,
      git,
    });
    expect(result).toEqual({
      ok: false,
      message: expect.stringContaining(
        "The token in TEMPLATE_READ_TOKEN cannot read the Template",
      ) as unknown,
    });
    expect(JSON.stringify(result)).not.toContain(TOKEN);
  });

  it("reports a failed clone", async () => {
    const { git } = fakeGit({ clone: 128 });
    expect(
      await cloneTemplate({ ref: "v1", into: "/tmp/t", token: TOKEN, git }),
    ).toEqual({
      ok: false,
      message:
        "git clone of the Template (phmilk/reforged-ts-template) at v1 into /tmp/t failed with exit code 128.",
    });
  });
});

describe("release:template-clone", () => {
  /** A pack output publishing reforged-ts at `version`. */
  async function packOutput(version: string): Promise<string> {
    const dir = await tempDir("pack");
    const path = `packages/reforged-ts-${version}.tgz`;
    const bytes = `tarball of reforged-ts@${version}`;
    await writeText(dir, path, bytes);
    const integrity = `sha256-${createHash("sha256").update(bytes).digest("base64")}`;
    const entry = {
      kind: "publish",
      name: "reforged-ts",
      version,
      access: "public",
      tag: "next",
      tarball: { path, integrity },
    };
    await writeText(
      dir,
      "publish-plan.json",
      JSON.stringify({ version: 1, plan: [[entry]] }),
    );
    return dir;
  }

  async function runCli(
    args: string[],
    fake = fakeGit(),
    env: Record<string, string> = { TEMPLATE_READ_TOKEN: TOKEN },
  ) {
    let stdout = "";
    let stderr = "";
    const cwd = await tempDir("cwd");
    const status = await main(
      args,
      {
        stdout: (text) => (stdout += text),
        stderr: (text) => (stderr += text),
      },
      { cwd, root: await writeWorkspace(), env, git: fake.git },
    );
    return { status, stdout, stderr, cwd };
  }

  it("clones the Template at the ref of the library major the plan publishes", async () => {
    const fake = fakeGit();
    const packDir = await packOutput("2.0.0-alpha.3");
    const result = await runCli(["--pack-dir", packDir, "--into", "t"], fake);
    const into = join(result.cwd, "t");
    expect(result).toMatchObject({
      status: 0,
      stdout: `Cloned phmilk/reforged-ts-template at v2 into ${into}.\n`,
      stderr: "",
    });
    expect(fake.commands[1]?.args).toEqual([
      "clone",
      "--quiet",
      "--depth",
      "1",
      "--branch",
      "v2",
      URL,
      into,
    ]);
    expect(fake.commands[0]?.env).toEqual(gitEnvironment(TOKEN));
  });

  it("exits 1 with the message of a missing prerequisite", async () => {
    const packDir = await packOutput("1.0.0-alpha.0");
    expect(
      await runCli(
        ["--pack-dir", packDir, "--into", "t"],
        fakeGit({ "ls-remote": 2 }),
      ),
    ).toMatchObject({
      status: 1,
      stderr: expect.stringContaining("has no v1 tag or branch") as unknown,
    });
  });

  it("prints the usage and exits 2 without both folders", async () => {
    for (const args of [
      ["--pack-dir", "p"],
      ["--into", "t"],
      ["--pack-dir", "p", "--into"],
      ["--pack-dir", "p", "--into", "t", "--pack-dir", "q"],
    ]) {
      expect(await runCli(args)).toMatchObject({
        status: 2,
        stderr: "Usage: release:template-clone --pack-dir <dir> --into <dir>\n",
      });
    }
  });
});
