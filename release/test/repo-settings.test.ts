import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import {
  LABELS,
  MERGE_SETTINGS,
  parseRuleset,
  planRepositorySettings,
  readRuleset,
  RepoSettingsError,
  requiredStatusChecks,
  type RepositoryState,
  type Ruleset,
} from "../src/repo-settings.js";
import { repositoryRoot } from "../src/workspace.js";

const REPOSITORY = "owner/fork";

const RULESET: Ruleset = {
  name: "master",
  target: "branch",
  rules: [
    {
      type: "required_status_checks",
      parameters: {
        required_status_checks: [{ context: "ci (ubuntu)" }],
      },
    },
  ],
};

/** A repository as GitHub creates it: nothing of this configuration. */
const FRESH: RepositoryState = {
  settings: {
    allow_squash_merge: true,
    allow_merge_commit: true,
    allow_rebase_merge: true,
    allow_auto_merge: false,
    delete_branch_on_merge: false,
  },
  rulesets: [],
  pages: null,
  labels: [
    { name: "bug", color: "d73a4a", description: "Something isn't working" },
    { name: "enhancement", color: "a2eeef", description: null },
  ],
};

/** A repository the script already configured. */
const CONFIGURED: RepositoryState = {
  settings: { ...MERGE_SETTINGS, has_issues: true },
  rulesets: [{ id: 42, name: "master" }],
  pages: { build_type: "workflow" },
  labels: LABELS.map(({ name, color, description }) => ({
    name,
    color,
    description,
  })),
};

describe("planRepositorySettings", () => {
  it("creates everything on a fresh repository", () => {
    const plan = planRepositorySettings(REPOSITORY, RULESET, FRESH);

    expect(
      plan.requests.map(({ method, endpoint }) => `${method} ${endpoint}`),
    ).toEqual([
      "PATCH /repos/owner/fork",
      "POST /repos/owner/fork/rulesets",
      "POST /repos/owner/fork/pages",
      ...LABELS.filter(
        ({ name }) => name !== "bug" && name !== "enhancement",
      ).map(() => "POST /repos/owner/fork/labels"),
    ]);
    expect(plan.requests[0]?.body).toEqual({
      allow_squash_merge: true,
      allow_merge_commit: false,
      allow_rebase_merge: false,
      allow_auto_merge: true,
      delete_branch_on_merge: true,
    });
    expect(plan.requests[1]?.body).toBe(RULESET);
    expect(plan.requests[2]?.body).toEqual({ build_type: "workflow" });
  });

  it("creates the missing labels with their committed colour and description", () => {
    const plan = planRepositorySettings(REPOSITORY, RULESET, FRESH);
    const created = plan.requests
      .filter(({ endpoint }) => endpoint.endsWith("/labels"))
      .map(({ body }) => body);

    expect(created).toContainEqual({
      name: "game-patch",
      color: expect.stringMatching(/^[0-9a-f]{6}$/i) as unknown,
      description: expect.any(String) as unknown,
    });
    expect(created.map((body) => (body as { name: string }).name)).toEqual(
      LABELS.map(({ name }) => name).filter(
        (name) => name !== "bug" && name !== "enhancement",
      ),
    );
  });

  it("updates the ruleset of the same name in place", () => {
    const plan = planRepositorySettings(REPOSITORY, RULESET, {
      ...CONFIGURED,
      rulesets: [
        { id: 7, name: "tags" },
        { id: 42, name: "master" },
      ],
    });

    expect(plan.requests).toEqual([
      {
        method: "PUT",
        endpoint: "/repos/owner/fork/rulesets/42",
        body: RULESET,
        summary: 'Update the ruleset "master" (id 42).',
      },
    ]);
  });

  it("changes nothing else on a configured repository", () => {
    const plan = planRepositorySettings(REPOSITORY, RULESET, CONFIGURED);

    expect(plan.requests.map(({ method }) => method)).toEqual(["PUT"]);
    expect(plan.unchanged).toEqual([
      "Merge settings: squash merge only, auto-merge, head branches deleted.",
      "Pages source: GitHub Actions.",
      `Labels: ${LABELS.map(({ name }) => name).join(", ")}.`,
    ]);
  });

  it("moves an existing Pages site to the GitHub Actions source", () => {
    const plan = planRepositorySettings(REPOSITORY, RULESET, {
      ...CONFIGURED,
      pages: { build_type: "legacy" },
    });

    expect(plan.requests).toContainEqual({
      method: "PUT",
      endpoint: "/repos/owner/fork/pages",
      body: { build_type: "workflow" },
      summary: "Set the Pages source to GitHub Actions.",
    });
  });

  it("changes the merge settings when one differs", () => {
    const plan = planRepositorySettings(REPOSITORY, RULESET, {
      ...CONFIGURED,
      settings: { ...MERGE_SETTINGS, allow_rebase_merge: true },
    });

    expect(plan.requests[0]).toMatchObject({
      method: "PATCH",
      endpoint: "/repos/owner/fork",
      body: MERGE_SETTINGS,
    });
  });

  it("updates game-patch to its committed colour and description", () => {
    const gamePatch = LABELS.find(({ name }) => name === "game-patch");
    const plan = planRepositorySettings(REPOSITORY, RULESET, {
      ...CONFIGURED,
      labels: [
        ...CONFIGURED.labels.filter(({ name }) => name !== "game-patch"),
        { name: "Game-Patch", color: "000000", description: "old" },
      ],
    });

    expect(plan.requests).toContainEqual({
      method: "PATCH",
      endpoint: "/repos/owner/fork/labels/Game-Patch",
      body: {
        new_name: "game-patch",
        color: gamePatch?.color,
        description: gamePatch?.description,
      },
      summary: "Update the label game-patch.",
    });
  });

  it("keeps the colour and description of the other existing labels", () => {
    const plan = planRepositorySettings(REPOSITORY, RULESET, {
      ...CONFIGURED,
      labels: CONFIGURED.labels.map((label) => ({
        ...label,
        color: label.name === "game-patch" ? label.color : "000000",
        description: label.name === "game-patch" ? label.description : null,
      })),
    });

    expect(plan.requests.map(({ method }) => method)).toEqual(["PUT"]);
  });

  it("matches label names regardless of case, colours too", () => {
    const plan = planRepositorySettings(REPOSITORY, RULESET, {
      ...CONFIGURED,
      labels: CONFIGURED.labels.map((label) => ({
        ...label,
        name:
          label.name === "game-patch" ? label.name : label.name.toUpperCase(),
        color: label.color.toUpperCase(),
      })),
    });

    expect(plan.requests.map(({ method }) => method)).toEqual(["PUT"]);
  });

  it("rejects a repository that is not owner/name", () => {
    expect(() =>
      planRepositorySettings("owner/fork/extra", RULESET, FRESH),
    ).toThrow(RepoSettingsError);
  });
});

describe("parseRuleset", () => {
  it("reads the committed ruleset", async () => {
    const ruleset = await readRuleset(repositoryRoot);

    expect(ruleset.name).toBe("master");
    expect(ruleset.target).toBe("branch");
  });

  it("rejects text that is not a JSON object with a name", () => {
    expect(() => parseRuleset("[]", "ruleset.json")).toThrow(
      "ruleset.json: not a ruleset (a JSON object with a name).",
    );
    expect(() => parseRuleset("{", "ruleset.json")).toThrow(/^ruleset\.json: /);
  });
});

describe("the committed ruleset", () => {
  it("requires exactly the checks of ci.yml's matrix", async () => {
    const ruleset = await readRuleset(repositoryRoot);
    const workflow = parse(
      await readFile(
        join(repositoryRoot, ".github", "workflows", "ci.yml"),
        "utf8",
      ),
    ) as {
      jobs: Record<
        string,
        { name?: string; strategy?: { matrix?: Record<string, unknown[]> } }
      >;
    };

    // GitHub names a matrix leg `<job name> (<values>)`; with one matrix key
    // that is the key's value. A second key changes the names, so this test
    // stops at it rather than guess.
    const names = Object.entries(workflow.jobs).flatMap(([id, job]) => {
      const matrix = job.strategy?.matrix ?? {};
      const keys = Object.keys(matrix);
      expect(keys.length, `ci.yml job ${id}: matrix keys`).toBeLessThanOrEqual(
        1,
      );
      const values = keys.length === 0 ? [] : (matrix[keys[0] ?? ""] ?? []);
      const name = job.name ?? id;
      return values.length === 0
        ? [name]
        : values.map((value) => `${name} (${String(value)})`);
    });

    expect(requiredStatusChecks(ruleset).toSorted()).toEqual(names.toSorted());
  });

  it("lists every label the issue forms apply", async () => {
    const folder = join(repositoryRoot, ".github", "ISSUE_TEMPLATE");
    const forms = [
      "bug-report.yml",
      "feature-request.yml",
      "new-game-patch.yml",
    ];
    const applied = new Set<string>();
    for (const form of forms) {
      const { labels } = parse(await readFile(join(folder, form), "utf8")) as {
        labels?: string[];
      };
      for (const label of labels ?? []) applied.add(label);
    }

    expect(applied.size).toBeGreaterThan(0);
    expect(LABELS.map(({ name }) => name)).toEqual(
      expect.arrayContaining([...applied]),
    );
  });
});

describe("requiredStatusChecks", () => {
  it("reads the contexts of the required_status_checks rule", () => {
    expect(requiredStatusChecks(RULESET)).toEqual(["ci (ubuntu)"]);
  });

  it("is empty without the rule", () => {
    expect(requiredStatusChecks({ name: "x", rules: [] })).toEqual([]);
  });
});
