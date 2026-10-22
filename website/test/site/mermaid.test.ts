// The site's Mermaid diagrams (#676, ADR 0019): the check of the build that
// every `mermaid` block of a docs page reaches the build as the theme's
// Mermaid component, which draws it in the light and the dark theme, and
// that no page shows one as code; on a build folder written here.
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

/** A page's source holding two diagrams, the first with quotes and an arrow. */
const SOURCE = [
  "# Intro",
  "",
  "```mermaid",
  "flowchart LR",
  "  %% diagram: tiny",
  '  a["it\'s \\"x\\""] --> b',
  "```",
  "",
  "```ts",
  "const mermaid = 1;",
  "```",
  "",
  "~~~mermaid",
  "stateDiagram-v2",
  "  %% diagram: two",
  "  [*] --> x",
  "~~~",
  "",
].join("\n");

// The page's chunk as Docusaurus 3.10 (Rspack, SWC) minifies the compiled
// MDX of SOURCE: each block the `value` of a `mermaid` element, its text a
// string literal in either quote, `>` escaped.
const PAGE_CHUNK = String.raw`(0,i.jsx)(t.p,{children:"Text."}),"\n",(0,i.jsx)(t.mermaid,{value:'flowchart LR\n  %% diagram: tiny\n  a["it\'s \\"x\\""] --\x3e b'}),"\n",(0,i.jsx)(t.mermaid,{value:"stateDiagram-v2\n  %% diagram: two\n  [*] --\x3e x"})`;

/** The theme's Mermaid component, bundled. */
const THEME_CHUNK =
  'function c({renderResult:e}){return(0,i.jsx)("div",{ref:t,className:`docusaurus-mermaid-container ${s.container}`})}';

/** The theme config Docusaurus validates, with the theme's defaults. */
const THEME_CONFIG = {
  mermaid: { theme: { light: "default", dark: "dark" }, options: {} },
};

const PAGE = "@site/docs/contributing/guide.md";

describe("the check of the Mermaid diagrams", () => {
  it("accepts a build where each block of a page reaches the theme's Mermaid component, in the light and the dark theme", async () => {
    await write("assets/js/common.f3591c00.js", PAGE_CHUNK);
    await write("assets/js/main.97568b94.js", THEME_CHUNK);
    await write("docs/next/contributing/guide.html", "<h1>Guide</h1>");

    expect(
      mermaidProblems({
        outDir: build,
        sources: new Map([[PAGE, SOURCE]]),
        themeConfig: THEME_CONFIG,
      }),
    ).toEqual([]);
  });

  it("names a page whose block reaches no Mermaid component of the build", async () => {
    await write(
      "assets/js/common.f3591c00.js",
      PAGE_CHUNK.replace("diagram: two", "diagram: other"),
    );
    await write("assets/js/main.97568b94.js", THEME_CHUNK);

    expect(
      mermaidProblems({
        outDir: build,
        sources: new Map([[PAGE, SOURCE]]),
        themeConfig: THEME_CONFIG,
      }),
    ).toEqual([
      `${PAGE}: its mermaid block "stateDiagram-v2" (line 13) reaches no Mermaid component of the build.`,
    ]);
  });

  it("fails when the build holds no Mermaid component of the theme, or its config lacks a light or a dark theme", async () => {
    await write("assets/js/common.f3591c00.js", PAGE_CHUNK);

    expect(
      mermaidProblems({
        outDir: build,
        sources: new Map([[PAGE, SOURCE]]),
        themeConfig: { mermaid: { theme: { light: "default" } } },
      }),
    ).toEqual([
      "The build holds no Mermaid component of @docusaurus/theme-mermaid.",
      "themeConfig.mermaid.theme names no dark Mermaid theme.",
    ]);
  });

  it("names each page of a docs version that shows a block as code", async () => {
    await write("docs/next/contributing/guide.html", AS_CODE);
    await write("docs/1.0/contributing/guide.html", AS_CODE);
    await write("docs/next/guides/events.html", "<h1>Events</h1>");
    await write(
      "docs/next/guides/other.html",
      '<pre class="prism-code language-ts"><code>flowchart</code></pre>',
    );

    expect(
      mermaidProblems({
        outDir: build,
        sources: new Map(),
        themeConfig: THEME_CONFIG,
      }),
    ).toEqual([
      "docs/1.0/contributing/guide.html shows a mermaid block as code.",
      "docs/next/contributing/guide.html shows a mermaid block as code.",
    ]);
  });

  it("reads the docs alone, not the Typings' reference", async () => {
    await write("typings/3.0.1/functions/KillUnit.html", AS_CODE);

    expect(
      mermaidProblems({
        outDir: build,
        sources: new Map(),
        themeConfig: THEME_CONFIG,
      }),
    ).toEqual([]);
  });
});
