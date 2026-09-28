// The doc comment lint (#43): the doc comment rules of the workspace's ESLint
// configuration, run by ESLint's API on the fixtures under fixtures/doc-lint,
// so a broken tsdoc.json or rule option fails a test and not only the lint.
// The fixtures are linted with the rules alone, without the type-aware
// configuration they sit beside; `pnpm lint` leaves them out of the rules,
// since they hold deliberate findings. The Typings headers are linted as
// reforged-types generates them, from the package's own files.

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint, type Linter } from "eslint";
import { parser } from "typescript-eslint";
import { describe, expect, it } from "vitest";

const WORKSPACE_URL = new URL("../../../../", import.meta.url);
const WORKSPACE = fileURLToPath(WORKSPACE_URL);
const LIBRARY = join(WORKSPACE, "packages/reforged-ts");
const FIXTURES = join(LIBRARY, "test/node/fixtures/doc-lint");
const TYPINGS = join(WORKSPACE, "packages/reforged-types/3.0.0");

// Imported by URL: the configuration is JavaScript, which this program does
// not type-check.
const { docComments } = (await import(
  new URL("eslint.config.mjs", WORKSPACE_URL).href
)) as { docComments: Linter.Config };

/**
 * ESLint with the doc comment rules alone on the fixtures. tsdoc/syntax reads
 * the tsdoc.json of the folder the library's program is in, as it does on the
 * sources.
 */
function docLinter(): ESLint {
  return new ESLint({
    cwd: WORKSPACE,
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ["**/*.ts"],
        languageOptions: {
          parser,
          parserOptions: { tsconfigRootDir: LIBRARY },
        },
      },
      { files: ["**/*.ts"], ...docComments },
    ],
  });
}

/** The messages of the doc comment rules on a fixture. */
async function lint(fixture: string): Promise<Linter.LintMessage[]> {
  const results = await docLinter().lintFiles([join(FIXTURES, fixture)]);
  return results.flatMap((result) => result.messages);
}

/**
 * The messages of the doc comment rules on a generated Typings file, linted
 * as if it sat among the fixtures, with the library's tag vocabulary.
 */
async function lintTypings(file: string): Promise<Linter.LintMessage[]> {
  const results = await docLinter().lintText(
    await readFile(join(TYPINGS, file), "utf8"),
    { filePath: join(FIXTURES, file) },
  );
  return results.flatMap((result) => result.messages);
}

/** Each message as `line rule: text`, for readable failures. */
function describeAll(messages: readonly Linter.LintMessage[]): string[] {
  return messages.map(
    (message) =>
      `${String(message.line)} ${message.ruleId ?? "(none)"}: ${message.message}`,
  );
}

describe("the doc comment lint", () => {
  it("runs every rule at error", () => {
    const levels = Object.values(docComments.rules ?? {}).map((entry) =>
      Array.isArray(entry) ? entry[0] : entry,
    );
    expect(levels.length).toBeGreaterThan(0);
    expect(new Set(levels)).toEqual(new Set(["error"]));
  });

  it("accepts every declared tag", async () => {
    const messages = await lint("tags.ts");

    expect(
      describeAll(
        messages.filter((message) => message.ruleId === "tsdoc/syntax"),
      ),
    ).toEqual([]);
  });

  it.each(["common.j.d.ts", "common.ai.d.ts", "blizzard.j.d.ts"])(
    "accepts every header of the generated Typings in %s",
    async (file) => {
      const messages = await lintTypings(file);

      expect(
        describeAll(
          messages.filter((message) => message.ruleId === "tsdoc/syntax"),
        ),
      ).toEqual([]);
    },
    60_000,
  );

  it("reports a @param without the hyphen, an undeclared tag and an unescaped brace", async () => {
    const messages = await lint("syntax.ts");

    expect(
      messages
        .filter((message) => message.ruleId === "tsdoc/syntax")
        .map((message) => message.message.split(":")[0]),
    ).toEqual([
      "tsdoc-undefined-tag",
      "tsdoc-param-tag-missing-hyphen",
      "tsdoc-escape-right-brace",
    ]);
  });

  it("requires a doc comment on a public member, not on a private or protected one", async () => {
    const messages = await lint("members.ts");

    expect(
      describeAll(
        messages.filter((message) => message.ruleId === "jsdoc/require-jsdoc"),
      ),
    ).toEqual(["15 jsdoc/require-jsdoc: Missing JSDoc comment."]);
  });

  it("requires a @param per parameter and @returns unless nothing is returned", async () => {
    const messages = await lint("params.ts");

    expect(
      describeAll(
        messages.filter(
          (message) =>
            message.ruleId === "jsdoc/require-param" ||
            message.ruleId === "jsdoc/require-returns",
        ),
      ),
    ).toEqual([
      '8 jsdoc/require-param: Missing JSDoc @param "right" declaration.',
      "8 jsdoc/require-returns: Missing JSDoc @returns declaration.",
    ]);
  });

  it("reports tags out of the documented order", async () => {
    const messages = await lint("order.ts");

    expect(
      messages
        .filter((message) => message.ruleId === "jsdoc/sort-tags")
        .map((message) => message.line),
    ).toEqual([8]);
  });
});
