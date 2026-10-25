import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main, type CopyReport } from "../src/cli/shared-copy.js";
import {
  COPY_RECORD,
  copyPullRequest,
  formatRecord,
  libraryFiles,
  readCopyRecord,
  refreshCopy,
  sharedFiles,
  type CopyRecord,
} from "../src/shared-copy.js";
import { repositoryRoot } from "../src/workspace.js";
import { tempDir, writeText } from "./support/workspace.js";

const OLD = "1".repeat(40);
const NEW = "2".repeat(40);
const COMMENT = "The record of origin of the copy; never edit a copied file.";

const sha256 = (text: string) =>
  createHash("sha256").update(text).digest("hex");

/** A library with one Upstream skill, one shared repository skill and a hook. */
async function library(): Promise<string> {
  const root = await tempDir("library");
  await writeText(
    root,
    ".claude/shared.json",
    JSON.stringify({
      lock: "skills-lock.json",
      skills: ["write-spec"],
      files: [".claude/hooks/hook.mjs"],
    }),
  );
  await writeText(
    root,
    "skills-lock.json",
    JSON.stringify({ version: 1, skills: { tdd: {} } }),
  );
  await writeText(root, ".claude/skills/tdd/SKILL.md", "tdd\n");
  await writeText(root, ".claude/skills/tdd/Z.md", "Z\n");
  await writeText(root, ".claude/skills/tdd/agents/openai.yaml", "a: 1\n");
  await writeText(root, ".claude/skills/write-spec/SKILL.md", "spec\n");
  await writeText(root, ".claude/skills/add-wrapper/SKILL.md", "not shared\n");
  await writeText(root, ".claude/hooks/hook.mjs", "hook\n");
  return root;
}

/** A Template whose copy is `library`'s, recorded at `OLD`. */
async function template(libraryRoot: string): Promise<string> {
  const root = await tempDir("template");
  const files = await libraryFiles(libraryRoot);
  for (const path of Object.keys(files)) {
    await writeText(
      root,
      path,
      await readFile(join(libraryRoot, path), "utf8"),
    );
  }
  await writeText(root, ".claude/skills/map-feature/SKILL.md", "seed\n");
  const record: CopyRecord = {
    $comment: COMMENT,
    repository: "phmilk/reforged-ts",
    commit: OLD,
    files,
  };
  await writeText(root, COPY_RECORD, formatRecord(record));
  return root;
}

describe("sharedFiles", () => {
  it("lists the lock, the files of each skill it names and of each shared skill, and the other files, in code-point order", async () => {
    expect(await sharedFiles(await library())).toEqual([
      ".claude/hooks/hook.mjs",
      ".claude/skills/tdd/SKILL.md",
      ".claude/skills/tdd/Z.md",
      ".claude/skills/tdd/agents/openai.yaml",
      ".claude/skills/write-spec/SKILL.md",
      "skills-lock.json",
    ]);
  });

  it("lists, in this repository, the lock, every Upstream skill, write-spec, the hook and its registration", async () => {
    const files = await sharedFiles(repositoryRoot);
    const lock = JSON.parse(
      await readFile(join(repositoryRoot, "skills-lock.json"), "utf8"),
    ) as { skills: Record<string, unknown> };
    expect(files).toEqual(
      expect.arrayContaining([
        "skills-lock.json",
        ".claude/hooks/shadowed-skills.mjs",
        ".claude/settings.json",
        ".claude/skills/write-spec/SKILL.md",
        ...Object.keys(lock.skills).map(
          (name) => `.claude/skills/${name}/SKILL.md`,
        ),
      ]),
    );
    expect(files.some((path) => path.includes("/add-wrapper/"))).toBe(false);
  });
});

describe("refreshCopy", () => {
  it("writes nothing when the copy is the library's, whatever commit the record names", async () => {
    const lib = await library();
    const tpl = await template(lib);
    const before = await readFile(join(tpl, COPY_RECORD), "utf8");

    const { difference, record } = await refreshCopy(lib, tpl, NEW);

    expect(difference).toEqual({ added: [], removed: [], modified: [] });
    expect(record).toBeUndefined();
    expect(await readFile(join(tpl, COPY_RECORD), "utf8")).toBe(before);
  });

  it("replaces the copy and rewrites the record's commit and files, keeping its $comment", async () => {
    const lib = await library();
    const tpl = await template(lib);
    await writeText(lib, ".claude/skills/tdd/SKILL.md", "tdd, updated\n");
    await writeText(lib, ".claude/skills/tdd/NEW.md", "new\n");
    await rm(join(lib, ".claude/skills/tdd/agents/openai.yaml"));

    const { difference } = await refreshCopy(lib, tpl, NEW);

    expect(difference).toEqual({
      added: [".claude/skills/tdd/NEW.md"],
      removed: [".claude/skills/tdd/agents/openai.yaml"],
      modified: [".claude/skills/tdd/SKILL.md"],
    });
    expect(
      await readFile(join(tpl, ".claude/skills/tdd/SKILL.md"), "utf8"),
    ).toBe("tdd, updated\n");
    expect(await readFile(join(tpl, ".claude/skills/tdd/NEW.md"), "utf8")).toBe(
      "new\n",
    );
    // The folder the removed file leaves empty goes too; the Seeds stay.
    expect(existsSync(join(tpl, ".claude/skills/tdd/agents"))).toBe(false);
    expect(existsSync(join(tpl, ".claude/skills/map-feature/SKILL.md"))).toBe(
      true,
    );
    const text = await readFile(join(tpl, COPY_RECORD), "utf8");
    expect(text).toBe(
      formatRecord({
        $comment: COMMENT,
        repository: "phmilk/reforged-ts",
        commit: NEW,
        files: await libraryFiles(lib),
      }),
    );
    expect(Object.keys((await readCopyRecord(tpl)).files)).toEqual(
      await sharedFiles(lib),
    );
    expect((await readCopyRecord(tpl)).files[".claude/skills/tdd/NEW.md"]).toBe(
      sha256("new\n"),
    );
  });

  it("restores a copied file edited in the Template", async () => {
    const lib = await library();
    const tpl = await template(lib);
    await writeText(tpl, ".claude/hooks/hook.mjs", "edited here\n");

    const { difference } = await refreshCopy(lib, tpl, NEW);

    expect(difference.modified).toEqual([".claude/hooks/hook.mjs"]);
    expect(await readFile(join(tpl, ".claude/hooks/hook.mjs"), "utf8")).toBe(
      "hook\n",
    );
  });

  it("refuses a commit that is not a full hash, and a Template without a record", async () => {
    const lib = await library();
    await expect(refreshCopy(lib, await template(lib), "abc")).rejects.toThrow(
      "abc is not a full commit hash of the library.",
    );
    await expect(refreshCopy(lib, await tempDir("bare"), NEW)).rejects.toThrow(
      `The Template has no record of its copy at ${COPY_RECORD}`,
    );
  });

  it("refuses a list naming a file that does not exist", async () => {
    const lib = await library();
    const tpl = await template(lib);
    await rm(join(lib, ".claude/hooks/hook.mjs"));
    await expect(refreshCopy(lib, tpl, NEW)).rejects.toThrow(
      "names files that do not exist: .claude/hooks/hook.mjs.",
    );
  });
});

describe("copyPullRequest", () => {
  it("names the library commit and lists each kind of change", () => {
    const { title, body } = copyPullRequest(
      { added: ["a.md"], removed: [], modified: ["b.md", "c.md"] },
      NEW,
      "https://run",
    );
    expect(title).toBe(
      "chore(skills): the copy of what the library shares, from phmilk/reforged-ts@22222222",
    );
    expect(body).toContain(
      `[phmilk/reforged-ts@22222222](https://github.com/phmilk/reforged-ts/commit/${NEW})`,
    );
    expect(body).toContain("<summary>Added (1)</summary>\n\n- `a.md`");
    expect(body).toContain("<summary>Modified (2)</summary>");
    expect(body).not.toContain("Removed");
    expect(body).toContain("https://run");
  });
});

describe("skills:copy", () => {
  async function run(args: string[], root: string) {
    let stdout = "";
    let stderr = "";
    const status = await main(
      args,
      {
        stdout: (text) => (stdout += text),
        stderr: (text) => (stderr += text),
      },
      root,
    );
    return { status, stdout, stderr };
  }

  it("needs the Template and the commit", async () => {
    expect((await run(["--template", "t"], await library())).status).toBe(2);
  });

  it("reports nothing to open when the copy is the library's", async () => {
    const lib = await library();
    const tpl = await template(lib);
    const report = join(await tempDir("report"), "copy.json");

    const result = await run(
      ["--template", tpl, "--commit", NEW, "--report", report],
      lib,
    );

    expect(result).toEqual({
      status: 0,
      stdout: "The copy is the library's already: nothing written.\n",
      stderr: "",
    });
    const written = JSON.parse(await readFile(report, "utf8")) as CopyReport;
    expect(written.changed).toBe(false);
  });

  it("reports the refresh and the pull request to open", async () => {
    const lib = await library();
    const tpl = await template(lib);
    await writeText(lib, ".claude/skills/write-spec/SKILL.md", "spec 2\n");
    const report = join(await tempDir("report"), "copy.json");

    const result = await run(
      ["--template", tpl, "--commit", NEW, "--report", report],
      lib,
    );

    expect(result.stdout).toBe(
      "The copy was refreshed: 0 added, 1 modified, 0 removed.\n",
    );
    const written = JSON.parse(await readFile(report, "utf8")) as CopyReport;
    expect(written.changed).toBe(true);
    expect(written.pullRequest.title).toContain("@22222222");
  });

  it("fails naming what it cannot read", async () => {
    const lib = await library();
    const result = await run(
      ["--template", await tempDir("bare"), "--commit", NEW],
      lib,
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("has no record of its copy");
  });
});
