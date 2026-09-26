import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// The repository root, two folders up from this file.
const root = fileURLToPath(new URL("../../", import.meta.url));

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function lines(text: string): string[] {
  const all = text.split(/\r?\n/);
  return all.at(-1) === "" ? all.slice(0, -1) : all;
}

// The lines of a Markdown file outside fenced code blocks, where a `#` starts
// a heading.
function proseLines(text: string): string[] {
  let fenced = false;
  return lines(text).filter((line) => {
    if (line.startsWith("```")) fenced = !fenced;
    return !fenced;
  });
}

function headings(text: string, level: "##" | "###"): string[] {
  const prefix = `${level} `;
  return proseLines(text)
    .filter((line) => line.startsWith(prefix))
    .map((line) => line.slice(prefix.length));
}

// The lines under a heading, up to the next heading of the same or a higher
// level; undefined when the heading is missing.
function section(text: string, heading: string): string[] | undefined {
  const all = proseLines(text);
  const start = all.indexOf(heading);
  if (start === -1) return undefined;
  const level = heading.indexOf(" ");
  const end = all.findIndex(
    (line, i) => i > start && /^#+ /.test(line) && line.indexOf(" ") <= level,
  );
  return all.slice(start + 1, end === -1 ? undefined : end);
}

const agents = read("AGENTS.md");

describe("AGENTS.md", () => {
  it("has the fixed sections, in order", () => {
    expect(headings(agents, "##"), "the `##` sections of AGENTS.md").toEqual([
      "Overview",
      "Commands",
      "Layout",
      "Rules",
      "Runtime constraints",
      "Agent skills",
      "Definition of done",
    ]);
  });

  it("is at most 150 lines", () => {
    expect(
      lines(agents).length,
      "AGENTS.md is capped at 150 lines: move the detail behind a pointer",
    ).toBeLessThanOrEqual(150);
  });

  it("keeps the subsections the setup skill maintains under Agent skills", () => {
    const agentSkills = section(agents, "## Agent skills") ?? [];
    expect(
      headings(agentSkills.join("\n"), "###"),
      "the `###` subsections of `## Agent skills`",
    ).toEqual(["Domain docs", "Issue tracker", "Triage labels", "Skills"]);
  });

  // An entry is one list item: the skill's folder name linked to its
  // SKILL.md, then its trigger.
  //   - [add-wrapper](.claude/skills/add-wrapper/SKILL.md): cover a Native ...
  it("lists under Skills only skills that exist, each named after its folder", () => {
    const entries = (section(agents, "### Skills") ?? []).filter((line) =>
      line.startsWith("- "),
    );
    const problems = entries.flatMap((entry) => {
      const match = /^- \[([^\]]+)\]\(([^)]+)\): \S/.exec(entry);
      if (!match) {
        return [
          `"${entry}" is not "- [<name>](.claude/skills/<name>/SKILL.md): <trigger>"`,
        ];
      }
      const [, name = "", path = ""] = match;
      const folder = dirname(path);
      if (folder !== `.claude/skills/${name}` || !path.endsWith("/SKILL.md")) {
        return [`${name}: ${path} is not .claude/skills/${name}/SKILL.md`];
      }
      if (!existsSync(join(root, path))) {
        return [`${name}: ${path} does not exist`];
      }
      const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(read(path))?.[1];
      const frontmatterName = frontmatter
        ?.match(/^name:[ \t]*(.*?)[ \t]*$/m)?.[1]
        ?.replace(/^(["'])(.*)\1$/, "$2");
      return frontmatterName === name
        ? []
        : [
            `${name}: the frontmatter name of ${path} is ${String(frontmatterName)}, not ${name}`,
          ];
    });
    expect(problems, "the entries under `### Skills` in AGENTS.md").toEqual([]);
  });
});

describe("CLAUDE.md", () => {
  it("is exactly the import line of AGENTS.md", () => {
    expect(
      lines(read("CLAUDE.md")),
      "CLAUDE.md holds the import of AGENTS.md and nothing else",
    ).toEqual(["@AGENTS.md"]);
  });
});
