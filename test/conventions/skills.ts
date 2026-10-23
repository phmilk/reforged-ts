// The Agent skills of the repository, as Claude Code loads them from
// .claude/skills/: the Upstream skills, which the skills CLI installed and
// skills-lock.json names, and the repository's own skills, every other folder.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { read, root } from "./repository.js";

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

function folderFiles(folder: string, current = folder): string[] {
  return readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
    const path = join(current, entry.name);
    if (entry.isDirectory()) {
      return entry.name === ".git" || entry.name === "node_modules"
        ? []
        : folderFiles(folder, path);
    }
    return entry.isFile() ? [relative(folder, path).split("\\").join("/")] : [];
  });
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
