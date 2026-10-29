// The Agent skills of the repository, as Claude Code loads them from
// .claude/skills/: the Upstream skills, which the skills CLI installed and
// skills-lock.json names, and the repository's own skills, every other folder,
// the Skill variants among them.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

import { folderFiles, read, root } from "./repository.js";

// The folder of the Agent skills and the skills CLI's lock, from the root.
export const skillsFolder = ".claude/skills";
export const lockPath = "skills-lock.json";

// An entry of the lock, as skills@1.7.4 writes it for a project install.
export interface LockEntry {
  source: string;
  sourceType: string;
  skillPath: string;
  computedHash: string;
}

// The lock's entries, by skill name: the name is the folder's.
export function lock(): Record<string, LockEntry> {
  return (JSON.parse(read(lockPath)) as { skills: Record<string, LockEntry> })
    .skills;
}

// The folders of .claude/skills/, sorted.
export function skillFolders(): string[] {
  return readdirSync(join(root, skillsFolder), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

// The Upstream skills, the names of the lock, sorted.
export function upstreamSkills(): string[] {
  return Object.keys(lock()).sort();
}

// The repository's own skills: the folders the lock does not name.
export function repositorySkills(): string[] {
  const upstream = new Set(upstreamSkills());
  return skillFolders().filter((name) => !upstream.has(name));
}

// The files of a skill's folder, by their path from it, sorted.
export function skillFiles(name: string): string[] {
  return folderFiles(join(root, skillsFolder, name)).sort();
}

// The hash the lock records for a skill's folder, recomputed from the files
// on disk as skills@1.7.4 computes it (computeSkillFolderHash in its
// dist/cli.mjs): the sha256 of each file's path from the folder then its
// bytes, the files in `localeCompare` order of their paths. Git stores the
// Upstream skills byte for byte (.gitattributes), so the bytes the CLI hashed
// are the bytes of every checkout.
export function folderHash(name: string): string {
  const folder = join(root, skillsFolder, name);
  const hash = createHash("sha256");
  for (const path of folderFiles(folder).sort((a, b) => a.localeCompare(b))) {
    hash.update(path);
    hash.update(readFileSync(join(folder, path)));
  }
  return hash.digest("hex");
}

// The frontmatter of a SKILL.md, parsed as YAML; undefined without one.
export function frontmatter(text: string): Record<string, unknown> | undefined {
  const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1];
  const fields: unknown = block === undefined ? undefined : parse(block);
  return typeof fields === "object" && fields !== null
    ? (fields as Record<string, unknown>)
    : undefined;
}

// A Skill variant, as its SKILL.md's frontmatter declares it: its folder, its
// `name`, and under `metadata` what it records of its source, the Upstream
// skill's name (`upstream`) and the lock's version of it, that skill's
// `computedHash` (`upstream-hash`); docs/agents/development-loop.md, "Skill
// variants". The fields are as written, a string or not. The weekly skills
// update reads the same keys to list the variants its pull request must
// review (`staleVariants` in release/src/skills-update.ts): a change to them
// changes both.
export interface Variant {
  folder: string;
  name: unknown;
  upstream: unknown;
  upstreamHash: unknown;
}

// The Skill variants among the repository skills: those whose frontmatter
// records `upstream` or `upstream-hash`.
export function variants(): Variant[] {
  return repositorySkills().flatMap((folder) => {
    const path = join(root, skillsFolder, folder, "SKILL.md");
    if (!existsSync(path)) return [];
    const fields = frontmatter(readFileSync(path, "utf8"));
    const metadata = fields?.metadata;
    if (typeof metadata !== "object" || metadata === null) return [];
    const { upstream, "upstream-hash": upstreamHash } = metadata as Record<
      string,
      unknown
    >;
    return upstream === undefined && upstreamHash === undefined
      ? []
      : [{ folder, name: fields?.name, upstream, upstreamHash }];
  });
}

// Whether a line names a skill: its name as a word of its own, a slash
// command (`/to-spec`), a code span or a path segment, never inside a longer
// name (`to-spec` is not named by `to-specs` or `my-to-spec`).
export function namesSkill(line: string, name: string): boolean {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![\\w-])${escaped}(?![\\w-])`).test(line);
}

// The lines of a Markdown doc that name a Replaced skill without its variant
// on the same line (ADR 0027), each as `<line number>: <line>`, given the map
// of Replaced skills (replacedSkills of .claude/hooks/replaced-skills.mjs).
// A fenced block counts only when it is a diagram (`mermaid`): a diagram is
// the loop the docs show, while a command or a configuration example (the
// install command lists every Upstream skill) recommends nothing.
export function unpairedReplacedSkills(
  text: string,
  replaced: Readonly<Record<string, string>>,
): string[] {
  let fence: string | undefined;
  return text.split(/\r?\n/).flatMap((line, index) => {
    const opening = /^\s*```(\w*)/.exec(line);
    if (opening !== null) {
      fence = fence === undefined ? (opening[1] ?? "") : undefined;
      return [];
    }
    if (fence !== undefined && fence !== "mermaid") return [];
    const unpaired = Object.entries(replaced).filter(
      ([skill, variant]) =>
        namesSkill(line, skill) && !namesSkill(line, variant),
    );
    return unpaired.length === 0 ? [] : [`${String(index + 1)}: ${line}`];
  });
}
