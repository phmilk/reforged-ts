import { describe, expect, it } from "vitest";
import { main } from "../src/cli/check-changeset.js";
import type { Git } from "../src/git.js";
import {
  changesetText,
  commitAll,
  initRepository,
  writeText,
  writeWorkspace,
} from "./support/workspace.js";

/** A fixture repository on its `feature` branch, one commit past `master`. */
async function repository() {
  const root = await writeWorkspace();
  const git = await initRepository(root);
  return { root, git };
}

async function runCli(
  repo: { root: string; git: Git },
  args: string[] = [],
  env: Record<string, string> = {},
) {
  let stdout = "";
  let stderr = "";
  const status = await main(
    args,
    {
      stdout: (text) => (stdout += text),
      stderr: (text) => (stderr += text),
    },
    { ...repo, env },
  );
  return { status, stdout, stderr };
}

const HINT =
  "Add a changeset under .changeset/ naming each package with its bump, " +
  "or an empty changeset when the change publishes nothing.\n";

describe("release:check-changeset", () => {
  it("fails with one line per package changed without a changeset", async () => {
    const repo = await repository();
    await writeText(repo.root, "packages/reforged-ts/src/unit.ts", "");
    await writeText(repo.root, "packages/reforged-types/README.md", "");
    await commitAll(repo.git, "change two packages");

    expect(await runCli(repo)).toEqual({
      status: 1,
      stdout: "",
      stderr:
        "Missing changeset: reforged-ts (packages/reforged-ts) changed since master and no changeset added names it.\n" +
        "Missing changeset: reforged-types (packages/reforged-types) changed since master and no changeset added names it.\n" +
        HINT,
    });
  });

  it("passes when the pull request adds a changeset naming the package", async () => {
    const repo = await repository();
    await writeText(repo.root, "packages/reforged-ts/src/unit.ts", "");
    await writeText(
      repo.root,
      ".changeset/brave-lions.md",
      changesetText({ "reforged-ts": "minor" }),
    );
    await commitAll(repo.git, "change with a changeset");

    expect(await runCli(repo)).toEqual({
      status: 0,
      stdout:
        "Every changed publishable package has a changeset: reforged-ts.\n",
      stderr: "",
    });
  });

  it("passes on an empty changeset", async () => {
    const repo = await repository();
    await writeText(repo.root, "packages/reforged-ts/test/unit.test.ts", "");
    await writeText(repo.root, ".changeset/quiet-owls.md", changesetText());
    await commitAll(repo.git, "test only");

    expect((await runCli(repo)).status).toBe(0);
  });

  it("passes when only files outside the publishable packages changed", async () => {
    const repo = await repository();
    await writeText(repo.root, "README.md", "# Workspace\n");
    await writeText(repo.root, "release/src/index.ts", "export {};\n");
    await commitAll(repo.git, "outside");

    expect(await runCli(repo)).toEqual({
      status: 0,
      stdout: "No publishable package changed since master.\n",
      stderr: "",
    });
  });

  it("does not count a changeset the base already has", async () => {
    const root = await writeWorkspace();
    await writeText(
      root,
      ".changeset/old.md",
      changesetText({ "reforged-ts": "patch" }),
    );
    const git = await initRepository(root);
    await writeText(root, "packages/reforged-ts/src/unit.ts", "");
    await commitAll(git, "change");

    expect((await runCli({ root, git })).status).toBe(1);
  });

  it("compares with the merge base, not with where master is now", async () => {
    const repo = await repository();
    await repo.git(["checkout", "--quiet", "master"]);
    await writeText(repo.root, "packages/reforged-types/src/patch.ts", "");
    await commitAll(repo.git, "master moves on");
    await repo.git(["checkout", "--quiet", "feature"]);
    await writeText(repo.root, "docs/guide.md", "");
    await commitAll(repo.git, "docs");

    expect((await runCli(repo)).status).toBe(0);
  });

  it("takes the base from --base, else from RELEASE_BASE_REF", async () => {
    const repo = await repository();
    await writeText(repo.root, "packages/reforged-ts/src/unit.ts", "");
    await commitAll(repo.git, "change");

    const fromEnv = await runCli(repo, [], { RELEASE_BASE_REF: "HEAD" });
    expect(fromEnv.stdout).toBe("No publishable package changed since HEAD.\n");
    const fromFlag = await runCli(repo, ["--base", "HEAD"]);
    expect(fromFlag.stdout).toBe(
      "No publishable package changed since HEAD.\n",
    );
    const both = await runCli(repo, ["--base", "master"], {
      RELEASE_BASE_REF: "HEAD",
    });
    expect(both.status).toBe(1);
  });

  it("falls back to origin/master when there is no local master", async () => {
    const repo = await repository();
    await repo.git(["update-ref", "refs/remotes/origin/master", "master"]);
    await repo.git(["branch", "--quiet", "-D", "master"]);
    await writeText(repo.root, "packages/reforged-ts/src/unit.ts", "");
    await commitAll(repo.git, "change");

    const { status, stderr } = await runCli(repo);
    expect(status).toBe(1);
    expect(stderr).toContain("changed since origin/master");
  });

  it("fails when no base can be found", async () => {
    const repo = await repository();
    await repo.git(["branch", "--quiet", "-D", "master"]);

    expect(await runCli(repo)).toEqual({
      status: 1,
      stdout: "",
      stderr: "Neither master nor origin/master exists; name the base ref.\n",
    });
  });

  it("fails naming a changeset Changesets rejects", async () => {
    const repo = await repository();
    await writeText(repo.root, ".changeset/bad.md", "No frontmatter.\n");
    await commitAll(repo.git, "bad changeset");

    const { status, stderr } = await runCli(repo);
    expect(status).toBe(1);
    expect(stderr).toMatch(/^\.changeset\/bad\.md: could not parse changeset/);
  });

  it("prints its usage and exits 2 on an unknown argument", async () => {
    const repo = await repository();

    expect(await runCli(repo, ["--bogus"])).toEqual({
      status: 2,
      stdout: "",
      stderr: "Usage: release:check-changeset [--base <ref>]\n",
    });
    expect((await runCli(repo, ["--base"])).status).toBe(2);
  });
});
