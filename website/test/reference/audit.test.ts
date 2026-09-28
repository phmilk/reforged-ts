// The docs audit (#43) on the reference tests' fixture library: TypeDoc with
// the site's reference options, and ESLint with the workspace's
// configuration, its doc comment rules extended to the fixture's files. The
// fixture's `undocumentedFarewell` has no doc comment.
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Linter } from "eslint";
import { describe, expect, it } from "vitest";
import { type AuditSubject, DOC_RULES, main } from "../../audit";
import type { Reference } from "../../reference";

const WORKSPACE_URL = new URL("../../../", import.meta.url);
const WORKSPACE = fileURLToPath(WORKSPACE_URL);
const FIXTURE = fileURLToPath(new URL("fixtures/library/", import.meta.url));
const FIXTURE_SOURCE = "website/test/reference/fixtures/library/src/index.ts";

const FIXTURE_REFERENCE: Reference = {
  id: "fixture-library",
  label: "fixture-library",
  dir: "api/fixture-library",
  entryPoints: [join(FIXTURE, "src/index.ts")],
  tsconfig: join(FIXTURE, "tsconfig.json"),
};

// Imported by URL: the configuration is JavaScript, which this program does
// not type-check.
const { docComments } = (await import(
  new URL("eslint.config.mjs", WORKSPACE_URL).href
)) as { docComments: Linter.Config };

const SUBJECT: AuditSubject = {
  root: WORKSPACE,
  reference: FIXTURE_REFERENCE,
  eslint: {
    cwd: WORKSPACE,
    overrideConfigFile: join(WORKSPACE, "eslint.config.mjs"),
    overrideConfig: {
      files: ["website/test/reference/fixtures/library/src/**/*.ts"],
      ...docComments,
    },
  },
  lint: [FIXTURE_SOURCE],
};

/** Runs `docs:audit` with `args` on the fixture: its exit code and output. */
async function run(
  args: readonly string[],
  subject: AuditSubject = SUBJECT,
): Promise<{ code: number; stdout: string; stderr: string }> {
  let stdout = "";
  let stderr = "";
  const code = await main(
    args,
    {
      stdout: (text) => (stdout += text),
      stderr: (text) => (stderr += text),
    },
    () => subject,
  );
  return { code, stdout, stderr };
}

describe("docs:audit", () => {
  it("lists an undocumented export under its file, from TypeDoc and the lint, and exits 0", async () => {
    const { code, stdout } = await run([]);

    const lines = stdout.split("\n");
    const header = lines.findIndex((line) => line.startsWith(FIXTURE_SOURCE));
    expect(header).not.toBe(-1);
    const fileLines = lines.slice(header + 1);
    expect(fileLines).toContainEqual(
      expect.stringMatching(/^ {2}undocumented undocumentedFarewell \(\w+\)$/),
    );
    expect(fileLines).toContainEqual(
      expect.stringMatching(
        /^ {2}lint 13:\d+ jsdoc\/require-jsdoc Missing JSDoc comment\.$/,
      ),
    );
    expect(stdout).not.toMatch(/undocumented (greet|welcome)\b/);
    expect(stdout).toMatch(
      /^docs:audit: \d+ findings in 1 file: 1 undocumented/m,
    );
    expect(code).toBe(0);
  });

  it("fails on the finding with --strict", async () => {
    const { code, stdout } = await run(["--strict"]);

    expect(stdout).toContain("undocumented undocumentedFarewell");
    expect(code).toBe(1);
  });

  it("keeps the files whose path ends with an argument", async () => {
    const kept = await run(["--strict", "library/src/index.ts"]);
    const other = await run(["--strict", "src/other.ts"]);

    expect(kept.stdout).toContain("undocumented undocumentedFarewell");
    expect(kept.code).toBe(1);
    expect(other.stdout).toBe(
      "docs:audit: 0 findings in 0 files (only src/other.ts): 0 undocumented, 0 lint, 0 typedoc.\n",
    );
    expect(other.code).toBe(0);
  });

  it("prints the counts alone with --summary", async () => {
    const { stdout } = await run(["--summary"]);

    expect(stdout).toMatch(
      new RegExp(
        `^${FIXTURE_SOURCE}  \\d+: 1 undocumented, \\d+ lint, 0 typedoc$`,
        "m",
      ),
    );
    expect(stdout).not.toContain("undocumentedFarewell");
  });

  it("counts the doc comment rules of eslint.config.mjs", () => {
    expect([...DOC_RULES].sort()).toEqual(
      Object.keys(docComments.rules ?? {}).sort(),
    );
  });

  it("leaves out the findings of the other lint rules", async () => {
    // A rule outside the doc comment rules that fires on every function of
    // the fixture: `pnpm lint` would report it, the audit does not.
    const withOtherRule: AuditSubject = {
      ...SUBJECT,
      eslint: {
        ...SUBJECT.eslint,
        overrideConfig: [
          {
            files: ["website/test/reference/fixtures/library/src/**/*.ts"],
            ...docComments,
          },
          {
            files: ["website/test/reference/fixtures/library/src/**/*.ts"],
            rules: { "no-restricted-syntax": ["error", "FunctionDeclaration"] },
          },
        ],
      },
    };

    const { stdout } = await run([], withOtherRule);

    expect(stdout).toContain("jsdoc/require-jsdoc");
    expect(stdout).not.toContain("no-restricted-syntax");
  });

  it("rejects an unknown option", async () => {
    const { code, stderr } = await run(["--fix"]);

    expect(stderr).toContain("Usage: docs:audit");
    expect(code).toBe(2);
  });
});
