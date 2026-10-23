// The convention test of the Agent skills (ADRs 0022 and 0024). It reads
// .claude/skills/ as Claude Code loads it, with the skills CLI's lock
// (skills-lock.json), the "Skills" list of AGENTS.md and the list of what
// both repositories share (.claude/shared.json), and fails when:
//
// - a folder is neither an Upstream skill the lock names, with the content
//   the lock records, nor a repository skill with its SKILL.md;
// - a repository skill takes an Upstream skill's name;
// - the "Skills" list of AGENTS.md misses a repository skill or names an
//   Upstream one;
// - the list of what is shared names a lock, skill or file that is not there;
// - an Upstream skill could be rewritten by git or by `pnpm format`, or a
//   repository skill is not formatted.
//
// An Upstream skill is never edited by hand: an edit fails here. Update it
// with the command of docs/agents/development-loop.md, "Installing and
// updating the Upstream skills".
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, posix } from "node:path";
import { getFileInfo } from "prettier";
import { describe, expect, it } from "vitest";

import { section } from "./markdown.js";
import { read, root } from "./repository.js";
import {
  folderHash,
  lock,
  lockPath,
  repositorySkills,
  skillFiles,
  skillFolders,
  skillsFolder,
  upstreamSkills,
} from "./skills.js";

// The `name` of a SKILL.md's frontmatter, unquoted; undefined without one.
function frontmatterName(text: string): string | undefined {
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1];
  return frontmatter
    ?.match(/^name:[ \t]*(.*?)[ \t]*$/m)?.[1]
    ?.replace(/^(["'])(.*)\1$/, "$2");
}

const upstream = upstreamSkills();
const repository = repositorySkills();

describe("the Agent skills of .claude/skills/", () => {
  it("reads both kinds from the repository", () => {
    expect(upstream, "the Upstream skills skills-lock.json names").toContain(
      "tdd",
    );
    expect(repository, "the repository's own skills").toContain("add-wrapper");
  });

  it("has every Upstream skill of the lock, from mattpocock/skills, with the content the lock records", () => {
    const problems = Object.entries(lock()).flatMap(([name, entry]) => {
      const folder = `${skillsFolder}/${name}`;
      if (!existsSync(join(root, folder, "SKILL.md"))) {
        return [`${name}: the lock names it and ${folder}/SKILL.md is missing`];
      }
      if (entry.source !== "mattpocock/skills") {
        return [`${name}: from ${entry.source}, not mattpocock/skills`];
      }
      return folderHash(name) === entry.computedHash
        ? []
        : [
            `${name}: ${folder} is not the content ${lockPath} records: an Upstream skill is never edited, undo the edit or update it with the skills CLI`,
          ];
    });
    expect(problems, `the Upstream skills of ${lockPath}`).toEqual([]);
  });

  // A folder the lock names is an Upstream skill, so a repository skill's
  // folder never has an Upstream skill's name; its frontmatter name could.
  it("has a SKILL.md named after its folder in every repository skill, none an Upstream skill's name", () => {
    const upstreamNames = new Set(upstream);
    const problems = repository.flatMap((name) => {
      const path = `${skillsFolder}/${name}/SKILL.md`;
      if (!existsSync(join(root, path))) {
        return [
          `${name}: neither an Upstream skill of ${lockPath} nor a repository skill with ${path}`,
        ];
      }
      const declared = frontmatterName(read(path));
      if (declared !== undefined && upstreamNames.has(declared)) {
        return [`${name}: ${path} takes the Upstream skill's name ${declared}`];
      }
      return declared === name
        ? []
        : [
            `${name}: the frontmatter name of ${path} is ${String(declared)}, not ${name}`,
          ];
    });
    expect(problems, "the repository skills of .claude/skills/").toEqual([]);
  });

  it("lists under Skills in AGENTS.md every repository skill and no Upstream skill", () => {
    const listed = (section(read("AGENTS.md"), "### Skills") ?? []).flatMap(
      (line) => /^- \[([^\]]+)\]/.exec(line)?.[1] ?? [],
    );
    expect(
      listed.toSorted(),
      "the entries under `### Skills` in AGENTS.md: the repository skills, not the Upstream ones, which skills-lock.json names",
    ).toEqual(repository);
  });

  // Git stores an Upstream skill byte for byte, so its hash holds on every
  // checkout, and Prettier skips it, so `pnpm format` never edits it; a
  // repository skill is text and formatted, as every file.
  it("keeps the Upstream skills' bytes and formats the repository skills", async () => {
    const files = skillFolders().flatMap((name) =>
      skillFiles(name).map((file) => ({
        name,
        path: posix.join(skillsFolder, name, file),
      })),
    );
    // `git check-attr -z` prints <path> NUL text NUL <value> NUL per file.
    const fields = execFileSync(
      "git",
      ["check-attr", "-z", "text", "--", ...files.map(({ path }) => path)],
      { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    ).split("\0");
    const attributes = new Map<string, string>();
    for (let i = 0; i + 2 < fields.length; i += 3) {
      attributes.set(fields[i] ?? "", fields[i + 2] ?? "");
    }
    const ignorePath = [
      join(root, ".gitignore"),
      join(root, ".prettierignore"),
    ];
    const upstreamNames = new Set(upstream);
    const problems = (
      await Promise.all(
        files.map(async ({ name, path }) => {
          const isUpstream = upstreamNames.has(name);
          const text = attributes.get(path);
          const { ignored, inferredParser } = await getFileInfo(
            join(root, path),
            { ignorePath },
          );
          if (isUpstream) {
            return [
              ...(text === "unset"
                ? []
                : [
                    `${path}: git converts its line ends (text: ${String(text)}): set -text in .gitattributes`,
                  ]),
              ...(ignored || inferredParser === null
                ? []
                : [
                    `${path}: Prettier formats it: ignore it in .prettierignore`,
                  ]),
            ];
          }
          return [
            ...(text === "auto"
              ? []
              : [
                  `${path}: not text=auto (text: ${String(text)}): set it in .gitattributes`,
                ]),
            ...(ignored
              ? [`${path}: Prettier skips it: un-ignore it in .prettierignore`]
              : []),
          ];
        }),
      )
    ).flat();
    expect(problems, "the attributes of the files of .claude/skills/").toEqual(
      [],
    );
  });
});

describe("the list of what both repositories share", () => {
  const shared = JSON.parse(read(".claude/shared.json")) as {
    lock: string;
    skills: string[];
    files: string[];
  };

  it("names the Upstream skills' lock, and repository skills and files that exist", () => {
    const repositoryNames = new Set(repository);
    const problems = [
      ...(shared.lock === lockPath
        ? []
        : [`lock: ${shared.lock}, not the Upstream skills' lock ${lockPath}`]),
      ...shared.skills.flatMap((name) =>
        repositoryNames.has(name)
          ? []
          : [
              `skills: ${name} is not a repository skill of .claude/skills/ (an Upstream skill is shared with the lock)`,
            ],
      ),
      ...shared.files.flatMap((path) =>
        existsSync(join(root, path)) ? [] : [`files: ${path} does not exist`],
      ),
    ];
    expect(problems, "the names of .claude/shared.json").toEqual([]);
  });
});
