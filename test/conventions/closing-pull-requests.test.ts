// The convention test of the Closing pull requests command (#1089): the
// Template Tickets procedure of `ship-spec` finds the merged pull requests
// of a library blocker with `pnpm closing-pull-requests`, which reads a
// pull request into the Next branch too, and no longer with GitHub's link
// (`closedByPullRequestsReferences`), which a pull request into `next`
// lacks. The command is a root script, and the README's "Commands" names
// its JSON shape as a contract with that file.
import { describe, expect, it } from "vitest";

import { section } from "./markdown.js";
import { read } from "./repository.js";

const TEMPLATE_TICKETS = ".claude/skills/ship-spec/template-tickets.md";
const COMMAND =
  "pnpm closing-pull-requests phmilk/reforged-ts#<blocker> --json";

describe('template-tickets.md, "A library version not yet published"', () => {
  const steps = (
    section(read(TEMPLATE_TICKETS), "## A library version not yet published") ??
    []
  ).join("\n");

  it("finds a blocker's merged pull requests with the command, by their state and merge commit", () => {
    expect(steps).toContain(COMMAND);
    expect(steps).toContain("`state` is `merged`");
    expect(steps).toContain("`mergeCommit`");
  });

  it("no longer reads GitHub's link, which a pull request into next lacks", () => {
    expect(read(TEMPLATE_TICKETS)).not.toContain(
      "closedByPullRequestsReferences",
    );
  });
});

describe("the command", () => {
  it("is a root script that Node runs from source, with no install", () => {
    const { scripts } = JSON.parse(read("package.json")) as {
      scripts: Record<string, string>;
    };
    expect(scripts["closing-pull-requests"]).toBe(
      "node release/src/closing-pull-requests.ts",
    );
  });

  it("is named in the README's Commands, with its shape a contract with template-tickets.md", () => {
    const row = (section(read("README.md"), "## Commands") ?? []).find((line) =>
      line.startsWith("| `pnpm closing-pull-requests"),
    );
    expect(
      row,
      "the row of the command in the README's Commands",
    ).toBeDefined();
    for (const part of [
      "--json",
      "{ issue, pullRequests: [{ repository, number, base, state, draft, mergeCommit }] }",
      "template-tickets.md",
    ]) {
      expect(row, `the row names ${part}`).toContain(part);
    }
  });
});
