// The include marker of the docs pages (#979): a line `{@includeCode …}`
// stands for the fenced block of the code it names, in the build, in the
// LLM files and in a Docs version's cut; a missing file or region fails.
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { IncludeCodeError } from "../../packages/reforged-ts/scripts/include-code-reader.mts";
import {
  expandIncludes,
  freezeIncludes,
  includeBlocks,
  replaceIncludes,
} from "../scripts/includes.mts";
import { readText, writeText } from "./support/workspace.mts";

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "reforged-website-includes-"));
  await writeText(
    root,
    "examples/welcome.test.ts",
    'import { it } from "reforged-test/map";\n\nit("greets", () => {});\n',
  );
  await writeText(
    root,
    "examples/regions.test.ts",
    [
      "const hidden = 0;",
      "// #region arrange",
      "  const game = startGame();",
      "// #endregion arrange",
      "",
    ].join("\n"),
  );
  await writeText(root, "examples/ticks.md", "Some ```code``` here.\n");
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

/** The folder of a page under `docs/guides/` of the fixture. */
const pageDir = () => join(root, "docs/guides");

const expand = (markdown: string) =>
  expandIncludes(markdown, pageDir(), "guides/page.md");

describe("expandIncludes", () => {
  it("replaces a marker with a fenced block of the whole file", () => {
    expect(
      expand(
        "Before.\n\n{@includeCode ../../examples/welcome.test.ts}\n\nAfter.\n",
      ),
    ).toBe(
      [
        "Before.",
        "",
        "```ts",
        'import { it } from "reforged-test/map";',
        "",
        'it("greets", () => {});',
        "```",
        "",
        "After.",
        "",
      ].join("\n"),
    );
  });

  it("includes a region, dedented, without its markers", () => {
    expect(
      expand("{@includeCode ../../examples/regions.test.ts#arrange}"),
    ).toBe("```ts\nconst game = startGame();\n```");
  });

  it("indents the block as the marker of a list item is indented", () => {
    expect(
      expand(
        "- A test:\n\n  {@includeCode ../../examples/regions.test.ts#arrange}",
      ),
    ).toBe("- A test:\n\n  ```ts\n  const game = startGame();\n  ```");
  });

  it("makes the fence longer than any run of backticks in the code", () => {
    expect(expand("{@includeCode ../../examples/ticks.md}")).toBe(
      "````md\nSome ```code``` here.\n````",
    );
  });

  it("leaves a marker inside a code block, or within a line, as it is", () => {
    const page = [
      "```md",
      "{@includeCode ../../examples/missing.ts}",
      "```",
      "The tag `{@includeCode ../../examples/missing.ts}` is shown in prose.",
    ].join("\n");

    expect(expand(page)).toBe(page);
  });

  it("fails on a missing file, naming the page and the line", () => {
    expect(() =>
      expand("# A guide\n\n{@includeCode ../../examples/missing.test.ts}\n"),
    ).toThrow(IncludeCodeError);
    expect(() =>
      expand("# A guide\n\n{@includeCode ../../examples/missing.test.ts}\n"),
    ).toThrow(
      /^guides\/page\.md:3: \{@includeCode \.\.\/\.\.\/examples\/missing\.test\.ts\} resolved to .*, which does not exist$/,
    );
  });

  it("fails on a missing region, naming the page and the line", () => {
    expect(() =>
      expand("{@includeCode ../../examples/regions.test.ts#act}"),
    ).toThrow(
      "guides/page.md:1: {@includeCode ../../examples/regions.test.ts#act}: region act was not found",
    );
  });
});

describe("freezeIncludes", () => {
  it("writes the code into a frozen page, resolved against its source page", async () => {
    const marker = "{@includeCode ../../examples/regions.test.ts#arrange}\n";
    await writeText(root, "docs/guides/page.md", `# A guide\n\n${marker}`);
    await writeText(root, "frozen/guides/page.md", `# A guide\n\n${marker}`);
    await writeText(root, "frozen/guides/other.md", "# No marker\n");

    expect(
      await freezeIncludes(join(root, "frozen"), join(root, "docs")),
    ).toEqual(["guides/page.md"]);
    expect(await readText(root, "frozen/guides/page.md")).toBe(
      "# A guide\n\n```ts\nconst game = startGame();\n```\n",
    );
    expect(await readText(root, "docs/guides/page.md")).toBe(
      `# A guide\n\n${marker}`,
    );
  });
});

describe("includeBlocks and replaceIncludes", () => {
  it("replace the markers the LLM files carry as text", async () => {
    await writeText(
      root,
      "docs/guides/page.md",
      "{@includeCode ../../examples/regions.test.ts#arrange}\n",
    );
    const blocks = await includeBlocks(join(root, "docs"));

    expect(
      replaceIncludes(
        "Copy:\n\n  {@includeCode ../../examples/regions.test.ts#arrange}\n\n{@includeCode ../../examples/other.ts}\n",
        blocks,
      ),
    ).toEqual({
      text: "Copy:\n\n  ```ts\n  const game = startGame();\n  ```\n\n{@includeCode ../../examples/other.ts}\n",
      missing: ["{@includeCode ../../examples/other.ts}"],
    });
  });

  it("fail when one marker text includes other code on two pages", async () => {
    await writeText(root, "docs/a/page.md", "{@includeCode examples/x.ts}\n");
    await writeText(root, "docs/b/page.md", "{@includeCode examples/x.ts}\n");
    await writeText(root, "docs/a/examples/x.ts", "const a = 1;\n");
    await writeText(root, "docs/b/examples/x.ts", "const b = 2;\n");

    await expect(includeBlocks(join(root, "docs"))).rejects.toThrow(
      "b/page.md:1: {@includeCode examples/x.ts} includes other code than the same marker on another page",
    );
  });
});

describe("the docs tree", () => {
  const DOCS = fileURLToPath(new URL("../docs", import.meta.url));

  it("includes only files and regions that exist", async () => {
    await expect(includeBlocks(DOCS)).resolves.toBeDefined();
  });

  it("shows the guide's complete test on reforged-test/map from its example file", async () => {
    const guide = await readFile(
      join(DOCS, "guides/testing-your-map.md"),
      "utf8",
    );
    const example = await readFile(
      fileURLToPath(
        new URL(
          "../../packages/reforged-test/examples/welcome.test.ts",
          import.meta.url,
        ),
      ),
      "utf8",
    );

    expect(
      expandIncludes(guide, join(DOCS, "guides"), "guides/testing-your-map.md"),
    ).toContain(
      `\`\`\`ts\n${example.replaceAll("\r\n", "\n").trimEnd()}\n\`\`\``,
    );
  });
});
