// The background-wait check (.claude/hooks/background-wait.mjs, #767): its
// verdict on hook inputs as Claude Code sends them. The inputs' shapes are
// the ones a real session of Claude Code 2.1.311 sent, logged for #768: a
// Subagent's tool call carries `agent_id` and `agent_type`, the main
// conversation's does not, and a Stop lists `background_tasks` and
// `session_crons`.
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { verdict } from "../../.claude/hooks/background-wait.mjs";
import { read, root } from "./repository.js";

const script = ".claude/hooks/background-wait.mjs";

const session = {
  session_id: "ef39ac6c-d50e-4884-88b6-5488b0b01e8c",
  transcript_path:
    "C:\\Users\\someone\\.claude\\projects\\a-project\\ef39ac6c-d50e-4884-88b6-5488b0b01e8c.jsonl",
  cwd: "C:\\Users\\someone\\a-project",
  prompt_id: "0eb8650a-ff82-491b-be18-bf3cdc8f8cac",
  permission_mode: "default",
  effort: { level: "medium" },
};

const subagent = {
  agent_id: "a051049f07c3b73df",
  agent_type: "general-purpose",
};

// A call of `tool`, by the main conversation unless `from` names a
// Subagent.
function call(
  tool: string,
  toolInput: Record<string, unknown>,
  from: Record<string, string> = {},
) {
  return {
    ...session,
    ...from,
    hook_event_name: "PreToolUse",
    tool_name: tool,
    tool_input: toolInput,
    tool_use_id: "toolu_01G3feSUxVv6rzSTL3PRTNgc",
  };
}

// The reason of a verdict that blocks; fails on a pass.
function blocked(result: ReturnType<typeof verdict>): string {
  expect(result.verdict).toBe("block");
  return result.verdict === "block" ? result.reason : "";
}

const background = { command: "pnpm check", run_in_background: true };

describe("the background-wait check, on a tool call", () => {
  it("denies a Subagent's background command, and says to run it in the foreground or split it", () => {
    const reason = blocked(verdict(call("Bash", background, subagent)));
    expect(reason).toMatch(/foreground/);
    expect(reason).toMatch(/600000/);
    expect(reason).toMatch(/split/);
  });

  it("denies a Subagent's background PowerShell command", () => {
    blocked(verdict(call("PowerShell", background, subagent)));
  });

  it("passes the same command from the main conversation", () => {
    expect(verdict(call("Bash", background))).toEqual({ verdict: "pass" });
  });

  it("passes a Subagent's foreground command", () => {
    expect(
      verdict(
        call("Bash", { command: "pnpm check", timeout: 600000 }, subagent),
      ),
    ).toEqual({ verdict: "pass" });
  });

  it("passes a Subagent's call of another tool that runs in the background", () => {
    expect(
      verdict(
        call(
          "Agent",
          {
            description: "review",
            prompt: "Review it.",
            run_in_background: true,
          },
          subagent,
        ),
      ),
    ).toEqual({ verdict: "pass" });
  });
});

// The end of the main conversation's turn whose last reply is `reply`, with
// nothing in flight unless `rest` says otherwise.
function stop(reply: string, rest: Record<string, unknown> = {}) {
  return {
    ...session,
    hook_event_name: "Stop",
    stop_hook_active: false,
    last_assistant_message: reply,
    background_tasks: [],
    session_crons: [],
    ...rest,
  };
}

const waits = "Vou esperar o implementador; ele me avisa quando terminar.";

// Work in flight, as a Stop lists it: a Subagent, a named agent left idle
// after its report (a teammate, still listed as running), a background
// command, and a scheduled prompt.
const running = {
  subagent: {
    id: "a051049f07c3b73df",
    type: "subagent",
    status: "running",
    description: "bg probe",
    agent_type: "general-purpose",
  },
  teammate: {
    id: "tophckwg4",
    type: "teammate",
    status: "running",
    description: "idle probe",
  },
  shell: {
    id: "bql96inc8",
    type: "shell",
    status: "running",
    description: "Sleep 20 seconds in background",
    command: "sleep 20",
  },
};
const cron = {
  id: "a7ca1007",
  schedule: "18 3 27 10 *",
  recurring: false,
  prompt: "noop",
};

describe("the background-wait check, at the end of a turn", () => {
  it("blocks a reply that waits on background work with nothing in flight, and says to verify", () => {
    const reason = blocked(verdict(stop(waits)));
    expect(reason).toMatch(/nothing/i);
    expect(reason).toMatch(/verify/i);
  });

  it.each(Object.entries(running))(
    "passes the same reply while a %s is in flight",
    (_, task) => {
      expect(verdict(stop(waits, { background_tasks: [task] }))).toEqual({
        verdict: "pass",
      });
    },
  );

  it("passes the same reply when a session cron is scheduled", () => {
    expect(verdict(stop(waits, { session_crons: [cron] }))).toEqual({
      verdict: "pass",
    });
  });

  it("passes the same reply once the stop hook is already active", () => {
    expect(verdict(stop(waits, { stop_hook_active: true }))).toEqual({
      verdict: "pass",
    });
  });

  // The replies of the session of #767: the stall of #763 and today's false
  // alarm, a reply that says nothing runs.
  it.each([
    "O check ainda está rodando.",
    "pnpm check is still running in the background. I'll pick up when it finishes.",
  ])("blocks %j with nothing in flight", (reply) => {
    blocked(verdict(stop(reply)));
  });

  it.each([
    "Nada está rodando em segundo plano.",
    "Encerrei o impl-763; nada roda em segundo plano.",
    "Nothing is running in the background.",
    "Pronto: o PR está aberto.",
  ])("passes %j with nothing in flight", (reply) => {
    expect(verdict(stop(reply))).toEqual({ verdict: "pass" });
  });

  // A reply that quotes a wait (a retrospective, a review, the report of a
  // stall) waits on nothing itself: the false alarm of #767's retrospective.
  it.each([
    'O implementador do #763 escreveu "I\'ll pick up when it finishes" e nunca voltou.',
    "O stall foi um “ainda está rodando” que ninguém conferiu.",
    "A Subagent ended its turn on `still running in the background`.",
    "The stall:\n\n> pnpm check is still running in the background. I'll pick up when it finishes.\n\nNothing runs now.",
    "The reply was:\n\n```text\nVou esperar o implementador; ele me avisa quando terminar.\n```\n\nNothing runs now.",
  ])("passes %j, which only quotes a wait, with nothing in flight", (reply) => {
    expect(verdict(stop(reply))).toEqual({ verdict: "pass" });
  });

  it("blocks a reply that waits outside the quote it carries, with nothing in flight", () => {
    blocked(
      verdict(
        stop(
          'Vou esperar o implementador; ele me avisa quando terminar o "pnpm check".',
        ),
      ),
    );
  });
});

// Runs the script as Claude Code runs it, `node <script>` with the hook input
// on stdin, from a folder outside the repository.
function run(stdin: string) {
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

// The commands the shared project settings run on `event` for a call of
// `tool` (any, when the event has no matcher).
function commands(event: string, tool = ""): string[] {
  const settings = JSON.parse(read(".claude/settings.json")) as Settings;
  return (settings.hooks[event] ?? [])
    .filter(
      ({ matcher }) =>
        matcher === undefined ||
        matcher === "" ||
        new RegExp(`^(?:${matcher})$`).test(tool),
    )
    .flatMap(({ hooks }) =>
      hooks
        .filter(({ type }) => type === "command")
        .map(({ command }) => command),
    );
}

describe("the background-wait hook", () => {
  const command = `node "\${CLAUDE_PROJECT_DIR}/${script}"`;

  it("is registered in the shared project settings on every Bash and PowerShell call", () => {
    expect(commands("PreToolUse", "Bash")).toContain(command);
    expect(commands("PreToolUse", "PowerShell")).toContain(command);
    expect(commands("PreToolUse", "Read")).not.toContain(command);
  });

  it("is registered in the shared project settings at the end of every turn", () => {
    expect(commands("Stop")).toContain(command);
  });

  it("is listed in what both repositories share", () => {
    const shared = JSON.parse(read(".claude/shared.json")) as {
      files: string[];
    };
    expect(shared.files).toContain(script);
  });

  it("denies a Subagent's background command in the output of PreToolUse", () => {
    const { code, stdout } = run(
      JSON.stringify(call("Bash", background, subagent)),
    );
    expect(code).toBe(0);
    expect(JSON.parse(stdout)).toEqual({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: blocked(
          verdict(call("Bash", background, subagent)),
        ),
      },
    });
  });

  it("blocks an empty wait in the output of Stop", () => {
    const { code, stdout } = run(JSON.stringify(stop(waits)));
    expect(code).toBe(0);
    expect(JSON.parse(stdout)).toEqual({
      decision: "block",
      reason: blocked(verdict(stop(waits))),
    });
  });

  it("prints nothing on a pass", () => {
    expect(run(JSON.stringify(call("Bash", background)))).toEqual({
      code: 0,
      stdout: "",
      stderr: "",
    });
  });

  it("exits 0, silent, on an input that is not JSON", () => {
    expect(run("{ not json")).toEqual({ code: 0, stdout: "", stderr: "" });
  });
});
