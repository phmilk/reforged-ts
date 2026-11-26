// The ship Stop check (.claude/hooks/ship-stop.mjs, #807): a turn that ends
// an implement with commits ahead of the remote default and no pull request
// (or a draft) is blocked once and told to run /ship-branch (ADR 0026). The
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
      "a typed /implement after the last /ship-branch",
      [typedLine("/ship-branch"), typedLine("/implement", "807")],
    ],
    [
      "a typed /implement and no /ship-branch",
      [typedLine("/implement", "#807")],
    ],
    [
      "a Skill call of implement-spec after a typed /ship-branch",
      [typedLine("/ship-branch"), skillCallLine("implement-spec", "802")],
    ],
    [
      "a plugin's implement after a Skill call of ship-branch",
      [
        skillCallLine("ship-branch"),
        skillCallLine("mattpocock-skills:implement"),
      ],
    ],
    ["a prompt that opens with /implement", [promptLine("/implement 807")]],
    // The built-in /ship of Claude Code is not the skill (#940): its pull
    // request passes the check through the repository state instead.
    [
      "a typed /implement, then the built-in /ship",
      [typedLine("/implement", "807"), typedLine("/ship")],
    ],
    [
      "a typed /implement, then a Skill call of ship",
      [typedLine("/implement", "807"), skillCallLine("ship")],
    ],
  ])("is true for %s", (_, lines) => {
    expect(implementPending(lines)).toBe(true);
  });

  it.each([
    ["no line", []],
    ["no implement", [typedLine("/grill-with-docs"), skillCallLine("pr")]],
    [
      "a typed /implement before the last /ship-branch",
      [typedLine("/implement", "807"), typedLine("/ship-branch")],
    ],
    [
      "a Skill call of implement before a Skill call of ship-branch",
      [skillCallLine("implement", "807"), skillCallLine("ship-branch")],
    ],
    [
      "an implement-spec before a ship-branch, then other skills",
      [
        typedLine("/implement-spec", "802"),
        skillCallLine("ship-branch"),
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

/** The hash of the branch's last commit in these tests. */
const HEAD = "835a4c7d00000000000000000000000000000000";

/** The hash of a commit before it: the head of a pull request merged earlier. */
const OLDER = "135187aa00000000000000000000000000000000";

/** One pull request as `gh pr list` answers it, open and not a draft unless told otherwise. */
const pullRequest = (more: Record<string, unknown> = {}) => ({
  state: "OPEN",
  isDraft: false,
  autoMergeRequest: null,
  headRefOid: HEAD,
  ...more,
});

/** `gh pr list`'s answer holding `pullRequests`. */
const listed = (...pullRequests: Record<string, unknown>[]) =>
  JSON.stringify(pullRequests);

describe("pullRequestStateOf", () => {
  it.each([
    ["no pull request", listed(), "none"],
    ["a draft", listed(pullRequest({ isDraft: true })), "draft"],
    [
      "an open one with auto-merge",
      listed(pullRequest({ autoMergeRequest: { mergeMethod: "SQUASH" } })),
      "auto-merge",
    ],
    ["an open one without auto-merge", listed(pullRequest()), "open"],
    [
      "one merged with the branch's last commit as its head",
      listed(pullRequest({ state: "MERGED" })),
      "merged",
    ],
    [
      "one merged before the branch's last commits",
      listed(pullRequest({ state: "MERGED", headRefOid: OLDER })),
      "none",
    ],
    [
      "one closed without a merge",
      listed(pullRequest({ state: "CLOSED" })),
      "none",
    ],
    [
      "a draft opened after an earlier merge",
      listed(
        pullRequest({ state: "MERGED", headRefOid: OLDER }),
        pullRequest({ isDraft: true }),
      ),
      "draft",
    ],
  ])("reads %s", (_, answer, state) => {
    expect(pullRequestStateOf(answer, HEAD)).toBe(state);
  });

  it.each([
    "",
    "{ not json",
    '{"isDraft":false}',
    "[1]",
    '[{"isDraft":false,"autoMergeRequest":null,"headRefOid":"835a4c7d"}]',
    '[{"state":"MERGED","isDraft":false,"autoMergeRequest":null}]',
  ])("throws on %j, which is no answer of gh pr list", (answer) => {
    expect(() => pullRequestStateOf(answer, HEAD)).toThrow();
  });
});

// The reason of a verdict that blocks; fails on a pass.
function blocked(result: ReturnType<typeof verdict>): string {
  expect(result.verdict).toBe("block");
  return result.verdict === "block" ? result.reason : "";
}

const PASS = { verdict: "pass" };

// Work in flight, as a Stop lists it: the two /code-review Subagents of #953,
// a background command, and a wakeup the session scheduled.
const inFlight = {
  "two Subagents run": {
    background_tasks: [
      {
        id: "a051049f07c3b73df",
        type: "subagent",
        status: "running",
        description: "Standards review",
        agent_type: "general-purpose",
      },
      {
        id: "a6f2c9e1d04b8a7c3",
        type: "subagent",
        status: "running",
        description: "Spec review",
        agent_type: "general-purpose",
      },
    ],
  },
  "a background command runs": {
    background_tasks: [
      {
        id: "bql96inc8",
        type: "shell",
        status: "running",
        description: "Watch the pull request's checks",
        command: "gh pr checks --watch",
      },
    ],
  },
  "a wakeup is scheduled": {
    session_crons: [
      {
        id: "a7ca1007",
        schedule: "18 3 27 10 *",
        recurring: false,
        prompt: "check the review",
      },
    ],
  },
};

describe("verdict", () => {
  it.each([
    ["none", /no pull request/],
    ["draft", /a draft pull request without auto-merge/],
  ] as const)(
    "blocks a pending implement with commits ahead and pull request %s, telling the Agent to run /ship-branch or say why it stops",
    (pullRequest, said) => {
      const result = verdict(stop(), { pending: true, ahead: 3, pullRequest });
      const reason = blocked(result);
      expect(reason).toMatch(said);
      expect(reason).toMatch(/3 commits ahead of the remote default/);
      expect(reason).toMatch(/run \/ship-branch/);
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
  const states = [
    "none",
    "draft",
    "auto-merge",
    "open",
    "merged",
    null,
  ] as const;
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

  // Work in flight is not the end of the work (#953): the Stop after it
  // finishes meets the check again.
  it.each(Object.entries(inFlight))(
    "passes a stop while %s, even with an implement pending, commits ahead and no pull request",
    (_, rest) => {
      expect(
        verdict(stop(rest), { pending: true, ahead: 3, pullRequest: "none" }),
      ).toEqual(PASS);
    },
  );

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
  lastCommit?: string | Error;
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
      lastCommit: () => answer("lastCommit", answers.lastCommit ?? HEAD),
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
    expect(calls).toEqual(["transcript", "ahead", "pullRequest", "lastCommit"]);
  });

  it("passes an open pull request with auto-merge", () => {
    const { read } = readers({
      transcript: IMPLEMENTED,
      ahead: 2,
      pullRequest: listed(pullRequest({ autoMergeRequest: {} })),
    });
    expect(run(stop(), read)).toEqual(PASS);
  });

  it("passes a branch whose pull request was squash-merged: its commits stay ahead of the remote default (#971)", () => {
    const { read } = readers({
      transcript: IMPLEMENTED,
      ahead: 3,
      pullRequest: listed(pullRequest({ state: "MERGED" })),
    });
    expect(run(stop(), read)).toEqual(PASS);
  });

  it("blocks commits made after the branch's pull request was merged", () => {
    const { read } = readers({
      transcript: IMPLEMENTED,
      ahead: 4,
      pullRequest: listed(pullRequest({ state: "MERGED", headRefOid: OLDER })),
    });
    expect(run(stop(), read)).toEqual(
      verdict(stop(), { pending: true, ahead: 4, pullRequest: "none" }),
    );
  });

  it("reads nothing on a stop whose stop hook is already active", () => {
    const { calls, read } = readers({ transcript: IMPLEMENTED });
    expect(run(stop({ stop_hook_active: true }), read)).toEqual(PASS);
    expect(calls).toEqual([]);
  });

  it.each(Object.entries(inFlight))(
    "reads nothing on a stop while %s",
    (_, rest) => {
      const { calls, read } = readers({
        transcript: IMPLEMENTED,
        ahead: 2,
        pullRequest: "[]",
      });
      expect(run(stop(rest), read)).toEqual(PASS);
      expect(calls).toEqual([]);
    },
  );

  it("reads neither git nor gh when no implement is pending", () => {
    const { calls, read } = readers({
      transcript: [typedLine("/implement"), typedLine("/ship-branch")],
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

  it("is listed in what both repositories share, with ship-branch and the Replaced skill Stop check", () => {
    const shared = JSON.parse(read(".claude/shared.json")) as {
      skills: string[];
      files: string[];
    };
    expect(shared.skills).toContain("ship-branch");
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
