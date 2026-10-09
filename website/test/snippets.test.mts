import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  checkSnippets,
  docsSnippets,
  extractSnippets,
  formatProblem,
  type Snippet,
} from "../scripts/snippets.mts";
import { SOURCES } from "../scripts/sources.mts";

/** The website package, whose `node_modules` the snippets resolve from. */
const WEBSITE = fileURLToPath(new URL("..", import.meta.url));
const DOCS = fileURLToPath(new URL("../docs", import.meta.url));

/** The page the fixture snippets are on. */
const PAGE = "guides/fixture.md";

const snippet = (line: number, code: string, title?: string): Snippet => ({
  page: PAGE,
  line,
  ...(title === undefined ? {} : { title }),
  code,
});

const check = (...snippets: Snippet[]) =>
  checkSnippets(snippets, { base: WEBSITE }).map(formatProblem);

describe("extractSnippets", () => {
  it("takes the ts fences of a page, with their title and first line", () => {
    const page = [
      "# A guide", // 1
      "", // 2
      "```ts", // 3
      "const a = 1;", // 4
      "```", // 5
      "", // 6
      '```typescript title="src/main.ts"', // 7
      "import './other';", // 8
      "```", // 9
    ].join("\n");

    expect(extractSnippets(page, PAGE)).toEqual([
      snippet(4, "const a = 1;\n"),
      snippet(8, "import './other';\n", "src/main.ts"),
    ]);
  });

  it("leaves out fragments and the fences of other languages", () => {
    const page = [
      "```ts fragment",
      "unit.kill();",
      "```",
      "```sh",
      "pnpm build",
      "```",
      "```text",
      "reforged-ts: a message",
      "```",
    ].join("\n");

    expect(extractSnippets(page, PAGE)).toEqual([]);
  });

  it("marks a fence whose meta holds builtins", () => {
    const page = ["```ts builtins", "const a = 1;", "```"].join("\n");

    expect(extractSnippets(page, PAGE)).toEqual([
      { ...snippet(2, "const a = 1;\n"), builtins: true },
    ]);
  });

  it("takes the indentation of a fence in a list item off its lines", () => {
    const page = [
      "- An item:",
      "",
      "  ```ts",
      "  if (x) {",
      "    y();",
      "  }",
      "  ```",
    ].join("\n");

    expect(extractSnippets(page, PAGE)).toEqual([
      snippet(4, "if (x) {\n  y();\n}\n"),
    ]);
  });

  it("reads a longer fence to its own closing, past shorter ones", () => {
    const page = ["````md", "```ts", "broken(", "```", "````"].join("\n");

    expect(extractSnippets(page, PAGE)).toEqual([]);
  });
});

describe("checkSnippets", () => {
  it("passes snippets that type-check against the Typings", () => {
    expect(check(snippet(4, "const t: timer = CreateTimer();\n"))).toEqual([]);
  });

  it("locates a type error on its page line and column", () => {
    expect(
      check(snippet(10, "const ok = 1;\nconst u: unit = CreateTimer();\n")),
    ).toEqual([
      `${PAGE}:11:7 TS2739: Type 'timer' is missing the following properties from type 'unit': __unit, __widget`,
    ]);
  });

  it("checks each untitled snippet as a module of its own", () => {
    expect(
      check(
        snippet(4, "const shared = 1;\n"),
        snippet(8, "const shared = 2;\n"),
      ),
    ).toEqual([]);
  });

  it("checks a builtins snippet with the Built-in objects' overloads and constants", () => {
    const code = [
      'import { Units } from "reforged-builtins/units";',
      "declare const footman: unit;",
      "// @ts-expect-error: a unit type's Rawcode where an ability's is expected",
      'UnitAddAbility(footman, FourCC("hfoo"));',
      "// @ts-expect-error: a unit type's Rawcode where an ability's is expected",
      "UnitAddAbility(footman, Units.Footman_hfoo);",
      "",
    ].join("\n");

    expect(check({ ...snippet(4, code), builtins: true })).toEqual([]);
  });

  it("checks every other snippet without them", () => {
    expect(
      check(
        snippet(
          4,
          'declare const footman: unit;\nUnitAddAbility(footman, FourCC("hfoo"));\n',
        ),
      ),
    ).toEqual([]);
  });

  it("lets the snippets of a page import each other by their titles", () => {
    expect(
      check(
        snippet(4, "export const lives = 3;\n", "src/lives.ts"),
        snippet(
          8,
          'import { lives } from "./lives";\nconst n: number = lives;\n',
          "src/main.ts",
        ),
      ),
    ).toEqual([]);
  });

  it("gives every page the Template's generated build mode", () => {
    expect(
      check(
        snippet(
          4,
          'import { devMode } from "./generated/env";\nconst on: boolean = devMode;\n',
        ),
      ),
    ).toEqual([]);
  });

  it("reports a title two snippets of a page share", () => {
    expect(
      check(
        snippet(4, "export {};\n", "src/main.ts"),
        snippet(8, "export {};\n", "src/main.ts"),
      ),
    ).toEqual([
      `${PAGE}:7:1 the title "src/main.ts" is also the title of the snippet at line 3: give one of them another path`,
    ]);
  });

  it("reports a title that is not a .ts file of the Map project", () => {
    expect(check(snippet(4, "export {};\n", "../outside.ts"))).toEqual([
      `${PAGE}:3:1 the title "../outside.ts" is not a relative path to a .ts file of the Map project`,
    ]);
  });
});

describe("the snippets of the docs tree", () => {
  // The collected pages are copies of sources that hold wrong code on
  // purpose (a lint rule's incorrect examples), and the API section is the
  // generated reference.
  const skip = [...SOURCES.flatMap((source) => source.outputs), "api"];

  it("type-check against the library (needs `pnpm build`)", async () => {
    const snippets = await docsSnippets(DOCS, skip);

    expect(snippets.length).toBeGreaterThan(0);
    expect(
      checkSnippets(snippets, { base: WEBSITE }).map(formatProblem),
    ).toEqual([]);
  });
});
