import { describe, expect, it } from "vitest";
import type { Gh } from "../src/cli/common.js";
import { main, type Context } from "../src/cli/spec-check.js";
import { graphQlFetch, type Sent } from "./support/board.js";

const LIBRARY = "phmilk/reforged-ts";
const TEMPLATE = "phmilk/reforged-ts-template";

const USAGE = "Usage: spec:check <spec> [owner/name]\n";

const gh: Gh = (args) =>
  args.join(" ") === "auth token"
    ? Promise.resolve("gh0\n")
    : Promise.reject(new Error(`unexpected gh ${args.join(" ")}`));

/** A sub-issue node as the query answers it. */
function subIssue(
  repository: string,
  number: number,
  fields: Record<string, unknown> = {},
) {
  return {
    number,
    state: "CLOSED",
    stateReason: "COMPLETED",
    body: "## Acceptance criteria\n\n- [x] It reads the body.\n",
    repository: { nameWithOwner: repository },
    assignees: { nodes: [] },
    ...fields,
  };
}

const BODY =
  "## Implementation Decisions\n\n" +
  "- It reads the body.\n" +
  "- It prints the verdict.\n\n" +
  "## Coverage table\n\n" +
  "| Item | Ticket | Criterion |\n| --- | --- | --- |\n" +
  "| It reads the body. | #11 | It reads the body. |\n" +
  `| It prints the verdict. | ${TEMPLATE}#5 | It reads the body. |\n`;

/** The answer to the Spec's query: issue #10, labelled `spec` unless `labels` says otherwise. */
function specAnswer(nodes: unknown[], { labels = ["spec"], body = BODY } = {}) {
  return {
    data: {
      repository: {
        issue: {
          title: "The Spec",
          body,
          labels: { nodes: labels.map((name) => ({ name })) },
          subIssues: { totalCount: nodes.length, nodes },
        },
      },
    },
  };
}

function run(
  args: string[],
  answer: unknown,
  sent: Sent[] = [],
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
    { gh, fetcher: graphQlFetch(() => answer, sent), ...context },
  );
  return code.then((exitCode) => ({ exitCode, stdout, stderr }));
}

describe("spec:check", () => {
  it("exits 0 on a delivered Spec, as the gh login, and says it may close", async () => {
    const sent: Sent[] = [];
    const result = await run(
      ["10"],
      specAnswer([subIssue(LIBRARY, 11), subIssue(TEMPLATE, 5)]),
      sent,
    );

    expect(result.stderr).toBe("");
    expect(result.exitCode).toBe(0);
    expect(
      sent.map(({ variables, authorization }) => [variables, authorization]),
    ).toEqual([
      [{ owner: "phmilk", name: "reforged-ts", number: 10 }, "Bearer gh0"],
    ]);
    expect(result.stdout).toBe(
      `Spec #10 of ${LIBRARY}, "The Spec": 2 items, 2 rows, 2 Tickets.\n` +
        "Delivered: every item has a row, every Ticket closed as completed, " +
        'every criterion is checked and every "check whether…" carries its Outcome. ' +
        "The Spec may close.\n",
    );
  });

  it("exits 1 on gaps and lists each", async () => {
    const result = await run(
      ["#10"],
      specAnswer(
        [
          subIssue(LIBRARY, 11, {
            state: "OPEN",
            stateReason: null,
            assignees: { nodes: [{ login: "wyller" }] },
            body: "## Acceptance criteria\n\n- [ ] It reads the body.\n- [x] Check whether it can. If so, yes; if not, no.\n",
          }),
          subIssue(TEMPLATE, 5, {
            stateReason: "NOT_PLANNED",
            body: "## Acceptance criteria\n\n- [ ] It reads the body.\n- [x] Check whether it can. If so, yes; if not, no.\n",
          }),
          subIssue(TEMPLATE, 6, { state: "OPEN", stateReason: null }),
        ],
        {
          body: BODY.replace(
            "- It prints",
            "- It counts.\n- It prints",
          ).replace("| #11 |", "| #12 |"),
        },
      ),
    );

    expect(result.stderr).toBe("");
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe(
      `Spec #10 of ${LIBRARY}, "The Spec": 3 items, 2 rows, 3 Tickets.\n` +
        "Not delivered, 7 gaps:\n" +
        '- No row for the item "It counts.".\n' +
        '- The row of "It reads the body." names #12, which is not a sub-issue of the Spec.\n' +
        "- #11 is open, held by @wyller, with 1 criterion unchecked.\n" +
        `- ${TEMPLATE}#5 closed as NOT_PLANNED, not as completed.\n` +
        `- ${TEMPLATE}#5 leaves a criterion unchecked: "It reads the body.".\n` +
        `- ${TEMPLATE}#5 has a "check whether…" without its Outcome: line: "Check whether it can. If so, yes; if not, no.".\n` +
        `- ${TEMPLATE}#6 is open, held by nobody, with every criterion checked.\n`,
    );
  });

  it("names a Spec with no Coverage table, and a row whose criterion its Ticket lacks", async () => {
    const none = await run(
      ["10"],
      specAnswer([subIssue(LIBRARY, 11)], {
        body: "## Implementation Decisions\n\n- It reads.\n",
      }),
    );
    const lacking = await run(
      ["10"],
      specAnswer([subIssue(LIBRARY, 11), subIssue(TEMPLATE, 5)], {
        body: BODY.replace(
          "| #11 | It reads the body. |",
          "| #11 | It writes. |",
        ),
      }),
    );

    expect(none.exitCode).toBe(1);
    expect(none.stdout).toContain(
      "Not delivered, 1 gap:\n- No Coverage table: the Spec's body has no ## Coverage table section with a table.\n",
    );
    expect(lacking.exitCode).toBe(1);
    expect(lacking.stdout).toContain(
      '- The row of "It reads the body." quotes the criterion "It writes.", which #11 does not hold.\n',
    );
  });

  it("reads a Spec of the Template when the repository is named", async () => {
    const sent: Sent[] = [];
    const result = await run(
      ["5", TEMPLATE],
      specAnswer([subIssue(LIBRARY, 11), subIssue(TEMPLATE, 5)], {
        body: BODY.replace("| #11 |", `| ${LIBRARY}#11 |`).replace(
          `${TEMPLATE}#5`,
          "#5",
        ),
      }),
      sent,
    );

    expect(result.exitCode).toBe(0);
    expect(sent[0]?.variables).toEqual({
      owner: "phmilk",
      name: "reforged-ts-template",
      number: 5,
    });
    expect(result.stdout).toContain(`Spec #5 of ${TEMPLATE}`);
  });

  it("exits 1 on an issue that is not a Spec, and on GitHub's error", async () => {
    const notSpec = await run(["10"], specAnswer([], { labels: ["ticket"] }));
    const error = await run(["10"], {
      errors: [
        {
          type: "NOT_FOUND",
          message: "Could not resolve to an Issue with the number of 10.",
        },
      ],
    });

    expect(notSpec.exitCode).toBe(1);
    expect(notSpec.stderr).toBe(
      `${LIBRARY}#10 is not a Spec: it is not labelled spec.\n`,
    );
    expect(error.exitCode).toBe(1);
    expect(error.stderr).toBe(
      "SpecCoverage answered: NOT_FOUND: Could not resolve to an Issue with the number of 10.\n",
    );
  });

  it("exits 1 when the gh login has no token", async () => {
    const result = await run(["10"], specAnswer([]), [], {
      gh: () =>
        Promise.reject(
          Object.assign(new Error("failed"), { stderr: "not logged in" }),
        ),
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("not logged in");
  });

  it.each([
    [[]],
    [["ten"]],
    [["10", "not-a-repository"]],
    [["10", LIBRARY, "extra"]],
  ])("exits 2 with the usage on %j", async (args) => {
    const sent: Sent[] = [];
    const result = await run(args, specAnswer([]), sent);

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toBe(USAGE);
    expect(result.stdout).toBe("");
    expect(sent).toEqual([]);
  });
});
