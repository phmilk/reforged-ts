// The session-start hook that warns a Collaborator whose personal skills
// shadow the repository's (.claude/hooks/shadowed-skills.mjs, ADR 0022), run
// as Claude Code runs it, `node <script>`, against a fake home folder (HOME,
// and USERPROFILE on Windows), from a folder outside the repository: the
// repository skills it compares are the real folders of .claude/skills/.
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { read, root } from "./repository.js";

const script = ".claude/hooks/shadowed-skills.mjs";
const PLUGIN = "mattpocock-skills@claude-plugins-official";

const homes: string[] = [];

afterEach(() => {
  for (const home of homes.splice(0)) {
    rmSync(home, { recursive: true, force: true });
  }
});

// A new empty home folder, removed after the test.
function fakeHome(): string {
  const home = mkdtempSync(join(tmpdir(), "reforged-shadowed-skills-"));
  homes.push(home);
  return home;
}

// A personal skill of `name` under `user`, the user's Claude Code folder.
function personalSkill(user: string, name: string): void {
  mkdirSync(join(user, "skills", name), { recursive: true });
  writeFileSync(
    join(user, "skills", name, "SKILL.md"),
    `---\nname: ${name}\n---\n`,
  );
}

function userSettings(user: string, text: string): void {
  mkdirSync(user, { recursive: true });
  writeFileSync(join(user, "settings.json"), text);
}

interface Output {
  systemMessage: string;
  hookSpecificOutput: { hookEventName: string; additionalContext: string };
}

// Runs the hook with `home` as the home folder; its exit code and output.
function run(home: string, env: Record<string, string> = {}) {
  const variables: Record<string, string | undefined> = {
    ...process.env,
    HOME: home,
    USERPROFILE: home,
    ...env,
  };
  if (env.CLAUDE_CONFIG_DIR === undefined) delete variables.CLAUDE_CONFIG_DIR;
  const result = spawnSync(process.execPath, [join(root, script)], {
    cwd: home,
    env: variables,
    encoding: "utf8",
  });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

function output(stdout: string): Output {
  return JSON.parse(stdout) as Output;
}

describe("the session-start hook", () => {
  it("is registered in the shared project settings, which run it with node", () => {
    const settings = JSON.parse(read(".claude/settings.json")) as {
      hooks: Record<
        string,
        { hooks: { type: string; command: string }[] }[] | undefined
      >;
    };
    const commands = (settings.hooks.SessionStart ?? []).flatMap(({ hooks }) =>
      hooks
        .filter(({ type }) => type === "command")
        .map(({ command }) => command),
    );
    expect(commands).toEqual([`node "\${CLAUDE_PROJECT_DIR}/${script}"`]);
  });

  it("is listed in what both repositories share", () => {
    const shared = JSON.parse(read(".claude/shared.json")) as {
      files: string[];
    };
    expect(shared.files).toContain(script);
  });

  it("names each personal skill with a repository skill's name, and the command that removes them", () => {
    const home = fakeHome();
    const user = join(home, ".claude");
    // An Upstream skill, a repository skill of this repository, and a
    // personal skill of a name the repository does not have.
    personalSkill(user, "tdd");
    personalSkill(user, "add-wrapper");
    personalSkill(user, "my-own-skill");
    const { code, stdout } = run(home);
    expect(code).toBe(0);
    const { systemMessage, hookSpecificOutput } = output(stdout);
    expect(systemMessage).toContain("add-wrapper, tdd");
    expect(systemMessage).toContain("npx skills remove -g add-wrapper tdd");
    expect(systemMessage).not.toContain("my-own-skill");
    expect(systemMessage).not.toContain(PLUGIN);
    expect(hookSpecificOutput.hookEventName).toBe("SessionStart");
    expect(hookSpecificOutput.additionalContext).toContain(systemMessage);
  });

  it("does not count a folder without a SKILL.md as a personal skill", () => {
    const home = fakeHome();
    mkdirSync(join(home, ".claude", "skills", "tdd"), { recursive: true });
    expect(run(home)).toMatchObject({ code: 0, stdout: "" });
  });

  it("names the upstream plugin when the user's settings enable it, and the command that removes it", () => {
    const home = fakeHome();
    userSettings(
      join(home, ".claude"),
      JSON.stringify({ enabledPlugins: { [PLUGIN]: true, "other@x": true } }),
    );
    const { code, stdout } = run(home);
    expect(code).toBe(0);
    const { systemMessage } = output(stdout);
    expect(systemMessage).toContain(`The upstream plugin ${PLUGIN} is enabled`);
    expect(systemMessage).toContain(`claude plugin uninstall ${PLUGIN}`);
    expect(systemMessage).not.toContain("other@x");
    expect(systemMessage).not.toContain("npx skills remove");
  });

  it("names both when both shadow the repository's skills", () => {
    const home = fakeHome();
    const user = join(home, ".claude");
    personalSkill(user, "to-spec");
    userSettings(user, JSON.stringify({ enabledPlugins: { [PLUGIN]: true } }));
    const { systemMessage } = output(run(home).stdout);
    expect(systemMessage).toContain("npx skills remove -g to-spec");
    expect(systemMessage).toContain(`claude plugin uninstall ${PLUGIN}`);
  });

  it("is silent when the plugin is installed but disabled", () => {
    const home = fakeHome();
    userSettings(
      join(home, ".claude"),
      JSON.stringify({ enabledPlugins: { [PLUGIN]: false } }),
    );
    expect(run(home)).toMatchObject({ code: 0, stdout: "" });
  });

  it("is silent when there is no personal skills folder", () => {
    expect(run(fakeHome())).toMatchObject({ code: 0, stdout: "", stderr: "" });
  });

  it("exits 0, silent, when the user's settings are not JSON", () => {
    const home = fakeHome();
    userSettings(join(home, ".claude"), "{ not json");
    expect(run(home)).toMatchObject({ code: 0, stdout: "", stderr: "" });
  });

  it("reads the Claude Code folder CLAUDE_CONFIG_DIR names, when set", () => {
    const home = fakeHome();
    const user = join(home, "elsewhere");
    personalSkill(user, "triage");
    personalSkill(join(home, ".claude"), "tdd");
    const { systemMessage } = output(
      run(home, { CLAUDE_CONFIG_DIR: user }).stdout,
    );
    expect(systemMessage).toContain("of the same name: triage.");
    expect(systemMessage).toMatch(/npx skills remove -g triage$/);
  });
});
