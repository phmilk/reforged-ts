import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { tagLinks } from "../src/jass-history.js";
import type { NewPatch } from "../src/patch-watch.js";
import {
  MAX_BODY_LENGTH,
  readReportedPlan,
  renderIssue,
  renderPullRequest,
  type GeneratorRun,
  type ReportedPlan,
} from "../src/patch-watch-report.js";
import { repositoryRoot } from "../src/workspace.js";

function newPatch(build: string, tag: string, commit: string): NewPatch {
  return {
    build,
    gameVersion: build.split(".").slice(0, 3).join("."),
    tag,
    commit,
    links: tagLinks({ name: tag, commit }),
  };
}

const PATCH = newPatch(
  "3.0.0.24277",
  "Reforged-v3.0.0.24277-w3-1a2b3c4",
  "1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d",
);

const PLAN: ReportedPlan = {
  supported: "3.0.0.24268",
  simulated: false,
  patch: PATCH,
  superseded: [],
};

const RUN_URL = "https://github.com/phmilk/reforged-ts/actions/runs/42";

// The runs below are what `typings:generate` printed, copied from real runs
// of the generator (packages/reforged-types/src/cli/generate.ts) on fixture
// Patches, with the tag line of a run that vendored one.

const VENDORED = `Vendored ${PATCH.tag}: Patch ${PATCH.build} at commit ${PATCH.commit}.\n`;

/** Missing entries, a parameter mismatch, an unknown line and a warning. */
const FAILED: GeneratorRun = {
  stdout:
    VENDORED +
    "In Patch 3.0.0.24277 and not in Patch 3.0.0.24268 (3):\n" +
    "- common.j:3: global constant integer MAX_FOO = 12\n" +
    "- common.j:6: constant native GetUnitFoo takes unit whichUnit returns integer\n" +
    "- common.j:7: native BlzSetUnitFoo takes unit whichUnit, integer foo returns boolean\n" +
    "\n",
  stderr:
    "Generation failed: 5 errors, 1 warning. No file was written.\n" +
    "\n" +
    "Errors (5):\n" +
    "- [ ] 3.0.0.24277/common.j:8: unknown line: native Weird takes nothing returns nothing | 42\n" +
    "- [ ] common.j: no Overlay entry for global constant integer MAX_FOO = 12; expected common.j/globals/MAX_FOO.json\n" +
    "- [ ] common.j/functions/KillUnit.json: parameters do not match the Patch: native KillUnit takes unit target, real delay returns nothing; Overlay has (whichUnit, delay)\n" +
    "- [ ] common.j: no Overlay entry for constant native GetUnitFoo takes unit whichUnit returns integer; expected common.j/functions/GetUnitFoo.json\n" +
    "- [ ] common.j: no Overlay entry for native BlzSetUnitFoo takes unit whichUnit, integer foo returns boolean; expected common.j/functions/BlzSetUnitFoo.json\n" +
    "\n" +
    "Warnings (1):\n" +
    "- [ ] common.j/functions/Removed.json: orphan Overlay entry, common.j of Patches 3.0.0.24268 and 3.0.0.24277 declares no Removed\n",
  exitCode: 1,
};

/** The rehearsal's run: the vendored Build again, nothing to curate. */
const CLEAN: GeneratorRun = {
  stdout:
    "Vendored Reforged-v3.0.0.24268-w3-3a9d8f2: Patch 3.0.0.24268 at commit a392fc3d5e6c37980accbfc560b28387fc7d01bc, unchanged.\n" +
    "Generated 6 files for Patch 3.0.0.24268.\n",
  stderr: "",
  exitCode: 0,
};

/** Generation succeeded; one warning follows the summary line. */
const WARNINGS: GeneratorRun = {
  stdout:
    VENDORED +
    "Generated 6 files for Patch 3.0.0.24277.\n" +
    "\n" +
    "Warnings (1):\n" +
    "- [ ] common.j/functions/Removed.json: orphan Overlay entry, common.j of Patch 3.0.0.24277 declares no Removed\n",
  stderr: "",
  exitCode: 0,
};

const FOOTER =
  "---\n" +
  "\n" +
  "Curation is human: the Patch watch opened this draft and never merges or publishes it. " +
  "Follow the New Patch loop of `packages/reforged-types/AGENTS.md`. Merge only when:\n" +
  "\n" +
  "- every item of the checklist is checked;\n" +
  "- the Typings drift check (`pnpm typings:check`) is green;\n" +
  "- a changeset bumps `reforged-types` by a minor, and the other packages as `docs/release.md` says (Choosing the bump for a Patch).\n";

/** The lines of a Markdown body. */
const lines = (body: string) => body.split("\n");

describe("renderPullRequest", () => {
  it("renders a failed generation as the curation checklist", () => {
    const { title, body } = renderPullRequest({
      plan: PLAN,
      issue: 12,
      run: FAILED,
      runUrl: RUN_URL,
    });

    expect(title).toBe("feat(reforged-types): support Patch 3.0.0.24277");
    expect(body).toBe(
      "Closes #12.\n" +
        "\n" +
        "The Patch watch found Patch 3.0.0.24277, tagged [`Reforged-v3.0.0.24277-w3-1a2b3c4`](https://github.com/Luashine/jass-history/tree/Reforged-v3.0.0.24277-w3-1a2b3c4) " +
        "at commit [`1a2b3c4`](https://github.com/Luashine/jass-history/commit/1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d) in jass-history, " +
        "and ran `pnpm typings:generate Reforged-v3.0.0.24277-w3-1a2b3c4` in its [workflow run](https://github.com/phmilk/reforged-ts/actions/runs/42).\n" +
        "\n" +
        "**Generation failed** (exit code 1), as expected for a new Patch: this pull request holds the vendored Patch files and their provenance. " +
        "The generated Typings come with the curation.\n" +
        "\n" +
        "## Curation checklist\n" +
        "\n" +
        "### Missing Overlay entries (3)\n" +
        "\n" +
        "Write each entry at its path under `packages/reforged-types/overlay/`, following the curation rules.\n" +
        "\n" +
        "- [ ] `MAX_FOO` in `common.j`: `global constant integer MAX_FOO = 12` at `common.j/globals/MAX_FOO.json`\n" +
        "- [ ] `GetUnitFoo` in `common.j`: `constant native GetUnitFoo takes unit whichUnit returns integer` at `common.j/functions/GetUnitFoo.json`\n" +
        "- [ ] `BlzSetUnitFoo` in `common.j`: `native BlzSetUnitFoo takes unit whichUnit, integer foo returns boolean` at `common.j/functions/BlzSetUnitFoo.json`\n" +
        "\n" +
        "### Parameter mismatches (1)\n" +
        "\n" +
        "Make each entry's `params` match the Patch signature: count, order and names.\n" +
        "\n" +
        "- [ ] `KillUnit` in `common.j`: the Patch declares `native KillUnit takes unit target, real delay returns nothing`; `common.j/functions/KillUnit.json` has `(whichUnit, delay)`\n" +
        "\n" +
        "### Parse errors (1)\n" +
        "\n" +
        "The Patch uses grammar the parser rejects: extend `packages/reforged-types/src/parser.ts` with a test, never skip the line.\n" +
        "\n" +
        "- [ ] `3.0.0.24277/common.j:8: unknown line: native Weird takes nothing returns nothing | 42`\n" +
        "\n" +
        "### Warnings (1)\n" +
        "\n" +
        "- [ ] `common.j/functions/Removed.json: orphan Overlay entry, common.j of Patches 3.0.0.24268 and 3.0.0.24277 declares no Removed`\n" +
        "\n" +
        "### In Patch 3.0.0.24277 and not in Patch 3.0.0.24268 (3)\n" +
        "\n" +
        "Set `since` to 3.0.0.24277 on the Overlay entry of each function and global.\n" +
        "\n" +
        "- [ ] `common.j:3`: `global constant integer MAX_FOO = 12`\n" +
        "- [ ] `common.j:6`: `constant native GetUnitFoo takes unit whichUnit returns integer`\n" +
        "- [ ] `common.j:7`: `native BlzSetUnitFoo takes unit whichUnit, integer foo returns boolean`\n" +
        "\n" +
        "## Generator output\n" +
        "\n" +
        "<details>\n" +
        "<summary><code>typings:generate</code> printed</summary>\n" +
        "\n" +
        "```text\n" +
        FAILED.stdout +
        FAILED.stderr +
        "```\n" +
        "\n" +
        "</details>\n" +
        "\n" +
        FOOTER,
    );
  });

  it("renders every missing entry with its source, name and signature", () => {
    const { body } = renderPullRequest({ plan: PLAN, issue: 12, run: FAILED });

    expect(lines(body)).toEqual(
      expect.arrayContaining([
        "- [ ] `GetUnitFoo` in `common.j`: `constant native GetUnitFoo takes unit whichUnit returns integer` at `common.j/functions/GetUnitFoo.json`",
      ]),
    );
  });

  it("renders a parameter mismatch with both sides", () => {
    const { body } = renderPullRequest({ plan: PLAN, issue: 12, run: FAILED });

    expect(lines(body)).toContain(
      "- [ ] `KillUnit` in `common.j`: the Patch declares `native KillUnit takes unit target, real delay returns nothing`; `common.j/functions/KillUnit.json` has `(whichUnit, delay)`",
    );
  });

  it("renders a mismatch of a parameterless function", () => {
    const run: GeneratorRun = {
      stdout: VENDORED,
      stderr:
        "Generation failed: 1 error, 0 warnings. No file was written.\n\nErrors (1):\n" +
        "- [ ] common.j/functions/Tick.json: parameters do not match the Patch: native Tick takes nothing returns nothing; Overlay has (x)\n",
      exitCode: 1,
    };

    const { body } = renderPullRequest({ plan: PLAN, issue: 12, run });

    expect(lines(body)).toContain(
      "- [ ] `Tick` in `common.j`: the Patch declares `native Tick takes nothing returns nothing`; `common.j/functions/Tick.json` has `(x)`",
    );
  });

  it("renders an unknown line verbatim, whatever it holds", () => {
    const run: GeneratorRun = {
      stdout: VENDORED,
      stderr:
        "Generation failed: 2 errors, 0 warnings. No file was written.\n\nErrors (2):\n" +
        "- [ ] common.j:12: unknown line: native `Odd` takes <nothing> returns *nothing* @phmilk\n" +
        "- [ ] common.ai:3: a second globals block (the first is at line 1)\n",
      exitCode: 1,
    };

    const { body } = renderPullRequest({ plan: PLAN, issue: 12, run });

    expect(body).toContain(
      "### Parse errors (1)\n" +
        "\n" +
        "The Patch uses grammar the parser rejects: extend `packages/reforged-types/src/parser.ts` with a test, never skip the line.\n" +
        "\n" +
        "- [ ] ``common.j:12: unknown line: native `Odd` takes <nothing> returns *nothing* @phmilk``\n",
    );
    expect(body).toContain(
      "### Other errors (1)\n" +
        "\n" +
        "- [ ] `common.ai:3: a second globals block (the first is at line 1)`\n",
    );
  });

  it("renders a clean run as nothing to curate", () => {
    const rehearsal = newPatch(
      "3.0.0.24268",
      "Reforged-v3.0.0.24268-w3-3a9d8f2",
      "a392fc3d5e6c37980accbfc560b28387fc7d01bc",
    );

    const { body } = renderPullRequest({
      plan: { ...PLAN, patch: rehearsal },
      issue: 12,
      run: CLEAN,
    });

    expect(body).toContain(
      "**Generation succeeded**: this pull request holds the vendored Patch files, their provenance and the generated Typings.\n" +
        "\n" +
        "## Curation checklist\n" +
        "\n" +
        "The generator reported no error and no warning.\n" +
        "\n" +
        "## Generator output\n",
    );
    expect(body).not.toContain("- [ ]");
    expect(body.endsWith(FOOTER)).toBe(true);
  });

  it("renders the warnings of a successful generation", () => {
    const { body } = renderPullRequest({
      plan: PLAN,
      issue: 12,
      run: WARNINGS,
    });

    expect(body).toContain("**Generation succeeded**");
    expect(body).toContain(
      "### Warnings (1)\n" +
        "\n" +
        "- [ ] `common.j/functions/Removed.json: orphan Overlay entry, common.j of Patch 3.0.0.24277 declares no Removed`\n",
    );
  });

  it("makes a failure without a checklist an item", () => {
    const run: GeneratorRun = {
      stdout: VENDORED,
      stderr: "TypeError: cannot read properties of undefined\n",
      exitCode: 1,
    };

    const { body } = renderPullRequest({ plan: PLAN, issue: 12, run });

    expect(body).toContain(
      "### Other errors (1)\n" +
        "\n" +
        "- [ ] Generation failed with exit code 1 and no checklist: read the generator output below.\n",
    );
  });

  it("always ends with the footer", () => {
    for (const run of [FAILED, CLEAN, WARNINGS]) {
      const { body } = renderPullRequest({ plan: PLAN, issue: 12, run });
      expect(body.endsWith(FOOTER)).toBe(true);
    }
  });

  it("says when the run is a rehearsal", () => {
    const { body } = renderPullRequest({
      plan: { ...PLAN, simulated: true, supported: "3.0.0.24267" },
      issue: 12,
      run: CLEAN,
    });

    expect(body).toContain(
      "> [!NOTE]\n" +
        "> A rehearsal: the watch ran with the supported Patch simulated as 3.0.0.24267. Close this pull request and its issue, remove the `game-patch` label from the issue (the watch skips a Build a labelled issue names, even closed) and delete the branch.\n",
    );
  });

  it("fences output that holds backticks", () => {
    const run: GeneratorRun = {
      stdout: VENDORED + "```` four backticks\n",
      stderr: "",
      exitCode: 0,
    };

    const { body } = renderPullRequest({ plan: PLAN, issue: 12, run });

    expect(body).toContain("`````text\n" + run.stdout + "`````\n");
  });

  it("names the issue the dry run has not opened", () => {
    const { body } = renderPullRequest({ plan: PLAN, issue: null, run: CLEAN });

    expect(body.startsWith("Closes the issue the Patch watch opens.\n")).toBe(
      true,
    );
  });

  it("keeps the body within GitHub's limit, output first", () => {
    const missing = Array.from(
      { length: 400 },
      (_, i) =>
        `- [ ] common.j: no Overlay entry for native N${String(i)} takes nothing returns nothing; expected common.j/functions/N${String(i)}.json\n`,
    ).join("");
    const run: GeneratorRun = {
      stdout: VENDORED + "x".repeat(MAX_BODY_LENGTH),
      stderr: `Generation failed.\n\nErrors (400):\n${missing}`,
      exitCode: 1,
    };

    const { body } = renderPullRequest({
      plan: PLAN,
      issue: 12,
      run,
      runUrl: RUN_URL,
    });

    expect(body.length).toBeLessThanOrEqual(MAX_BODY_LENGTH);
    expect(body).toContain("- [ ] `N399` in `common.j`");
    expect(body).toContain(
      `The output is too long for this description: read it in the [workflow run](${RUN_URL}).`,
    );
    expect(body.endsWith(FOOTER)).toBe(true);
  });

  it("drops the items that do not fit, counting them", () => {
    const missing = Array.from(
      { length: 2000 },
      (_, i) =>
        `- [ ] common.j: no Overlay entry for native Name${String(i)} takes integer a, integer b, integer c returns nothing; expected common.j/functions/Name${String(i)}.json\n`,
    ).join("");
    const run: GeneratorRun = {
      stdout: VENDORED,
      stderr: `Generation failed.\n\nErrors (2000):\n${missing}`,
      exitCode: 1,
    };

    const { body } = renderPullRequest({ plan: PLAN, issue: 12, run });

    expect(body.length).toBeLessThanOrEqual(MAX_BODY_LENGTH);
    expect(body).toContain("- [ ] `Name0` in `common.j`");
    expect(body).not.toContain("- [ ] `Name1999` in `common.j`");
    expect(body).toMatch(
      /\n\d+ more items do not fit this description: read them in the generator output of the workflow run\.\n/,
    );
    expect(body.endsWith(FOOTER)).toBe(true);
  });
});

describe("renderIssue", () => {
  it("writes one section per field of the form, in its order", async () => {
    const form = parse(
      await readFile(
        join(repositoryRoot, ".github/ISSUE_TEMPLATE/new-game-patch.yml"),
        "utf8",
      ),
    ) as { body: { type: string; attributes: { label?: string } }[] };
    const labels = form.body
      .filter((item) => item.type !== "markdown")
      .map((item) => item.attributes.label);

    const { body } = renderIssue({ plan: PLAN });

    expect(
      lines(body)
        .filter((line) => line.startsWith("### "))
        .map((line) => line.slice(4)),
    ).toEqual(labels);
  });

  it("fills the New game Patch form's fields", () => {
    const { title, body } = renderIssue({ plan: PLAN, runUrl: RUN_URL });

    expect(title).toBe("New Patch: 3.0.0.24277");
    expect(body).toBe(
      "### Build\n" +
        "\n" +
        "3.0.0.24277\n" +
        "\n" +
        "### jass-history tag\n" +
        "\n" +
        "Reforged-v3.0.0.24277-w3-1a2b3c4\n" +
        "\n" +
        "### Where it was observed\n" +
        "\n" +
        "jass-history tagged Build 3.0.0.24277 (Game version 3.0.0) at commit 1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d; " +
        "the Patch watch found it in its [workflow run](https://github.com/phmilk/reforged-ts/actions/runs/42).\n" +
        "\n" +
        "- Tag: https://github.com/Luashine/jass-history/tree/Reforged-v3.0.0.24277-w3-1a2b3c4\n" +
        "- Commit: https://github.com/Luashine/jass-history/commit/1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d\n" +
        "- Patch files: https://github.com/Luashine/jass-history/tree/1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d/timeline/scripts\n" +
        "\n" +
        "### Additional context\n" +
        "\n" +
        "The supported Patch is 3.0.0.24268. No other live Build was released since.\n" +
        "\n" +
        "The Patch watch opens a draft pull request with the vendored Patch files and the curation checklist.\n",
    );
  });

  it("lists the superseded Builds", () => {
    const older = newPatch(
      "3.0.0.24270",
      "Reforged-v3.0.0.24270-w3-0f0f0f0",
      "0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f",
    );

    const { body } = renderIssue({ plan: { ...PLAN, superseded: [older] } });

    expect(body).toContain(
      "The supported Patch is 3.0.0.24268. This Build supersedes the other live Builds released since, which the watch does not report on their own:\n" +
        "\n" +
        "- 3.0.0.24270, tag Reforged-v3.0.0.24270-w3-0f0f0f0: https://github.com/Luashine/jass-history/tree/Reforged-v3.0.0.24270-w3-0f0f0f0\n",
    );
    expect(body).toContain("the Patch watch found it.\n");
  });

  it("says when the run is a rehearsal", () => {
    const { body } = renderIssue({
      plan: { ...PLAN, simulated: true, supported: "3.0.0.24267" },
    });

    expect(body).toContain(
      "The supported Patch is 3.0.0.24267 (simulated). No other live Build was released since.\n",
    );
    expect(body).toContain(
      "\n> [!NOTE]\n" +
        "> A rehearsal: the watch ran with the supported Patch simulated as 3.0.0.24267. Close this issue and its pull request, remove the `game-patch` label from the issue (the watch skips a Build a labelled issue names, even closed) and delete the branch.\n",
    );
  });
});

describe("readReportedPlan", () => {
  const json = (value: unknown) => JSON.stringify(value);

  it("reads the plan the plan command printed", () => {
    expect(
      readReportedPlan(
        json({
          ...PLAN,
          vendored: ["3.0.0.24268"],
          reported: [],
          tags: 128,
          ignored: [],
        }),
      ),
    ).toEqual(PLAN);
  });

  it("rejects a plan without a new Patch", () => {
    expect(() => readReportedPlan(json({ ...PLAN, patch: null }))).toThrow(
      "The plan has no new Patch to report.",
    );
  });

  it("rejects text that is not a plan", () => {
    expect(() => readReportedPlan("{")).toThrow("The plan is not JSON");
    expect(() =>
      readReportedPlan(json({ ...PLAN, patch: { build: "3.0" } })),
    ).toThrow("The plan is not the JSON of patch-watch:plan --json.");
  });
});
