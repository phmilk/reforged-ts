// The convention test of the Agent skills (ADRs 0022 and 0024). It reads
// .claude/skills/ as Claude Code loads it, with the skills CLI's lock
// (skills-lock.json), the "Skills" list of AGENTS.md and the list of what
// both repositories share (.claude/shared.json), and fails when:
//
// - a folder is neither an Upstream skill the lock names, with the content
//   the lock records, nor a repository skill with its SKILL.md;
// - an Upstream skill's file has CRLF line ends, which upstream never writes;
// - a repository skill takes an Upstream skill's name;
// - a Skill variant takes an Upstream skill's name, or records an Upstream
//   skill the lock does not name, or a version of it that is not the lock's
//   current one (docs/agents/development-loop.md, "Skill variants");
// - the "Skills" list of AGENTS.md misses a repository skill or names an
//   Upstream one;
// - a Skill variant's `metadata.replaces` names no Upstream skill of the lock,
//   or AGENTS.md or the development loop doc names a Replaced skill without
//   its variant on the same line (ADR 0027);
// - the list of what is shared names a lock, skill or file that is not there;
// - an Upstream skill could be rewritten by git or by `pnpm format`, or a
//   repository skill is not formatted.
//
// An Upstream skill is never edited by hand: an edit fails here. Update it
// with the command of docs/agents/development-loop.md, "Installing and
// updating the Upstream skills".
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, posix } from "node:path";
import { getFileInfo } from "prettier";
import { describe, expect, it } from "vitest";

import {
  replacedSkills,
  replacesOf,
} from "../../.claude/hooks/replaced-skills.mjs";
import { section } from "./markdown.js";
import { read, root } from "./repository.js";
import {
  folderHash,
  frontmatter,
  lock,
  type LockEntry,
  lockPath,
  namesSkill,
  repositorySkills,
  skillFiles,
  skillFolders,
  skillsFolder,
  upstreamSkills,
  unpairedReplacedSkills,
  type Variant,
  variants,
} from "./skills.js";

// The `name` of a SKILL.md's frontmatter; undefined without one.
function frontmatterName(text: string): string | undefined {
  const name = frontmatter(text)?.name;
  return typeof name === "string" ? name : undefined;
}

// What is wrong with the Skill variants against the lock's entries: a variant
// that takes an Upstream skill's name, records half of its source, records an
// Upstream skill the lock does not name, or a hash the lock has moved past.
function variantProblems(
  found: readonly Variant[],
  entries: Record<string, LockEntry>,
): string[] {
  const review = `review the variant against the Upstream skill's steps, then record the lock's hash (docs/agents/development-loop.md, "Skill variants")`;
  const named = (each: unknown): each is string =>
    typeof each === "string" && Object.hasOwn(entries, each);
  return found.flatMap(({ folder, name, upstream, upstreamHash }) => {
    const names = [...new Set([folder, name].filter(named))];
    if (names.length > 0) {
      return [
        `${folder}: a Skill variant takes the Upstream skill's name ${names.join(", ")}`,
      ];
    }
    if (typeof upstream !== "string" || typeof upstreamHash !== "string") {
      return [
        `${folder}: a Skill variant records metadata.upstream (${String(upstream)}) and metadata.upstream-hash (${String(upstreamHash)}), both strings`,
      ];
    }
    const entry = named(upstream) ? entries[upstream] : undefined;
    if (entry === undefined) {
      return [
        `${folder}: built from the Upstream skill ${upstream}, which ${lockPath} does not name`,
      ];
    }
    return upstreamHash === entry.computedHash
      ? []
      : [
          `${folder}: built from ${upstream} at ${upstreamHash}, and ${lockPath} has it at ${entry.computedHash}: ${review}`,
        ];
  });
}

// What is wrong with a map of Replaced skills against the Upstream skills of
// the lock: a `replaces` that names none of them.
function replacesProblems(
  replaced: Readonly<Record<string, string>>,
  upstreamNames: readonly string[],
): string[] {
  const names = new Set(upstreamNames);
  return Object.entries(replaced).flatMap(([skill, variant]) =>
    names.has(skill)
      ? []
      : [
          `${variant}: metadata.replaces names ${skill}, which is no Upstream skill of ${lockPath}`,
        ],
  );
}

// The docs a Collaborator or an Agent reads for the development loop, held to
// the map of Replaced skills.
const loopDocs = ["AGENTS.md", "docs/agents/development-loop.md"];

const upstream = upstreamSkills();
const repository = repositorySkills();

describe("the Agent skills of .claude/skills/", () => {
  it("reads both kinds from the repository", () => {
    expect(upstream, "the Upstream skills skills-lock.json names").toContain(
      "tdd",
    );
    expect(repository, "the repository's own skills").toContain("add-wrapper");
    expect(
      variants().map(
        ({ folder, upstream }) => `${folder} from ${String(upstream)}`,
      ),
      "the Skill variants, each from its Upstream skill",
    ).toEqual(
      expect.arrayContaining([
        "next-step from ask-matt",
        "split-spec from to-tickets",
        "write-spec from to-spec",
      ]),
    );
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

  // Upstream writes LF. An install on Windows without core.autocrlf=false
  // copies CRLF and hashes it, which the lock check above accepts; the next
  // update on Linux would then rewrite every folder.
  it("has every Upstream skill with upstream's LF line ends", () => {
    const crlf = Object.keys(lock()).flatMap((name) =>
      skillFiles(name)
        .filter((path) =>
          readFileSync(join(root, skillsFolder, name, path)).includes("\r\n"),
        )
        .map((path) => `${skillsFolder}/${name}/${path}`),
    );
    expect(
      crlf,
      `the Upstream skill files with CRLF: reinstall them with core.autocrlf=false (docs/agents/development-loop.md, "Installing and updating the Upstream skills")`,
    ).toEqual([]);
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

  // An update that moves an Upstream skill's hash turns this red for every
  // variant built from it, until the variant is reviewed.
  it("has every Skill variant record an Upstream skill of the lock, at the lock's current hash, under its own name", () => {
    expect(
      variantProblems(variants(), lock()),
      `the Skill variants of .claude/skills/ against ${lockPath}`,
    ).toEqual([]);
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

describe("the check of the Skill variants", () => {
  const entries: Record<string, LockEntry> = {
    "to-spec": {
      source: "mattpocock/skills",
      sourceType: "github",
      skillPath: "skills/engineering/to-spec/SKILL.md",
      computedHash: "current",
    },
  };
  const variant = (fields: Partial<Variant>): Variant => ({
    folder: "write-spec",
    name: "write-spec",
    upstream: "to-spec",
    upstreamHash: "current",
    ...fields,
  });

  it("passes a variant recording the lock's current hash", () => {
    expect(variantProblems([variant({})], entries)).toEqual([]);
  });

  it("fails a variant that takes an Upstream skill's name", () => {
    expect(variantProblems([variant({ name: "to-spec" })], entries)).toEqual([
      expect.stringContaining("takes the Upstream skill's name to-spec"),
    ]);
  });

  it("fails a variant recording an Upstream skill the lock does not name", () => {
    expect(
      variantProblems([variant({ upstream: "not-in-lock" })], entries),
    ).toEqual([
      expect.stringContaining(
        "not-in-lock, which skills-lock.json does not name",
      ),
    ]);
  });

  it("fails a variant recording a hash the lock has moved past", () => {
    expect(
      variantProblems([variant({ upstreamHash: "older" })], entries),
    ).toEqual([
      expect.stringContaining(
        "to-spec at older, and skills-lock.json has it at current",
      ),
    ]);
  });

  it("fails a variant recording half of its source", () => {
    expect(
      variantProblems([variant({ upstreamHash: undefined })], entries),
    ).toEqual([expect.stringContaining("metadata.upstream-hash (undefined)")]);
  });
});

describe("the map of Replaced skills", () => {
  const fixtures = join(root, "test/conventions/fixtures/replaced-skills");

  it("reads write-spec replacing to-spec and split-spec replacing to-tickets from the skills' folders", () => {
    expect(replacedSkills(), "the map of Replaced skills").toEqual({
      "to-spec": "write-spec",
      "to-tickets": "split-spec",
    });
  });

  it("has every replaces name an Upstream skill of the lock", () => {
    expect(
      replacesProblems(replacedSkills(), upstream),
      "the `metadata.replaces` of the Skill variants (ADR 0027)",
    ).toEqual([]);
  });

  it("fails a fixture whose replaces names no Upstream skill of the lock", () => {
    const map = replacedSkills(fixtures);
    expect(map, "the fixtures' map: only metadata.replaces counts").toEqual({
      "to-spec": "spec-writer",
      "to-tikets": "ticket-splitter",
    });
    expect(replacesProblems(map, upstream)).toEqual([
      expect.stringContaining(
        "ticket-splitter: metadata.replaces names to-tikets",
      ),
    ]);
  });

  it("reads replaces under metadata only, quoted or not", () => {
    const skill = (frontmatter: string) =>
      `---\n${frontmatter}\n---\n# A skill\n`;
    expect(replacesOf(skill("name: a\nmetadata:\n  replaces: to-spec"))).toBe(
      "to-spec",
    );
    expect(replacesOf(skill("metadata:\n  replaces: 'to-spec'"))).toBe(
      "to-spec",
    );
    expect(
      replacesOf(skill("replaces: to-spec\nmetadata:\n  upstream: x")),
    ).toBe(undefined);
    expect(replacesOf("# no frontmatter\nreplaces: to-spec")).toBe(undefined);
  });

  it("names AGENTS.md's and the development loop doc's Replaced skills only beside their variant", () => {
    const map = replacedSkills();
    const problems = loopDocs.flatMap((path) =>
      unpairedReplacedSkills(read(path), map).map((line) => `${path}:${line}`),
    );
    expect(
      problems,
      "the lines naming a Replaced skill without its variant: name the variant instead, or both on one line (ADR 0027)",
    ).toEqual([]);
  });

  describe("the check of a doc's lines", () => {
    const map = { "to-spec": "write-spec", "to-tickets": "split-spec" };

    it("fails a line naming a Replaced skill alone, as a command, a code span or a word", () => {
      expect(
        unpairedReplacedSkills(
          [
            "Run `/to-spec` next.",
            "then to-tickets",
            '  grill_with_docs --> to_spec["/to-spec: a spec"]',
          ].join("\n"),
          map,
        ),
      ).toEqual([
        "1: Run `/to-spec` next.",
        "2: then to-tickets",
        '3:   grill_with_docs --> to_spec["/to-spec: a spec"]',
      ]);
    });

    it("passes a line naming the variant beside it, and a longer name", () => {
      expect(
        unpairedReplacedSkills(
          "`write-spec` replaces `to-spec`.\nthe to-specs, my-to-spec",
          map,
        ),
      ).toEqual([]);
    });

    it("fails the line whose variant stands on another line", () => {
      expect(
        unpairedReplacedSkills("Run /to-spec,\nnot /write-spec.", map),
      ).toEqual(["1: Run /to-spec,"]);
    });

    it("reads a diagram's lines and skips a command's or an example's", () => {
      expect(
        unpairedReplacedSkills(
          [
            "```sh",
            "npx skills add -s to-spec to-tickets",
            "```",
            "```mermaid",
            '  a["/to-spec"]',
            "```",
          ].join("\n"),
          map,
        ),
      ).toEqual(['5:   a["/to-spec"]']);
    });

    it("names a skill as a whole word only", () => {
      expect(namesSkill("see .claude/skills/to-spec/SKILL.md", "to-spec")).toBe(
        true,
      );
      expect(namesSkill("auto-spec", "to-spec")).toBe(false);
    });
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
