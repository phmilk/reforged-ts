import { describe, expect, it } from "vitest";
import {
  type Api,
  type ClosingPullRequest,
  readClosingPullRequests,
} from "../src/closing-pull-requests.js";

const LIBRARY = "phmilk/reforged-ts";
const TEMPLATE = "phmilk/reforged-ts-template";
const MERGE = "c".repeat(40);

/** A pull request as the fake GitHub holds it. */
interface FakePull {
  repository: string;
  number: number;
  base: string;
  state: "OPEN" | "MERGED" | "CLOSED";
  draft?: boolean;
  body?: string;
  mergeCommit?: string;
  /** The issues GitHub links it to by its closing keywords, into the default branch. */
  links?: readonly { repository: string; number: number }[];
}

/** The state of the fake GitHub: each repository's branches, and the pull requests. */
interface FakeState {
  branches: Readonly<Record<string, readonly string[]>>;
  pulls: readonly FakePull[];
}

/** A pull request node as GitHub's GraphQL API answers it. */
function pullNode(pull: FakePull): unknown {
  return {
    number: pull.number,
    state: pull.state,
    isDraft: pull.draft === true,
    baseRefName: pull.base,
    body: pull.body ?? "",
    mergeCommit:
      pull.state === "MERGED" ? { oid: pull.mergeCommit ?? MERGE } : null,
    repository: { nameWithOwner: pull.repository },
  };
}

/** One page of `nodes`, `first` at a time from the cursor `after` (an index). */
function page(nodes: readonly unknown[], first: number, after: unknown) {
  const start = typeof after === "string" ? Number(after) : 0;
  const end = start + first;
  return {
    pageInfo: { hasNextPage: end < nodes.length, endCursor: String(end) },
    nodes: nodes.slice(start, end),
  };
}

/** A search query the module may send, its parts as GitHub reads them. */
const SEARCH = /^repo:(\S+) is:pr is:merged base:(\S+) (\d+) in:body$/;

/**
 * A stub of GitHub's GraphQL API over `state`, with no network: it answers
 * the three reads of the module (an issue's linked pull requests and the
 * branch `next`, the open pull requests into a branch, and the issue
 * search), as GitHub would, and an error to anything else.
 */
function fakeGitHub(state: FakeState): Api {
  return ({ endpoint, body }) => {
    const { query, variables } = body as {
      query: string;
      variables: Record<string, unknown>;
    };
    const operation = /^\s*query\s+(\w+)/.exec(query)?.[1];
    const repository = `${String(variables.owner)}/${String(variables.name)}`;
    const branches = state.branches[repository] ?? ["master"];
    const data = (): unknown => {
      switch (operation) {
        case "ClosingPullRequests": {
          // includeClosedPrs: false still answers merged ones, as GitHub does.
          const linked = state.pulls.filter(
            (pull) =>
              pull.state !== "CLOSED" &&
              (pull.links ?? []).some(
                (link) =>
                  link.repository === repository &&
                  link.number === variables.number,
              ),
          );
          return {
            repository: {
              ref: branches.includes("next") ? { name: "next" } : null,
              issue: {
                closedByPullRequestsReferences: {
                  totalCount: linked.length,
                  nodes: linked.map(pullNode),
                },
              },
            },
          };
        }
        case "OpenPullRequestsIntoNext":
          return {
            repository: {
              pullRequests: page(
                state.pulls
                  .filter(
                    (pull) =>
                      pull.repository === repository &&
                      pull.base === "next" &&
                      pull.state === "OPEN",
                  )
                  .map(pullNode),
                Number(variables.first),
                variables.cursor,
              ),
            },
          };
        case "MergedPullRequestsIntoNext": {
          const match = SEARCH.exec(String(variables.query));
          if (match === null) throw new Error("An unknown search.");
          const [, searched, base, term] = match;
          return {
            search: page(
              state.pulls
                .filter(
                  (pull) =>
                    pull.repository === searched &&
                    pull.base === base &&
                    pull.state === "MERGED" &&
                    (pull.body ?? "").includes(term),
                )
                .map(pullNode),
              Number(variables.first),
              variables.cursor,
            ),
          };
        }
        default:
          throw new Error(`An unknown operation: ${String(operation)}.`);
      }
    };
    if (endpoint !== "/graphql") {
      return Promise.resolve({ status: 404, body: { message: "Not Found" } });
    }
    return Promise.resolve({ status: 200, body: { data: data() } });
  };
}

/** Issue `number` of the library. */
const libraryIssue = (number: number) => ({ repository: LIBRARY, number });

/** A Closing pull request of the library as the module answers it. */
function answered(
  number: number,
  base: string,
  state: "open" | "merged",
  { draft = false, repository = LIBRARY } = {},
): ClosingPullRequest {
  return {
    repository,
    number,
    base,
    state,
    draft,
    mergeCommit: state === "merged" ? MERGE : null,
  };
}

describe("readClosingPullRequests", () => {
  describe("into the default branch", () => {
    const state: FakeState = {
      branches: { [LIBRARY]: ["master"] },
      pulls: [
        {
          repository: LIBRARY,
          number: 20,
          base: "master",
          state: "OPEN",
          links: [libraryIssue(5)],
        },
        {
          repository: LIBRARY,
          number: 21,
          base: "master",
          state: "OPEN",
          draft: true,
          links: [libraryIssue(5)],
        },
        {
          repository: LIBRARY,
          number: 22,
          base: "master",
          state: "MERGED",
          links: [libraryIssue(5)],
        },
        {
          repository: LIBRARY,
          number: 23,
          base: "master",
          state: "CLOSED",
          links: [libraryIssue(5)],
        },
      ],
    };

    it("answers the open pull requests GitHub links to the issue, ready and draft", async () => {
      expect(
        await readClosingPullRequests(fakeGitHub(state), libraryIssue(5)),
      ).toEqual([
        answered(20, "master", "open"),
        answered(21, "master", "open", { draft: true }),
      ]);
    });

    it("answers the merged ones too, with their merge commit, when asked", async () => {
      expect(
        await readClosingPullRequests(fakeGitHub(state), libraryIssue(5), {
          merged: true,
        }),
      ).toEqual([
        answered(20, "master", "open"),
        answered(21, "master", "open", { draft: true }),
        answered(22, "master", "merged"),
      ]);
    });

    it("answers none of another repository that GitHub links to the issue", async () => {
      const crossed: FakeState = {
        branches: { [LIBRARY]: ["master"] },
        pulls: [
          {
            repository: TEMPLATE,
            number: 30,
            base: "main",
            state: "OPEN",
            links: [libraryIssue(5)],
          },
        ],
      };
      expect(
        await readClosingPullRequests(fakeGitHub(crossed), libraryIssue(5), {
          merged: true,
        }),
      ).toEqual([]);
    });
  });

  describe("into the Next branch", () => {
    /** A pull request of the library into `next`, which GitHub links to nothing. */
    const intoNext = (
      number: number,
      state: FakePull["state"],
      body: string,
      draft = false,
    ): FakePull => ({
      repository: LIBRARY,
      number,
      base: "next",
      state,
      body,
      draft,
    });

    const state: FakeState = {
      branches: { [LIBRARY]: ["master", "next"] },
      pulls: [
        intoNext(40, "OPEN", "Closes #5."),
        intoNext(41, "OPEN", "Fixes: phmilk/reforged-ts#5", true),
        intoNext(42, "MERGED", "Resolves #5"),
        intoNext(43, "CLOSED", "Closes #5"),
        intoNext(44, "OPEN", "Closes #6, a mention of #5 is no keyword."),
        intoNext(45, "OPEN", "Write `Closes #5` in the body."),
        intoNext(46, "MERGED", "```sh\ngh pr create --body 'Closes #5'\n```"),
        intoNext(47, "MERGED", "Closes #55 and #500."),
        intoNext(48, "OPEN", `Closes ${TEMPLATE}#5`),
        {
          repository: TEMPLATE,
          number: 49,
          base: "next",
          state: "OPEN",
          body: `Closes ${LIBRARY}#5`,
        },
        {
          repository: LIBRARY,
          number: 20,
          base: "master",
          state: "OPEN",
          links: [libraryIssue(5)],
        },
      ],
    };

    it("answers the open ones whose closing keywords name the issue, ready and draft, beside those GitHub links", async () => {
      expect(
        await readClosingPullRequests(fakeGitHub(state), libraryIssue(5)),
      ).toEqual([
        answered(20, "master", "open"),
        answered(40, "next", "open"),
        answered(41, "next", "open", { draft: true }),
      ]);
    });

    it("answers the merged ones too, with their merge commit, when asked", async () => {
      expect(
        await readClosingPullRequests(fakeGitHub(state), libraryIssue(5), {
          merged: true,
        }),
      ).toEqual([
        answered(20, "master", "open"),
        answered(40, "next", "open"),
        answered(41, "next", "open", { draft: true }),
        answered(42, "next", "merged"),
      ]);
    });

    it("answers a pull request of the Template into its own next by the Template's issue", async () => {
      const template: FakeState = {
        branches: { [TEMPLATE]: ["main", "next"] },
        pulls: [
          {
            repository: TEMPLATE,
            number: 9,
            base: "next",
            state: "OPEN",
            body: "Closes #5",
          },
          {
            repository: TEMPLATE,
            number: 10,
            base: "next",
            state: "OPEN",
            body: `Closes ${LIBRARY}#5`,
          },
        ],
      };
      expect(
        await readClosingPullRequests(fakeGitHub(template), {
          repository: TEMPLATE,
          number: 5,
        }),
      ).toEqual([answered(9, "next", "open", { repository: TEMPLATE })]);
    });

    it("reads every page of the open pull requests into next", async () => {
      const many: FakeState = {
        branches: { [LIBRARY]: ["master", "next"] },
        pulls: Array.from({ length: 230 }, (_, index) =>
          intoNext(100 + index, "OPEN", index === 229 ? "Closes #5" : ""),
        ),
      };
      expect(
        await readClosingPullRequests(fakeGitHub(many), libraryIssue(5)),
      ).toEqual([answered(329, "next", "open")]);
    });

    it("reads every page of the search for merged ones", async () => {
      const many: FakeState = {
        branches: { [LIBRARY]: ["master", "next"] },
        pulls: Array.from({ length: 230 }, (_, index) =>
          intoNext(
            100 + index,
            "MERGED",
            index === 229 ? "Closes #5" : "See #5",
          ),
        ),
      };
      expect(
        await readClosingPullRequests(fakeGitHub(many), libraryIssue(5), {
          merged: true,
        }),
      ).toEqual([answered(329, "next", "merged")]);
    });

    it("answers none into next in a repository with no branch next", async () => {
      const deleted: FakeState = {
        branches: { [LIBRARY]: ["master"] },
        pulls: [
          intoNext(40, "OPEN", "Closes #5"),
          intoNext(42, "MERGED", "Closes #5"),
        ],
      };
      expect(
        await readClosingPullRequests(fakeGitHub(deleted), libraryIssue(5), {
          merged: true,
        }),
      ).toEqual([]);
    });
  });

  describe("on an answer it cannot read", () => {
    it("stops with GitHub's error", async () => {
      const api: Api = () =>
        Promise.resolve({
          status: 200,
          body: {
            data: null,
            errors: [
              {
                message: "Could not resolve to an Issue with the number of 5.",
              },
            ],
          },
        });
      await expect(
        readClosingPullRequests(api, libraryIssue(5)),
      ).rejects.toThrow(
        "ClosingPullRequests answered: Could not resolve to an Issue with the number of 5.",
      );
    });

    it("stops when GitHub links more pull requests than it read", async () => {
      const api: Api = () =>
        Promise.resolve({
          status: 200,
          body: {
            data: {
              repository: {
                ref: null,
                issue: {
                  closedByPullRequestsReferences: { totalCount: 51, nodes: [] },
                },
              },
            },
          },
        });
      await expect(
        readClosingPullRequests(api, libraryIssue(5)),
      ).rejects.toThrow(
        `${LIBRARY}#5 has 51 linked pull requests, more than the 0 read.`,
      );
    });
  });
});
