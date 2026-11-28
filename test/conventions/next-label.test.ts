// The convention test of the label `next` (#1062, ADR 0031): where an
// Agent's work goes is said in one rule of AGENTS.md, the label is listed
// beside the kind labels, and the five skills of the loop follow it. A later
// edit that drops one of them fails here.
import { describe, expect, it } from "vitest";

import { section } from "./markdown.js";
import { read } from "./repository.js";

// A text that names the label `next`, as "the label `next`", "labelled
// `next`" or "`next` label"; the branch or the dist-tag alone does not count.
const NAMES_THE_LABEL = /\blabel(?:led)? `next`|`next` label/;

describe("the rule for Agents in AGENTS.md", () => {
  const rules = (section(read("AGENTS.md"), "## Rules") ?? []).filter((line) =>
    line.startsWith("- "),
  );
  const named = rules.filter((line) => NAMES_THE_LABEL.test(line));

  it("is one line of the Rules that names the label `next`", () => {
    expect(
      named,
      "the lines of `## Rules` naming the label `next`",
    ).toHaveLength(1);
  });

  it("sends work to `master` and the label `next` to `next`, and leaves the release to its workflow", () => {
    const [rule = ""] = named;
    for (const part of [
      "`master`",
      "goes to `next`",
      "dist-tags",
      "publishes",
      "Template refs",
      "never set by hand",
      "docs/release.md#release-channels",
    ]) {
      expect(rule.toLowerCase(), `the rule names ${part}`).toContain(
        part.toLowerCase(),
      );
    }
  });
});

describe("docs/agents/triage-labels.md", () => {
  const kindLabels = section(
    read("docs/agents/triage-labels.md"),
    "## Kind labels",
  );

  it("lists `next` among the kind labels", () => {
    expect(
      (kindLabels ?? []).filter((line) => line.startsWith("| `next`")),
      "the row of `next` in the table of `## Kind labels`",
    ).toHaveLength(1);
  });

  it("says what the label does in a section of its own", () => {
    expect(kindLabels).toContain("### The `next` label");
  });
});

describe("the skills of the loop", () => {
  // Each skill, and what it does with the label.
  const skills: readonly [skill: string, does: string, text: string][] = [
    ["write-spec", "applies it", "--add-label next"],
    ["split-spec", "gives it to each Ticket", "--add-label next"],
    ["ship-spec", "makes the worktree from `origin/next`", "origin/next"],
    ["ship-branch", "opens the pull request against `next`", "--base next"],
    ["next-step", "reviews against `origin/next`", "origin/next"],
  ];

  it.each(skills)("%s names the label `next` and %s", (skill, _, text) => {
    const body = read(`.claude/skills/${skill}/SKILL.md`);

    expect(body, `${skill} names the label \`next\``).toMatch(NAMES_THE_LABEL);
    expect(body, `${skill} holds ${text}`).toContain(text);
  });
});
