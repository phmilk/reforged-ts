// The gh commands the Agent reads in the skills, the hooks, the agent docs
// and AGENTS.md (#790): none asks `gh issue view` for a `parent` field,
// which gh 2.89 refuses (`Unknown JSON field: "parent"`); an issue's parent
// is read with `gh api repos/<owner>/<repo>/issues/<n>/parent`
// (docs/agents/issue-tracker.md, "Conventions").
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { read, root } from "./repository.js";

// The lines of `text` that ask `gh issue view` for a `parent` JSON field.
function parentFieldCalls(text: string): string[] {
  return text
    .split(/\r?\n/)
    .filter((line) =>
      /gh issue view\b.*?--json[ =][\w,]*\bparent\b/.test(line),
    );
}

// The files the Agent reads its gh commands from, by their path from the
// root: every file of the folders, and AGENTS.md.
function agentFiles(): string[] {
  const folders = [".claude/skills", ".claude/hooks", "docs/agents"];
  return [
    ...folders.flatMap((folder) =>
      readdirSync(join(root, folder), { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) =>
          join(entry.parentPath, entry.name)
            .slice(root.length)
            .split("\\")
            .join("/"),
        ),
    ),
    "AGENTS.md",
  ];
}

describe("a parent JSON field of gh issue view", () => {
  it.each([
    "`gh issue view <n> --json number,state,parent`",
    "gh issue view 745 --json parent --jq .parent.number",
    "gh issue view 5 --repo phmilk/reforged-ts --json=title,parent",
  ])("is found in %s", (line) => {
    expect(parentFieldCalls(`before\n${line}\nafter`)).toEqual([line]);
  });

  it.each([
    "gh api repos/<owner>/<repo>/issues/<n>/parent",
    "gh issue view <n> --json number,state,title,labels",
    "`gh issue view` has no parent field",
    "gh pr view --json number,state",
  ])("is not found in %s", (line) => {
    expect(parentFieldCalls(line)).toEqual([]);
  });

  it("is asked for by no skill, hook, agent doc or AGENTS.md", () => {
    const files = agentFiles();
    expect(files).toContain(".claude/skills/next-step/SKILL.md");
    expect(
      files.flatMap((file) =>
        parentFieldCalls(read(file)).map((line) => `${file}: ${line}`),
      ),
    ).toEqual([]);
  });
});
