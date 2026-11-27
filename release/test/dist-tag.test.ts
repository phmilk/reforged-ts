import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main } from "../src/cli/dist-tag.js";
import { formatReleases, setDistTags } from "../src/dist-tag.js";
import {
  publishEntry,
  publishPlan as plan,
  writePackDir,
} from "./support/publish-plan.js";
import { tempDir, writeText, writeWorkspace } from "./support/workspace.js";

const ALPHA = "1.0.0-alpha.1";

const entry = (name: string, version = ALPHA, tag = "alpha") =>
  publishEntry(name, version, tag);

describe("setDistTags", () => {
  it("sets the dist-tag on every publish entry, whatever Changesets wrote", () => {
    const input = plan(
      [entry("reforged-types"), entry("reforged-test", ALPHA, "latest")],
      [entry("reforged-ts", ALPHA, "next")],
    );
    for (const tag of ["latest", "next"]) {
      const { plan: output, releases } = setDistTags(input, tag);
      expect(output).toEqual(
        plan(
          [
            entry("reforged-types", ALPHA, tag),
            entry("reforged-test", ALPHA, tag),
          ],
          [entry("reforged-ts", ALPHA, tag)],
        ),
      );
      expect(releases).toEqual([
        { name: "reforged-types", version: ALPHA, from: "alpha", tag },
        { name: "reforged-test", version: ALPHA, from: "latest", tag },
        { name: "reforged-ts", version: ALPHA, from: "next", tag },
      ]);
    }
    expect(input.plan[0]?.[0]).toEqual(entry("reforged-types"));
  });

  it("leaves tag-only entries alone", () => {
    const tagOnly = { kind: "tag-only", name: "private", version: "1.0.0" };
    const { plan: output, releases } = setDistTags(
      plan([tagOnly, entry("reforged-ts")]),
      "latest",
    );
    expect(output).toEqual(
      plan([tagOnly, entry("reforged-ts", ALPHA, "latest")]),
    );
    expect(releases.map(({ name }) => name)).toEqual(["reforged-ts"]);
  });

  it("refuses a plan that publishes a package at 0.0.0, naming it", () => {
    expect(() =>
      setDistTags(
        plan([entry("reforged-types", "0.0.0"), entry("reforged-ts")]),
        "latest",
      ),
    ).toThrow(
      "The publish plan holds unversioned packages: reforged-types@0.0.0. " +
        "A package at 0.0.0 is never published",
    );
  });
});

describe("formatReleases", () => {
  it("renders a Markdown table, or says the plan publishes nothing", () => {
    expect(
      formatReleases([
        { name: "reforged-ts", version: ALPHA, from: "alpha", tag: "latest" },
      ]),
    ).toBe(
      "| Package | Version | Dist-tag |\n| --- | --- | --- |\n" +
        `| reforged-ts | ${ALPHA} | \`latest\` |\n`,
    );
    expect(formatReleases([])).toBe("The publish plan publishes nothing.\n");
  });
});

describe("release:dist-tag", () => {
  /** A workspace in pre mode, its packages at `version`. */
  async function workspace(version = ALPHA) {
    const root = await writeWorkspace([
      {
        dir: "packages/reforged-ts",
        name: "reforged-ts",
        fields: { version },
      },
    ]);
    await writeText(
      root,
      ".changeset/pre.json",
      JSON.stringify({ mode: "pre", tag: "alpha" }),
    );
    return root;
  }

  async function runCli(
    args: string[],
    root: string,
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
      { cwd: await tempDir("cwd"), root, env },
    );
    return { status, stdout, stderr };
  }

  const readPlan = async (packDir: string): Promise<unknown> =>
    JSON.parse(await readFile(join(packDir, "publish-plan.json"), "utf8"));

  it("writes latest on master in pre mode, and the plan to the job summary", async () => {
    const packDir = await writePackDir(plan([entry("reforged-ts")]));
    const summaryDir = await tempDir("summary");
    const summary = join(summaryDir, "summary.md");
    await writeText(summaryDir, "summary.md", "# Earlier\n");

    expect(
      await runCli(
        ["--pack-dir", packDir, "--branch", "master"],
        await workspace(),
        { GITHUB_STEP_SUMMARY: summary },
      ),
    ).toEqual({
      status: 0,
      stdout: `reforged-ts@${ALPHA}: latest (Changesets wrote alpha)\n`,
      stderr: "",
    });
    expect(await readPlan(packDir)).toEqual(
      plan([entry("reforged-ts", ALPHA, "latest")]),
    );
    expect(await readFile(summary, "utf8")).toContain(
      `# Earlier\n## Publish plan\n\n| Package | Version | Dist-tag |`,
    );
  });

  it("writes next on next, whatever Changesets wrote", async () => {
    const beta = "2.0.0-beta.0";
    const packDir = await writePackDir(
      plan([entry("reforged-ts", beta, "beta")]),
    );
    expect(
      await runCli(
        ["--branch", "next", "--pack-dir", packDir],
        await workspace(beta),
      ),
    ).toEqual({
      status: 0,
      stdout: `reforged-ts@${beta}: next (Changesets wrote beta)\n`,
      stderr: "",
    });
    expect(await readPlan(packDir)).toEqual(
      plan([entry("reforged-ts", beta, "next")]),
    );
  });

  it("keeps a tag Changesets already wrote, and says nothing of it", async () => {
    const packDir = await writePackDir(
      plan([entry("reforged-ts", "1.0.0", "latest")]),
    );
    expect(
      await runCli(
        ["--pack-dir", packDir, "--branch", "master"],
        await workspace("1.0.0"),
      ),
    ).toEqual({ status: 0, stdout: "reforged-ts@1.0.0: latest\n", stderr: "" });
  });

  it("exits 1 on a branch with no channel, leaving the plan as it was", async () => {
    const input = plan([entry("reforged-ts")]);
    const packDir = await writePackDir(input);
    expect(
      await runCli(
        ["--pack-dir", packDir, "--branch", "feature/1063"],
        await workspace(),
      ),
    ).toEqual({
      status: 1,
      stdout: "",
      stderr: expect.stringContaining(
        'A release runs from master or next, and "feature/1063" is neither',
      ) as unknown,
    });
    expect(await readPlan(packDir)).toEqual(input);
  });

  it("exits 1 on a missing plan and 2 on bad arguments", async () => {
    const root = await workspace();
    expect(
      await runCli(
        ["--pack-dir", await tempDir("empty"), "--branch", "master"],
        root,
      ),
    ).toMatchObject({
      status: 1,
      stderr: expect.stringContaining(
        "Cannot read the publish plan",
      ) as unknown,
    });
    const usage = "Usage: release:dist-tag --pack-dir <dir> --branch <name>\n";
    for (const args of [
      [],
      ["--pack-dir", "pack"],
      ["--branch", "master"],
      ["--pack-dir", "pack", "--branch"],
      ["--pack-dir", "pack", "--branch", "master", "--tag", "next"],
    ]) {
      expect(await runCli(args, root)).toMatchObject({
        status: 2,
        stderr: usage,
      });
    }
  });
});
