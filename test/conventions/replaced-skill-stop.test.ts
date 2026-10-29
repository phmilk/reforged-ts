// The Replaced skill Stop check (.claude/hooks/replaced-skill-stop.mjs,
// #804): a reply that names a Replaced skill without its variant on the same
// line is sent back once (ADR 0027). Its pure verdict on Stop inputs as
// Claude Code sends them, then the script itself, run with Node.
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { verdict } from "../../.claude/hooks/replaced-skill-stop.mjs";
import { read, root } from "./repository.js";

const script = ".claude/hooks/replaced-skill-stop.mjs";

const map = { "to-spec": "write-spec", "to-tickets": "split-spec" };

const session = {
  session_id: "ef39ac6c-d50e-4884-88b6-5488b0b01e8c",
  transcript_path:
    "C:\\Users\\someone\\.claude\\projects\\a-project\\ef39ac6c-d50e-4884-88b6-5488b0b01e8c.jsonl",
  cwd: "C:\\Users\\someone\\a-project",
  permission_mode: "default",
};

// The end of a turn whose last reply is `reply`.
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

// The reason of a verdict that blocks; fails on a pass.
function blocked(result: ReturnType<typeof verdict>): string {
  expect(result.verdict).toBe("block");
  return result.verdict === "block" ? result.reason : "";
}

describe("the Replaced skill Stop check", () => {
  it("blocks a reply naming a bare Replaced skill, and names the variant to name instead", () => {
    const result = verdict(
      stop("Grilling done. Next, run /to-spec to write it up."),
      map,
    );
    const reason = blocked(result);
    expect(reason).toMatch(/`to-spec`/);
    expect(reason).toMatch(/`write-spec`/);
    expect(reason).toMatch(/ADR 0027/);
    expect(result).toEqual({
      verdict: "block",
      reason,
      output: { decision: "block", reason },
    });
  });

  it.each([
    ["`/to-spec`", "`write-spec`"],
    ["`to-spec`", "`write-spec`"],
    ["to-tickets", "`split-spec`"],
    ["`/to-tickets`", "`split-spec`"],
  ])("blocks a line naming %s, and names %s", (named, variant) => {
    expect(blocked(verdict(stop(`Next step: ${named}.`), map))).toContain(
      variant,
    );
  });

  it("names every Replaced skill a reply names alone, once each", () => {
    const reason = blocked(
      verdict(stop("Run `/to-spec`, then /to-tickets, then /to-spec."), map),
    );
    expect(reason).toMatch(/`write-spec` instead of `to-spec`/);
    expect(reason).toMatch(/`split-spec` instead of `to-tickets`/);
    expect(reason.match(/instead of `to-spec`/g)).toHaveLength(1);
  });

  it.each([
    "`write-spec` replaces `to-spec` here.",
    "Run /split-spec (it replaces /to-tickets).",
    "Not /to-spec: /write-spec.",
  ])("passes %j, which names the variant on the same line", (reply) => {
    expect(verdict(stop(reply), map)).toEqual({ verdict: "pass" });
  });

  it("blocks a reply whose variant stands on another line", () => {
    blocked(verdict(stop("Run /to-spec next.\nIt is /write-spec here."), map));
  });

  it("passes the same reply once the stop hook is already active", () => {
    expect(
      verdict(stop("Run /to-spec next.", { stop_hook_active: true }), map),
    ).toEqual({ verdict: "pass" });
  });

  it.each([
    "Pronto: o PR está aberto.",
    "The to-specs and my-to-spec are other names.",
    "",
  ])("passes %j, which names no Replaced skill", (reply) => {
    expect(verdict(stop(reply), map)).toEqual({ verdict: "pass" });
  });

  it("passes a stop with no reply, and any other event", () => {
    const silent: Record<string, unknown> = stop("");
    delete silent.last_assistant_message;
    expect(verdict(silent, map)).toEqual({ verdict: "pass" });
    const prompt = {
      ...session,
      hook_event_name: "UserPromptSubmit",
      prompt: "/to-spec",
    };
    expect(verdict(prompt, map)).toEqual({ verdict: "pass" });
  });
});

// Runs the script as Claude Code runs it, `node <script>` with the hook input
// on stdin, from a folder outside the repository: it reads the map of
// Replaced skills from the repository's own skills.
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

describe("the Replaced skill Stop hook", () => {
  const command = `node "\${CLAUDE_PROJECT_DIR}/${script}"`;

  it("is registered in the shared project settings at the end of every turn", () => {
    const { hooks } = JSON.parse(read(".claude/settings.json")) as Settings;
    expect(
      (hooks.Stop ?? []).flatMap((entry) =>
        entry.hooks.map((hook) => hook.command),
      ),
    ).toContain(command);
  });

  it("is listed in what both repositories share", () => {
    const shared = JSON.parse(read(".claude/shared.json")) as {
      files: string[];
    };
    expect(shared.files).toContain(script);
  });

  it("blocks a reply naming a Replaced skill alone in the output of Stop, from the repository's map", () => {
    const input = stop("Next, run `/to-spec`.");
    const { code, stdout } = run(JSON.stringify(input));
    expect(code).toBe(0);
    expect(JSON.parse(stdout)).toEqual({
      decision: "block",
      reason: blocked(verdict(input, map)),
    });
  });

  it("prints nothing on a pass", () => {
    expect(
      run(JSON.stringify(stop("`write-spec` replaces `to-spec`."))),
    ).toEqual({ code: 0, stdout: "", stderr: "" });
  });

  it("exits 0, silent, on an input that is not JSON", () => {
    expect(run("{ not json")).toEqual({ code: 0, stdout: "", stderr: "" });
  });
});
