import { describe, expect, it } from "vitest";
import { pullRequestCiDiagram } from "../src/diagram-pull-request-ci.js";
import { tempDir, writeText } from "./support/workspace.js";

const CI = `name: ci
on:
  pull_request:
  push:
    branches: [main]
jobs:
  ci:
    name: ci
    strategy:
      matrix:
        os: [ubuntu, windows]
    runs-on: \${{ matrix.os }}-latest
    steps:
      - uses: actions/checkout@0123456789abcdef # v1
      - name: lint
        run: pnpm run lint
      - id: docs
        name: docs:check
        if: >-
          matrix.os == 'ubuntu' &&
            github.event_name == 'pull_request' || false
        run: pnpm run docs:check
      - run: |
          echo one
          echo two
`;

const CLAIM = `name: claim
on:
  pull_request_target:
    types: [opened, edited]
  issues:
    types: [assigned]
jobs:
  claim:
    name: claim
    uses: ./.github/workflows/claim-check.yml
`;

const CLAIM_CHECK = `name: claim-check
on: workflow_call
jobs:
  check:
    name: check
    runs-on: ubuntu-latest
    steps:
      - run: node check.ts
  dispatch:
    needs: check
    if: \${{ !cancelled() && github.repository == 'phmilk/reforged-ts' }}
    runs-on: ubuntu-latest
    steps:
      - run: gh workflow run board.yml
  board-dispatch:
    name: board-dispatch
    needs: check
    if: \${{ !cancelled() && contains(fromJSON('["phmilk/reforged-ts-template"]'), github.repository) }}
    uses: phmilk/reforged-ts/.github/workflows/board-dispatch.yml@master
  after-board:
    needs: board-dispatch
    runs-on: ubuntu-latest
    steps:
      - run: "true"
  remote:
    name: remote
    needs: [check]
    uses: owner/repo/.github/workflows/remote.yml@main
`;

const BOARD_DISPATCH = `name: board-dispatch
on: workflow_call
jobs:
  dispatch:
    runs-on: ubuntu-latest
    steps:
      - run: gh api repos/phmilk/reforged-ts/dispatches
`;

const BOARD = `name: board
on:
  pull_request_target:
    types: [opened, closed]
    branches: [main]
  schedule:
    - cron: "37 * * * *"
jobs:
  reconcile:
    name: reconcile
    runs-on: ubuntu-latest
    steps:
      - run: pnpm board:reconcile
`;

const RELEASE = `name: release
on: [push, workflow_dispatch]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm publish
`;

const ruleset = (...checks: string[]) =>
  JSON.stringify({
    name: "main",
    rules: [
      { type: "deletion" },
      {
        type: "required_status_checks",
        parameters: {
          required_status_checks: checks.map((context) => ({ context })),
        },
      },
    ],
  });

const REQUIRED = ["ci (ubuntu)", "ci (windows)", "claim / check"];

/** A repository root holding the workflows `files` and the ruleset. */
async function repository(
  files: Record<string, string>,
  required: readonly string[] = REQUIRED,
): Promise<string> {
  const root = await tempDir("ci-diagram");
  for (const [name, text] of Object.entries(files)) {
    await writeText(root, `.github/workflows/${name}`, text);
  }
  await writeText(root, ".github/rulesets/master.json", ruleset(...required));
  return root;
}

const WORKFLOWS = {
  "board.yml": BOARD,
  "board-dispatch.yml": BOARD_DISPATCH,
  "ci.yml": CI,
  "claim.yml": CLAIM,
  "claim-check.yml": CLAIM_CHECK,
  "release.yml": RELEASE,
};

describe("the CI diagram of a pull request", () => {
  it("draws the workflows a pull request triggers, their jobs and the required checks, then the steps of ci.yml", async () => {
    const markdown = await pullRequestCiDiagram.render(
      await repository(WORKFLOWS),
    );

    expect(markdown).toBe(
      "```mermaid\n" +
        "flowchart LR\n" +
        "  %% diagram: pull-request-ci\n" +
        "  %% Generated from the workflows a pull_request or pull_request_target event triggers, and the required checks of the committed ruleset.\n" +
        '  contributor(["Contributor, a Collaborator or not"])\n' +
        '  renovate(["Renovate"])\n' +
        '  pull_request(["pull request"])\n' +
        '  contributor -->|"opens, with a changeset"| pull_request\n' +
        '  renovate -->|"opens a dependency upgrade, with no changeset"| pull_request\n' +
        '  subgraph board_yml["board.yml"]\n' +
        '    board_yml_reconcile["reconcile"]\n' +
        "  end\n" +
        '  subgraph ci_yml["ci.yml"]\n' +
        '    ci_yml_ci_ubuntu["ci (ubuntu)"]\n' +
        '    ci_yml_ci_windows["ci (windows)"]\n' +
        "  end\n" +
        '  subgraph claim_yml["claim.yml"]\n' +
        '    subgraph claim_yml_claim["claim-check.yml, called by the job claim"]\n' +
        '      claim_yml_claim_check["claim / check"]\n' +
        '      claim_yml_claim_dispatch["claim / dispatch"]\n' +
        '      subgraph claim_yml_claim_board_dispatch["board-dispatch.yml, called by the job claim / board-dispatch"]\n' +
        '        claim_yml_claim_board_dispatch_dispatch["claim / board-dispatch / dispatch, skipped here"]\n' +
        "      end\n" +
        '      claim_yml_claim_after_board["claim / after-board, skipped here"]\n' +
        '      claim_yml_claim_remote[["claim / remote / (a job of owner/repo/.github/workflows/remote.yml@main)"]]\n' +
        "    end\n" +
        "  end\n" +
        '  pull_request -->|"pull_request_target into main: opened, closed"| board_yml\n' +
        '  pull_request -->|"pull_request"| ci_yml\n' +
        '  pull_request -->|"pull_request_target: opened, edited"| claim_yml\n' +
        "  claim_yml_claim_check --> claim_yml_claim_dispatch\n" +
        "  claim_yml_claim_check --> claim_yml_claim_board_dispatch\n" +
        "  claim_yml_claim_board_dispatch --> claim_yml_claim_after_board\n" +
        "  claim_yml_claim_check --> claim_yml_claim_remote\n" +
        "  classDef required stroke-width:4px\n" +
        "  class ci_yml_ci_ubuntu,ci_yml_ci_windows,claim_yml_claim_check required\n" +
        "  classDef skipped stroke-dasharray:5 5\n" +
        "  class claim_yml_claim_board_dispatch_dispatch,claim_yml_claim_after_board skipped\n" +
        "```\n" +
        "\n" +
        "| #   | Step of `ci.yml`   | `if`                                                                      |\n" +
        "| --- | ------------------ | ------------------------------------------------------------------------- |\n" +
        "| 1   | `actions/checkout` |                                                                           |\n" +
        "| 2   | `lint`             |                                                                           |\n" +
        "| 3   | `docs:check`       | `matrix.os == 'ubuntu' && github.event_name == 'pull_request' \\|\\| false` |\n" +
        "| 4   | `echo one`         |                                                                           |\n",
    );
  });

  it("highlights the checks the committed ruleset requires, whichever they are", async () => {
    const markdown = await pullRequestCiDiagram.render(
      await repository(WORKFLOWS, ["claim / dispatch", "reconcile"]),
    );

    expect(markdown).toContain(
      "  class board_yml_reconcile,claim_yml_claim_dispatch required\n",
    );
  });

  it("names the check of a job of a called workflow after its caller, its job and its own job", async () => {
    const root = await repository(WORKFLOWS, [
      "claim / board-dispatch / dispatch",
    ]);
    await expect(pullRequestCiDiagram.render(root)).resolves.toContain(
      "  class claim_yml_claim_board_dispatch_dispatch required\n",
    );

    await expect(
      pullRequestCiDiagram.render(
        await repository(WORKFLOWS, ["claim / board-dispatch"]),
      ),
    ).rejects.toThrow('requires "claim / board-dispatch", which no job');
    await expect(
      pullRequestCiDiagram.render(
        await repository(WORKFLOWS, ["claim / remote"]),
      ),
    ).rejects.toThrow('requires "claim / remote", which no job');
  });

  it("draws a job its condition keeps from running in this repository as skipped here, and the jobs that need it", async () => {
    const markdown = await pullRequestCiDiagram.render(
      await repository({
        ...WORKFLOWS,
        "claim-check.yml": CLAIM_CHECK.replace(
          "phmilk/reforged-ts-template",
          "phmilk/reforged-ts",
        ),
      }),
    );

    expect(markdown).toContain(
      '        claim_yml_claim_board_dispatch_dispatch["claim / board-dispatch / dispatch"]\n',
    );
    expect(markdown).toContain(
      '      claim_yml_claim_after_board["claim / after-board"]\n',
    );
    expect(markdown).not.toContain("skipped here");
    expect(markdown).not.toContain("classDef skipped");
  });

  it("fails on a check the ruleset requires that no job reports, as after renaming a job or a matrix value", async () => {
    const renamed = CI.replace("os: [ubuntu, windows]", "os: [ubuntu, macos]");

    await expect(
      pullRequestCiDiagram.render(
        await repository({ ...WORKFLOWS, "ci.yml": renamed }),
      ),
    ).rejects.toThrow(
      '.github/rulesets/master.json requires "ci (windows)", which no job of the workflows a pull request triggers reports: rename the job back, or update the ruleset.',
    );
    await expect(
      pullRequestCiDiagram.render(
        await repository({
          ...WORKFLOWS,
          "claim-check.yml": CLAIM_CHECK.replace("name: check", "name: verify"),
        }),
      ),
    ).rejects.toThrow('requires "claim / check", which no job');
  });

  it("names every leg of a matrix of several lists, and refuses one whose check names it cannot tell", async () => {
    const twoLists = CI.replace(
      "os: [ubuntu, windows]",
      "os: [ubuntu, windows]\n        node: [22, 24]",
    );
    const markdown = await pullRequestCiDiagram.render(
      await repository({ ...WORKFLOWS, "ci.yml": twoLists }, [
        "ci (windows, 24)",
      ]),
    );
    expect(markdown).toContain(
      '  subgraph ci_yml["ci.yml"]\n' +
        '    ci_yml_ci_ubuntu_22["ci (ubuntu, 22)"]\n' +
        '    ci_yml_ci_ubuntu_24["ci (ubuntu, 24)"]\n' +
        '    ci_yml_ci_windows_22["ci (windows, 22)"]\n' +
        '    ci_yml_ci_windows_24["ci (windows, 24)"]\n' +
        "  end\n",
    );

    const include = CI.replace(
      "os: [ubuntu, windows]",
      "os: [ubuntu]\n        include:\n          - os: windows",
    );
    await expect(
      pullRequestCiDiagram.render(
        await repository({ ...WORKFLOWS, "ci.yml": include }),
      ),
    ).rejects.toThrow(
      ".github/workflows/ci.yml: the matrix of the job ci is not a set of lists",
    );
  });
});
