// The gh commands the Agent reads in the skills, the hooks, the agent docs
// and AGENTS.md (#790): an issue's parent is read as
// docs/agents/issue-tracker.md, "Conventions", says, never as a `parent`
// field of `gh issue view`.
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { folderFiles, read, root } from "./repository.js";

// The lines of `text` that ask `gh issue view` for a `parent` JSON field.
function parentFieldCalls(text: string): string[] {
  return text
    .split(/\r?\n/)
    .filter((line) =>
      /gh issue view\b.*?--json[ =](?:"[\w, ]*|'[\w, ]*|[\w,]*)\bparent\b/.test(
        line,
      ),
    );
}

// The files the Agent reads its gh commands from, by their path from the
// root: every file of the folders, and AGENTS.md.
function agentFiles(): string[] {
  const folders = [".claude/skills", ".claude/hooks", "docs/agents"];
  return [
    ...folders.flatMap((folder) =>
      folderFiles(join(root, folder)).map((file) => `${folder}/${file}`),
    ),
    "AGENTS.md",
  ];
}

describe("a parent JSON field of gh issue view", () => {
  it.each([
    "`gh issue view <n> --json number,state,parent`",
    "gh issue view 745 --json parent --jq .parent.number",
    "gh issue view 5 --repo phmilk/reforged-ts --json=title,parent",
    `gh issue view 5 --json "number,parent"`,
    "gh issue view 5 --json 'parent'",
  ])("is found in %s", (line) => {
    expect(parentFieldCalls(`before\n${line}\nafter`)).toEqual([line]);
  });

  it.each([
    "gh api repos/<owner>/<repo>/issues/<n>/parent",
    "gh issue view <n> --json number,state,title,labels",
    "`gh issue view` has no parent field",
    "gh pr view --json number,state",
    "gh issue view 5 --json title and then read its parent with gh api",
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
