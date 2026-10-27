import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main, type Context } from "../src/cli/board-labels.js";
import type { Gh } from "../src/cli/common.js";
import {
  graphQlFetch,
  issue,
  LABEL_IDS,
  LIBRARY,
  mutations,
  reading,
  STATE,
  TEMPLATE,
  type Sent,
} from "./support/board.js";
import { tempDir, writeText } from "./support/workspace.js";

const gh: Gh = (args) => Promise.resolve(args[0] === "auth" ? "gh0\n" : "");

function run(
  args: string[],
  fetcher: typeof fetch,
  context: Partial<Context> = {},
) {
  let stdout = "";
  let stderr = "";
  const code = main(
    args,
    {
      stdout: (text) => {
        stdout += text;
      },
      stderr: (text) => {
        stderr += text;
      },
    },
    { env: { LABELS_TOKEN: "app" }, gh, fetcher, ...context },
  );
  return code.then((exitCode) => ({ exitCode, stdout, stderr }));
}

/** #10 unsplit and still ready-for-agent, #20 split and right, #30 of the Template unsplit with no label. */
const ISSUES = [
  issue(10, { labels: ["spec", "ready-for-agent"] }),
  issue(20, {
    labels: ["spec", "ready-for-agent"],
    subIssues: [{ repository: LIBRARY, number: 21, state: "OPEN" }],
  }),
  issue(30, { repository: TEMPLATE, labels: ["spec"] }),
  issue(1, { labels: ["ready-for-agent"] }),
];

const FOUND =
  "Token: LABELS_TOKEN.\n" +
  `3 open Specs of ${LIBRARY} and ${TEMPLATE}.\n` +
  "As they should be: 1 Spec.\n";

describe("board:labels", () => {
  it("prints the plan and sends nothing on a dry run, with the token of LABELS_TOKEN", async () => {
    const sent: Sent[] = [];
    const result = await run(
      ["--dry-run"],
      graphQlFetch(reading(STATE, { issues: ISSUES }), sent),
    );

    expect(result.stderr).toBe("");
    expect(result.exitCode).toBe(0);
    expect(mutations(sent)).toEqual([]);
    expect(sent[0]?.authorization).toBe("Bearer app");
    expect(result.stdout).toBe(
      `${FOUND}Dry run, 3 requests, none sent:\n` +
        `\nAdd needs-split to ${LIBRARY}#10: a Spec with no sub-issue.\n` +
        "mutation AddLabels($labelableId: ID!, $labelIds: [ID!]!)\n" +
        '{\n  "labelableId": "I_10",\n  "labelIds": [\n    "LA_split"\n  ]\n}\n' +
        `\nRemove ready-for-agent from ${LIBRARY}#10: a Spec with no sub-issue.\n` +
        "mutation RemoveLabels($labelableId: ID!, $labelIds: [ID!]!)\n" +
        '{\n  "labelableId": "I_10",\n  "labelIds": [\n    "LA_ready"\n  ]\n}\n' +
        `\nAdd needs-split to ${TEMPLATE}#30: a Spec with no sub-issue.\n` +
        "mutation AddLabels($labelableId: ID!, $labelIds: [ID!]!)\n" +
        '{\n  "labelableId": "I_t30",\n  "labelIds": [\n    "LA_t_split"\n  ]\n}\n',
    );
  });

  it("falls back to the gh login when LABELS_TOKEN is not set, and says so", async () => {
    const sent: Sent[] = [];
    const result = await run(
      ["--dry-run"],
      graphQlFetch(reading(STATE, { issues: ISSUES }), sent),
      { env: {} },
    );

    expect(result.exitCode).toBe(0);
    expect(sent[0]?.authorization).toBe("Bearer gh0");
    expect(result.stdout).toContain(
      "Token: the gh login (LABELS_TOKEN is not set).\n",
    );
  });

  it("writes the differences, says what it did and writes the job summary", async () => {
    const sent: Sent[] = [];
    const dir = await tempDir("board-labels");
    await writeText(dir, "summary.md", "");
    const result = await run(
      [],
      graphQlFetch(reading(STATE, { issues: ISSUES }), sent),
      {
        env: {
          LABELS_TOKEN: "app",
          GITHUB_STEP_SUMMARY: join(dir, "summary.md"),
        },
      },
    );

    expect(result.stderr).toBe("");
    expect(result.exitCode).toBe(0);
    expect(mutations(sent)).toEqual([
      ["AddLabels", { labelableId: "I_10", labelIds: ["LA_split"] }],
      ["RemoveLabels", { labelableId: "I_10", labelIds: ["LA_ready"] }],
      ["AddLabels", { labelableId: "I_t30", labelIds: ["LA_t_split"] }],
    ]);
    expect(result.stdout).toBe(
      `${FOUND}3 requests:\n` +
        `\nAdd needs-split to ${LIBRARY}#10: a Spec with no sub-issue.\n` +
        "mutation AddLabels($labelableId: ID!, $labelIds: [ID!]!)\n" +
        '{\n  "labelableId": "I_10",\n  "labelIds": [\n    "LA_split"\n  ]\n}\n' +
        `\nRemove ready-for-agent from ${LIBRARY}#10: a Spec with no sub-issue.\n` +
        "mutation RemoveLabels($labelableId: ID!, $labelIds: [ID!]!)\n" +
        '{\n  "labelableId": "I_10",\n  "labelIds": [\n    "LA_ready"\n  ]\n}\n' +
        `\nAdd needs-split to ${TEMPLATE}#30: a Spec with no sub-issue.\n` +
        "mutation AddLabels($labelableId: ID!, $labelIds: [ID!]!)\n" +
        '{\n  "labelableId": "I_t30",\n  "labelIds": [\n    "LA_t_split"\n  ]\n}\n' +
        `Done: Add needs-split to ${LIBRARY}#10: a Spec with no sub-issue.\n` +
        `Done: Remove ready-for-agent from ${LIBRARY}#10: a Spec with no sub-issue.\n` +
        `Done: Add needs-split to ${TEMPLATE}#30: a Spec with no sub-issue.\n`,
    );
    expect(await readFile(join(dir, "summary.md"), "utf8")).toBe(
      "## Board labels\n\n1 Spec as it should be; 3 requests, 3 done.\n\n" +
        `- Add needs-split to ${LIBRARY}#10: a Spec with no sub-issue.\n` +
        `- Remove ready-for-agent from ${LIBRARY}#10: a Spec with no sub-issue.\n` +
        `- Add needs-split to ${TEMPLATE}#30: a Spec with no sub-issue.\n`,
    );
  });

  it("exits 1 naming a label missing from a repository, and sends nothing", async () => {
    const sent: Sent[] = [];
    const result = await run(
      [],
      graphQlFetch(
        reading(STATE, {
          issues: ISSUES,
          labelIds: { ...LABEL_IDS, [TEMPLATE]: {} },
        }),
        sent,
      ),
    );

    expect(result.exitCode).toBe(1);
    expect(mutations(sent)).toEqual([]);
    expect(result.stderr).toBe(
      `The label needs-split does not exist in ${TEMPLATE}: create it there (pnpm repo:settings creates the library's), then run board:labels again.\n`,
    );
  });

  it("exits 2 on an unknown argument, with the usage", async () => {
    const sent: Sent[] = [];
    const result = await run(
      ["--max-deletes", "3"],
      graphQlFetch(reading(STATE), sent),
    );

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/^Usage: board:labels \[--dry-run\]\n/);
    expect(sent).toEqual([]);
  });
});
