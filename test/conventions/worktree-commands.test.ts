// The `git worktree add` commands the Agent reads in the skills, the hooks,
// the docs and AGENTS.md (#946): one that creates a branch from a
// remote-tracking branch carries `--no-track`. Without it the new branch
// gets `origin/<default>` as its upstream, and a bare `git pull` in the
// worktree pulls the default branch.
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { folderFiles, read, root } from "./repository.js";

// A line of a text, with its number from 1.
interface Line {
  number: number;
  text: string;
}

// The lines of `text` holding a `git worktree add` that creates a branch
// (`-b` or `-B`) from a start point beginning with `origin/`, without
// `--no-track`.
function trackingWorktreeAdds(text: string): Line[] {
  return text
    .split(/\r?\n/)
    .map((line, index) => ({ number: index + 1, text: line }))
    .filter(({ text: line }) => worktreeAdds(line).some(tracks));
}

// The arguments of each `git worktree add` of `line`, `git -C <path>`
// included: its words up to the end of the command (a backtick, `;`, `&` or
// `|`), their quotes removed.
function worktreeAdds(line: string): string[][] {
  const word = `(?:"[^"]*"|'[^']*'|[^\\s\`;&|]+)`;
  const command = new RegExp(
    `\\bgit(?:\\s+-[Cc]\\s+${word})*\\s+worktree\\s+add\\b([^\`;&|]*)`,
    "g",
  );
  return [...line.matchAll(command)].map(([, args = ""]) =>
    args
      .trim()
      .split(/\s+/)
      .map((arg) => arg.replace(/^["']|["']$/g, "")),
  );
}

// Whether a `git worktree add` with these arguments gives its new branch an
// upstream: a `-b` or `-B`, an argument beginning with `origin/` that is not
// the new branch's name, and no `--no-track`.
function tracks(args: string[]): boolean {
  const branch = args.findIndex((arg) => arg === "-b" || arg === "-B");
  return (
    branch !== -1 &&
    !args.includes("--no-track") &&
    args.some((arg, index) => arg.startsWith("origin/") && index !== branch + 1)
  );
}

// The files the Agent reads its git commands from, by their path from the
// root: every file of the folders, and AGENTS.md.
function agentFiles(): string[] {
  const folders = [".claude/skills", ".claude/hooks", "docs"];
  return [
    ...folders.flatMap((folder) =>
      folderFiles(join(root, folder)).map((file) => `${folder}/${file}`),
    ),
    "AGENTS.md",
  ];
}

describe("a git worktree add that tracks a remote-tracking branch", () => {
  it.each([
    "git worktree add .claude/worktrees/x -b fix/1-x origin/master",
    `git -C "$template" worktree add "$dir" -b fix/1-x origin/main`,
    "git worktree add -b fix/1-x .claude/worktrees/x origin/master",
    "git worktree add -B fix/1-x .claude/worktrees/x origin/master",
    "run `git worktree add ../x -b fix/1-x origin/master`, then `git fetch --no-track`",
    `git worktree add "$dir" -b fix/1-x "origin/$default"`,
  ])("is found in %s", (line) => {
    expect(trackingWorktreeAdds(`before\n${line}\nafter`)).toEqual([
      { number: 2, text: line },
    ]);
  });

  it.each([
    "git worktree add --no-track .claude/worktrees/x -b fix/1-x origin/master",
    "git worktree add .claude/worktrees/x --no-track -b fix/1-x origin/master",
    `git -C "$template" worktree add --no-track "$dir" -b fix/1-x origin/main`,
    `git -C "$template" worktree add "$dir" --no-track -b fix/1-x origin/main`,
    `git worktree add --detach "$status" origin/master`,
    "git worktree add .claude/worktrees/x <branch>",
    "git worktree add .claude/worktrees/x -b <branch> <integration-branch>",
    "git worktree add .claude/worktrees/x -b fix/1-x master",
    "git worktree add .claude/worktrees/x -b origin/x HEAD",
    "git worktree add ../x fix/1-x && git branch -b origin/master",
    "git worktree list, then git switch -c fix/1-x origin/master",
  ])("is not found in %s", (line) => {
    expect(trackingWorktreeAdds(line)).toEqual([]);
  });

  it("is written by no skill, hook, doc or AGENTS.md", () => {
    const files = agentFiles();
    expect(files).toEqual(
      expect.arrayContaining([
        ".claude/skills/ship-spec/SKILL.md",
        ".claude/skills/ship-spec/template-tickets.md",
        ".claude/hooks/skill-target.mjs",
        "docs/agents/development-loop.md",
        "AGENTS.md",
      ]),
    );
    expect(
      files.flatMap((file) =>
        trackingWorktreeAdds(read(file)).map(
          ({ number, text }) => `${file}:${String(number)}: ${text.trim()}`,
        ),
      ),
    ).toEqual([]);
  });
});
