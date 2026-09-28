// The doc comment lint (#43): the rules of the workspace's docs
// configuration, run by ESLint's API on the fixtures under fixtures/doc-lint,
// so a broken tsdoc.json or rule option fails a test and not only the audit.
// The fixtures are linted with the rules alone, without the type-aware
// configuration they sit beside.

import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint, type Linter } from "eslint";
import { parser } from "typescript-eslint";
import { describe, expect, it } from "vitest";

const WORKSPACE_URL = new URL("../../../../", import.meta.url);
const WORKSPACE = fileURLToPath(WORKSPACE_URL);
const LIBRARY = join(WORKSPACE, "packages/reforged-ts");
const FIXTURES = join(LIBRARY, "test/node/fixtures/doc-lint");

// Imported by URL: the configuration is JavaScript, which this program does
// not type-check.
const { docComments } = (await import(
  new URL("eslint.docs.config.mjs", WORKSPACE_URL).href
)) as { docComments: Linter.Config };

/**
 * The messages of the doc comment rules on a fixture. tsdoc/syntax reads the
 * tsdoc.json of the folder the library's program is in, as it does on the
 * sources.
 */
async function lint(fixture: string): Promise<Linter.LintMessage[]> {
  const eslint = new ESLint({
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
  const results = await eslint.lintFiles([join(FIXTURES, fixture)]);
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
  it("runs every rule at warn", () => {
    const levels = Object.values(docComments.rules ?? {}).map((entry) =>
      Array.isArray(entry) ? entry[0] : entry,
    );
    expect(levels.length).toBeGreaterThan(0);
    expect(new Set(levels)).toEqual(new Set(["warn"]));
  });

  it("accepts every declared tag and a generated Typings header", async () => {
    const messages = await lint("tags.ts");

    expect(
      describeAll(
        messages.filter((message) => message.ruleId === "tsdoc/syntax"),
      ),
    ).toEqual([]);
  });

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
});
