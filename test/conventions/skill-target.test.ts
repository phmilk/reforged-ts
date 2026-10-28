// The skill-target check (.claude/hooks/skill-target.mjs, #743): a skill
// pointed at the wrong issue stops before it starts (ADR 0025). Its pure
// parts on hook inputs as Claude Code sends them, then the script itself,
// run with Node and a fake `gh` on the path.
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  issueRefOf,
  requestOf,
  verdict,
} from "../../.claude/hooks/skill-target.mjs";
import { read, root } from "./repository.js";

const LIBRARY = "phmilk/reforged-ts";
const TEMPLATE = "phmilk/reforged-ts-template";

const session = {
  session_id: "ef39ac6c-d50e-4884-88b6-5488b0b01e8c",
  cwd: "C:\\Users\\someone\\a-project",
  permission_mode: "default",
};

// A typed prompt.
const typed = (prompt: string) => ({
  ...session,
  hook_event_name: "UserPromptSubmit",
  prompt,
});

// A call of the Skill tool.
const skillCall = (skill: string, args?: string) => ({
  ...session,
  hook_event_name: "PreToolUse",
  tool_name: "Skill",
  tool_input: args === undefined ? { skill } : { skill, args },
});

describe("requestOf", () => {
  it("reads a typed /implement, /implement-spec, /ship-spec or /split-spec and its arguments", () => {
    expect(requestOf(typed("/implement 734"))).toEqual({
      event: "UserPromptSubmit",
      skill: "implement",
      args: "734",
    });
    expect(requestOf(typed("  /implement-spec #737 please"))).toEqual({
      event: "UserPromptSubmit",
      skill: "implement-spec",
      args: "#737 please",
    });
    expect(requestOf(typed("/ship-spec"))).toEqual({
      event: "UserPromptSubmit",
      skill: "ship-spec",
      args: "",
    });
  });

  it("reads a Skill tool call of one of them, a plugin's prefix aside", () => {
    expect(requestOf(skillCall("split-spec", "737"))).toEqual({
      event: "PreToolUse",
      skill: "split-spec",
      args: "737",
    });
    expect(requestOf(skillCall("reforged:implement"))).toEqual({
      event: "PreToolUse",
      skill: "implement",
      args: "",
    });
  });

  it("reads nothing else: another skill, another tool, a prompt that only mentions one", () => {
    expect(requestOf(typed("/tdd 734"))).toBeNull();
    expect(requestOf(typed("/implementation 734"))).toBeNull();
    expect(requestOf(typed("please /implement 734"))).toBeNull();
    expect(requestOf(skillCall("tdd", "734"))).toBeNull();
    expect(
      requestOf({
        ...session,
        hook_event_name: "PreToolUse",
        tool_name: "Bash",
        tool_input: { command: "/implement 734" },
      }),
    ).toBeNull();
  });
});

describe("issueRefOf", () => {
  it.each([
    ["734", { repository: LIBRARY, number: 734 }],
    ["#734 and #735", { repository: LIBRARY, number: 734 }],
    [`${TEMPLATE}#118`, { repository: TEMPLATE, number: 118 }],
    [
      `https://github.com/${TEMPLATE}/issues/118`,
      { repository: TEMPLATE, number: 118 },
    ],
    ["the ticket #12, then 13", { repository: LIBRARY, number: 12 }],
  ])("reads %s", (args, expected) => {
    expect(issueRefOf(args, LIBRARY)).toEqual(expected);
  });

  it("reads none in arguments that name no issue", () => {
    expect(issueRefOf("", LIBRARY)).toBeNull();
    expect(issueRefOf("the conversation, step 2.5", LIBRARY)).toBeNull();
  });
});

/** An open issue #742 of the library: no Spec, no blocker, no sub-issue. */
function facts(more: Record<string, unknown> = {}) {
  return {
    repository: LIBRARY,
    number: 742,
    open: true,
    closedBy: null,
    isSpec: false,
    subIssues: 0,
    coverageTable: false,
    openBlockers: [],
    spec: null,
    ...more,
  };
}

const BLOCKERS = [
  { repository: LIBRARY, number: 9 },
  { repository: TEMPLATE, number: 5 },
];

const SPEC_737 = { repository: LIBRARY, number: 737 };

describe("verdict", () => {
  it("stops /implement on a Ticket with open blockers, naming them and the Tickets its Spec offers now", () => {
    const result = verdict(
      { event: "UserPromptSubmit", skill: "implement", args: "742" },
      facts({ openBlockers: BLOCKERS, spec: SPEC_737 }),
      ["#740 needs-split", `${TEMPLATE}#118 a Template Ticket`],
      LIBRARY,
    );

    const reason =
      "#742 is blocked by #9 and phmilk/reforged-ts-template#5, still open: a Ticket is implemented once its blockers are closed (ADR 0025, .claude/hooks/skill-target.mjs). Takeable now in its Spec #737: #740 needs-split; phmilk/reforged-ts-template#118 a Template Ticket. Run /implement on one of them instead, or deliver the blockers first.";
    expect(result).toEqual({
      verdict: "block",
      reason,
      output: { decision: "block", reason },
    });
  });

  it("names spec:frontier when the Frontier cannot be read here, and says when none is takeable", () => {
    const blocked = facts({ openBlockers: [BLOCKERS[0]], spec: SPEC_737 });
    const request = {
      event: "PreToolUse",
      skill: "implement",
      args: "742",
    } as const;

    const unread = verdict(request, blocked, null, LIBRARY);
    expect(unread.verdict === "block" && unread.reason).toContain(
      "Run pnpm spec:frontier 737 in a clone of the library for the Tickets to take instead, or deliver the blockers first.",
    );
    expect(unread.verdict === "block" && unread.output).toEqual({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: unread.verdict === "block" && unread.reason,
      },
    });
    const none = verdict(request, blocked, [], LIBRARY);
    expect(none.verdict === "block" && none.reason).toContain(
      "No Ticket of its Spec #737 is takeable now: deliver the blockers first.",
    );
  });

  it.each(["implement", "implement-spec", "ship-spec"] as const)(
    "stops /%s on a Spec with no sub-issue, naming /split-spec",
    (skill) => {
      const result = verdict(
        { event: "UserPromptSubmit", skill, args: "737" },
        facts({ number: 737, isSpec: true }),
        null,
        LIBRARY,
      );

      expect(result.verdict === "block" && result.reason).toBe(
        "#737 is a Spec with no Ticket yet (needs-split): an unsplit Spec is not worked, whole or in part (ADR 0025, .claude/hooks/skill-target.mjs). Run /split-spec 737 first.",
      );
    },
  );

  it("stops /split-spec on a Spec with Tickets and a Coverage table", () => {
    const result = verdict(
      { event: "PreToolUse", skill: "split-spec", args: "737" },
      facts({ number: 737, isSpec: true, subIssues: 6, coverageTable: true }),
      null,
      LIBRARY,
    );

    expect(result.verdict === "block" && result.reason).toBe(
      "#737 is already split: it has Tickets and a Coverage table, so there is nothing to split (ADR 0025, .claude/hooks/skill-target.mjs). Take a Ticket of its Frontier (pnpm spec:frontier 737) with /implement, or check its coverage with pnpm spec:check 737.",
    );
  });

  it("names an issue of another repository in full, in the reason and in the commands", () => {
    const split = verdict(
      { event: "PreToolUse", skill: "split-spec", args: `${TEMPLATE}#90` },
      facts({
        repository: TEMPLATE,
        number: 90,
        isSpec: true,
        subIssues: 2,
        coverageTable: true,
      }),
      null,
      LIBRARY,
    );
    const unsplit = verdict(
      { event: "PreToolUse", skill: "implement-spec", args: "90" },
      facts({ repository: TEMPLATE, number: 90, isSpec: true }),
      null,
      null,
    );

    expect(split.verdict === "block" && split.reason).toBe(
      "phmilk/reforged-ts-template#90 is already split: it has Tickets and a Coverage table, so there is nothing to split (ADR 0025, .claude/hooks/skill-target.mjs). Take a Ticket of its Frontier (pnpm spec:frontier 90 phmilk/reforged-ts-template) with /implement, or check its coverage with pnpm spec:check 90 phmilk/reforged-ts-template.",
    );
    expect(unsplit.verdict === "block" && unsplit.reason).toContain(
      "Run /split-spec phmilk/reforged-ts-template#90 first.",
    );
  });

  it.each(["split-spec", "implement-spec", "ship-spec"] as const)(
    "stops /%s on a closed Spec, saying who closed it",
    (skill) => {
      const result = verdict(
        { event: "UserPromptSubmit", skill, args: "737" },
        facts({ number: 737, isSpec: true, open: false, closedBy: "alice" }),
        null,
        LIBRARY,
      );

      expect(result.verdict === "block" && result.reason).toBe(
        `#737 is closed, by @alice: there is nothing left to ${skill === "split-spec" ? "split" : "work"} on it (ADR 0025, .claude/hooks/skill-target.mjs).`,
      );
    },
  );

  it("stops /implement on a closed Spec too", () => {
    const result = verdict(
      { event: "UserPromptSubmit", skill: "implement", args: "737" },
      facts({ number: 737, isSpec: true, open: false, closedBy: "alice" }),
      null,
      LIBRARY,
    );

    expect(result.verdict === "block" && result.reason).toBe(
      "#737 is closed, by @alice: there is nothing left to work on it (ADR 0025, .claude/hooks/skill-target.mjs).",
    );
  });

  it("stops /implement on a closed Ticket, and says so when its closer is unknown", () => {
    const result = verdict(
      { event: "PreToolUse", skill: "implement", args: "742" },
      facts({ open: false, spec: SPEC_737 }),
      null,
      LIBRARY,
    );

    expect(result.verdict === "block" && result.reason).toBe(
      "#742 is closed: there is nothing left to work on it (ADR 0025, .claude/hooks/skill-target.mjs).",
    );
  });

  it.each([
    ["/implement on a takeable Ticket", "implement", facts({ spec: SPEC_737 })],
    [
      "/implement-spec on a split Spec",
      "implement-spec",
      facts({ number: 737, isSpec: true, subIssues: 6 }),
    ],
    [
      "/split-spec on a split Spec with no Coverage table (the existing-split path)",
      "split-spec",
      facts({ number: 737, isSpec: true, subIssues: 6 }),
    ],
    [
      "/split-spec on an unsplit Spec",
      "split-spec",
      facts({ number: 737, isSpec: true }),
    ],
    [
      "/implement-spec on a blocked Ticket: the rule is /implement's",
      "implement-spec",
      facts({ openBlockers: BLOCKERS }),
    ],
    [
      "/implement on a closed issue that is no Ticket",
      "implement",
      facts({ open: false, openBlockers: BLOCKERS }),
    ],
    [
      "/implement-spec on a closed Ticket: the rule is /implement's",
      "implement-spec",
      facts({ open: false, spec: SPEC_737 }),
    ],
  ] as const)("passes %s", (_name, skill, issue) => {
    expect(
      verdict(
        { event: "UserPromptSubmit", skill, args: "742" },
        issue,
        null,
        LIBRARY,
      ),
    ).toEqual({ verdict: "pass" });
  });
});

// The script itself, run as Claude Code runs it, with a fake `gh` first on
// the path: `gh` for a POSIX shell, `gh.cmd` for Windows' cmd, both running
// a Node script that answers from a fixture file and logs every call.

const script = ".claude/hooks/skill-target.mjs";

const FAKE_GH = `import { appendFileSync, readFileSync } from "node:fs";
const args = process.argv.slice(2);
const answers = JSON.parse(readFileSync(process.env.FAKE_GH_ANSWERS, "utf8"));
appendFileSync(process.env.FAKE_GH_LOG, args.join(" ") + "\\n");
if (answers.fail) {
  process.stderr.write(answers.fail + "\\n");
  process.exit(1);
}
if (args[0] === "repo") {
  process.stdout.write(answers.repo + "\\n");
} else {
  const body = JSON.parse(readFileSync(0, "utf8"));
  const data = body.query.includes("viewer") ? answers.spec : answers.issue;
  process.stdout.write(JSON.stringify({ data }));
}
`;

interface Answers {
  repo?: string;
  issue?: unknown;
  spec?: unknown;
  fail?: string;
}

/**
 * Runs the script on `input` with a fake `gh` answering `answers`; returns
 * its exit code, its parsed output (`null` when it printed nothing) and
 * the `gh` calls it made.
 */
function runHook(input: unknown, answers: Answers) {
  const dir = mkdtempSync(join(tmpdir(), "skill-target-"));
  writeFileSync(join(dir, "fake-gh.mjs"), FAKE_GH);
  writeFileSync(
    join(dir, "gh"),
    '#!/bin/sh\nexec node "$(dirname "$0")/fake-gh.mjs" "$@"\n',
  );
  chmodSync(join(dir, "gh"), 0o755);
  writeFileSync(join(dir, "gh.cmd"), '@node "%~dp0fake-gh.mjs" %*\r\n');
  writeFileSync(join(dir, "answers.json"), JSON.stringify(answers));
  writeFileSync(join(dir, "calls.log"), "");
  // Windows spells it Path: every spelling goes, one PATH comes back.
  const env: Record<string, string | undefined> = {};
  let path = "";
  for (const [key, value] of Object.entries(process.env)) {
    if (key.toUpperCase() === "PATH") path = value ?? "";
    else env[key] = value;
  }
  const result = spawnSync(process.execPath, [join(root, script)], {
    cwd: tmpdir(),
    input: JSON.stringify(input),
    encoding: "utf8",
    env: {
      ...env,
      PATH: `${dir}${delimiter}${path}`,
      CLAUDE_PROJECT_DIR: root,
      FAKE_GH_ANSWERS: join(dir, "answers.json"),
      FAKE_GH_LOG: join(dir, "calls.log"),
    },
  });
  const calls = readFileSync(join(dir, "calls.log"), "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => line.trim());
  return {
    code: result.status,
    output:
      result.stdout.trim() === ""
        ? null
        : (JSON.parse(result.stdout) as unknown),
    calls,
  };
}

/** Issue facts as the check's query answers them: open, no label, nothing else. */
function issueData(more: Record<string, unknown> = {}) {
  return {
    repository: {
      issue: {
        state: "OPEN",
        body: "",
        labels: { nodes: [] },
        subIssues: { totalCount: 0 },
        blockedBy: { nodes: [] },
        parent: null,
        ...more,
      },
    },
  };
}

const SPEC_PARENT = {
  number: 737,
  repository: { nameWithOwner: LIBRARY },
  labels: { nodes: [{ name: "spec" }] },
};

/** A Ticket node of the Frontier query: open, no blocker, no assignee. */
function ticketNode(number: number, more: Record<string, unknown> = {}) {
  return {
    number,
    title: `Ticket ${String(number)}`,
    state: "OPEN",
    repository: { nameWithOwner: LIBRARY },
    assignees: { nodes: [] },
    blockedBy: { totalCount: 0, nodes: [] },
    closedByPullRequestsReferences: { nodes: [] },
    ...more,
  };
}

/** Spec #737 as the Frontier query answers it: #740 takeable, #741 held by bob, #742 blocked. */
const SPEC_DATA = {
  viewer: { login: "alice" },
  repository: {
    issue: {
      title: "The Spec",
      labels: { nodes: [{ name: "spec" }] },
      subIssues: {
        totalCount: 3,
        nodes: [
          ticketNode(740),
          ticketNode(741, { assignees: { nodes: [{ login: "bob" }] } }),
          ticketNode(742, {
            blockedBy: {
              totalCount: 1,
              nodes: [
                {
                  number: 9,
                  state: "OPEN",
                  repository: { nameWithOwner: LIBRARY },
                },
              ],
            },
          }),
        ],
      },
    },
  },
};

describe("the skill-target script", () => {
  it("stops a typed /implement on a blocked Ticket, naming its blockers and the takeable Tickets of its Spec", () => {
    const result = runHook(typed("/implement 742"), {
      repo: LIBRARY,
      issue: issueData({
        blockedBy: {
          nodes: [
            {
              number: 9,
              state: "OPEN",
              repository: { nameWithOwner: LIBRARY },
            },
            {
              number: 8,
              state: "CLOSED",
              repository: { nameWithOwner: LIBRARY },
            },
          ],
        },
        parent: SPEC_PARENT,
      }),
      spec: SPEC_DATA,
    });

    const reason =
      "#742 is blocked by #9, still open: a Ticket is implemented once its blockers are closed (ADR 0025, .claude/hooks/skill-target.mjs). Takeable now in its Spec #737: #740 Ticket 740. Run /implement on one of them instead, or deliver the blockers first.";
    expect(result).toEqual({
      code: 0,
      output: { decision: "block", reason },
      calls: [
        "repo view --json nameWithOwner --jq .nameWithOwner",
        "api graphql --input -",
        "api graphql --input -",
      ],
    });
  });

  it("denies a Skill call of implement-spec on an unsplit Spec of the Template, named in full, without asking for the clone's repository", () => {
    const result = runHook(skillCall("implement-spec", `${TEMPLATE}#90`), {
      issue: issueData({
        labels: { nodes: [{ name: "spec" }, { name: "needs-split" }] },
      }),
    });

    const reason =
      "phmilk/reforged-ts-template#90 is a Spec with no Ticket yet (needs-split): an unsplit Spec is not worked, whole or in part (ADR 0025, .claude/hooks/skill-target.mjs). Run /split-spec phmilk/reforged-ts-template#90 first.";
    expect(result).toEqual({
      code: 0,
      output: {
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: reason,
        },
      },
      calls: ["api graphql --input -"],
    });
  });

  it("stops a typed /implement on an unsplit Spec of the clone's repository, named #n", () => {
    const result = runHook(typed("/implement 737"), {
      repo: LIBRARY,
      issue: issueData({
        labels: { nodes: [{ name: "spec" }, { name: "needs-split" }] },
      }),
    });

    expect(result.output).toEqual({
      decision: "block",
      reason:
        "#737 is a Spec with no Ticket yet (needs-split): an unsplit Spec is not worked, whole or in part (ADR 0025, .claude/hooks/skill-target.mjs). Run /split-spec 737 first.",
    });
  });

  it("denies a Skill call of implement on a blocked Ticket too", () => {
    const result = runHook(skillCall("implement", "742"), {
      repo: LIBRARY,
      issue: issueData({
        blockedBy: {
          nodes: [
            {
              number: 9,
              state: "OPEN",
              repository: { nameWithOwner: LIBRARY },
            },
          ],
        },
        parent: SPEC_PARENT,
      }),
      spec: SPEC_DATA,
    });

    expect(result.output).toMatchObject({
      hookSpecificOutput: {
        permissionDecision: "deny",
        permissionDecisionReason: expect.stringContaining(
          "Takeable now in its Spec #737: #740 Ticket 740.",
        ) as unknown,
      },
    });
  });

  it("stops a closed Spec and a closed Ticket on both events, naming who closed them", () => {
    const closed = (more: Record<string, unknown>) => ({
      repo: LIBRARY,
      issue: issueData({
        state: "CLOSED",
        timelineItems: { nodes: [{ actor: { login: "alice" } }] },
        ...more,
      }),
    });
    const spec = closed({ labels: { nodes: [{ name: "spec" }] } });
    const ticket = closed({ parent: SPEC_PARENT });

    expect(runHook(typed("/split-spec 737"), spec).output).toEqual({
      decision: "block",
      reason:
        "#737 is closed, by @alice: there is nothing left to split on it (ADR 0025, .claude/hooks/skill-target.mjs).",
    });
    expect(runHook(skillCall("ship-spec", "737"), spec).output).toMatchObject({
      hookSpecificOutput: { permissionDecision: "deny" },
    });
    expect(runHook(typed("/implement 742"), ticket).output).toEqual({
      decision: "block",
      reason:
        "#742 is closed, by @alice: there is nothing left to work on it (ADR 0025, .claude/hooks/skill-target.mjs).",
    });
    expect(runHook(skillCall("implement", "742"), ticket).output).toMatchObject(
      { hookSpecificOutput: { permissionDecision: "deny" } },
    );
  });

  it("stops split-spec on a Spec with Tickets and a Coverage table, on both events", () => {
    const answers = {
      repo: LIBRARY,
      issue: issueData({
        labels: { nodes: [{ name: "spec" }] },
        subIssues: { totalCount: 6 },
        body: "## Problem Statement\n\nText.\n\n## Coverage table\n\n| Item | Ticket |\n",
      }),
    };

    expect(
      runHook(skillCall("split-spec", "737"), answers).output,
    ).toMatchObject({ hookSpecificOutput: { permissionDecision: "deny" } });
    expect(runHook(typed("/split-spec 737"), answers).output).toMatchObject({
      decision: "block",
    });
  });

  it("lets a takeable Ticket through on both events, adding the next-step line to the Agent's context", () => {
    const answers = {
      repo: LIBRARY,
      issue: issueData({ parent: SPEC_PARENT }),
    };
    const context = (event: string) => ({
      hookSpecificOutput: {
        hookEventName: event,
        additionalContext:
          "This repository ends every implement with the next-step skill: when this work is done, run next-step, which prints the next steps from the state of the issue, its Spec and its pull request (ADR 0025, .claude/hooks/skill-target.mjs).",
      },
    });

    expect(runHook(typed("/implement #740"), answers)).toMatchObject({
      code: 0,
      output: context("UserPromptSubmit"),
    });
    expect(runHook(skillCall("implement", "740"), answers)).toMatchObject({
      code: 0,
      output: context("PreToolUse"),
    });
  });

  it("lets /implement-spec through on a split Spec, adding the next-step line", () => {
    const result = runHook(skillCall("implement-spec", "737"), {
      repo: LIBRARY,
      issue: issueData({
        labels: { nodes: [{ name: "spec" }] },
        subIssues: { totalCount: 3 },
      }),
    });

    expect(result.output).toEqual({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        additionalContext: expect.stringContaining("run next-step") as unknown,
      },
    });
  });

  it("lets split-spec and ship-spec through silently: next-step ends an implement", () => {
    const answers = {
      repo: LIBRARY,
      issue: issueData({
        labels: { nodes: [{ name: "spec" }] },
        subIssues: { totalCount: 3 },
      }),
    };

    expect(runHook(typed("/split-spec 737"), answers).output).toBeNull();
    expect(runHook(skillCall("ship-spec", "737"), answers).output).toBeNull();
  });

  it("stays silent and asks GitHub nothing with no issue reference", () => {
    expect(
      runHook(typed("/implement the plan above"), { repo: LIBRARY }),
    ).toEqual({ code: 0, output: null, calls: [] });
    expect(runHook(skillCall("implement"), { repo: LIBRARY })).toEqual({
      code: 0,
      output: null,
      calls: [],
    });
  });

  it("lets the skill run with a one-line warning when gh fails, on both events", () => {
    const answers = { fail: "error connecting to api.github.com" };
    const warning = {
      systemMessage:
        "The skill-target check could not read GitHub (error connecting to api.github.com); the skill runs, and the claim check still holds the rule on its pull request.",
    };

    // The skill runs, and still ends with its next steps.
    const nextStep = expect.stringContaining("run next-step") as unknown;

    expect(runHook(typed("/implement 742"), answers)).toMatchObject({
      code: 0,
      output: {
        ...warning,
        hookSpecificOutput: {
          hookEventName: "UserPromptSubmit",
          additionalContext: nextStep,
        },
      },
    });
    expect(runHook(skillCall("split-spec", "742"), answers)).toEqual({
      code: 0,
      output: warning,
      calls: expect.any(Array) as unknown,
    });
    expect(runHook(skillCall("implement", "742"), answers)).toMatchObject({
      code: 0,
      output: {
        ...warning,
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          additionalContext: nextStep,
        },
      },
    });
  });
});

interface Settings {
  hooks: Record<
    string,
    | { matcher?: string; hooks: { type: string; command: string }[] }[]
    | undefined
  >;
}

describe("the shared settings", () => {
  const command = 'node "${CLAUDE_PROJECT_DIR}/.claude/hooks/skill-target.mjs"';

  it("run the check on every prompt and on every call of the Skill tool", () => {
    const { hooks } = JSON.parse(read(".claude/settings.json")) as Settings;

    expect(
      (hooks.UserPromptSubmit ?? []).flatMap((entry) =>
        entry.hooks.map((hook) => hook.command),
      ),
    ).toContain(command);
    expect(
      (hooks.PreToolUse ?? [])
        .filter((entry) => entry.matcher === "Skill")
        .flatMap((entry) => entry.hooks.map((hook) => hook.command)),
    ).toContain(command);
  });

  it("are shared with the Template, the hook among them", () => {
    const shared = JSON.parse(read(".claude/shared.json")) as {
      files: string[];
    };

    expect(shared.files).toContain(script);
  });
});
