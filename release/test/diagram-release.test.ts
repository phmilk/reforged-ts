import { describe, expect, it } from "vitest";
import { releaseDiagram } from "../src/diagram-release.js";
import { tempDir, writeText } from "./support/workspace.js";

/** A repository root holding `text` as its `.github/workflows/release.yml`. */
async function render(text: string): Promise<string> {
  const root = await tempDir("diagram-release");
  await writeText(root, ".github/workflows/release.yml", text);
  return releaseDiagram.render(root);
}

const block = (lines: readonly string[]) =>
  "```mermaid\n" +
  "flowchart LR\n" +
  "  %% diagram: release\n" +
  "  %% Generated from release.yml: its jobs and their needs, each edge labelled by the modes, as the select job decides them, in which the job it leads to runs.\n" +
  lines.map((line) => `  ${line}\n`).join("") +
  "```\n";

describe("the release diagram", () => {
  it("draws every job with its needs, a reusable workflow it calls and the Template's sync", async () => {
    const mermaid = await render(`
on: push
jobs:
  select:
    runs-on: ubuntu-latest
    steps: [{ run: "true" }]
  pack:
    needs: select
    runs-on: ubuntu-latest
    steps: [{ run: "true" }]
  docs-cut:
    needs: [pack]
    uses: ./.github/workflows/docs-cut.yml
  template-dispatch:
    needs: [select, pack]
    runs-on: ubuntu-latest
    steps: [{ run: "true" }]
`);

    expect(mermaid).toBe(
      block([
        'subgraph release_yml["release.yml"]',
        '  select["select"]',
        '  pack["pack"]',
        '  docs_cut["docs-cut"]',
        '  template_dispatch["template-dispatch"]',
        "end",
        'docs_cut_yml[["docs-cut.yml"]]',
        'subgraph template["Template: phmilk/reforged-ts-template"]',
        '  sync_yml(["sync.yml"])',
        "end",
        'select -->|"always"| pack',
        'pack -->|"always"| docs_cut',
        'docs_cut -->|"calls"| docs_cut_yml',
        'select -->|"always"| template_dispatch',
        'pack -->|"always"| template_dispatch',
        'template_dispatch -.->|"dispatches the release"| sync_yml',
      ]),
    );
  });

  it("labels each edge with the modes its job runs in, read from the jobs' conditions and needs", async () => {
    const mermaid = await render(`
on: [push, workflow_dispatch]
jobs:
  select:
    outputs:
      mode: \${{ steps.select.outputs.mode }}
      dry-run: \${{ github.event_name == 'workflow_dispatch' && inputs.dry-run }}
  version:
    needs: select
    if: needs.select.outputs.mode == 'version' && needs.select.outputs.dry-run != 'true'
  version-dry-run:
    needs: select
    if: \${{ needs.select.outputs.mode == 'version' && needs.select.outputs.dry-run == 'true' }}
  pack:
    needs: select
    if: >-
      needs.select.outputs.mode == 'publish' ||
      (needs.select.outputs.mode == 'version' && needs.select.outputs.dry-run == 'true')
  template-gate:
    needs: pack
  publish:
    needs: [select, pack, template-gate]
    if: "'publish' == needs.select.outputs.mode && needs.select.outputs.dry-run != 'true'"
  docs-cut:
    needs: publish
    if: needs.publish.outputs.library-tag != ''
  template-dispatch:
    needs: [select, publish]
    if: >-
      !cancelled() && needs.publish.result == 'success'
  template-dispatch-dry-run:
    needs: [select, template-gate]
    if: needs.select.outputs.dry-run == 'true'
  report:
    needs: select
    if: always() && needs.select.outputs.mode != 'version'
`);

    const edges = mermaid
      .split("\n")
      .filter((line) => line.includes('"|'))
      .map((line) => line.trim());
    expect(edges).toEqual([
      'select -->|"version"| version',
      'select -->|"version (dry run)"| version_dry_run',
      'select -->|"publish, publish (dry run), version (dry run)"| pack',
      'pack -->|"publish, publish (dry run), version (dry run)"| template_gate',
      'select -->|"publish"| publish',
      'pack -->|"publish"| publish',
      'template_gate -->|"publish"| publish',
      'publish -->|"publish"| docs_cut',
      'select -->|"publish"| template_dispatch',
      'publish -->|"publish"| template_dispatch',
      'template_dispatch -.->|"dispatches the release"| sync_yml',
      'select -->|"publish (dry run), version (dry run)"| template_dispatch_dry_run',
      'template_gate -->|"publish (dry run), version (dry run)"| template_dispatch_dry_run',
      'select -->|"another mode, another mode (dry run), publish, publish (dry run)"| report',
    ]);
  });

  it("labels a job that runs in every mode always, and one that runs in none never", async () => {
    const mermaid = await render(`
jobs:
  select: {}
  template-dispatch:
    needs: select
    if: github.repository == 'phmilk/reforged-ts' || needs.select.outputs.mode == 'publish'
  never:
    needs: select
    if: needs.select.outputs.mode == 'publish' && needs.select.outputs.mode == 'version'
`);

    expect(mermaid).toContain('select -->|"always"| template_dispatch\n');
    expect(mermaid).toContain('select -->|"never"| never\n');
  });

  it("refuses a workflow whose job needs a job it does not hold, or lacks the job that dispatches to the Template", async () => {
    await expect(
      render(`
jobs:
  pack: { needs: select }
  template-dispatch: { needs: pack }
`),
    ).rejects.toThrow(
      "The job pack of .github/workflows/release.yml needs select, which the workflow does not hold.",
    );
    await expect(
      render(`
jobs:
  select: {}
`),
    ).rejects.toThrow(
      ".github/workflows/release.yml holds no job template-dispatch, which dispatches the release to the Template's sync.yml: update the external node of release/src/diagram-release.ts.",
    );
  });
});
