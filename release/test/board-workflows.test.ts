import { describe, expect, it } from "vitest";
import { BOARD_OWNER, BOARD_REPOSITORIES } from "../src/board.js";
import { readWorkflow } from "./support/workflows.js";

describe("board.yml", () => {
  it("runs on the issue and pull_request_target events, another Board repository's dispatch, hourly and by hand, one group, contents read, master checked out, the token from the board environment", async () => {
    const {
      text,
      workflow: { on, permissions, concurrency, jobs },
    } = await readWorkflow("board.yml");

    // The event type lists have a copy in the Template's board caller, held
    // equal by tests/pipeline/board.test.ts of phmilk/reforged-ts-template;
    // neither repository reads the other's files in a test.
    expect(on).toEqual({
      issues: {
        types: [
          "opened",
          "reopened",
          "closed",
          "deleted",
          "transferred",
          "assigned",
          "unassigned",
          "labeled",
          "unlabeled",
        ],
      },
      // master's workflow file and checkout, whatever the pull request
      // holds, and the secret for a fork's pull request too: never
      // pull_request, whose run takes the merge commit's file.
      pull_request_target: {
        types: [
          "opened",
          "reopened",
          "closed",
          "edited",
          "converted_to_draft",
          "ready_for_review",
        ],
        // Into master alone: the run is on the base branch's ref, which the
        // environment refuses on any other, and a closing keyword closes
        // nothing outside the default branch.
        branches: ["master"],
      },
      // Another Board repository's event, sent by board-dispatch.yml.
      repository_dispatch: { types: ["board-repository-event"] },
      workflow_dispatch: null,
      schedule: [
        { cron: expect.stringMatching(/^\d+ \* \* \* \*$/) as unknown },
      ],
    });
    // Nothing reads the dispatch's payload: each run reads everything.
    expect(text).not.toContain("client_payload");
    expect(permissions).toEqual({ contents: "read" });
    expect(concurrency).toEqual({
      group: "board",
      "cancel-in-progress": false,
    });
    expect(Object.keys(jobs)).toEqual(["labels", "reconcile"]);
    const job = jobs.reconcile;
    // No fork skip: master's code runs whatever the head, and the
    // environment's branch policy, master only, guards the secret. After
    // the labels, whatever they did: a Status never waits on a label.
    expect(job?.needs).toBe("labels");
    expect(job?.if).toBe("${{ !cancelled() }}");
    expect(job?.environment).toBe("board");
    expect(job?.permissions).toEqual({ contents: "read" });
    const steps = job?.steps ?? [];
    const checkouts = steps.filter((step) =>
      step.uses?.startsWith("actions/checkout@"),
    );
    expect(checkouts).toHaveLength(1);
    expect(checkouts[0]?.with).toMatchObject({
      ref: "master",
      "persist-credentials": false,
    });
    for (const step of steps) {
      expect(step.run ?? "", "a run step").not.toContain("${{");
    }
    const run = steps.filter((step) => step.run !== undefined);
    expect(run.map((step) => step.run)).toEqual(["pnpm board:reconcile"]);
    expect(run[0]?.env).toEqual({
      PROJECT_TOKEN: "${{ secrets.PROJECT_TOKEN }}",
    });
  });

  it("gives the labels to a job in the app environment, with the App's token over both repositories, issues write, master checked out", async () => {
    const {
      workflow: { jobs },
    } = await readWorkflow("board.yml");
    const job = jobs.labels;

    expect(job?.if).toBeUndefined();
    expect(job?.environment).toBe("app");
    expect(job?.permissions).toEqual({ contents: "read" });
    const steps = job?.steps ?? [];
    expect(steps.map((step) => step.uses ?? step.run)).toEqual([
      expect.stringMatching(/^actions\/checkout@[0-9a-f]{40}$/) as unknown,
      "./.github/actions/app-token",
      "./.github/actions/setup-workspace",
      "pnpm board:labels",
    ]);
    expect(steps[0]?.with).toMatchObject({
      ref: "master",
      "persist-credentials": false,
    });
    // The repositories the reconcile reads, by name under the owner.
    expect(steps[1]?.id).toBe("app");
    expect(steps[1]?.with).toEqual({
      "client-id": "${{ vars.APP_CLIENT_ID }}",
      "private-key": "${{ secrets.APP_PRIVATE_KEY }}",
      repository: BOARD_REPOSITORIES.map((repository) =>
        repository.replace(`${BOARD_OWNER}/`, ""),
      ).join(","),
      "permission-contents": "read",
      "permission-issues": "write",
    });
    expect(steps[3]?.env).toEqual({
      LABELS_TOKEN: "${{ steps.app.outputs.token }}",
    });
  });
});

describe("board-dispatch.yml", () => {
  it("is called alone with the App's key passed by name, one job in the caller's board environment, contents read, no checkout, the App's token for the library alone with contents write, a board-repository-event dispatch", async () => {
    const {
      workflow: { on, permissions, jobs },
    } = await readWorkflow("board-dispatch.yml");

    // An environment secret reaches a called job only when the caller
    // passes it (#554): required, so an unpassed key fails the call at
    // startup rather than as an empty key in the token action.
    expect(on).toEqual({
      workflow_call: {
        secrets: {
          APP_PRIVATE_KEY: {
            description: expect.any(String) as unknown,
            required: true,
          },
        },
      },
    });
    expect(permissions).toEqual({ contents: "read" });
    expect(Object.keys(jobs)).toEqual(["dispatch"]);
    const job = jobs.dispatch;
    expect(job?.environment).toBe("board");
    expect(job?.permissions).toEqual({ contents: "read" });
    // The library's board group coalesces the runs; the caller's has none.
    expect(job?.concurrency).toBeUndefined();
    const steps = job?.steps ?? [];
    for (const step of steps) {
      expect(step.uses ?? "", "a checkout").not.toMatch(/^actions\/checkout@/);
      expect(step.run ?? "", "a run step").not.toContain("${{");
    }
    // The token action and gh alone: no other action, no install.
    const uses = steps.flatMap((step) =>
      step.uses === undefined ? [] : [step.uses],
    );
    expect(uses).toEqual([
      expect.stringMatching(/^actions\/create-github-app-token@[0-9a-f]{40}$/),
    ]);
    const token = steps.find((step) => step.uses === uses[0]);
    expect(token?.with).toEqual({
      "client-id": "${{ vars.APP_CLIENT_ID }}",
      "private-key": "${{ secrets.APP_PRIVATE_KEY }}",
      owner: BOARD_OWNER,
      repositories: "reforged-ts",
      "permission-contents": "write",
    });
    // `required` checks only that the key is passed, never its value: the
    // token action alone receives it, and fails on an empty one.
    // One secret in the whole job, a job-level env included: the token's.
    expect(JSON.stringify(job).split("secrets.")).toHaveLength(2);
    const run = steps.filter((step) => step.run !== undefined);
    expect(run).toHaveLength(2);
    // The refusal comes first: no token is minted for a repository off the
    // list.
    expect(steps.map((step) => step.id ?? step.run?.split(/\s/)[0])).toEqual([
      "for",
      "app",
      "gh",
    ]);
    expect(run[0]?.env?.REPOSITORY).toBe("${{ github.repository }}");
    expect(run[0]?.run).toContain("exit 1");
    expect(token?.id).toBe("app");
    // No payload: board.yml reads none.
    expect(run[1]).toMatchObject({
      env: { GH_TOKEN: "${{ steps.app.outputs.token }}" },
      run: `gh api --method POST repos/${BOARD_OWNER}/reforged-ts/dispatches -f event_type=board-repository-event`,
    });
  });

  it("lists the board's repositories other than the library", async () => {
    const {
      workflow: { jobs },
    } = await readWorkflow("board-dispatch.yml");
    const listed =
      jobs.dispatch?.steps?.find(
        (step) => step.env?.BOARD_REPOSITORIES !== undefined,
      )?.env?.BOARD_REPOSITORIES ?? "";

    expect(listed.split(/\s+/).filter(Boolean)).toEqual(
      BOARD_REPOSITORIES.filter(
        (repository) => repository !== `${BOARD_OWNER}/reforged-ts`,
      ),
    );
  });
});
