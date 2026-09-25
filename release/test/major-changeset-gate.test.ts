import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main } from "../src/cli/major-changeset-gate.js";
import {
  formatGate,
  majorChangesetGate,
  migrationPagePath,
} from "../src/major-changeset-gate.js";
import {
  changesetText,
  PACKAGES,
  tempDir,
  writeText,
  writeWorkspace,
} from "./support/workspace.js";

const FIRST = { from: "w3ts@3", to: "reforged-ts@1" };
const SECOND = { from: "reforged-ts@1", to: "reforged-ts@2" };
const RENAMES = "packages/reforged-ts/migration/renames.json";

interface Fixture {
  /** The version of reforged-ts. */
  version: string;
  /** Pending changesets, by file name. */
  pending?: Record<string, Record<string, string>>;
  /** Changesets of the pre folder, by file name. */
  pre?: Record<string, Record<string, string>>;
  /** The mode of `.changeset/pre.json`; no file when undefined. */
  preMode?: "pre" | "exit";
  /** Pages of the migration section, root-relative. */
  pages?: string[];
  /** The rename map's items; no file when undefined. */
  renames?: unknown[];
}

async function workspace(fixture: Fixture): Promise<string> {
  const root = await writeWorkspace(
    PACKAGES.map((pkg) =>
      pkg.name === "reforged-ts"
        ? { ...pkg, fields: { version: fixture.version } }
        : pkg,
    ),
  );
  for (const [name, releases] of Object.entries(fixture.pending ?? {})) {
    await writeText(root, `.changeset/${name}`, changesetText(releases));
  }
  for (const [name, releases] of Object.entries(fixture.pre ?? {})) {
    await writeText(root, `.changeset/pre/${name}`, changesetText(releases));
  }
  await writeText(root, ".changeset/README.md", "Not a changeset.\n");
  if (fixture.preMode !== undefined) {
    await writeText(
      root,
      ".changeset/pre.json",
      JSON.stringify({ mode: fixture.preMode, tag: "alpha" }),
    );
  }
  for (const page of fixture.pages ?? []) {
    await writeText(root, page, "# Migrating\n");
  }
  if (fixture.renames !== undefined) {
    await writeText(root, RENAMES, JSON.stringify(fixture.renames));
  }
  return root;
}

function entry(versions: { from: string; to: string }) {
  return {
    old: "Unit.owner",
    new: ["Unit.getOwner", "Unit.setOwner"],
    kind: "accessor",
    versions,
    oneToOne: false,
    note: "A get/set pair.",
  };
}

function marker(versions: { from: string; to: string }) {
  return { kind: "noRenames", versions, note: "Renames nothing." };
}

async function runCli(root: string, env: Record<string, string> = {}) {
  let stdout = "";
  let stderr = "";
  const status = await main(
    [],
    {
      stdout: (text) => (stdout += text),
      stderr: (text) => (stderr += text),
    },
    { root, env },
  );
  return { status, stdout, stderr };
}

describe("the migration page of a version pair", () => {
  it("is under the migration section, named after both sides", () => {
    expect(migrationPagePath(FIRST)).toBe(
      "website/docs/migration/w3ts-3-to-reforged-ts-1.md",
    );
    expect(migrationPagePath(SECOND)).toBe(
      "website/docs/migration/reforged-ts-1-to-reforged-ts-2.md",
    );
  });
});

describe("the major-changeset gate", () => {
  it("requires nothing for a minor", async () => {
    const root = await workspace({
      version: "1.2.0",
      pending: { "feature.md": { "reforged-ts": "minor" } },
      renames: [],
    });
    expect(await majorChangesetGate(root)).toEqual({
      verdict: "pass",
      requirement: undefined,
      missing: [],
      preMode: "none",
    });
  });

  it("requires nothing for a major of another package", async () => {
    const root = await workspace({
      version: "1.2.0",
      pending: { "types.md": { "reforged-types": "major" } },
    });
    expect(await majorChangesetGate(root)).toMatchObject({
      verdict: "pass",
      requirement: undefined,
    });
  });

  it("passes a major with its migration page and renames", async () => {
    const root = await workspace({
      version: "1.2.0",
      pending: {
        "remove.md": { "reforged-ts": "major" },
        "feature.md": { "reforged-ts": "minor" },
      },
      pages: [migrationPagePath(SECOND)],
      renames: [entry(FIRST), entry(SECOND)],
    });
    expect(await majorChangesetGate(root)).toEqual({
      verdict: "pass",
      requirement: {
        pair: SECOND,
        reason: { kind: "major", changesets: [".changeset/remove.md"] },
        page: "website/docs/migration/reforged-ts-1-to-reforged-ts-2.md",
      },
      missing: [],
      preMode: "none",
    });
  });

  it("accepts the page written as MDX", async () => {
    const root = await workspace({
      version: "1.2.0",
      pending: { "remove.md": { "reforged-ts": "major" } },
      pages: [`${migrationPagePath(SECOND)}x`],
      renames: [entry(SECOND)],
    });
    expect(await majorChangesetGate(root)).toMatchObject({ verdict: "pass" });
  });

  it("fails a major missing its page, naming the path and the pair", async () => {
    const root = await workspace({
      version: "1.2.0",
      pending: { "remove.md": { "reforged-ts": "major" } },
      pages: [migrationPagePath(FIRST)],
      renames: [entry(SECOND)],
    });
    const result = await majorChangesetGate(root);
    expect(result).toMatchObject({
      verdict: "fail",
      missing: [
        {
          kind: "page",
          path: "website/docs/migration/reforged-ts-1-to-reforged-ts-2.md",
        },
      ],
    });
    expect(formatGate(result)).toBe(
      "A major of reforged-ts is pending (`.changeset/remove.md`): version pair reforged-ts@1 to reforged-ts@2.\n" +
        "\n" +
        "- [ ] Missing migration page for reforged-ts@1 to reforged-ts@2: `website/docs/migration/reforged-ts-1-to-reforged-ts-2.md`.\n" +
        "\n" +
        'The next version of reforged-ts is stable, so this blocks the release. See "The major-changeset gate" in docs/release.md.\n',
    );
  });

  it("fails a major missing its renames, naming the pair", async () => {
    const root = await workspace({
      version: "1.2.0",
      pending: { "remove.md": { "reforged-ts": "major" } },
      pages: [migrationPagePath(SECOND)],
      renames: [entry(FIRST)],
    });
    const result = await majorChangesetGate(root);
    expect(result).toMatchObject({
      verdict: "fail",
      missing: [{ kind: "renames", file: RENAMES }],
    });
    expect(formatGate(result)).toContain(
      "- [ ] Missing renames for reforged-ts@1 to reforged-ts@2: `packages/reforged-ts/migration/renames.json` has no entry with `versions` `reforged-ts@1` to `reforged-ts@2` and no no-renames marker",
    );
  });

  it("fails a major when the rename map does not exist", async () => {
    const root = await workspace({
      version: "1.2.0",
      pending: { "remove.md": { "reforged-ts": "major" } },
      pages: [migrationPagePath(SECOND)],
    });
    expect(await majorChangesetGate(root)).toMatchObject({
      verdict: "fail",
      missing: [{ kind: "renames", file: RENAMES }],
    });
  });

  it("passes a major whose pair has the no-renames marker", async () => {
    const root = await workspace({
      version: "1.2.0",
      pending: { "remove.md": { "reforged-ts": "major" } },
      pages: [migrationPagePath(SECOND)],
      renames: [entry(FIRST), marker(SECOND)],
    });
    expect(await majorChangesetGate(root)).toMatchObject({
      verdict: "pass",
      missing: [],
    });
  });

  describe("the first stable version", () => {
    it("requires the w3ts 3.x to reforged-ts 1.0 page without any major", async () => {
      const root = await workspace({
        version: "1.0.0-alpha.3",
        pending: { "feature.md": { "reforged-ts": "minor" } },
        preMode: "exit",
        renames: [entry(FIRST)],
      });
      const result = await majorChangesetGate(root);
      expect(result).toEqual({
        verdict: "fail",
        requirement: {
          pair: FIRST,
          reason: { kind: "first-stable" },
          page: "website/docs/migration/w3ts-3-to-reforged-ts-1.md",
        },
        missing: [
          {
            kind: "page",
            path: "website/docs/migration/w3ts-3-to-reforged-ts-1.md",
          },
        ],
        preMode: "exit",
      });
      expect(formatGate(result)).toMatch(
        /^The next stable version of reforged-ts is its first \(1\.0\.0\), a major relative to w3ts@3: version pair w3ts@3 to reforged-ts@1\.\n/,
      );
    });

    it("requires it from 0.0.0 with a major", async () => {
      const root = await workspace({
        version: "0.0.0",
        pending: { "first-release.md": { "reforged-ts": "major" } },
      });
      expect(await majorChangesetGate(root)).toMatchObject({
        verdict: "fail",
        requirement: { pair: FIRST, reason: { kind: "first-stable" } },
        missing: [{ kind: "page" }, { kind: "renames" }],
      });
    });

    it("passes with the page and the renames", async () => {
      const root = await workspace({
        version: "0.0.0",
        pending: { "first-release.md": { "reforged-ts": "major" } },
        pages: [migrationPagePath(FIRST)],
        renames: [entry(FIRST)],
      });
      expect(await majorChangesetGate(root)).toMatchObject({
        verdict: "pass",
        requirement: { pair: FIRST },
      });
    });

    it("requires nothing while nothing releases the library", async () => {
      const root = await workspace({
        version: "0.0.0",
        pending: { "types.md": { "reforged-types": "minor" } },
      });
      expect(await majorChangesetGate(root)).toMatchObject({
        verdict: "pass",
        requirement: undefined,
      });
    });
  });

  it("reads the changesets of the pre folder", async () => {
    // 2.0.0-beta.0: the major was versioned into a prerelease and waits in
    // the pre folder; pre mode is exited, so the next version is 2.0.0.
    const root = await workspace({
      version: "2.0.0-beta.0",
      pre: { "remove.md": { "reforged-ts": "major" } },
      preMode: "exit",
      renames: [entry(SECOND)],
    });
    const result = await majorChangesetGate(root);
    expect(result).toMatchObject({
      verdict: "fail",
      requirement: {
        pair: SECOND,
        reason: { kind: "major", changesets: [".changeset/pre/remove.md"] },
      },
      missing: [
        {
          kind: "page",
          path: "website/docs/migration/reforged-ts-1-to-reforged-ts-2.md",
        },
      ],
    });
  });

  it("names the pair after the major a pending major gives a prerelease", async () => {
    // 2.1.0-beta.0 plus a major is 3.0.0.
    const root = await workspace({
      version: "2.1.0-beta.0",
      pending: { "remove.md": { "reforged-ts": "major" } },
      preMode: "pre",
    });
    expect(await majorChangesetGate(root)).toMatchObject({
      verdict: "report",
      requirement: { pair: { from: "reforged-ts@2", to: "reforged-ts@3" } },
    });
  });

  it("fails on a changeset it cannot parse", async () => {
    const root = await workspace({ version: "1.2.0" });
    await writeText(root, ".changeset/broken.md", "---\nnot: [yaml\n---\n");
    await expect(majorChangesetGate(root)).rejects.toThrow(
      /\.changeset[\\/]broken\.md/,
    );
  });
});

describe("release:gate", () => {
  const missingBoth = {
    version: "1.0.0-alpha.0",
    pending: { "feature.md": { "reforged-ts": "minor" } },
    pre: { "first-release.md": { "reforged-ts": "major" } },
  } satisfies Fixture;

  it("reports what is missing and exits zero while pre mode is active", async () => {
    const root = await workspace({ ...missingBoth, preMode: "pre" });
    const { status, stdout, stderr } = await runCli(root);
    expect({ status, stderr }).toEqual({ status: 0, stderr: "" });
    expect(stdout).toContain(
      "- [ ] Missing migration page for w3ts@3 to reforged-ts@1: `website/docs/migration/w3ts-3-to-reforged-ts-1.md`.\n",
    );
    expect(stdout).toContain(
      "- [ ] Missing renames for w3ts@3 to reforged-ts@1: `packages/reforged-ts/migration/renames.json`",
    );
    expect(stdout).toContain(
      "Pre mode is active (`.changeset/pre.json`): reported only.",
    );
  });

  it("fails once pre mode is exited", async () => {
    const root = await workspace({ ...missingBoth, preMode: "exit" });
    const { status, stdout, stderr } = await runCli(root);
    expect({ status, stdout }).toEqual({ status: 1, stdout: "" });
    expect(stderr).toContain(
      "- [ ] Missing migration page for w3ts@3 to reforged-ts@1: `website/docs/migration/w3ts-3-to-reforged-ts-1.md`.\n",
    );
    expect(stderr).toContain("this blocks the release");
  });

  it("fails with no pre state", async () => {
    const root = await workspace({
      version: "1.2.0",
      pending: { "remove.md": { "reforged-ts": "major" } },
    });
    expect(await runCli(root)).toMatchObject({ status: 1, stdout: "" });
  });

  it("passes, saying so, when nothing is required", async () => {
    const root = await workspace({
      version: "1.2.0",
      pending: { "feature.md": { "reforged-ts": "minor" } },
    });
    expect(await runCli(root)).toEqual({
      status: 0,
      stdout:
        "No major of reforged-ts is pending and its next stable version is not its first: no migration page is required.\n",
      stderr: "",
    });
  });

  it("appends the verdict to the job summary in GitHub Actions", async () => {
    const root = await workspace({ ...missingBoth, preMode: "pre" });
    const summary = join(await tempDir("summary"), "summary.md");
    const { stdout } = await runCli(root, { GITHUB_STEP_SUMMARY: summary });
    expect(await readFile(summary, "utf8")).toBe(
      `## Major-changeset gate\n\n${stdout}\n`,
    );
  });

  it("writes no summary when nothing is required", async () => {
    const root = await workspace({ version: "1.2.0" });
    const summary = join(await tempDir("summary"), "summary.md");
    await runCli(root, { GITHUB_STEP_SUMMARY: summary });
    await expect(readFile(summary, "utf8")).rejects.toThrow();
  });

  it("exits 1 naming an unreadable pre state", async () => {
    const root = await workspace({ version: "1.2.0" });
    await writeText(root, ".changeset/pre.json", '{"mode":"entered"}');
    expect(await runCli(root)).toEqual({
      status: 1,
      stdout: "",
      stderr:
        '.changeset/pre.json: mode must be "pre" or "exit", not "entered".\n',
    });
  });

  it("exits 2 on an argument", async () => {
    let stderr = "";
    const status = await main(
      ["--base", "master"],
      { stdout: () => undefined, stderr: (text) => (stderr += text) },
      { root: await workspace({ version: "1.2.0" }), env: {} },
    );
    expect({ status, stderr }).toEqual({
      status: 2,
      stderr: "Usage: release:gate\n",
    });
  });
});
