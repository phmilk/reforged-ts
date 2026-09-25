import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main } from "../src/cli/dist-tag.js";
import { formatReleases, NEXT_TAG, setDistTags } from "../src/dist-tag.js";
import { tempDir, writeText, writeWorkspace } from "./support/workspace.js";

const ALPHA = "1.0.0-alpha.1";

function entry(name: string, version = ALPHA, tag = "alpha") {
  return {
    kind: "publish",
    name,
    version,
    access: "public",
    tag,
    tarball: {
      path: `packages/${name}-${version}.tgz`,
      integrity: "sha256-AAAA",
    },
  };
}

/** A plan as `changeset pack` writes it, in dependency-ordered chunks. */
function plan(...chunks: unknown[][]) {
  return { version: 1, plan: chunks };
}

describe("setDistTags", () => {
  it("sets next on every publish entry in pre mode, whatever Changesets wrote", () => {
    const input = plan(
      [entry("reforged-types"), entry("reforged-test", ALPHA, "latest")],
      [entry("reforged-ts")],
    );
    const { plan: output, releases } = setDistTags(input, "pre");
    expect(output).toEqual(
      plan(
        [
          entry("reforged-types", ALPHA, NEXT_TAG),
          entry("reforged-test", ALPHA, NEXT_TAG),
        ],
        [entry("reforged-ts", ALPHA, NEXT_TAG)],
      ),
    );
    expect(releases).toEqual([
      { name: "reforged-types", version: ALPHA, from: "alpha", tag: "next" },
      { name: "reforged-test", version: ALPHA, from: "latest", tag: "next" },
      { name: "reforged-ts", version: ALPHA, from: "alpha", tag: "next" },
    ]);
    expect(input.plan[0]?.[0]).toEqual(entry("reforged-types"));
  });

  it("leaves the tags Changesets wrote outside pre mode", () => {
    const input = plan([entry("reforged-ts", "1.0.0", "latest")]);
    for (const mode of ["none", "exit"] as const) {
      expect(setDistTags(input, mode)).toEqual({
        plan: input,
        releases: [
          {
            name: "reforged-ts",
            version: "1.0.0",
            from: "latest",
            tag: "latest",
          },
        ],
      });
    }
  });

  it("leaves tag-only entries alone", () => {
    const tagOnly = { kind: "tag-only", name: "private", version: "1.0.0" };
    const { plan: output, releases } = setDistTags(
      plan([tagOnly, entry("reforged-ts")]),
      "pre",
    );
    expect(output).toEqual(
      plan([tagOnly, entry("reforged-ts", ALPHA, "next")]),
    );
    expect(releases.map(({ name }) => name)).toEqual(["reforged-ts"]);
  });

  it("refuses a plan that publishes a package at 0.0.0, naming it", () => {
    expect(() =>
      setDistTags(
        plan([entry("reforged-types", "0.0.0"), entry("reforged-ts")]),
        "pre",
      ),
    ).toThrow(
      "The publish plan holds unversioned packages: reforged-types@0.0.0. " +
        "A package at 0.0.0 is never published",
    );
  });

  it("refuses what is not a Changesets 3 plan", () => {
    expect(() => setDistTags({ version: 2, plan: [] }, "pre")).toThrow(
      "not a version 1 Changesets plan",
    );
    expect(() => setDistTags(plan([{ kind: "publish" }]), "pre")).toThrow(
      "neither a publish nor a tag-only one",
    );
  });
});

describe("formatReleases", () => {
  it("renders a Markdown table, or says the plan publishes nothing", () => {
    expect(
      formatReleases([
        { name: "reforged-ts", version: ALPHA, from: "alpha", tag: "next" },
      ]),
    ).toBe(
      "| Package | Version | Dist-tag |\n| --- | --- | --- |\n" +
        `| reforged-ts | ${ALPHA} | \`next\` |\n`,
    );
    expect(formatReleases([])).toBe("The publish plan publishes nothing.\n");
  });
});

describe("release:dist-tag", () => {
  async function workspace(preMode: "pre" | "none") {
    const root = await writeWorkspace();
    if (preMode === "pre") {
      await writeText(
        root,
        ".changeset/pre.json",
        JSON.stringify({ mode: "pre", tag: "alpha" }),
      );
    }
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

  it("rewrites the plan file in pre mode and writes the plan to the job summary", async () => {
    const packDir = await tempDir("pack");
    await writeText(
      packDir,
      "publish-plan.json",
      JSON.stringify(plan([entry("reforged-ts")])),
    );
    const summaryDir = await tempDir("summary");
    const summary = join(summaryDir, "summary.md");
    await writeText(summaryDir, "summary.md", "# Earlier\n");

    expect(
      await runCli(["--pack-dir", packDir], await workspace("pre"), {
        GITHUB_STEP_SUMMARY: summary,
      }),
    ).toEqual({
      status: 0,
      stdout: `reforged-ts@${ALPHA}: next (Changesets wrote alpha)\n`,
      stderr: "",
    });
    expect(
      JSON.parse(await readFile(join(packDir, "publish-plan.json"), "utf8")),
    ).toEqual(plan([entry("reforged-ts", ALPHA, "next")]));
    expect(await readFile(summary, "utf8")).toContain(
      `# Earlier\n## Publish plan\n\n| Package | Version | Dist-tag |`,
    );
  });

  it("keeps the tags outside pre mode", async () => {
    const packDir = await tempDir("pack");
    await writeText(
      packDir,
      "publish-plan.json",
      JSON.stringify(plan([entry("reforged-ts", "1.0.0", "latest")])),
    );
    expect(
      await runCli(["--pack-dir", packDir], await workspace("none")),
    ).toEqual({ status: 0, stdout: "reforged-ts@1.0.0: latest\n", stderr: "" });
  });

  it("exits 1 on a missing plan and 2 on bad arguments", async () => {
    const root = await workspace("pre");
    expect(
      await runCli(["--pack-dir", await tempDir("empty")], root),
    ).toMatchObject({
      status: 1,
      stderr: expect.stringContaining(
        "Cannot read the publish plan",
      ) as unknown,
    });
    expect(await runCli([], root)).toMatchObject({
      status: 2,
      stderr: "Usage: release:dist-tag --pack-dir <dir>\n",
    });
  });
});
