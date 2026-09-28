// The build's include-code step (scripts/include-code.mts): every
// `{@includeCode}` of the emitted declarations becomes a fenced block that
// stays inside its doc comment, in each form TypeDoc reads, and an include
// that cannot be expanded fails the build. Each test writes its own
// declarations and example files to a temporary folder.

import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  expandDeclarations,
  expandIncludeCode,
  IncludeCodeError,
} from "../../scripts/include-code.mts";
import { packageRoot } from "./support/package-root";

const script = join(packageRoot, "scripts", "include-code.mts");

/** An example as the examples folder holds one. */
const EXAMPLE = [
  "// Creates a Trigger.",
  'import { Trigger } from "reforged-ts";',
  "",
  "// #region create",
  "  const trigger = Trigger.create();",
  "    trigger.enable();",
  "// #endregion create",
  "// #region destroy",
  "trigger.destroy();",
  "// #endregion destroy",
  "",
].join("\n");

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "reforged-ts-include-code-"));
  await put("examples/example.ts", EXAMPLE);
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

async function put(file: string, text: string): Promise<void> {
  await mkdir(dirname(join(dir, file)), { recursive: true });
  await writeFile(join(dir, file), text);
}

/**
 * A declaration file of src/handles/, one doc comment holding `line` after
 * an `@example` tag, titled `title` when one is given.
 */
function declaration(line: string, title?: string): string {
  return [
    "export declare class Trigger {",
    "    /**",
    "     * Enables the trigger.",
    "     *",
    title === undefined ? "     * @example" : `     * @example ${title}`,
    `     * ${line}`,
    "     */",
    "    enable(): void;",
    "}",
    "",
  ].join("\n");
}

/** Expands a declaration file of src/handles/ as the build does. */
function expandFile(text: string): string {
  return expandIncludeCode(
    text,
    join(dir, "src", "handles"),
    "handles/trigger.d.ts",
  );
}

/** Expands `line` as the comment of src/handles/trigger.ts; the comment's lines. */
function expand(line: string): string[] {
  const lines = expandFile(declaration(line)).split("\n");
  return lines.slice(5, lines.indexOf("     */"));
}

describe("expandIncludeCode", () => {
  it("expands a whole file into a fenced block with the file's language", () => {
    expect(expand("{@includeCode ../../examples/example.ts}")).toEqual([
      "     * ```ts",
      "     * // Creates a Trigger.",
      '     * import { Trigger } from "reforged-ts";',
      "     *",
      "     * // #region create",
      "     *   const trigger = Trigger.create();",
      "     *     trigger.enable();",
      "     * // #endregion create",
      "     * // #region destroy",
      "     * trigger.destroy();",
      "     * // #endregion destroy",
      "     * ```",
    ]);
  });

  it("expands a region without its markers, dedented", () => {
    expect(expand("{@includeCode ../../examples/example.ts#create}")).toEqual([
      "     * ```ts",
      "     * const trigger = Trigger.create();",
      "     *   trigger.enable();",
      "     * ```",
    ]);
  });

  it("concatenates several regions", () => {
    expect(
      expand("{@includeCode ../../examples/example.ts#create,destroy}"),
    ).toEqual([
      "     * ```ts",
      "     * const trigger = Trigger.create();",
      "     *   trigger.enable();",
      "     * trigger.destroy();",
      "     * ```",
    ]);
  });

  it("expands line ranges and single lines", () => {
    expect(expand("{@includeCode ../../examples/example.ts:1-2,9}")).toEqual([
      "     * ```ts",
      "     * // Creates a Trigger.",
      '     * import { Trigger } from "reforged-ts";',
      "     * trigger.destroy();",
      "     * ```",
    ]);
  });

  it("puts a titled example's title on a line of its own, keeping the code's indentation", () => {
    const lines = expandFile(
      declaration(
        "{@includeCode ../../examples/example.ts#create}",
        "Enabling a trigger",
      ),
    ).split("\n");
    expect(lines.slice(4, lines.indexOf("     */"))).toEqual([
      "     * @example",
      "     * Enabling a trigger",
      "     * ```ts",
      "     * const trigger = Trigger.create();",
      "     *   trigger.enable();",
      "     * ```",
    ]);
  });

  it("leaves an untitled example's lines as they are", () => {
    const text = declaration("{@includeCode ../../examples/example.ts#create}");
    expect(expandFile(text)).toBe(
      text.replace(
        "{@includeCode ../../examples/example.ts#create}",
        "```ts\n     * const trigger = Trigger.create();\n     *   trigger.enable();\n     * ```",
      ),
    );
  });

  it("leaves the title of an example without an include on its tag's line", () => {
    const text = declaration("`trigger.enable();`", "Enabling a trigger");
    expect(expandFile(text)).toBe(text);
  });

  it("expands an include standing where a titled example's title would", () => {
    const lines = expandFile(
      declaration(
        "{@includeCode ../../examples/example.ts:9}",
        "{@includeCode ../../examples/example.ts:9}",
      ),
    ).split("\n");
    expect(lines.slice(4, lines.indexOf("     */"))).toEqual([
      "     * @example",
      "     * ```ts",
      "     * trigger.destroy();",
      "     * ```",
      "     * ```ts",
      "     * trigger.destroy();",
      "     * ```",
    ]);
  });

  it("keeps the text around the tag on lines of its own", () => {
    expect(
      expand("Before: {@includeCode ../../examples/example.ts:9} after."),
    ).toEqual([
      "     * Before:",
      "     * ```ts",
      "     * trigger.destroy();",
      "     * ```",
      "     * after.",
    ]);
  });

  it("keeps a comment end in the code from closing the doc comment", async () => {
    await put("examples/comment.ts", "/* a note */\nlet a = 1;\n");
    expect(expand("{@includeCode ../../examples/comment.ts}")).toEqual([
      "     * ```ts",
      "     * /* a note *\\/",
      "     * let a = 1;",
      "     * ```",
    ]);
  });

  it("makes the fence longer than any backtick run in the code", async () => {
    await put("examples/fence.ts", "const md = `\n```ts\n```\n`;\n");
    expect(expand("{@includeCode ../../examples/fence.ts}")).toEqual([
      "     * ````ts",
      "     * const md = `",
      "     * ```ts",
      "     * ```",
      "     * `;",
      "     * ````",
    ]);
  });

  it("reads an example with Windows line ends as one with Unix ones", async () => {
    await put("examples/crlf.ts", "let a = 1;\r\nlet b = 2;\r\n");
    expect(expand("{@includeCode ../../examples/crlf.ts}")).toEqual([
      "     * ```ts",
      "     * let a = 1;",
      "     * let b = 2;",
      "     * ```",
    ]);
  });

  it.each([
    [
      "a missing file",
      "{@includeCode ../../examples/missing.ts}",
      /handles\/trigger\.d\.ts:6: \{@includeCode \.\.\/\.\.\/examples\/missing\.ts\} resolved to .*missing\.ts, which does not exist/,
    ],
    [
      "a missing region",
      "{@includeCode ../../examples/example.ts#missing}",
      /region missing was not found/,
    ],
    [
      "a line past the end",
      "{@includeCode ../../examples/example.ts:3-40}",
      /asks for line 40 of a file of 11 lines/,
    ],
    [
      "a reversed line range",
      "{@includeCode ../../examples/example.ts:5-3}",
      /5-3 is not a line range/,
    ],
    ["no file", "{@includeCode}", /names no file/],
    [
      "a tag with no closing brace",
      "{@includeCode ../../examples/example.ts",
      /a malformed \{@includeCode\} tag/,
    ],
  ])("rejects %s", (_, line, message) => {
    expect(() => expand(line)).toThrow(IncludeCodeError);
    expect(() => expand(line)).toThrow(message);
  });

  it("rejects a tag outside a multi-line doc comment", () => {
    expect(() =>
      expandIncludeCode(
        "/** {@includeCode ../../examples/example.ts} */\n",
        join(dir, "src", "handles"),
        "handles/trigger.d.ts",
      ),
    ).toThrow(/must stand on a line of a multi-line doc comment/);
  });
});

describe("expandDeclarations", () => {
  it("expands each declaration file against its source file's folder", async () => {
    await put(
      "dist/handles/trigger.d.ts",
      declaration("{@includeCode ../../examples/example.ts:9}"),
    );
    await put("dist/index.d.ts", "export {};\n");
    expect(
      await expandDeclarations(join(dir, "dist"), join(dir, "src")),
    ).toEqual(["handles/trigger.d.ts"]);
    expect(
      await readFile(join(dir, "dist/handles/trigger.d.ts"), "utf8"),
    ).toContain("     * trigger.destroy();\n");
  });
});

describe("the build's include-code step", () => {
  /** Runs the step as the library's build does, on the temporary folder. */
  function build() {
    return spawnSync(
      process.execPath,
      ["--experimental-strip-types", script, "dist", "src"],
      { cwd: dir, encoding: "utf8" },
    );
  }

  it("is the last command of the library's build", async () => {
    const manifest = JSON.parse(
      await readFile(join(packageRoot, "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };
    expect(manifest.scripts.build).toMatch(
      / && node --experimental-strip-types scripts\/include-code\.mts dist src$/,
    );
  });

  it("succeeds when every include resolves", async () => {
    await put(
      "dist/handles/trigger.d.ts",
      declaration("{@includeCode ../../examples/example.ts#create}"),
    );
    const run = build();
    expect(run.stderr).not.toContain("include-code:");
    expect(run.status).toBe(0);
    expect(run.stdout).toContain("expanded in 1 declaration files");
  });

  it("fails on an include pointing at a missing file", async () => {
    await put(
      "dist/handles/trigger.d.ts",
      declaration("{@includeCode ../../examples/missing.ts}"),
    );
    const run = build();
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(
      /include-code: handles\/trigger\.d\.ts:6: \{@includeCode \.\.\/\.\.\/examples\/missing\.ts\} resolved to .*missing\.ts, which does not exist/,
    );
  });
});
