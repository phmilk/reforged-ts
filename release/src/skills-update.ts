/**
 * The update of the Upstream skills (ADR 0022): which skills they are, the
 * commands that install, update and remove them, what an update moved in
 * the lock, the Skill variants it leaves to review, and the pull request the
 * weekly skills workflow (`skills-update.yml`) opens with it.
 *
 * The Upstream skills are the set upstream's plugin ships, the `skills` of
 * its `.claude-plugin/plugin.json`, read at each update: the folders of
 * upstream's `engineering` and `productivity` folders. The skills CLI skips
 * a `-s` name that matches nothing without a word, and still matches a name
 * upstream moved to `deprecated`, so no list of names is kept here: the
 * install takes the plugin's, a lock entry the plugin no longer ships is
 * removed, and the setup doc's command (`SETUP_DOC`, "Installing and
 * updating the Upstream skills") is rewritten when the set changes. A test
 * holds that command to the lock.
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
import type { Report } from "./patch-watch-report.js";
import { SKILLS_FOLDER } from "./shared-copy.js";
import { LIBRARY_REPOSITORY } from "./template-clone.js";
import { isRecord, isStringList } from "./unknown.js";

/** The skills CLI, at the version the lock was written with. */
export const SKILLS_CLI = "skills@1.7.4";
/** The Upstream skills' repository. */
export const UPSTREAM_REPOSITORY = "mattpocock/skills";
/**
 * Upstream's plugin manifest on its default branch: its `skills` are the
 * Upstream skills.
 */
export const PLUGIN_URL = `https://raw.githubusercontent.com/${UPSTREAM_REPOSITORY}/main/.claude-plugin/plugin.json`;
/** The folders of upstream the Upstream skills come from. */
export const UPSTREAM_FOLDERS: readonly string[] = [
  "skills/engineering",
  "skills/productivity",
];
/** The Upstream skills' lock, from the repository root. */
export const LOCK_FILE = "skills-lock.json";
/** The doc that writes the install command for a person, from the root. */
export const SETUP_DOC = "docs/agents/development-loop.md";
/** The heading of the section of `SETUP_DOC` whose `sh` block is the command. */
export const SETUP_SECTION = "## Installing and updating the Upstream skills";

/** The skills upstream's plugin ships. */
export interface PluginSkills {
  /** The Upstream skills, by name (their folder's), in the plugin's order. */
  names: string[];
  /** The plugin's paths outside `UPSTREAM_FOLDERS`, left out. */
  ignored: string[];
}

/**
 * A skill's name as the install passes it to the skills CLI (through a
 * shell on Windows) and the setup doc writes it in its `sh` line: lower-case
 * letters, digits and hyphens.
 */
export const SKILL_NAME = /^[a-z0-9][a-z0-9-]*$/;

/**
 * A skill's folder in upstream, as its plugin manifest names it:
 * `./skills/<folder>/<name>`, the `./` and a trailing `/` optional.
 */
const PLUGIN_PATH = /^(?:\.\/)?skills\/([a-z0-9][a-z0-9-]*)\/([^/]*)\/?$/;

/**
 * The skills of upstream's plugin manifest, parsed. A path of another
 * folder of upstream (`in-progress`, `misc`, `deprecated`) is left out; one
 * of another shape, or a name of other characters than `SKILL_NAME`'s, is
 * refused, and so is every update while upstream ships it.
 */
export function pluginSkills(manifest: unknown): PluginSkills {
  const paths = isRecord(manifest) ? manifest.skills : undefined;
  if (!isStringList(paths) || paths.length === 0) {
    throw new Error(`${PLUGIN_URL} has no skills list.`);
  }
  const names: string[] = [];
  const ignored: string[] = [];
  for (const path of paths) {
    const match = PLUGIN_PATH.exec(path);
    const [, folder = "", name = ""] = match ?? [];
    if (match === null || !SKILL_NAME.test(name)) {
      throw new Error(
        `${PLUGIN_URL} ships ${JSON.stringify(path)}, not ./skills/<folder>/<name> with a name of lower-case letters, digits and hyphens: nothing was installed.`,
      );
    }
    if (UPSTREAM_FOLDERS.includes(`skills/${folder}`)) {
      names.push(name);
    } else {
      ignored.push(path);
    }
  }
  return { names, ignored };
}

/**
 * The lock's skills whose `skillPath` is not `SKILL.md` in their own folder
 * of upstream's `engineering` or `productivity` folders, each with it.
 */
export function misplacedSkills(
  lock: Readonly<Record<string, LockSkill>>,
): string[] {
  return Object.entries(lock)
    .filter(
      ([name, { skillPath }]) =>
        !UPSTREAM_FOLDERS.some(
          (folder) => skillPath === `${folder}/${name}/SKILL.md`,
        ),
    )
    .map(([name, { skillPath }]) => `${name} (${skillPath})`)
    .sort(byCodePoint);
}

/** The skills upstream's plugin ships today, fetched with `fetcher`. */
export async function fetchPluginSkills(
  fetcher: typeof fetch,
): Promise<PluginSkills> {
  const response = await fetcher(PLUGIN_URL);
  if (!response.ok) {
    throw new Error(
      `GET ${PLUGIN_URL} answered ${String(response.status)} ${response.statusText}.`,
    );
  }
  return pluginSkills(await response.json());
}

/**
 * The arguments of the skills CLI that install the Upstream skills `names`,
 * or update them: project scope, Claude Code alone, copied files.
 */
export const installArgs = (names: readonly string[]): string[] => [
  "add",
  UPSTREAM_REPOSITORY,
  "-a",
  "claude-code",
  "--copy",
  "-y",
  "-s",
  ...names,
];

/**
 * The arguments of the skills CLI that remove the skills `names`, their
 * folders and their lock entries.
 */
export const removeArgs = (names: readonly string[]): string[] => [
  "remove",
  "-y",
  ...names,
];

/** The install of `names` as the setup doc writes it, one line. */
export const installCommand = (names: readonly string[]): string =>
  `npx ${SKILLS_CLI} ${installArgs(names).join(" ")}`;

/** Where the `sh` block of the setup doc's section holds its one line. */
function commandLine(
  doc: string,
): { start: number; end: number; text: string } | undefined {
  const section = doc.indexOf(SETUP_SECTION);
  if (section === -1) return undefined;
  const fence = "```sh\n";
  const match = new RegExp(`${fence}([^\\n]*)\\n\`\`\``).exec(
    doc.slice(section),
  );
  if (match === null) return undefined;
  const start = section + match.index + fence.length;
  const [, text] = match;
  return { start, end: start + text.length, text };
}

/**
 * The skill names of the setup doc's install command, in its order;
 * `undefined` when its section has no `sh` block of one install command.
 */
export function docSkillNames(doc: string): string[] | undefined {
  const text = commandLine(doc)?.text;
  const prefix = `${installCommand([])} `;
  if (text?.startsWith(prefix) !== true) return undefined;
  return text.slice(prefix.length).split(" ");
}

/** The setup doc with its install command naming `names`. */
export function withDocCommand(doc: string, names: readonly string[]): string {
  const line = commandLine(doc);
  if (line === undefined) {
    throw new Error(`${SETUP_DOC} has no sh block under "${SETUP_SECTION}".`);
  }
  return doc.slice(0, line.start) + installCommand(names) + doc.slice(line.end);
}

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
  /** `relocated`: its folder in upstream moved, its files changed or not. */
  change: "added" | "updated" | "relocated" | "removed";
  /** Its `SKILL.md` in upstream, as the lock names it after the update or before. */
  skillPath: string;
}

/**
 * The skills whose lock entry an update added, changed (its folder's hash or
 * its path in upstream) or removed, by name.
 */
export function lockChanges(
  before: Readonly<Partial<Record<string, LockSkill>>>,
  after: Readonly<Partial<Record<string, LockSkill>>>,
): LockChange[] {
  const names = [
    ...new Set([...Object.keys(before), ...Object.keys(after)]),
  ].sort(byCodePoint);
  return names.flatMap((name): LockChange[] => {
    const [was, is] = [before[name], after[name]];
    if (
      was?.computedHash === is?.computedHash &&
      was?.skillPath === is?.skillPath
    ) {
      return [];
    }
    const change =
      was === undefined
        ? "added"
        : is === undefined
          ? "removed"
          : was.skillPath === is.skillPath
            ? "updated"
            : "relocated";
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
 * It reads a variant as `variants()` of `test/conventions/skills.ts` does,
 * which the release scripts cannot import: the frontmatter of its
 * `SKILL.md`, `metadata.upstream` and `metadata.upstream-hash`. A change to
 * those keys changes both.
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
  `https://github.com/${LIBRARY_REPOSITORY}/blob/master/${SETUP_DOC}#${anchor}`;

/** The library's pull request, from the changes an update made to the lock. */
export function updatePullRequest(
  changes: readonly LockChange[],
  stale: readonly StaleVariant[],
  runUrl?: string,
): Report {
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
