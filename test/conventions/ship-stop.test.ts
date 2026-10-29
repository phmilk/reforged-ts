// The ship Stop check (.claude/hooks/ship-stop.mjs, #807): a turn that ends
// an implement with commits ahead of the remote default and no pull request
// (or a draft) is blocked once and told to run /ship (ADR 0026). The
// transcript reader over fixture lines, the reader of `gh`'s answer, the
// pure verdict over the three facts, and run() with readers that stand in
// for the transcript, `git` and `gh`; no test spawns `gh` or `git`, and the
// script itself runs only on inputs that read neither.
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  implementPending,
  pullRequestStateOf,
  run,
  verdict,
} from "../../.claude/hooks/ship-stop.mjs";
import { read, root } from "./repository.js";

const script = ".claude/hooks/ship-stop.mjs";

const session = {
  session_id: "ef39ac6c-d50e-4884-88b6-5488b0b01e8c",
  transcript_path:
    "C:\\Users\\someone\\.claude\\projects\\a-project\\ef39ac6c-d50e-4884-88b6-5488b0b01e8c.jsonl",
  cwd: "C:\\Users\\someone\\a-project",
  permission_mode: "default",
};

// The end of a turn, as Claude Code sends it.
function stop(rest: Record<string, unknown> = {}) {
  return {
    ...session,
    hook_event_name: "Stop",
    stop_hook_active: false,
    last_assistant_message: "Done: the Ticket is implemented and committed.",
    background_tasks: [],
    session_crons: [],
    ...rest,
  };
}

// Transcript lines as Claude Code writes them, one JSON object per line.

// A slash command the Collaborator typed.
function typedLine(command: string, args = "", rest = {}) {
  const name = command.slice(1);
  return JSON.stringify({
    type: "user",
    isSidechain: false,
    message: {
      role: "user",
      content: `<command-message>${name}</command-message>\n<command-name>${command}</command-name>\n<command-args>${args}</command-args>`,
    },
    ...rest,
  });
}

// A call of the Skill tool by the Agent.
function skillCallLine(skill: string, args?: string) {
  return JSON.stringify({
    type: "assistant",
    isSidechain: false,
    message: {
      role: "assistant",
      content: [
        { type: "text", text: "Running the skill." },
        {
          type: "tool_use",
          id: "toolu_01",
          name: "Skill",
          input: args === undefined ? { skill } : { skill, args },
        },
      ],
    },
  });
}

// Text the Agent wrote, or a prompt the Collaborator wrote.
function replyLine(text: string) {
  return JSON.stringify({
    type: "assistant",
    message: { role: "assistant", content: [{ type: "text", text }] },
  });
}
function promptLine(text: string) {
  return JSON.stringify({
    type: "user",
    message: { role: "user", content: text },
  });
}

// A tool's result that quotes a command: never an invocation.
function quotingResultLine(command: string) {
  return JSON.stringify({
    type: "user",
    message: {
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: "toolu_01",
          content: `U: <command-name>${command}</command-name>`,
        },
      ],
    },
  });
}

describe("implementPending", () => {
  it.each([
    [
      "a typed /implement after the last /ship",
      [typedLine("/ship"), typedLine("/implement", "807")],
    ],
    ["a typed /implement and no /ship", [typedLine("/implement", "#807")]],
    [
      "a Skill call of implement-spec after a typed /ship",
      [typedLine("/ship"), skillCallLine("implement-spec", "802")],
    ],
    [
      "a plugin's implement after a Skill call of ship",
      [skillCallLine("ship"), skillCallLine("mattpocock-skills:implement")],
    ],
    ["a prompt that opens with /implement", [promptLine("/implement 807")]],
  ])("is true for %s", (_, lines) => {
    expect(implementPending(lines)).toBe(true);
  });

  it.each([
    ["no line", []],
    ["no implement", [typedLine("/grill-with-docs"), skillCallLine("pr")]],
    [
      "a typed /implement before the last /ship",
      [typedLine("/implement", "807"), typedLine("/ship")],
    ],
    [
      "a Skill call of implement before a Skill call of ship",
      [skillCallLine("implement", "807"), skillCallLine("ship")],
    ],
    [
      "an implement-spec before a ship, then other skills",
      [
        typedLine("/implement-spec", "802"),
        skillCallLine("ship"),
        skillCallLine("next-step"),
      ],
    ],
    [
      "an implement a tool's result or a reply only quotes",
      [quotingResultLine("/implement"), replyLine("Next, run /implement 807.")],
    ],
    [
      "an implement of a Subagent's line",
      [typedLine("/implement", "807", { isSidechain: true })],
    ],
    ["lines that are not JSON", ["{ not json", "", "null"]],
    ["other skills", [typedLine("/implementation"), typedLine("/ship-spec")]],
  ])("is false for %s", (_, lines) => {
    expect(implementPending(lines)).toBe(false);
  });
});

describe("pullRequestStateOf", () => {
  it.each([
    ["[]", "none"],
    ['[{"isDraft":true,"autoMergeRequest":null}]', "draft"],
    [
      '[{"isDraft":false,"autoMergeRequest":{"mergeMethod":"SQUASH"}}]',
      "auto-merge",
    ],
    ['[{"isDraft":false,"autoMergeRequest":null}]', "open"],
  ])("reads %s as %s", (answer, state) => {
    expect(pullRequestStateOf(answer)).toBe(state);
  });

  it.each(["", "{ not json", '{"isDraft":false}', "[1]"])(
    "throws on %j, which is no answer of gh pr list",
    (answer) => {
      expect(() => pullRequestStateOf(answer)).toThrow();
    },
  );
});

// The reason of a verdict that blocks; fails on a pass.
function blocked(result: ReturnType<typeof verdict>): string {
  expect(result.verdict).toBe("block");
  return result.verdict === "block" ? result.reason : "";
}

const PASS = { verdict: "pass" };

describe("verdict", () => {
  it.each([
    ["none", /no pull request/],
    ["draft", /a draft pull request without auto-merge/],
  ] as const)(
    "blocks a pending implement with commits ahead and pull request %s, telling the Agent to run /ship or say why it stops",
    (pullRequest, said) => {
      const result = verdict(stop(), { pending: true, ahead: 3, pullRequest });
      const reason = blocked(result);
      expect(reason).toMatch(said);
      expect(reason).toMatch(/3 commits ahead of the remote default/);
      expect(reason).toMatch(/run \/ship/);
      expect(reason).toMatch(/say why/);
      expect(reason).toMatch(/ADR 0026/);
      expect(result).toEqual({
        verdict: "block",
        reason,
        output: { decision: "block", reason },
      });
    },
  );

  it("says one commit in the singular", () => {
    expect(
      blocked(
        verdict(stop(), { pending: true, ahead: 1, pullRequest: "none" }),
      ),
    ).toMatch(/1 commit ahead/);
  });

  // Every combination of the three facts: it blocks on exactly two.
  const pendings = [true, false];
  const aheads = [0, 2, null];
  const states = ["none", "draft", "auto-merge", "open", null] as const;
  const combinations = pendings.flatMap((pending) =>
    aheads.flatMap((ahead) =>
      states.map((pullRequest) => ({ pending, ahead, pullRequest })),
    ),
  );
  it.each(combinations)(
    "on pending $pending, ahead $ahead, pull request $pullRequest",
    (facts) => {
      const blocks =
        facts.pending &&
        facts.ahead !== null &&
        facts.ahead > 0 &&
        (facts.pullRequest === "none" || facts.pullRequest === "draft");
      expect(verdict(stop(), facts).verdict).toBe(blocks ? "block" : "pass");
    },
  );

  it("passes a stop whose stop hook is already active, whatever the facts", () => {
    expect(
      verdict(stop({ stop_hook_active: true }), {
        pending: true,
        ahead: 3,
        pullRequest: "none",
      }),
    ).toEqual(PASS);
  });

  it("passes any other event", () => {
    expect(
      verdict(
        { ...session, hook_event_name: "SubagentStop" },
        { pending: true, ahead: 3, pullRequest: "none" },
      ),
    ).toEqual(PASS);
  });
});

// Readers that stand in for the transcript, `git` and `gh`, logging which
// ones run; a reader given as an Error throws it, as a failed read does.
function readers(answers: {
  transcript: readonly string[] | Error;
  ahead?: number | Error;
  pullRequest?: string | Error;
}) {
  const calls: string[] = [];
  const answer = <T>(name: string, value: T | Error | undefined): T => {
    calls.push(name);
    if (value instanceof Error) throw value;
    if (value === undefined) throw new Error(`${name} was not expected`);
    return value;
  };
  return {
    calls,
    read: {
      transcript: () => answer("transcript", answers.transcript),
      ahead: () => answer("ahead", answers.ahead),
      pullRequest: () => answer("pullRequest", answers.pullRequest),
    },
  };
}

const IMPLEMENTED = [typedLine("/implement", "807")];

describe("run", () => {
  it("reads the three facts in order and blocks on a pending implement with no pull request", () => {
    const { calls, read } = readers({
      transcript: IMPLEMENTED,
      ahead: 2,
      pullRequest: "[]",
    });
    const result = run(stop(), read);
    expect(result).toEqual(
      verdict(stop(), { pending: true, ahead: 2, pullRequest: "none" }),
    );
    expect(calls).toEqual(["transcript", "ahead", "pullRequest"]);
  });

  it("passes an open pull request with auto-merge", () => {
    const { read } = readers({
      transcript: IMPLEMENTED,
      ahead: 2,
      pullRequest: '[{"isDraft":false,"autoMergeRequest":{}}]',
    });
    expect(run(stop(), read)).toEqual(PASS);
  });

  it("reads nothing on a stop whose stop hook is already active", () => {
    const { calls, read } = readers({ transcript: IMPLEMENTED });
    expect(run(stop({ stop_hook_active: true }), read)).toEqual(PASS);
    expect(calls).toEqual([]);
  });

  it("reads neither git nor gh when no implement is pending", () => {
    const { calls, read } = readers({
      transcript: [typedLine("/implement"), typedLine("/ship")],
    });
    expect(run(stop(), read)).toEqual(PASS);
    expect(calls).toEqual(["transcript"]);
  });

  it("reads no gh when no commit is ahead", () => {
    const { calls, read } = readers({ transcript: IMPLEMENTED, ahead: 0 });
    expect(run(stop(), read)).toEqual(PASS);
    expect(calls).toEqual(["transcript", "ahead"]);
  });

  it.each([
    ["the transcript", { transcript: new Error("ENOENT") }],
    [
      "git",
      { transcript: IMPLEMENTED, ahead: new Error("git rev-list exited 128") },
    ],
    [
      "gh",
      {
        transcript: IMPLEMENTED,
        ahead: 2,
        pullRequest: new Error("gh: could not resolve host"),
      },
    ],
    [
      "gh's answer",
      { transcript: IMPLEMENTED, ahead: 2, pullRequest: "<html>" },
    ],
  ])("passes when %s fails", (_, answers) => {
    expect(run(stop(), readers(answers).read)).toEqual(PASS);
  });
});

// Runs the script as Claude Code runs it, `node <script>` with the hook input
// on stdin, only on inputs that stop before any `git` or `gh`.
function runScript(stdin: string) {
  const result = spawnSync(process.execPath, [join(root, script)], {
    cwd: tmpdir(),
    input: stdin,
    encoding: "utf8",
  });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

interface Settings {
  hooks: Record<
    string,
    | { matcher?: string; hooks: { type: string; command: string }[] }[]
    | undefined
  >;
}

describe("the ship Stop hook", () => {
  const command = `node "\${CLAUDE_PROJECT_DIR}/${script}"`;

  it("is registered in the shared project settings at the end of every turn", () => {
    const { hooks } = JSON.parse(read(".claude/settings.json")) as Settings;
    expect(
      (hooks.Stop ?? []).flatMap((entry) =>
        entry.hooks.map((hook) => hook.command),
      ),
    ).toContain(command);
  });

  it("is listed in what both repositories share, with ship and the Replaced skill Stop check", () => {
    const shared = JSON.parse(read(".claude/shared.json")) as {
      skills: string[];
      files: string[];
    };
    expect(shared.skills).toContain("ship");
    expect(shared.files).toEqual(
      expect.arrayContaining([script, ".claude/hooks/replaced-skill-stop.mjs"]),
    );
  });

  it("exits 0, silent, on a stop whose stop hook is already active", () => {
    expect(runScript(JSON.stringify(stop({ stop_hook_active: true })))).toEqual(
      { code: 0, stdout: "", stderr: "" },
    );
  });

  it("exits 0, silent, on a transcript it cannot read", () => {
    expect(
      runScript(
        JSON.stringify(
          stop({ transcript_path: join(tmpdir(), "no-such-transcript.jsonl") }),
        ),
      ),
    ).toEqual({ code: 0, stdout: "", stderr: "" });
  });

  it("exits 0, silent, on an input that is not JSON", () => {
    expect(runScript("{ not json")).toEqual({
      code: 0,
      stdout: "",
      stderr: "",
    });
  });
});
