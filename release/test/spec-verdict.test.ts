import { describe, expect, it } from "vitest";
import type { FetchedSpec, FetchedTicket } from "../src/spec-check.js";
import {
  planSpecVerdict,
  specsToCheck,
  verdictComment,
  VERDICT_MARKER,
} from "../src/spec-verdict.js";
import { issue, LIBRARY, OTHER, TEMPLATE } from "./support/board.js";

/** A Ticket of the library closed as completed, its one criterion checked. */
function ticket(
  number: number,
  fields: Partial<FetchedTicket> = {},
): FetchedTicket {
  return {
    repository: LIBRARY,
    number,
    state: "CLOSED",
    stateReason: "COMPLETED",
    assignees: ["alice"],
    body: "## Acceptance criteria\n\n- [x] It reads the body.\n",
    ...fields,
  };
}

/** Spec #10 of `repository`, one item that #11 of the library covers. */
function spec(
  tickets: FetchedTicket[] = [ticket(11), ticket(12)],
  repository = LIBRARY,
): FetchedSpec {
  return {
    repository,
    number: 10,
    title: "The Spec",
    body:
      "## Implementation Decisions\n\n- It reads the body.\n\n" +
      "## Coverage table\n\n| Item | Ticket | Criterion |\n| --- | --- | --- |\n" +
      `| It reads the body. | ${LIBRARY}#11 | It reads the body. |\n`,
    tickets,
  };
}

describe("verdictComment", () => {
  it("says the check is green, with the counts the CLI prints and the command that closes the Spec", () => {
    expect(verdictComment(spec())).toBe(
      `${VERDICT_MARKER}\n\n` +
        "**Coverage check: green.** Every Ticket of this Spec is closed, and `pnpm spec:check 10` finds no gap: 1 item, 1 row, 2 Tickets. " +
        'Close the Spec: `gh issue close 10 --comment "Delivered: the coverage check is green (1 item, 1 row, 2 Tickets)."`. ' +
        "The board never closes it: whoever merged its last Ticket, an assignee of the Spec or the maintainer does (ADR 0023). " +
        'See `docs/agents/issue-tracker.md`, "Closing a Spec".',
    );
  });

  it("names the Template in both commands for a Spec of the Template", () => {
    const body = verdictComment(spec(undefined, TEMPLATE));

    expect(body).toContain(`\`pnpm spec:check 10 ${TEMPLATE}\``);
    expect(body).toContain(`\`gh issue close 10 -R ${TEMPLATE} --comment "`);
  });

  it("lists each gap in the words pnpm spec:check prints, and keeps the Spec open", () => {
    expect(
      verdictComment(
        spec([
          ticket(11, {
            body: "## Acceptance criteria\n\n- [ ] It reads the body.\n",
          }),
          ticket(12, { stateReason: "NOT_PLANNED" }),
        ]),
      ),
    ).toBe(
      `${VERDICT_MARKER}\n\n` +
        "**Coverage check: red.** Every Ticket of this Spec is closed, but `pnpm spec:check 10` finds 2 gaps (1 item, 1 row, 2 Tickets):\n\n" +
        '- #11 leaves a criterion unchecked: "It reads the body.".\n' +
        "- #12 closed as NOT_PLANNED, not as completed.\n\n" +
        "The Spec stays open. Whoever fills a gap runs the check again; the board edits this comment on its next run. " +
        'See `docs/agents/issue-tracker.md`, "Closing a Spec".',
    );
  });
});

describe("specsToCheck", () => {
  const closed = (number: number, repository = LIBRARY) => ({
    repository,
    number,
    state: "CLOSED",
  });
  const open = (number: number) => ({
    repository: LIBRARY,
    number,
    state: "OPEN",
  });

  it("keeps the open Specs of both Board repositories with sub-issues and none open", () => {
    const delivered = issue(10, {
      labels: ["spec", "ready-for-agent"],
      subIssues: [closed(11), closed(5, TEMPLATE)],
    });
    const ofTemplate = issue(20, {
      repository: TEMPLATE,
      labels: ["spec"],
      subIssues: [closed(21, TEMPLATE)],
    });

    expect(
      specsToCheck([
        delivered,
        ofTemplate,
        // A Ticket still open, no sub-issue, no Spec, closed, off the board.
        issue(30, { labels: ["spec"], subIssues: [closed(31), open(32)] }),
        issue(40, { labels: ["spec", "needs-split"] }),
        issue(50, { labels: ["ready-for-agent"], subIssues: [closed(51)] }),
        issue(60, {
          labels: ["spec"],
          state: "CLOSED",
          subIssues: [closed(61)],
        }),
        issue(70, {
          repository: OTHER,
          labels: ["spec"],
          subIssues: [closed(71)],
        }),
      ]),
    ).toEqual([delivered, ofTemplate]);
  });
});

describe("planSpecVerdict", () => {
  const delivered = spec();
  const body = verdictComment(delivered);

  it("adds the comment to a Spec that has none, saying the verdict", () => {
    expect(planSpecVerdict("I_10", delivered, null)).toEqual({
      query: expect.stringContaining("addComment(") as unknown,
      variables: { subjectId: "I_10", body },
      summary: `Comment the coverage check on ${LIBRARY}#10: green.`,
    });
  });

  it("writes nothing when the comment already says it, as GitHub stores it", () => {
    expect(
      planSpecVerdict("I_10", delivered, {
        id: "IC_1",
        body: body.replaceAll("\n", "\r\n"),
      }),
    ).toBeNull();
  });

  it("edits the same comment when the verdict changed", () => {
    const red = spec([ticket(11, { stateReason: "NOT_PLANNED" })]);

    expect(planSpecVerdict("I_10", red, { id: "IC_1", body })).toEqual({
      query: expect.stringContaining("updateIssueComment(") as unknown,
      variables: { id: "IC_1", body: verdictComment(red) },
      summary: `Edit the coverage check's comment on ${LIBRARY}#10: red, 1 gap.`,
    });
  });
});
