import { describe, expect, it } from "vitest";
import {
  demoteHeadings,
  escapeMdx,
  rewriteLinks,
  sections,
} from "../scripts/markdown.mts";

const upper = (markdown: string) =>
  rewriteLinks(markdown, (destination) => destination.toUpperCase());

describe("rewriteLinks", () => {
  it("rewrites inline links, bracketed destinations and reference definitions", () => {
    expect(upper("[a](x.md#y) [b](<x y.md>)\n\n[c]: ref.md\n")).toBe(
      "[a](X.MD#Y) [b](<X Y.MD>)\n\n[c]: REF.MD\n",
    );
  });

  it("leaves footnotes alone", () => {
    expect(upper("Text[^1].\n\n[^1]: Some note.\n")).toBe(
      "Text[^1].\n\n[^1]: Some note.\n",
    );
  });

  it("leaves code spans and fenced blocks alone", () => {
    expect(upper("`[a](x.md)` [b](y.md)\n\n```md\n[c](z.md)\n```\n")).toBe(
      "`[a](x.md)` [b](Y.MD)\n\n```md\n[c](z.md)\n```\n",
    );
  });

  it("ends a code span at its paragraph", () => {
    expect(upper("A stray ` backtick.\n\n[a](x.md) and ` again.\n")).toBe(
      "A stray ` backtick.\n\n[a](X.MD) and ` again.\n",
    );
  });

  it("opens a code span on a whole backtick run", () => {
    expect(upper("``not a span` [a](x.md)\n")).toBe(
      "``not a span` [a](X.MD)\n",
    );
  });
});

describe("sections", () => {
  it("keeps everything from the first heading of the level on", () => {
    expect(
      sections(
        "# Title\n\nIntro.\n\n## One\n\nA.\n\n### Deeper\n\n## Two\n",
        2,
      ),
    ).toBe("## One\n\nA.\n\n### Deeper\n\n## Two\n");
  });

  it("skips a heading in a fenced block and is empty without a section", () => {
    expect(sections("Intro.\n\n```md\n## code\n```\n", 2)).toBe("");
  });
});

describe("demoteHeadings", () => {
  it("moves every heading down, up to the sixth level, and leaves code alone", () => {
    expect(
      demoteHeadings(
        "## One\n\n#### Four\n\n##### Five\n\n```md\n## code\n```\n#hashtag\n",
        2,
      ),
    ).toBe(
      "#### One\n\n###### Four\n\n###### Five\n\n```md\n## code\n```\n#hashtag\n",
    );
  });
});

describe("escapeMdx", () => {
  it("escapes braces and angle brackets in prose, neither in code nor twice", () => {
    expect(
      escapeMdx(
        "A {b} <C> `{d} <E>` \\{f\\}.\n\n```ts\nconst g = <H>{};\n```\n",
      ),
    ).toBe(
      "A \\{b\\} \\<C> `{d} <E>` \\{f\\}.\n\n```ts\nconst g = <H>{};\n```\n",
    );
  });
});
