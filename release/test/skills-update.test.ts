import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main, type UpdateReport } from "../src/cli/skills-update.js";
import type { Command } from "../src/process.js";
import {
  docSkillNames,
  fetchPluginSkills,
  INSTALL_ENV,
  installArgs,
  installCommand,
  lockChanges,
  misplacedSkills,
  PLUGIN_URL,
  pluginSkills,
  readLock,
  removeArgs,
  SETUP_DOC,
  SETUP_SECTION,
  staleVariants,
  updatePullRequest,
  withDocCommand,
  type LockSkill,
} from "../src/skills-update.js";
import { repositoryRoot } from "../src/workspace.js";
import { readWorkflow } from "./support/workflows.js";
import { tempDir, writeText } from "./support/workspace.js";

const skill = (
  computedHash: string,
  folder = "engineering/tdd",
): LockSkill => ({
  computedHash,
  skillPath: `skills/${folder}/SKILL.md`,
});

const lockText = (skills: Record<string, LockSkill>) =>
  `${JSON.stringify({ version: 1, skills: Object.fromEntries(Object.entries(skills).map(([name, entry]) => [name, { source: "mattpocock/skills", sourceType: "github", ...entry }])) }, null, 2)}\n`;

const variantText = (upstream: string, hash: string) =>
  `---\nname: write-spec\ndescription: A variant.\nmetadata:\n  upstream: ${upstream}\n  upstream-hash: ${hash}\n---\n\n# Write a Spec\n`;

/** A setup doc whose section writes the install of `names`. */
const docText = (names: readonly string[]) =>
  `# The development loop\n\n${SETUP_SECTION}\n\nOne command:\n\n\`\`\`sh\n${installCommand(names)}\n\`\`\`\n\n- **The skill names.** Upstream's.\n\n## Removing the global copies\n\n\`\`\`sh\nnpx skills remove -g <name>...\n\`\`\`\n`;

/** A fetch answering upstream's plugin manifest with `skills`. */
const plugin =
  (skills: string[], requests: string[] = []): typeof fetch =>
  (input) => {
    requests.push(input instanceof Request ? input.url : input.toString());
    return Promise.resolve(
      new Response(JSON.stringify({ name: "mattpocock-skills", skills })),
    );
  };

describe("the setup doc's install command", () => {
  it("names exactly the skills of the lock, as the update writes it", async () => {
    const doc = await readFile(join(repositoryRoot, SETUP_DOC), "utf8");
    const names = docSkillNames(doc);
    const lock = readLock(
      await readFile(join(repositoryRoot, "skills-lock.json"), "utf8"),
    );
    expect(names?.toSorted()).toEqual(Object.keys(lock).sort());
    // What the update would write for these names is the doc as it is.
    expect(withDocCommand(doc, names ?? [])).toBe(doc);
  });

  it("installs copied files for Claude Code alone, keeping LF", () => {
    expect(installCommand(["tdd", "pr"])).toBe(
      "npx skills@1.7.4 add mattpocock/skills -a claude-code --copy -y -s tdd pr",
    );
    expect(removeArgs(["teach"])).toEqual(["remove", "-y", "teach"]);
    expect(INSTALL_ENV).toMatchObject({
      GIT_CONFIG_KEY_0: "core.autocrlf",
      GIT_CONFIG_VALUE_0: "false",
    });
  });

  it("is rewritten in place, the rest of the doc kept", () => {
    const doc = docText(["tdd", "pr"]);
    const rewritten = withDocCommand(doc, ["tdd", "wizard"]);
    expect(docSkillNames(rewritten)).toEqual(["tdd", "wizard"]);
    expect(rewritten.replace("wizard", "pr")).toBe(doc);
  });

  it("is not read from a section without one", () => {
    expect(
      docSkillNames("# A doc\n\n```sh\nnpx skills@1.7.4 add x\n```\n"),
    ).toBe(undefined);
    expect(() => withDocCommand("# A doc\n", ["tdd"])).toThrow(
      `${SETUP_DOC} has no sh block`,
    );
  });
});

describe("pluginSkills", () => {
  it("names the skills of upstream's engineering and productivity folders, and leaves out the rest", () => {
    expect(
      pluginSkills({
        skills: [
          "./skills/engineering/tdd",
          "./skills/productivity/grill-me/",
          "./skills/deprecated/old",
          "./skills/misc/other",
        ],
      }),
    ).toEqual({
      names: ["tdd", "grill-me"],
      ignored: ["./skills/deprecated/old", "./skills/misc/other"],
    });
  });

  it.each([
    "./skills/engineering/tdd; rm -rf ~",
    "./skills/engineering/$(curl evil)",
    "./skills/engineering/Tdd",
    "./skills/engineering/-s",
    "./skills/engineering/tdd/nested",
    "../skills/engineering/tdd",
    "/skills/engineering/tdd",
    "skills/../engineering/tdd",
  ])(
    "refuses the path %s, which the install and the doc would carry",
    (path) => {
      expect(() =>
        pluginSkills({ skills: ["./skills/engineering/pr", path] }),
      ).toThrow(
        `${PLUGIN_URL} ships ${JSON.stringify(path)}, not ./skills/<folder>/<name>`,
      );
    },
  );

  it("refuses a manifest without skills", () => {
    expect(() => pluginSkills({ name: "x" })).toThrow(
      `${PLUGIN_URL} has no skills list.`,
    );
  });

  it("fetches the manifest of upstream's default branch", async () => {
    const requests: string[] = [];
    expect(
      await fetchPluginSkills(plugin(["./skills/engineering/tdd"], requests)),
    ).toEqual({ names: ["tdd"], ignored: [] });
    expect(requests).toEqual([
      "https://raw.githubusercontent.com/mattpocock/skills/main/.claude-plugin/plugin.json",
    ]);
  });

  it("fails on an answer that is not 200", async () => {
    const missing: typeof fetch = () =>
      Promise.resolve(
        new Response("", { status: 404, statusText: "Not Found" }),
      );
    await expect(fetchPluginSkills(missing)).rejects.toThrow(
      `GET ${PLUGIN_URL} answered 404 Not Found.`,
    );
  });
});

describe("lockChanges", () => {
  it("names each skill added, updated, relocated or removed, in code-point order", () => {
    expect(
      lockChanges(
        {
          tdd: skill("a"),
          pr: skill("b", "engineering/pr"),
          teach: skill("c"),
          wizard: skill("d", "engineering/wizard"),
        },
        {
          tdd: skill("a2"),
          pr: skill("b", "engineering/pr"),
          wizard: skill("d", "deprecated/wizard"),
          grill: skill("e", "productivity/grill"),
        },
      ),
    ).toEqual([
      {
        name: "grill",
        change: "added",
        skillPath: "skills/productivity/grill/SKILL.md",
      },
      {
        name: "tdd",
        change: "updated",
        skillPath: "skills/engineering/tdd/SKILL.md",
      },
      {
        name: "teach",
        change: "removed",
        skillPath: "skills/engineering/tdd/SKILL.md",
      },
      {
        name: "wizard",
        change: "relocated",
        skillPath: "skills/deprecated/wizard/SKILL.md",
      },
    ]);
  });

  it("is empty when nothing moved", () => {
    expect(lockChanges({ tdd: skill("a") }, { tdd: skill("a") })).toEqual([]);
  });
});

describe("misplacedSkills", () => {
  it("names a skill of the lock outside its own folder of engineering or productivity", () => {
    expect(
      misplacedSkills({
        tdd: skill("a"),
        "grill-me": skill("b", "productivity/grill-me"),
        wizard: skill("c", "deprecated/wizard"),
        pr: skill("d", "engineering/other"),
      }),
    ).toEqual([
      "pr (skills/engineering/other/SKILL.md)",
      "wizard (skills/deprecated/wizard/SKILL.md)",
    ]);
  });

  it("names none in this repository's lock", async () => {
    const lock = readLock(
      await readFile(join(repositoryRoot, "skills-lock.json"), "utf8"),
    );
    expect(misplacedSkills(lock)).toEqual([]);
  });
});

describe("readLock", () => {
  it("refuses an entry without its hash", () => {
    expect(() =>
      readLock(JSON.stringify({ skills: { tdd: { skillPath: "x" } } })),
    ).toThrow("skills-lock.json: tdd has no computedHash or skillPath.");
  });
});

describe("staleVariants", () => {
  it("names a variant recording another hash than the lock's, or a skill it no longer names", async () => {
    const root = await tempDir("variants");
    await writeText(root, ".claude/skills/to-spec/SKILL.md", "upstream\n");
    await writeText(
      root,
      ".claude/skills/write-spec/SKILL.md",
      variantText("to-spec", "old"),
    );
    await writeText(
      root,
      ".claude/skills/split-spec/SKILL.md",
      variantText("gone", "x"),
    );
    await writeText(
      root,
      ".claude/skills/fresh/SKILL.md",
      variantText("to-spec", "new"),
    );
    await writeText(
      root,
      ".claude/skills/add-wrapper/SKILL.md",
      "---\nname: add-wrapper\n---\n",
    );

    expect(await staleVariants(root, { "to-spec": skill("new") })).toEqual([
      { folder: "split-spec", upstream: "gone" },
      { folder: "write-spec", upstream: "to-spec" },
    ]);
  });

  it("names none in this repository, whose conventions test holds every variant to the lock", async () => {
    const lock = readLock(
      await readFile(join(repositoryRoot, "skills-lock.json"), "utf8"),
    );
    expect(await staleVariants(repositoryRoot, lock)).toEqual([]);
  });
});

describe("updatePullRequest", () => {
  it("lists what moved with its upstream history, and the variants to review", () => {
    const { title, body } = updatePullRequest(
      [
        {
          name: "to-spec",
          change: "updated",
          skillPath: "skills/engineering/to-spec/SKILL.md",
        },
      ],
      [{ folder: "write-spec", upstream: "to-spec" }],
      "https://run",
    );
    expect(title).toBe(
      "chore(skills): the Upstream skills at mattpocock/skills's current files",
    );
    expect(body).toContain(
      "- `to-spec`: updated ([its history](https://github.com/mattpocock/skills/commits/main/skills/engineering/to-spec))",
    );
    expect(body).toContain("- [ ] `write-spec`, from `to-spec`");
    expect(body).toContain("https://run");
  });

  it("says when no variant needs a review", () => {
    expect(updatePullRequest([], []).body).toContain(
      "No Skill variant is built from an Upstream skill this update changes.",
    );
  });
});

describe("skills:update", () => {
  const PLUGIN = ["./skills/engineering/to-spec", "./skills/engineering/tdd"];

  /**
   * A repository locking to-spec and teach, whose install, when run, writes
   * `after` as the lock; the remove takes the skills it names out of the lock.
   */
  async function repository(
    after: Record<string, LockSkill> = {
      "to-spec": skill("old", "engineering/to-spec"),
      tdd: skill("t"),
    },
    documented = ["to-spec", "tdd"],
  ) {
    const root = await tempDir("skills-update");
    await writeText(
      root,
      "skills-lock.json",
      lockText({
        "to-spec": skill("old", "engineering/to-spec"),
        tdd: skill("t"),
      }),
    );
    await writeText(root, SETUP_DOC, docText(documented));
    await writeText(root, ".claude/skills/to-spec/SKILL.md", "upstream\n");
    await writeText(
      root,
      ".claude/skills/write-spec/SKILL.md",
      variantText("to-spec", "old"),
    );
    const commands: Command[] = [];
    const run = async (command: Command) => {
      commands.push(command);
      if (command.args.includes("add")) {
        await writeText(root, "skills-lock.json", lockText(after));
      }
      return 0;
    };
    return { root, commands, run };
  }

  async function cli(
    args: string[],
    context: {
      root: string;
      run: (command: Command) => Promise<number>;
      fetcher?: typeof fetch;
    },
  ) {
    let stdout = "";
    let stderr = "";
    const status = await main(
      args,
      {
        stdout: (text) => (stdout += text),
        stderr: (text) => (stderr += text),
      },
      { fetcher: plugin(PLUGIN), ...context },
    );
    return { status, stdout, stderr };
  }

  it("installs the plugin's skills from the root with npx, keeping LF", async () => {
    const repo = await repository();
    await cli([], repo);
    expect(repo.commands).toEqual([
      {
        command: "npx",
        args: ["--yes", "skills@1.7.4", ...installArgs(["to-spec", "tdd"])],
        cwd: repo.root,
        env: INSTALL_ENV,
      },
    ]);
  });

  it("reports nothing moved when the lock is unchanged, and leaves the doc", async () => {
    const repo = await repository();
    const report = join(await tempDir("report"), "update.json");
    expect(await cli(["--report", report], repo)).toEqual({
      status: 0,
      stdout: "Upstream has not moved: skills-lock.json is unchanged.\n",
      stderr: "",
    });
    const written = JSON.parse(await readFile(report, "utf8")) as UpdateReport;
    expect(written).toMatchObject({
      moved: false,
      changes: [],
      stale: [],
      docUpdated: false,
    });
    expect(await readFile(join(repo.root, SETUP_DOC), "utf8")).toBe(
      docText(["to-spec", "tdd"]),
    );
  });

  it("removes a skill the plugin no longer ships, installs a new one and rewrites the doc's command", async () => {
    const repo = await repository({
      "to-spec": skill("old", "engineering/to-spec"),
      wizard: skill("w", "productivity/wizard"),
    });
    const result = await cli([], {
      ...repo,
      fetcher: plugin([
        "./skills/engineering/to-spec",
        "./skills/productivity/wizard",
        "./skills/deprecated/tdd",
      ]),
    });

    expect(repo.commands.map(({ args }) => args)).toEqual([
      ["--yes", "skills@1.7.4", "remove", "-y", "tdd"],
      ["--yes", "skills@1.7.4", ...installArgs(["to-spec", "wizard"])],
    ]);
    expect(result).toEqual({
      status: 0,
      stdout:
        "Upstream moved:\n  tdd: removed\n  wizard: added\n" +
        `The install command of ${SETUP_DOC} was rewritten.\n` +
        "Left out: ./skills/deprecated/tdd, which upstream's plugin ships from outside its engineering and productivity folders.\n",
      stderr: "",
    });
    expect(await readFile(join(repo.root, SETUP_DOC), "utf8")).toBe(
      docText(["to-spec", "wizard"]),
    );
  });

  it("reports what moved and the variant to review", async () => {
    const repo = await repository({
      "to-spec": skill("new", "engineering/to-spec"),
      tdd: skill("t"),
    });
    const report = join(await tempDir("report"), "update.json");
    const result = await cli(
      ["--report", report, "--run-url", "https://run"],
      repo,
    );

    expect(result).toEqual({
      status: 0,
      stdout:
        "Upstream moved:\n  to-spec: updated\n" +
        "Skill variant to review: write-spec, built from to-spec at another version than the lock's.\n",
      stderr: "",
    });
    const written = JSON.parse(await readFile(report, "utf8")) as UpdateReport;
    expect(written.moved).toBe(true);
    expect(written.stale).toEqual([
      { folder: "write-spec", upstream: "to-spec" },
    ]);
    expect(written.pullRequest.body).toContain("https://run");
  });

  it("fails when the install fails", async () => {
    const repo = await repository();
    const result = await cli([], {
      root: repo.root,
      run: () => Promise.resolve(1),
    });
    expect(result).toEqual({
      status: 1,
      stdout: "",
      stderr: "npx skills@1.7.4 add exited with 1.\n",
    });
  });

  it("fails before any install when the plugin cannot be read", async () => {
    const repo = await repository();
    const result = await cli([], {
      ...repo,
      fetcher: () => Promise.resolve(new Response("{}")),
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toBe(`${PLUGIN_URL} has no skills list.\n`);
    expect(repo.commands).toEqual([]);
  });

  it("fails when the install locks a skill outside engineering and productivity", async () => {
    const repo = await repository({
      "to-spec": skill("old", "engineering/to-spec"),
      tdd: skill("t", "deprecated/tdd"),
    });
    const result = await cli([], repo);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "skills-lock.json names skills outside upstream's engineering and productivity folders after the install: tdd (skills/deprecated/tdd/SKILL.md).",
    );
  });

  it("fails before any install on a name the shell would read", async () => {
    const repo = await repository();
    const result = await cli([], {
      ...repo,
      fetcher: plugin(["./skills/engineering/tdd&calc"]),
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('ships "./skills/engineering/tdd&calc"');
    expect(repo.commands).toEqual([]);
  });

  it("rejects an unknown option", async () => {
    const repo = await repository();
    expect((await cli(["--dry-run"], repo)).status).toBe(2);
  });
});

describe("skills-update.yml", () => {
  it("runs weekly and by hand, one run at a time", async () => {
    const { workflow } = await readWorkflow("skills-update.yml");
    expect(Object.keys(workflow.on)).toEqual(["schedule", "workflow_dispatch"]);
    expect(workflow.concurrency).toEqual({
      group: "skills-update",
      "cancel-in-progress": false,
    });
    expect(Object.keys(workflow.jobs)).toEqual([
      "update",
      "pull-request",
      "template",
    ]);
  });

  it("installs without a token, and commits the update without running the checkout's code", async () => {
    const { workflow } = await readWorkflow("skills-update.yml");
    const { update, "pull-request": pullRequest } = workflow.jobs;
    expect(update?.environment).toBeUndefined();
    expect(JSON.stringify(update)).not.toContain("secrets.");
    expect(
      update?.steps?.some((step) =>
        step.run?.includes("pnpm --silent skills:update"),
      ),
    ).toBe(true);

    expect(pullRequest?.environment).toBe("app");
    for (const step of pullRequest?.steps ?? []) {
      expect(step.uses ?? "").not.toBe("./.github/actions/setup-workspace");
      expect(step.run ?? "").not.toContain("pnpm");
    }
  });

  // The patch comes from the job that ran code from npm: the job holding
  // the token checks what it touches before anything is committed.
  it("checks, where the token is, that the patch touches only the update's files", async () => {
    const { workflow } = await readWorkflow("skills-update.yml");
    const steps = workflow.jobs["pull-request"]?.steps ?? [];
    const apply = steps.findIndex((step) =>
      step.run?.includes("git apply --index"),
    );
    const push = steps.findIndex(
      (step) => step.run?.includes("push --force") ?? false,
    );
    expect(apply).toBeGreaterThan(-1);
    expect(apply).toBeLessThan(push);
    const guard = steps[apply]?.run ?? "";
    expect(guard.indexOf("git apply --index")).toBeLessThan(
      guard.indexOf("git diff --cached --raw --no-renames"),
    );
    expect(guard).toContain(
      'skills-lock.json | docs/agents/development-loop.md | ".changeset/skills-update-$GITHUB_RUN_ID.md") ;;',
    );
    expect(guard).toContain(".claude/skills/*/*)");
    expect(guard).toContain("exit 1");
    expect(steps[apply]?.env).toBeUndefined();
  });

  it("opens the Template's pull request with a token scoped to the Template", async () => {
    const { workflow } = await readWorkflow("skills-update.yml");
    const { template } = workflow.jobs;
    expect(template?.environment).toBe("app");
    const steps = template?.steps ?? [];
    const tokens = steps.filter(
      (step) => step.uses === "./.github/actions/app-token",
    );
    expect(tokens.map((step) => step.with)).toEqual([
      expect.objectContaining({
        repository: "${{ env.TEMPLATE }}",
        "permission-contents": "write",
        "permission-pull-requests": "write",
      }),
    ]);
    const checkouts = steps.filter((step) =>
      step.uses?.startsWith("actions/checkout@"),
    );
    expect(checkouts.map((step) => step.with?.repository)).toEqual([
      undefined,
      "${{ github.repository_owner }}/${{ env.TEMPLATE }}",
    ]);
  });
});

/**
 * Git Bash's bash on Windows, beside git (`bash` there may be WSL's); bash
 * elsewhere. Undefined when Git for Windows keeps none.
 */
function gitBash(): string | undefined {
  if (process.platform !== "win32") return "bash";
  const execPath = execFileSync("git", ["--exec-path"], {
    encoding: "utf8",
  }).trim();
  const bash = join(execPath, "..", "..", "..", "bin", "bash.exe");
  return existsSync(bash) ? bash : undefined;
}

// The step's own script, run against a repository holding a lock naming tdd,
// tdd's folder, the repository skill write-spec and a workflow, with what a
// patch could stage.
describe("the patch check of skills-update.yml", () => {
  const bash = gitBash();

  async function guard(
    stage: (git: (...args: string[]) => string, root: string) => Promise<void>,
  ) {
    const { workflow } = await readWorkflow("skills-update.yml");
    const step = workflow.jobs["pull-request"]?.steps?.find((each) =>
      each.run?.includes("git apply --index"),
    );
    const script = (step?.run ?? "")
      .split("\n")
      .filter((line) => !line.startsWith("git apply --index"))
      .join("\n");
    const root = await tempDir("patch-check");
    const git = (...args: string[]) =>
      execFileSync("git", ["-c", "core.autocrlf=false", ...args], {
        cwd: root,
        encoding: "utf8",
      });
    git("init", "-q");
    await writeText(root, "skills-lock.json", '{"skills":{"tdd":{}}}\n');
    await writeText(root, ".claude/skills/tdd/SKILL.md", "tdd\n");
    await writeText(root, ".claude/skills/write-spec/SKILL.md", "spec\n");
    await writeText(root, ".github/workflows/ci.yml", "name: ci\n");
    await writeText(root, "docs/agents/development-loop.md", "# Loop\n");
    git("add", "-A");
    git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-qm", "master");
    await stage(git, root);
    await writeText(root, "check.sh", script);
    const result = spawnSync(
      bash ?? "bash",
      ["--noprofile", "--norc", "-eo", "pipefail", "check.sh"],
      {
        cwd: root,
        encoding: "utf8",
        env: { ...process.env, GITHUB_RUN_ID: "42" },
      },
    );
    return { status: result.status, stdout: result.stdout };
  }

  it.skipIf(bash === undefined)("passes the update's own files", async () => {
    const result = await guard(async (git, root) => {
      await writeText(
        root,
        "skills-lock.json",
        '{"skills":{"tdd":{},"new":{}}}\n',
      );
      await writeText(root, ".claude/skills/tdd/SKILL.md", "tdd 2\n");
      await writeText(root, ".claude/skills/new/SKILL.md", "new\n");
      await writeText(root, ".changeset/skills-update-42.md", "---\n---\n");
      await writeText(root, "docs/agents/development-loop.md", "# Loop 2\n");
      git("add", "-A");
    });
    expect(result.status).toBe(0);
  });

  it.skipIf(bash === undefined)(
    "refuses a rename out of another path, which shows as its deletion",
    async () => {
      const result = await guard(async (git, root) => {
        await mkdir(join(root, ".claude/skills/evil"), { recursive: true });
        git("mv", ".github/workflows/ci.yml", ".claude/skills/evil/ci.yml");
        // git would show it as one rename, to the allowed path alone.
        expect(git("diff", "--cached", "--name-only", "-M")).toBe(
          ".claude/skills/evil/ci.yml\n",
        );
      });
      expect(result.status).toBe(1);
      expect(result.stdout).toContain(".github/workflows/ci.yml\n");
      expect(result.stdout).not.toContain("evil");
    },
  );

  it.skipIf(bash === undefined)(
    "refuses a repository skill, another changeset and any other file",
    async () => {
      const result = await guard(async (git, root) => {
        await writeText(root, ".claude/skills/write-spec/SKILL.md", "edited\n");
        await writeText(root, ".changeset/other.md", "---\n---\n");
        await writeText(root, "package.json", "{}\n");
        git("add", "-A");
      });
      expect(result.status).toBe(1);
      expect(result.stdout).toContain(".claude/skills/write-spec/SKILL.md\n");
      expect(result.stdout).toContain(".changeset/other.md\n");
      expect(result.stdout).toContain("package.json\n");
    },
  );

  it.skipIf(bash === undefined)(
    "refuses a folder that is a repository skill's on a case-insensitive file system",
    async () => {
      const paths = [
        ".claude/skills/Write-Spec/SKILL.md",
        ".claude/skills/write-spec./SKILL.md",
        ".claude/skills/write-spec /SKILL.md",
      ];
      const result = await guard((git) => {
        const blob = git("hash-object", "-w", "skills-lock.json").trim();
        for (const path of paths) {
          git(
            "-c",
            "core.protectNTFS=false",
            "update-index",
            "--add",
            "--cacheinfo",
            `100644,${blob},${path}`,
          );
        }
        return Promise.resolve();
      });
      expect(result.status).toBe(1);
      for (const path of paths) expect(result.stdout).toContain(`${path}\n`);
    },
  );

  it.skipIf(bash === undefined)(
    "refuses a symlink, a gitlink and a regular file turned into a symlink, on allowed paths",
    async () => {
      const result = await guard((git) => {
        const blob = git("hash-object", "-w", "skills-lock.json").trim();
        const commit = git("rev-parse", "HEAD").trim();
        git(
          "update-index",
          "--add",
          "--cacheinfo",
          `120000,${blob},.claude/skills/new/link`,
        );
        git(
          "update-index",
          "--add",
          "--cacheinfo",
          `160000,${commit},.claude/skills/new/module`,
        );
        git(
          "update-index",
          "--cacheinfo",
          `120000,${blob},.claude/skills/tdd/SKILL.md`,
        );
        return Promise.resolve();
      });
      expect(result.status).toBe(1);
      expect(result.stdout).toContain(".claude/skills/new/link (mode 120000)");
      expect(result.stdout).toContain(
        ".claude/skills/new/module (mode 160000)",
      );
      expect(result.stdout).toContain(
        ".claude/skills/tdd/SKILL.md (mode 120000)",
      );
    },
  );
});
