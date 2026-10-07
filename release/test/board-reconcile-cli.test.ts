import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BOARD_MUTATIONS, BOARD_OWNER, BOARD_TITLE } from "../src/board.js";
import { main, type Context } from "../src/cli/board-reconcile.js";
import type { Gh } from "../src/cli/common.js";
import {
  CONFIGURED,
  daysAgo,
  graphQlFetch,
  issue,
  item,
  LIBRARY,
  mutations,
  NOW,
  OTHER,
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
    {
      env: { PROJECT_TOKEN: "pat" },
      gh,
      fetcher,
      now: () => NOW,
      ...context,
    },
  );
  return code.then((exitCode) => ({ exitCode, stdout, stderr }));
}

const ready = issue(1, { labels: ["ready-for-agent"] });
const claimed = issue(2, { assignees: ["alice"] });
const closedLongAgo = issue(4, { state: "CLOSED", updatedAt: daysAgo(20) });
const templateReady = issue(5, {
  repository: TEMPLATE,
  labels: ["ready-for-human"],
});

/** The board agrees with GitHub but for #2 (Ready, claimed), #4 (to archive) and #1 (missing). */
const DRIFTED = {
  items: [
    item(claimed, "Ready"),
    item(closedLongAgo, "Done"),
    item(templateReady, "Ready"),
  ],
  issues: [ready, claimed, templateReady],
};

const AGREES = {
  items: [item(claimed, "In progress"), item(templateReady, "Ready")],
  issues: [claimed, templateReady],
};

const FOUND =
  `Token: PROJECT_TOKEN, as ${BOARD_OWNER}.\n` +
  `Project "${BOARD_TITLE}" under ${BOARD_OWNER}: ${CONFIGURED.url} (number 7).\n` +
  `3 open issues of ${LIBRARY} and ${TEMPLATE}; 3 items on the board, 0 archived.\n` +
  "As they should be: 1 item.\n";

describe("board:reconcile", () => {
  it("prints the plan and sends nothing on a dry run, with the token of PROJECT_TOKEN", async () => {
    const sent: Sent[] = [];
    const result = await run(
      ["--dry-run"],
      graphQlFetch(reading(STATE, DRIFTED), sent),
    );

    expect(result.stderr).toBe("");
    expect(result.exitCode).toBe(0);
    expect(sent.every(({ kind }) => kind === "query")).toBe(true);
    expect(sent[0]?.authorization).toBe("Bearer pat");
    expect(result.stdout).toBe(
      `${FOUND}Dry run, 4 requests, none sent:\n` +
        `\nSet the Status of ${LIBRARY}#2 to In progress (was Ready).\n` +
        "mutation UpdateItemStatus($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!)\n" +
        '{\n  "projectId": "PVT_board",\n  "itemId": "PVTI_I_2",\n  "fieldId": "PVTSSF_status",\n  "optionId": "opt3"\n}\n' +
        `\nArchive ${LIBRARY}#4: closed, and not updated since ${daysAgo(20).slice(0, 10)}.\n` +
        "mutation ArchiveItem($projectId: ID!, $itemId: ID!)\n" +
        '{\n  "projectId": "PVT_board",\n  "itemId": "PVTI_I_4"\n}\n' +
        `\nAdd ${LIBRARY}#1 to the board, then set its Status to Ready.\n` +
        "mutation AddItem($projectId: ID!, $contentId: ID!)\n" +
        '{\n  "projectId": "PVT_board",\n  "contentId": "I_1"\n}\n' +
        `\nSet the Status of ${LIBRARY}#1, once added, to Ready.\n` +
        "mutation UpdateItemStatus($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!)\n" +
        `{\n  "projectId": "PVT_board",\n  "itemId": "<the id of the item of ${LIBRARY}#1>",\n  "fieldId": "PVTSSF_status",\n  "optionId": "opt1"\n}\n`,
    );
  });

  it("falls back to the gh login when PROJECT_TOKEN is not set, and says so", async () => {
    const sent: Sent[] = [];
    const result = await run(
      ["--dry-run"],
      graphQlFetch(reading(STATE, AGREES), sent),
      { env: {} },
    );

    expect(result.exitCode).toBe(0);
    expect(sent[0]?.authorization).toBe("Bearer gh0");
    expect(result.stdout).toContain(
      `Token: the gh login (PROJECT_TOKEN is not set), as ${BOARD_OWNER}.\n`,
    );
  });

  it("writes the differences, says what it did and writes the job summary", async () => {
    const sent: Sent[] = [];
    const dir = await tempDir("board-reconcile");
    await writeText(dir, "summary.md", "");
    const result = await run([], graphQlFetch(reading(STATE, DRIFTED), sent), {
      env: {
        PROJECT_TOKEN: "pat",
        GITHUB_STEP_SUMMARY: join(dir, "summary.md"),
      },
    });

    expect(result.stderr).toBe("");
    expect(result.exitCode).toBe(0);
    expect(mutations(sent)).toEqual([
      [
        "UpdateItemStatus",
        {
          projectId: "PVT_board",
          itemId: "PVTI_I_2",
          fieldId: "PVTSSF_status",
          optionId: "opt3",
        },
      ],
      ["ArchiveItem", { projectId: "PVT_board", itemId: "PVTI_I_4" }],
      ["AddItem", { projectId: "PVT_board", contentId: "I_1" }],
      [
        "UpdateItemStatus",
        {
          projectId: "PVT_board",
          itemId: "PVTI_I_1",
          fieldId: "PVTSSF_status",
          optionId: "opt1",
        },
      ],
    ]);
    expect(sent.find(({ kind }) => kind === "mutation")?.query).toBe(
      BOARD_MUTATIONS.updateItemStatus,
    );
    const done =
      `Done: Set the Status of ${LIBRARY}#2 to In progress (was Ready).\n` +
      `Done: Archive ${LIBRARY}#4: closed, and not updated since ${daysAgo(20).slice(0, 10)}.\n` +
      `Done: Add ${LIBRARY}#1 to the board, then set its Status to Ready.\n` +
      `Done: Set the Status of ${LIBRARY}#1, once added, to Ready.\n`;
    expect(result.stdout.startsWith(`${FOUND}4 requests:\n`)).toBe(true);
    expect(result.stdout.endsWith(done)).toBe(true);
    expect(await readFile(join(dir, "summary.md"), "utf8")).toBe(
      "## Board reconcile\n\n1 item as they should be; 4 requests, 4 done.\n\n" +
        `- Set the Status of ${LIBRARY}#2 to In progress (was Ready).\n` +
        `- Archive ${LIBRARY}#4: closed, and not updated since ${daysAgo(20).slice(0, 10)}.\n` +
        `- Add ${LIBRARY}#1 to the board, then set its Status to Ready.\n` +
        `- Set the Status of ${LIBRARY}#1, once added, to Ready.\n`,
    );
  });

  it("sends nothing when the board already agrees, and says so", async () => {
    const sent: Sent[] = [];
    const dir = await tempDir("board-reconcile");
    await writeText(dir, "summary.md", "");
    const result = await run([], graphQlFetch(reading(STATE, AGREES), sent), {
      env: {
        PROJECT_TOKEN: "pat",
        GITHUB_STEP_SUMMARY: join(dir, "summary.md"),
      },
    });

    expect(result.exitCode).toBe(0);
    expect(mutations(sent)).toEqual([]);
    expect(result.stdout).toContain(
      "As they should be: 2 items.\n0 requests:\n",
    );
    expect(await readFile(join(dir, "summary.md"), "utf8")).toBe(
      "## Board reconcile\n\n2 items as they should be; 0 requests, 0 done.\n",
    );
  });

  it("stops with exit 1 when the project does not exist, naming board:setup", async () => {
    const sent: Sent[] = [];
    const result = await run(
      [],
      graphQlFetch(reading({ ...STATE, project: null }), sent),
    );

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe(
      `No project "${BOARD_TITLE}" under ${BOARD_OWNER}: run board:setup first.\n`,
    );
    expect(mutations(sent)).toEqual([]);
  });

  it("stops at the first refused request, naming it, the summary saying what was done", async () => {
    const sent: Sent[] = [];
    const dir = await tempDir("board-reconcile");
    await writeText(dir, "summary.md", "");
    const result = await run(
      [],
      graphQlFetch(
        reading(STATE, { ...DRIFTED, failing: "ArchiveItem" }),
        sent,
      ),
      {
        env: {
          PROJECT_TOKEN: "pat",
          GITHUB_STEP_SUMMARY: join(dir, "summary.md"),
        },
      },
    );

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe(
      "ArchiveItem answered: FORBIDDEN: Resource not accessible by personal access token. " +
        `Not done: Archive ${LIBRARY}#4: closed, and not updated since ${daysAgo(20).slice(0, 10)}.\n`,
    );
    expect(mutations(sent).map(([operation]) => operation)).toEqual([
      "UpdateItemStatus",
      "ArchiveItem",
    ]);
    expect(await readFile(join(dir, "summary.md"), "utf8")).toContain(
      "1 item as they should be; 4 requests, 1 done.\n",
    );
  });

  it("refuses a plan that removes more than 10 items, the summary saying what, unless --max-deletes allows them", async () => {
    const foreign = Array.from({ length: 11 }, (_, i) =>
      issue(300 + i, { repository: OTHER }),
    );
    const swamped = {
      items: foreign.map((candidate) => item(candidate, "Backlog")),
      issues: [],
    };
    const dir = await tempDir("board-reconcile");
    await writeText(dir, "summary.md", "");
    const env = {
      PROJECT_TOKEN: "pat",
      GITHUB_STEP_SUMMARY: join(dir, "summary.md"),
    };

    const refused: Sent[] = [];
    const result = await run(
      [],
      graphQlFetch(reading(STATE, swamped), refused),
      { env },
    );
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatch(
      /^Refused: the plan removes 11 items from the board, more than the 10 one run may remove, and nothing was sent\. The removals: Remove phmilk\/other#300 from the board: an issue of another repository\. .* When they are right, run board:reconcile --max-deletes 11\.\n$/,
    );
    expect(mutations(refused)).toEqual([]);
    expect(await readFile(join(dir, "summary.md"), "utf8")).toBe(
      `## Board reconcile\n\n${result.stderr}`,
    );

    const allowed: Sent[] = [];
    const raised = await run(
      ["--max-deletes", "11"],
      graphQlFetch(reading(STATE, swamped), allowed),
      { env },
    );
    expect(raised.stderr).toBe("");
    expect(raised.exitCode).toBe(0);
    expect(raised.stdout).toContain("11 requests:\n");
    expect(mutations(allowed).map(([operation]) => operation)).toEqual(
      Array.from({ length: 11 }, () => "DeleteItem"),
    );
  });

  it("stops without a token, naming both", async () => {
    const sent: Sent[] = [];
    const noAuth: Gh = () => Promise.reject(new Error("not logged in"));
    const result = await run([], graphQlFetch(reading(STATE, AGREES), sent), {
      env: {},
      gh: noAuth,
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain(
      "gh auth token (the token of the gh authentication, since PROJECT_TOKEN is not set; run gh auth login) failed: not logged in",
    );
    expect(sent).toEqual([]);
  });

  it.each([
    [["--apply"]],
    [["--dry-run", "--dry-run"]],
    [["--repo", "a/b"]],
    [["--max-deletes"]],
    [["--max-deletes", "ten"]],
    [["--max-deletes", "-1"]],
    [["--max-deletes", "5", "--max-deletes", "6"]],
  ])("rejects the arguments %j", async (args) => {
    const sent: Sent[] = [];
    const result = await run(args, graphQlFetch(reading(STATE, AGREES), sent));

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toBe(
      "Usage: board:reconcile [--dry-run] [--max-deletes <n>]\n" +
        "  With the token in PROJECT_TOKEN (the maintainer's classic token, scope project), else the gh login's.\n" +
        "  --max-deletes <n>: allow a plan that removes up to n items from the board (10 without it).\n",
    );
    expect(sent).toEqual([]);
  });
});
