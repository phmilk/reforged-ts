import { describe, expect, it } from "vitest";
import {
  coverageVerdict,
  type FetchedSpec,
  type FetchedTicket,
} from "../src/spec-check.js";

const LIBRARY = "phmilk/reforged-ts";
const TEMPLATE = "phmilk/reforged-ts-template";

/** A Ticket's body as `to-tickets` writes it, with `criteria` as its checklist lines. */
const ticketBody = (...criteria: string[]) =>
  "## Parent\n\n#10\n\n## What to build\n\nThe thing.\n\n" +
  `## Acceptance criteria\n\n${criteria.join("\n")}\n`;

/** A Ticket of the library closed as completed, with no assignee. */
function ticket(
  number: number,
  body: string,
  fields: Partial<FetchedTicket> = {},
): FetchedTicket {
  return {
    repository: LIBRARY,
    number,
    state: "CLOSED",
    stateReason: "COMPLETED",
    assignees: [],
    body,
    ...fields,
  };
}

const DECISIONS =
  "## Implementation Decisions\n\n" +
  "- **The parser**, a new module:\n" +
  "  - It reads the body.\n" +
  "  - It counts the rows.\n" +
  "- **The board:**\n" +
  "  - The board is unchanged.\n";

const TESTING =
  "## Testing Decisions\n\n" +
  "- **The verdict**, with fixtures:\n" +
  "  - a fully delivered Spec;\n" +
  "\n" +
  "  Its CLI is tested for exit codes.\n";

const NOTES =
  "## Further Notes\n\n" +
  "- **Order:**\n" +
  "  1. The parser comes first.\n" +
  "\n" +
  "Amended on a day: a paragraph outside any list item.\n";

/** The Coverage table of `rows`, each `[item, ticket, criterion]`. */
const table = (...rows: string[][]) =>
  "## Coverage table\n\n" +
  "Written after the split.\n\n" +
  "| Item | Ticket | Criterion |\n| --- | --- | --- |\n" +
  rows.map((row) => `| ${row.join(" | ")} |\n`).join("");

/** Every item of the sections above, with its Ticket and criterion. */
const ROWS = [
  ["a new module", "#11", "A module that parses"],
  ["It reads the body.", "#11", "It reads the body"],
  ["It counts the rows.", "#11", "It counts the rows"],
  ["The board is unchanged.", "#11", "The board is untouched"],
  ["with fixtures", "#12", "Every verdict test"],
  ["a fully delivered Spec;", "#12", "A fully delivered Spec gives no gap"],
  ["Its CLI is tested for exit codes.", "#12", "The CLI is tested"],
  ["The parser comes first.", "#11", "It lands first"],
];

const TICKET_11 = ticket(
  11,
  ticketBody(
    "- [x] A module that parses the body.",
    "- [x] It reads the body and the sub-issues.",
    "- [x] It counts the rows of the table.",
    "- [x] The board is untouched.",
    "- [x] It lands first.",
  ),
);

const TICKET_12 = ticket(
  12,
  ticketBody(
    "- [x] Every verdict test hands the check a Spec.",
    "- [x] A fully delivered Spec gives no gap.",
    "- [x] The CLI is tested for its exit codes.",
  ),
);

/** Spec #10 of the library, its body made of `parts`, with `tickets`. */
function spec(parts: string[], tickets: FetchedTicket[]): FetchedSpec {
  return {
    repository: LIBRARY,
    number: 10,
    title: "The Spec",
    body:
      "Intro.\n\n## Problem Statement\n\n- Not an item.\n\n" +
      parts.join("\n") +
      "\n🤖 Generated with Claude Code\n\n",
    tickets,
  };
}

const DELIVERED = spec(
  [DECISIONS, TESTING, NOTES, table(...ROWS)],
  [TICKET_11, TICKET_12],
);

describe("coverageVerdict", () => {
  it("finds no gap in a fully delivered Spec", () => {
    expect(coverageVerdict(DELIVERED).gaps).toEqual([]);
  });

  it("names every item missing from the table, a paragraph inside a list item and a numbered one included", () => {
    const missing = ROWS.filter(
      ([item]) =>
        ![
          "It counts the rows.",
          "Its CLI is tested for exit codes.",
          "The parser comes first.",
        ].includes(item),
    );
    const verdict = coverageVerdict(
      spec(
        [DECISIONS, TESTING, NOTES, table(...missing)],
        [TICKET_11, TICKET_12],
      ),
    );

    expect(verdict.gaps).toEqual([
      { kind: "no-row", item: "It counts the rows." },
      { kind: "no-row", item: "Its CLI is tested for exit codes." },
      { kind: "no-row", item: "The parser comes first." },
    ]);
  });

  it("takes a quote found in several items for none of them, and names a quote found in no item", () => {
    const rows = ROWS.map((row) =>
      row[0] === "It counts the rows."
        ? ["the", row[1], row[2]]
        : row[0] === "The board is unchanged."
          ? ["The board is gone.", row[1], row[2]]
          : row,
    );
    const verdict = coverageVerdict(
      spec([DECISIONS, TESTING, NOTES, table(...rows)], [TICKET_11, TICKET_12]),
    );

    expect(verdict.gaps).toEqual([
      { kind: "no-row", item: "It counts the rows." },
      { kind: "no-row", item: "The board is unchanged." },
      { kind: "ambiguous-row", item: "the", items: 2 },
      { kind: "no-item", item: "The board is gone." },
    ]);
  });

  it("covers an item written twice, in two sections, once per row that quotes it", () => {
    const twice = (...rows: string[][]) =>
      coverageVerdict(
        spec(
          [
            DECISIONS,
            TESTING.replace(
              "  - a fully delivered Spec;\n",
              "  - a fully delivered Spec;\n  - It reads the body.\n",
            ),
            NOTES,
            table(...ROWS, ...rows),
          ],
          [TICKET_11, TICKET_12],
        ),
      );

    expect(twice().gaps).toEqual([
      { kind: "no-row", item: "It reads the body." },
    ]);
    expect(twice(["It reads the body.", "#11", "It reads"]).gaps).toEqual([]);
  });

  it("names a row whose Ticket is a sub-issue outside the Board repositories as such", () => {
    const rows = ROWS.map((row) =>
      row[0] === "The board is unchanged."
        ? [row[0], "phmilk/other#7", row[2]]
        : row,
    );
    const verdict = coverageVerdict(
      spec(
        [DECISIONS, TESTING, NOTES, table(...rows)],
        [
          TICKET_11,
          TICKET_12,
          ticket(7, TICKET_11.body, {
            repository: "phmilk/other",
            state: "OPEN",
            stateReason: null,
          }),
        ],
      ),
    );

    expect(verdict.gaps).toEqual([
      {
        kind: "outside-board",
        item: "The board is unchanged.",
        ticket: { repository: "phmilk/other", number: 7 },
      },
    ]);
    expect(verdict.tickets).toBe(2);
  });

  it("reads the first table of the section only", () => {
    const verdict = coverageVerdict(
      spec(
        [
          DECISIONS,
          TESTING,
          NOTES,
          table(...ROWS.filter(([item]) => item !== "It counts the rows.")) +
            "\nAn older table, kept for the record:\n\n" +
            "| Item | Ticket | Criterion |\n| --- | --- | --- |\n" +
            "| It counts the rows. | #11 | It counts the rows |\n",
        ],
        [TICKET_11, TICKET_12],
      ),
    );

    expect(verdict.gaps).toEqual([
      { kind: "no-row", item: "It counts the rows." },
    ]);
  });

  it("says a Spec with no Coverage table has none, instead of naming each item", () => {
    const verdict = coverageVerdict(
      spec([DECISIONS, TESTING, NOTES], [TICKET_11, TICKET_12]),
    );

    expect(verdict.gaps).toEqual([{ kind: "no-table" }]);
  });

  it("names a row whose Ticket is not a sub-issue of the Spec", () => {
    const rows = ROWS.map((row) =>
      row[0] === "The board is unchanged." ? [row[0], "#99", row[2]] : row,
    );
    const verdict = coverageVerdict(
      spec([DECISIONS, TESTING, NOTES, table(...rows)], [TICKET_11, TICKET_12]),
    );

    expect(verdict.gaps).toEqual([
      {
        kind: "not-sub-issue",
        item: "The board is unchanged.",
        ticket: { repository: LIBRARY, number: 99 },
      },
    ]);
  });

  it("counts a Ticket in the Template like one in the library, named in full", () => {
    const rows = ROWS.map((row) =>
      row[1] === "#12" ? [row[0], `${TEMPLATE}#12`, row[2]] : row,
    );
    const delivered = coverageVerdict(
      spec(
        [DECISIONS, TESTING, NOTES, table(...rows)],
        [TICKET_11, { ...TICKET_12, repository: TEMPLATE }],
      ),
    );
    const open = coverageVerdict(
      spec(
        [DECISIONS, TESTING, NOTES, table(...rows)],
        [
          TICKET_11,
          {
            ...TICKET_12,
            repository: TEMPLATE,
            state: "OPEN",
            stateReason: null,
          },
        ],
      ),
    );
    const shortForm = coverageVerdict(
      spec(
        [DECISIONS, TESTING, NOTES, table(...ROWS)],
        [TICKET_11, { ...TICKET_12, repository: TEMPLATE }],
      ),
    );

    expect(delivered.gaps).toEqual([]);
    expect(open.gaps).toEqual([
      {
        kind: "open",
        ticket: { repository: TEMPLATE, number: 12 },
        assignees: [],
        unchecked: 0,
      },
    ]);
    expect(shortForm.gaps.map((gap) => gap.kind)).toEqual(
      Array(3).fill("not-sub-issue"),
    );
  });

  it("names an open Ticket with the logins that hold it, counting its unchecked criteria instead of naming each", () => {
    const verdict = coverageVerdict(
      spec(
        [DECISIONS, TESTING, NOTES, table(...ROWS)],
        [
          TICKET_11,
          {
            ...TICKET_12,
            state: "OPEN",
            stateReason: null,
            assignees: ["wyller"],
            body: TICKET_12.body
              .replace("- [x] A fully", "- [ ] A fully")
              .replace("- [x] The CLI", "- [ ] The CLI"),
          },
        ],
      ),
    );

    expect(verdict.gaps).toEqual([
      {
        kind: "open",
        ticket: { repository: LIBRARY, number: 12 },
        assignees: ["wyller"],
        unchecked: 2,
      },
    ]);
  });

  it("names a Ticket closed as not planned", () => {
    const verdict = coverageVerdict(
      spec(
        [DECISIONS, TESTING, NOTES, table(...ROWS)],
        [{ ...TICKET_11, stateReason: "NOT_PLANNED" }, TICKET_12],
      ),
    );

    expect(verdict.gaps).toEqual([
      {
        kind: "not-completed",
        ticket: { repository: LIBRARY, number: 11 },
        reason: "NOT_PLANNED",
      },
    ]);
  });

  it("keeps a close reason GitHub adds later as GitHub writes it", () => {
    const verdict = coverageVerdict(
      spec(
        [DECISIONS, TESTING, NOTES, table(...ROWS)],
        [{ ...TICKET_11, stateReason: "SUPERSEDED" }, TICKET_12],
      ),
    );

    expect(verdict.gaps).toEqual([
      {
        kind: "not-completed",
        ticket: { repository: LIBRARY, number: 11 },
        reason: "SUPERSEDED",
      },
    ]);
  });

  it("names a criterion left unchecked in its Ticket", () => {
    const verdict = coverageVerdict(
      spec(
        [DECISIONS, TESTING, NOTES, table(...ROWS)],
        [
          TICKET_11,
          {
            ...TICKET_12,
            body: TICKET_12.body.replace("- [x] The CLI", "- [ ] The CLI"),
          },
        ],
      ),
    );

    expect(verdict.gaps).toEqual([
      {
        kind: "unchecked",
        ticket: { repository: LIBRARY, number: 12 },
        criterion: "The CLI is tested for its exit codes.",
      },
    ]);
  });

  it("names a row whose criterion its Ticket does not hold", () => {
    const rows = ROWS.map((row) =>
      row[0] === "It reads the body." ? [row[0], row[1], "It writes"] : row,
    );
    const verdict = coverageVerdict(
      spec([DECISIONS, TESTING, NOTES, table(...rows)], [TICKET_11, TICKET_12]),
    );

    expect(verdict.gaps).toEqual([
      {
        kind: "no-criterion",
        item: "It reads the body.",
        ticket: { repository: LIBRARY, number: 11 },
        criterion: "It writes",
      },
    ]);
  });

  it("lists every gap it finds, not only the first", () => {
    const rows = ROWS.filter(([item]) => item !== "It counts the rows.").map(
      (row) => (row[1] === "#12" ? [row[0], "#99", row[2]] : row),
    );
    const verdict = coverageVerdict(
      spec(
        [DECISIONS, TESTING, NOTES, table(...rows)],
        [
          {
            ...TICKET_11,
            state: "OPEN",
            stateReason: null,
            assignees: ["alice", "bob"],
            body: TICKET_11.body.replace("- [x] It lands", "- [ ] It lands"),
          },
          {
            ...TICKET_12,
            body: TICKET_12.body.replace("- [x] A fully", "- [ ] A fully"),
          },
        ],
      ),
    );

    expect(verdict.gaps).toEqual([
      { kind: "no-row", item: "It counts the rows." },
      ...[
        "with fixtures",
        "a fully delivered Spec;",
        "Its CLI is tested for exit codes.",
      ].map((item) => ({
        kind: "not-sub-issue",
        item,
        ticket: { repository: LIBRARY, number: 99 },
      })),
      {
        kind: "open",
        ticket: { repository: LIBRARY, number: 11 },
        assignees: ["alice", "bob"],
        unchecked: 1,
      },
      {
        kind: "unchecked",
        ticket: { repository: LIBRARY, number: 12 },
        criterion: "A fully delivered Spec gives no gap.",
      },
    ]);
  });

  it('names a "check whether…" without its Outcome: line, accepts one with it, and takes no criterion that only mentions one for one', () => {
    const checked = (outcome: string) =>
      ticket(
        13,
        ticketBody(
          "- [x] **Check whether** the token can write the Spec. If it can, it does; if not, it comments.",
          outcome,
          '- [x] The verdict names a "check whether…" without its Outcome: line.',
          "- [x] Check whether the docs agree. If they do, nothing; if not, fix them.",
          "",
          "      Outcome: they agree.",
        ),
      );
    const verdictOf = (outcome: string) =>
      coverageVerdict(
        spec(
          [DECISIONS, TESTING, NOTES, table(...ROWS)],
          [TICKET_11, TICKET_12, checked(outcome)],
        ),
      );

    expect(verdictOf("      Outcome: it can; it does.").gaps).toEqual([]);
    expect(verdictOf("").gaps).toEqual([
      {
        kind: "no-outcome",
        ticket: { repository: LIBRARY, number: 13 },
        criterion:
          "**Check whether** the token can write the Spec. If it can, it does; if not, it comments.",
      },
    ]);
  });
});
