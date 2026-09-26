import { describe, expect, it } from "vitest";
import { collect } from "../scripts/collector.mts";
import {
  fixture,
  PLUGIN,
  readText,
  REPOSITORY_FILES,
} from "./support/workspace.mts";

const GITHUB = "https://github.com/phmilk/reforged-ts/blob/master";

/** The fixture repository with `changes`: a file set, or removed if null. */
function changed(
  changes: Readonly<Record<string, string | null>>,
): Record<string, string> {
  const files: Record<string, string> = {};
  for (const [path, text] of Object.entries({
    ...REPOSITORY_FILES,
    ...changes,
  })) {
    if (text !== null) files[path] = text;
  }
  return files;
}

describe("the lint rule pages", () => {
  it("copies one page per rule of the plugin under the Lint rules guide", async () => {
    const workspace = await fixture();
    const report = await collect(workspace);
    expect(
      report.collected.find(({ source }) => source === "the lint rule pages")
        ?.paths,
    ).toEqual([
      "guides/lint-rules/index.md",
      "guides/lint-rules/no-sleep.md",
      "guides/lint-rules/prefer-timer.md",
      "guides/lint-rules/_category_.json",
    ]);
    expect(
      await readText(workspace.docs, "guides/lint-rules/_category_.json"),
    ).toBe(`{\n  "label": "Lint rules",\n  "position": 10\n}\n`);
  });

  it("gives a rule's page the rule's name and its source's edit link, and links the other rules", async () => {
    const workspace = await fixture();
    await collect(workspace);
    const page = await readText(
      workspace.docs,
      "guides/lint-rules/no-sleep.md",
    );
    expect(page).toContain(`title: "no-sleep"
sidebar_position: 1
custom_edit_url: ${GITHUB}/${PLUGIN}/docs/no-sleep.md
`);
    expect(page).not.toContain("# no-sleep");
    expect(page).toContain(
      "the replacement is [`prefer-timer`](./prefer-timer.md).",
    );
    expect(page).toContain(
      "// eslint-disable-next-line reforged/no-sleep -- a trigger action",
    );
  });

  it("lists every rule with its summary on the index", async () => {
    const workspace = await fixture();
    await collect(workspace);
    const index = await readText(workspace.docs, "guides/lint-rules/index.md");
    expect(index).toContain(`title: "Lint rules"`);
    expect(index).toContain(`custom_edit_url: null`);
    expect(index).toContain(`## Rules

- [\`no-sleep\`](./no-sleep.md): Reports a call to \`TriggerSleepAction\`. An error in the recommended config; the replacement is [\`prefer-timer\`](./prefer-timer.md).
- [\`prefer-timer\`](./prefer-timer.md): Reports a wait loop. A warning in the recommended config; the replacement is a Timer.
`);
    expect(index).toContain(
      "// eslint-disable-next-line reforged/<rule> -- <why the code is safe here>",
    );
  });

  it("fails naming the rule when a rule of the recommended config has no page", async () => {
    const workspace = await fixture(
      changed({ [`${PLUGIN}/docs/prefer-timer.md`]: null }),
    );
    await expect(collect(workspace)).rejects.toThrow(
      `docs:collect failed:\n- [ ] the lint rule pages: the rule \`prefer-timer\` of the plugin's recommended config has no page: add \`${PLUGIN}/docs/prefer-timer.md\`.`,
    );
  });

  it("fails naming the file when a page has no rule", async () => {
    const workspace = await fixture(
      changed({ [`${PLUGIN}/docs/no-wait.md`]: "# no-wait\n\nReports.\n" }),
    );
    await expect(collect(workspace)).rejects.toThrow(
      `docs:collect failed:\n- [ ] the lint rule pages: \`${PLUGIN}/docs/no-wait.md\` is the page of no rule of the plugin's recommended config: register the rule in \`${PLUGIN}/src/rules/index.ts\`, or delete the page.`,
    );
  });

  it("names every rule without a page and every page without a rule at once", async () => {
    const workspace = await fixture(
      changed({
        [`${PLUGIN}/docs/no-sleep.md`]: null,
        [`${PLUGIN}/docs/prefer-timer.md`]: null,
        [`${PLUGIN}/docs/no-wait.md`]: "# no-wait\n\nReports.\n",
      }),
    );
    const failure = collect(workspace);
    await expect(failure).rejects.toThrow(
      "the lint rule pages: the rule `no-sleep` of",
    );
    await expect(failure).rejects.toThrow(
      "the lint rule pages: the rule `prefer-timer` of",
    );
    await expect(failure).rejects.toThrow(
      `the lint rule pages: \`${PLUGIN}/docs/no-wait.md\` is the page of no rule`,
    );
  });

  it("fails on a registry that registers no rule", async () => {
    const workspace = await fixture(
      changed({
        [`${PLUGIN}/src/rules/index.ts`]: "export const ruleEntries = [];\n",
      }),
    );
    await expect(collect(workspace)).rejects.toThrow(
      `the lint rule pages: \`${PLUGIN}/src/rules/index.ts\` registers no rule: the collector reads one \`import <name> from "./<rule>.js";\` line per rule.`,
    );
  });

  it("fails on a plugin without a registry", async () => {
    const workspace = await fixture(
      changed({ [`${PLUGIN}/src/rules/index.ts`]: null }),
    );
    await expect(collect(workspace)).rejects.toThrow(
      `the lint rule pages: \`${PLUGIN}/src/rules/index.ts\` does not exist.`,
    );
  });
});
