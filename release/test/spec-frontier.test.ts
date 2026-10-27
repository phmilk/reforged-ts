import { describe, expect, it } from "vitest";
import { BOARD_REPOSITORIES as BOARD } from "../src/board.js";
import { LABELS } from "../src/repo-settings.js";
import {
  BOARD_REPOSITORIES,
  frontierQuery,
  SPEC_LABEL,
  type FetchedSpec,
  type FetchedTicket,
} from "../src/spec-frontier.js";

const LIBRARY = "phmilk/reforged-ts";
const TEMPLATE = "phmilk/reforged-ts-template";

/** An open Ticket of the library with no assignee, no blocker and no pull request. */
function ticket(number: number, fields: Partial<FetchedTicket> = {}) {
  return {
    repository: LIBRARY,
    number,
    title: `Ticket ${String(number)}`,
    state: "OPEN",
    assignees: [],
    blockers: [],
    pullRequests: [],
    ...fields,
  } satisfies FetchedTicket;
}

/** Spec #10 of the library, labelled `spec`, with `tickets`. */
function spec(tickets: FetchedTicket[]): FetchedSpec {
  return {
    repository: LIBRARY,
    number: 10,
    title: "The Spec",
    spec: true,
    tickets,
  };
}

describe("frontierQuery", () => {
  it("offers an open Ticket with no blocker, and not one blocked by an open issue", () => {
    const answer = frontierQuery(
      spec([
        ticket(11),
        ticket(12, {
          blockers: [
            { repository: LIBRARY, number: 11, state: "OPEN" },
            { repository: LIBRARY, number: 9, state: "CLOSED" },
          ],
        }),
        ticket(13, {
          blockers: [{ repository: LIBRARY, number: 9, state: "CLOSED" }],
        }),
      ]),
      "alice",
    );

    expect(answer.takeable.map(({ number }) => number)).toEqual([11, 13]);
    expect(answer.held).toEqual([]);
    expect(answer.heldByOthers).toEqual([]);
  });

  it("lists a Ticket held by another login as theirs, not takeable", () => {
    const answer = frontierQuery(
      spec([ticket(11, { assignees: ["bob"] }), ticket(12)]),
      "alice",
    );

    expect(answer.takeable.map(({ number }) => number)).toEqual([12]);
    expect(answer.held).toEqual([]);
    expect(answer.heldByOthers.map(({ number }) => number)).toEqual([11]);
  });

  it("lists a Ticket the login holds with its open pull request, still takeable by it", () => {
    const held = ticket(11, {
      assignees: ["alice"],
      pullRequests: [{ repository: LIBRARY, number: 40 }],
    });
    const paired = ticket(12, { assignees: ["bob", "alice"] });

    const answer = frontierQuery(spec([held, paired, ticket(13)]), "alice");

    // "No assignee other than itself": its own Ticket stays takeable, a
    // paired one does not.
    expect(answer.takeable.map(({ number }) => number)).toEqual([11, 13]);
    expect(answer.held).toEqual([held, paired]);
    expect(answer.heldByOthers).toEqual([]);
  });

  it("offers a Ticket in the Template, and ignores a sub-issue outside the Board repositories", () => {
    const answer = frontierQuery(
      spec([
        ticket(117, { repository: TEMPLATE }),
        ticket(118, {
          repository: TEMPLATE,
          blockers: [{ repository: LIBRARY, number: 11, state: "OPEN" }],
        }),
        ticket(5, { repository: "someone/else" }),
        ticket(6, { repository: "someone/else", assignees: ["bob"] }),
      ]),
      "alice",
    );

    expect(answer.takeable).toEqual([ticket(117, { repository: TEMPLATE })]);
    expect(answer.heldByOthers).toEqual([]);
  });

  it("leaves a closed Ticket out of every list", () => {
    const answer = frontierQuery(
      spec([
        ticket(11, { state: "CLOSED" }),
        ticket(12, { state: "CLOSED", assignees: ["alice"] }),
        ticket(13, { state: "CLOSED", assignees: ["bob"] }),
      ]),
      "alice",
    );

    expect(answer).toEqual({
      login: "alice",
      takeable: [],
      held: [],
      heldByOthers: [],
    });
  });

  it("offers nothing on a Spec whose open Tickets are all other logins'", () => {
    const answer = frontierQuery(
      spec([
        ticket(11, { assignees: ["bob"] }),
        ticket(12, { repository: TEMPLATE, assignees: ["carol"] }),
        ticket(13, { state: "CLOSED" }),
      ]),
      "alice",
    );

    expect(answer.takeable).toEqual([]);
    expect(answer.held).toEqual([]);
    expect(answer.heldByOthers.map(({ number }) => number)).toEqual([11, 12]);
  });
});

describe("BOARD_REPOSITORIES", () => {
  it("is the board's own list, which the script copies since it imports nothing", () => {
    expect(BOARD_REPOSITORIES).toEqual(BOARD);
  });
});

describe("SPEC_LABEL", () => {
  it("is among the labels repo-settings applies, which the script copies since it imports nothing", () => {
    expect(LABELS.map(({ name }) => name)).toContain(SPEC_LABEL);
  });
});
