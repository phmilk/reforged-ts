// The site's Mermaid diagrams (#676, ADR 0019): the check of the build that
// no page of a docs version shows a `mermaid` block as code, on a build
// folder written here.
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mermaidProblems } from "../../mermaid";

let build: string;

beforeEach(async () => {
  build = await mkdtemp(join(tmpdir(), "reforged-website-mermaid-"));
});

afterEach(async () => {
  await rm(build, { recursive: true, force: true });
});

async function write(path: string, text: string): Promise<void> {
  await mkdir(dirname(join(build, path)), { recursive: true });
  await writeFile(join(build, path), text);
}

/** A `mermaid` block as Docusaurus renders it when Mermaid is off. */
const AS_CODE =
  '<div class="language-mermaid codeBlockContainer_Ckt0"><pre tabindex="0" class="prism-code language-mermaid codeBlock_bY9V"><code>flowchart LR</code></pre></div>';

describe("the check of the Mermaid diagrams", () => {
  it("accepts pages whose blocks are diagrams, and other code", async () => {
    await write(
      "docs/next/contributing/guide.html",
      '<p>The packages:</p><pre class="prism-code language-ts"><code>flowchart</code></pre>',
    );
    await write("docs/next.html", "<h1>reforged-ts</h1>");

    expect(mermaidProblems(build)).toEqual([]);
  });

  it("names each page of a docs version that shows a block as code", async () => {
    await write("docs/next/contributing/guide.html", AS_CODE);
    await write("docs/1.0/contributing/guide.html", AS_CODE);
    await write("docs/next/guides/events.html", "<h1>Events</h1>");

    expect(mermaidProblems(build)).toEqual([
      "docs/1.0/contributing/guide.html shows a mermaid block as code.",
      "docs/next/contributing/guide.html shows a mermaid block as code.",
    ]);
  });

  it("reads the docs alone, not the Typings' reference", async () => {
    await write("typings/3.0.1/functions/KillUnit.html", AS_CODE);

    expect(mermaidProblems(build)).toEqual([]);
  });
});
