/**
 * The update of the Upstream skills (ADR 0022): the command that installs
 * them and, run again, updates them to upstream's current files, what an
 * update moved in the lock, the Skill variants it leaves to review, and the
 * pull request the weekly skills workflow (`skills-update.yml`) opens with
 * it. docs/agents/development-loop.md, "Installing and updating the Upstream
 * skills", writes the same command for a person; a test holds the two
 * equal.
 *
 * `skills check` is not run: in skills@1.7.4 `check` is another name of
 * `update`, which reinstalls each skill without `--copy` (a symlink, which
 * a Windows clone cannot hold) and for every agent it detects. The install
 * itself is the check: upstream moved when it changes the lock.
 */
import { readdir, readFile } from "node:fs/promises";
import { join, posix } from "node:path";
import { parse } from "yaml";
import { byCodePoint } from "./order.js";
import { LIBRARY_REPOSITORY } from "./template-clone.js";
import { isRecord } from "./unknown.js";

/** The skills CLI, at the version the lock was written with. */
export const SKILLS_CLI = "skills@1.7.4";
/** The Upstream skills' repository. */
export const UPSTREAM_REPOSITORY = "mattpocock/skills";
/** The Upstream skills' lock, from the repository root. */
export const LOCK_FILE = "skills-lock.json";
/** The folder of the Agent skills, from the repository root. */
export const SKILLS_FOLDER = ".claude/skills";

/**
 * The Upstream skills, the folders of upstream's `engineering` and
 * `productivity` folders, in the order the setup doc's command names them.
 */
export const UPSTREAM_SKILLS: readonly string[] = [
  "ask-matt",
  "code-review",
  "codebase-design",
  "diagnosing-bugs",
  "domain-modeling",
  "grill-with-docs",
  "implement",
  "implement-spec",
  "improve-codebase-architecture",
  "pr",
  "prototype",
  "research",
  "retro",
  "setup-matt-pocock-skills",
  "tdd",
  "to-spec",
  "to-tickets",
  "triage",
  "wayfinder",
  "wizard",
  "grill-me",
  "grilling",
  "handoff",
  "teach",
  "to-questionnaire",
  "wait-what",
  "writing-for-agents",
];

/**
 * The arguments of the skills CLI that install the Upstream skills, or
 * update them: project scope, Claude Code alone, copied files.
 */
export const INSTALL_ARGS: readonly string[] = [
  "add",
  UPSTREAM_REPOSITORY,
  "-a",
  "claude-code",
  "--copy",
  "-y",
  "-s",
  ...UPSTREAM_SKILLS,
];

/** The install as the setup doc writes it, one line. */
export const INSTALL_COMMAND = `npx ${SKILLS_CLI} ${INSTALL_ARGS.join(" ")}`;

/**
 * What the install adds to the environment: upstream's LF kept on a
 * machine whose git converts line ends (Git for Windows), and no telemetry.
 */
export const INSTALL_ENV: Readonly<Record<string, string>> = {
  GIT_CONFIG_COUNT: "1",
  GIT_CONFIG_KEY_0: "core.autocrlf",
  GIT_CONFIG_VALUE_0: "false",
  DISABLE_TELEMETRY: "1",
};

/** A skill of the lock: its folder's hash and its `SKILL.md` in upstream. */
export interface LockSkill {
  computedHash: string;
  skillPath: string;
}

/** The skills of a lock's text, by name. */
export function readLock(text: string): Record<string, LockSkill> {
  const parsed: unknown = JSON.parse(text);
  if (!isRecord(parsed) || !isRecord(parsed.skills)) {
    throw new Error(`${LOCK_FILE} has no skills.`);
  }
  return Object.fromEntries(
    Object.entries(parsed.skills).map(([name, entry]) => {
      const { computedHash, skillPath } = isRecord(entry) ? entry : {};
      if (typeof computedHash !== "string" || typeof skillPath !== "string") {
        throw new Error(
          `${LOCK_FILE}: ${name} has no computedHash or skillPath.`,
        );
      }
      return [name, { computedHash, skillPath }];
    }),
  );
}

/** What an update did to a skill of the lock. */
export interface LockChange {
  name: string;
  change: "added" | "updated" | "removed";
  /** Its `SKILL.md` in upstream, as the lock names it after the update or before. */
  skillPath: string;
}

/** The skills whose lock entry an update added, changed or removed, by name. */
export function lockChanges(
  before: Readonly<Partial<Record<string, LockSkill>>>,
  after: Readonly<Partial<Record<string, LockSkill>>>,
): LockChange[] {
  const names = [
    ...new Set([...Object.keys(before), ...Object.keys(after)]),
  ].sort(byCodePoint);
  return names.flatMap((name): LockChange[] => {
    const [was, is] = [before[name], after[name]];
    if (was?.computedHash === is?.computedHash) return [];
    const change =
      was === undefined ? "added" : is === undefined ? "removed" : "updated";
    const skillPath = (is ?? was)?.skillPath ?? "";
    return [{ name, change, skillPath }];
  });
}

/** A Skill variant whose recorded version is no longer the lock's. */
export interface StaleVariant {
  /** Its folder under `.claude/skills/`. */
  folder: string;
  /** The Upstream skill it was built from. */
  upstream: string;
}

/**
 * The Skill variants of `root` built from an Upstream skill at another hash
 * than `lock`'s (or one the lock no longer names): the variants the update's
 * pull request must review, which the skills conventions test fails on.
 */
export async function staleVariants(
  root: string,
  lock: Readonly<Partial<Record<string, LockSkill>>>,
): Promise<StaleVariant[]> {
  const entries = await readdir(join(root, SKILLS_FOLDER), {
    withFileTypes: true,
  });
  const folders = entries
    .filter((entry) => entry.isDirectory() && !Object.hasOwn(lock, entry.name))
    .map((entry) => entry.name)
    .sort(byCodePoint);
  const found = await Promise.all(
    folders.map(async (folder): Promise<StaleVariant[]> => {
      const text = await readFile(
        join(root, SKILLS_FOLDER, folder, "SKILL.md"),
        "utf8",
      ).catch(() => undefined);
      const block =
        text === undefined
          ? undefined
          : /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1];
      const fields: unknown = block === undefined ? undefined : parse(block);
      const metadata = isRecord(fields) ? fields.metadata : undefined;
      if (!isRecord(metadata) || typeof metadata.upstream !== "string") {
        return [];
      }
      return metadata["upstream-hash"] === lock[metadata.upstream]?.computedHash
        ? []
        : [{ folder, upstream: metadata.upstream }];
    }),
  );
  return found.flat();
}

/** The setup doc's section on `master`, by its anchor. */
const setupDoc = (anchor: string): string =>
  `https://github.com/${LIBRARY_REPOSITORY}/blob/master/docs/agents/development-loop.md#${anchor}`;

/** The library's pull request, from the changes an update made to the lock. */
export function updatePullRequest(
  changes: readonly LockChange[],
  stale: readonly StaleVariant[],
  runUrl?: string,
): { title: string; body: string } {
  const upstream = `https://github.com/${UPSTREAM_REPOSITORY}`;
  const lines = changes.map(({ name, change, skillPath }) => {
    const folder = posix.dirname(skillPath);
    return `- \`${name}\`: ${change} ([its history](${upstream}/commits/main/${folder}))`;
  });
  const variants =
    stale.length === 0
      ? [
          "No Skill variant is built from an Upstream skill this update changes.",
        ]
      : [
          `The skills conventions test fails until each Skill variant built from a changed Upstream skill is reviewed: compare it with the Upstream skill's new steps, carry over what applies, then record the lock's new \`computedHash\` as its \`metadata.upstream-hash\` ([Skill variants](${setupDoc("skill-variants")})). Push the review to this branch: the next run replaces the branch only when upstream moves again.`,
          "",
          ...stale.map(
            ({ folder, upstream: name }) =>
              `- [ ] \`${folder}\`, from \`${name}\``,
          ),
        ];
  const body = [
    `The Upstream skills at [${UPSTREAM_REPOSITORY}](${upstream})'s current files, installed by the command of [Installing and updating the Upstream skills](${setupDoc("installing-and-updating-the-upstream-skills")}), which rewrote \`${LOCK_FILE}\`. The diff is upstream's change, line by line: review it as the change in what each skill tells an Agent to do.`,
    "",
    ...lines,
    "",
    ...variants,
    "",
    ...(runUrl === undefined
      ? []
      : [`Opened by the weekly skills update: ${runUrl}`, ""]),
  ].join("\n");
  return {
    title: `chore(skills): the Upstream skills at ${UPSTREAM_REPOSITORY}'s current files`,
    body,
  };
}
