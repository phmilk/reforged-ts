// The convention test of the recipe for removing a worktree (#941). The
// development loop doc owns it, under "Subagents" ("Removing a worktree"), and
// `ship-spec`, a skill both repositories share (ADR 0024), points to it by its
// URL and keeps only its own steps. It fails when:
//
// - the development loop doc has no "Removing a worktree" under "Subagents",
//   or that section loses a step of the recipe (`git worktree remove`,
//   `git worktree list`, `rm -rf`);
// - "Removing a worktree" of `ship-spec` no longer links that recipe, or
//   states it again (two copies disagreed once);
// - that section of `ship-spec` loses one of its own steps: the ledger entry
//   of a worktree left in place, `git branch -D` after a merge, the check
//   lock;
// - a link of the skill's folder to its "Removing a worktree" has no section
//   to land on.
import { describe, expect, it } from "vitest";

import { section } from "./markdown.js";
import { read } from "./repository.js";
import { skillFiles, skillsFolder } from "./skills.js";

const loopDoc = "docs/agents/development-loop.md";
const heading = "Removing a worktree";

// The recipe's URL, as a shared skill links a doc of the library: the
// Template's copy has no such file beside it.
const recipeUrl = `https://github.com/phmilk/reforged-ts/blob/master/${loopDoc}#removing-a-worktree`;

// The commands of the recipe: the doc holds each, the skill none.
const recipeCommands = ["git worktree remove", "git worktree list", "rm -rf"];

// What the skill's section keeps, each with the text that shows it.
const skillOwn: readonly { readonly what: string; readonly text: string }[] = [
  { what: "the ledger entry of a worktree left in place", text: "ledger" },
  { what: "the branch's deletion after a merge", text: "git branch -D" },
  { what: "the check lock", text: "(#the-check-lock)" },
];

// The recipe's section of the development loop doc, a subsection of
// "Subagents"; undefined when it is missing or stands elsewhere.
function recipeOf(doc: string): string | undefined {
  const subagents = section(doc, "## Subagents");
  if (subagents === undefined) return undefined;
  return section(subagents.join("\n"), `### ${heading}`)?.join("\n");
}

// What is wrong with the two texts, the development loop doc's and the
// SKILL.md of `ship-spec`.
function removalProblems(doc: string, skill: string): string[] {
  const recipe = recipeOf(doc);
  const own = section(skill, `## ${heading}`)?.join("\n");
  const problems: string[] = [];

  if (recipe === undefined) {
    problems.push(`${loopDoc}: no "### ${heading}" under "## Subagents"`);
  } else {
    for (const command of recipeCommands) {
      if (!recipe.includes(`\`${command}`)) {
        problems.push(
          `${loopDoc}, "${heading}": the recipe lost \`${command}\``,
        );
      }
    }
  }

  if (own === undefined) {
    problems.push(`ship-spec: no "## ${heading}"`);
    return problems;
  }
  if (!own.includes(`](${recipeUrl})`)) {
    problems.push(`ship-spec, "${heading}": no link to ${recipeUrl}`);
  }
  for (const command of recipeCommands) {
    if (own.includes(command)) {
      problems.push(
        `ship-spec, "${heading}": states \`${command}\` again, which the development loop doc's recipe owns`,
      );
    }
  }
  for (const { what, text } of skillOwn) {
    if (!own.includes(text)) {
      problems.push(`ship-spec, "${heading}": lost ${what} (${text})`);
    }
  }
  return problems;
}

const doc = read(loopDoc);
const skill = read(`${skillsFolder}/ship-spec/SKILL.md`);

describe("the recipe for removing a worktree", () => {
  it("is written once, in the development loop doc, and linked from ship-spec, which keeps its own steps", () => {
    expect(removalProblems(doc, skill)).toEqual([]);
  });

  it("has every link to ship-spec's section, from the skill's own files, land on it", () => {
    const links = skillFiles("ship-spec")
      .filter((path) => path.endsWith(".md"))
      .flatMap((path) =>
        [
          ...read(`${skillsFolder}/ship-spec/${path}`).matchAll(
            // A link inside the folder: the recipe's URL has a `:`.
            /\]\(([^)#:\s]*)#removing-a-worktree\)/g,
          ),
        ].map((match) => ({ from: path, to: match[1] ?? "" })),
      );
    // SKILL.md links the section from three steps at least, a merge, the
    // run's end and a stop, and template-tickets.md for the Template's
    // worktree.
    const sources = links.map((link) => link.from);
    expect(
      sources.filter((source) => source === "SKILL.md").length,
    ).toBeGreaterThanOrEqual(3);
    expect(sources).toContain("template-tickets.md");
    // Every link lands on SKILL.md, by an anchor of its own or by its name
    // from a file beside it.
    expect(
      links.filter(
        ({ from: file, to }) => to !== (file === "SKILL.md" ? "" : "SKILL.md"),
      ),
    ).toEqual([]);
    expect(section(skill, `## ${heading}`)).toBeDefined();
  });

  describe("the check of the two texts", () => {
    const goodDoc = [
      "## Subagents",
      "",
      `### ${heading}`,
      "",
      "1. `git worktree remove <path>`.",
      "2. When it fails, read `git worktree list`: `rm -rf <path>`, or leave it.",
    ].join("\n");
    const goodSkill = [
      `## ${heading}`,
      "",
      `Follow [the recipe](${recipeUrl}); a worktree it leaves goes in the ledger.`,
      "After a merge, `git branch -D <branch>`, then [The check lock](#the-check-lock).",
    ].join("\n");

    it("passes a recipe in the doc and a skill that links it", () => {
      expect(removalProblems(goodDoc, goodSkill)).toEqual([]);
    });

    it("fails a skill that no longer links the recipe", () => {
      expect(
        removalProblems(goodDoc, goodSkill.replace(recipeUrl, "#stopping")),
      ).toEqual([`ship-spec, "${heading}": no link to ${recipeUrl}`]);
    });

    it("fails a skill that states the recipe again", () => {
      expect(
        removalProblems(
          goodDoc,
          `${goodSkill}\nWhen it fails, read \`git worktree list\`.`,
        ),
      ).toEqual([
        `ship-spec, "${heading}": states \`git worktree list\` again, which the development loop doc's recipe owns`,
      ]);
    });

    it("fails a skill that lost one of its own steps", () => {
      expect(
        removalProblems(goodDoc, goodSkill.replace("git branch -D", "delete")),
      ).toEqual([
        `ship-spec, "${heading}": lost the branch's deletion after a merge (git branch -D)`,
      ]);
    });

    it("fails a doc whose recipe is missing, stands outside Subagents or lost a step", () => {
      expect(removalProblems("## Subagents\n", goodSkill)).toEqual([
        `${loopDoc}: no "### ${heading}" under "## Subagents"`,
      ]);
      expect(
        removalProblems(
          goodDoc.replace("## Subagents", "## The loop"),
          goodSkill,
        ),
      ).toEqual([`${loopDoc}: no "### ${heading}" under "## Subagents"`]);
      expect(
        removalProblems(
          goodDoc.replace("`rm -rf <path>`", "delete it"),
          goodSkill,
        ),
      ).toEqual([`${loopDoc}, "${heading}": the recipe lost \`rm -rf\``]);
    });
  });
});
