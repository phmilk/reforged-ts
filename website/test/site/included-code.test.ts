// The include marker of a hand-written page under the site's Markdown
// compiler (#979): the build's preprocessor expands it into the fenced block
// of the code it names before MDX reads the page, and a marker whose file
// does not exist fails the page. `pnpm check` builds no site, so this is
// where such a page fails first.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { compile, SITE } from "./compile";

const GUIDE = join(SITE, "docs/guides/testing-your-map.md");

describe("a page's include marker", () => {
  it("compiles in the guide as the code of its example file", async () => {
    const code = await compile(GUIDE, await readFile(GUIDE, "utf8"));

    expect(code).not.toContain("@includeCode");
    expect(code).toContain("greets the players when the game starts");
  });

  it("fails the page when its file does not exist", async () => {
    await expect(
      compile(
        GUIDE,
        "# A guide\n\n{@includeCode ../../../packages/reforged-test/examples/missing.test.ts}\n",
      ),
    ).rejects.toThrow(
      "guides/testing-your-map.md:3: {@includeCode ../../../packages/reforged-test/examples/missing.test.ts} resolved to",
    );
  });
});
