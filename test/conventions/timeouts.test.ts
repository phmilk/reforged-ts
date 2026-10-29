import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { posix } from "node:path";
import { describe, expect, it } from "vitest";

import { read, root } from "./repository.js";
import { explicitTimeouts, unmeasuredTimeouts } from "./timeouts.js";

const lines = (...text: string[]): string => `${text.join("\n")}\n`;

describe("explicitTimeouts", () => {
  it("finds a test's, a hook's, a describe's and a project's timeout", () => {
    const found = explicitTimeouts(
      "a.test.ts",
      lines(
        'import { beforeAll, describe, it } from "vitest";',
        "beforeAll(() => {}, 1_000);",
        'describe("suite", { timeout: 2_000 }, () => {',
        '  it("one", () => {}, 3_000);',
        '  it.each([1])("row %i", () => {}, 4_000);',
        '  it.runIf(true)("runs", () => {',
        "  }, 5_000);",
        "});",
        "export default { test: { testTimeout: 6_000, hookTimeout: 7_000 } };",
      ),
    );
    expect(found.map(({ line, text }) => `${String(line)} ${text}`)).toEqual([
      "2 1_000",
      "3 timeout: 2_000",
      "4 3_000",
      "5 4_000",
      "7 5_000",
      "9 testTimeout: 6_000",
      "9 hookTimeout: 7_000",
    ]);
  });

  it("finds a timeout passed through a constant where the constant is declared", () => {
    const found = explicitTimeouts(
      "a.test.ts",
      lines(
        "const SLOW = { timeout: 30_000 };",
        'it("one", SLOW, () => {});',
        'it("two", SLOW, () => {});',
      ),
    );
    expect(found).toEqual([{ line: 1, text: "timeout: 30_000", comment: "" }]);
  });

  it("leaves a number that is no timeout alone", () => {
    expect(
      explicitTimeouts(
        "a.test.ts",
        lines(
          'it("waits", async () => {',
          "  await vi.waitFor(() => {}, { timeout: 10_000 });",
          "  expect(add(1, 2)).toBe(3);",
          "});",
        ),
      ),
    ).toEqual([]);
  });
});

describe("unmeasuredTimeouts", () => {
  it("accepts a comment right above the timeout, or above its call, giving the duration, the command and the platform", () => {
    expect(
      unmeasuredTimeouts(
        "a.test.ts",
        lines(
          "// Starts tsc, cold.",
          "// Measured 12 s with pnpm test on the windows CI leg, 2026-10.",
          'it("above the call", () => {',
          "}, 60_000);",
          'it("above the timeout", () => {',
          "  // Measured 850 ms with `pnpm --filter reforged-map test` on",
          "  // Linux (WSL 2, 8 threads), 2026-10.",
          "}, 5_000);",
          "export default {",
          "  // Measured 1.5 min with pnpm check on windows, 2026-10.",
          "  testTimeout: 120_000,",
          "};",
        ),
      ),
    ).toEqual([]);
  });

  it("reports a timeout with no comment, or one that misses the duration, the command or the platform", () => {
    const unmeasured = unmeasuredTimeouts(
      "a.test.ts",
      lines(
        'it("no comment", () => {}, 1_000);',
        "// A git repository, then a spawn: seconds on Windows.",
        'it("a reason, no measurement", () => {}, 2_000);',
        "// Measured with pnpm test on the windows CI leg.",
        'it("no duration", () => {}, 3_000);',
        "// Measured 4 s on the windows CI leg.",
        'it("no command", () => {}, 4_000);',
        "// Measured 5 s with pnpm test.",
        'it("no platform", () => {}, 5_000);',
        "// Measured 6 s with pnpm test on windows.",
        "",
        'it("a blank line between", () => {}, 6_000);',
      ),
    );
    expect(unmeasured.map(({ text }) => text)).toEqual([
      "1_000",
      "2_000",
      "3_000",
      "4_000",
      "5_000",
      "6_000",
    ]);
  });
});

// The workspace's TypeScript files that use vitest: committed or new, never
// ignored (node_modules, build output, the agents' worktrees).
const vitestFiles = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
)
  .split("\0")
  .filter(
    (file) =>
      /\.[cm]?ts$/.test(file) &&
      !/\.d\.[cm]?ts$/.test(file) &&
      existsSync(posix.join(root, file)),
  )
  .filter((file) => read(file).includes("vitest"));

describe("the workspace's explicit timeouts", () => {
  it("each say what was measured, with which command, on which platform", () => {
    const unmeasured = vitestFiles.flatMap((file) =>
      unmeasuredTimeouts(file, read(file)).map(
        ({ line, text }) => `${file}:${String(line)} ${text}`,
      ),
    );
    expect(
      unmeasured,
      'explicit timeouts without a "Measured <duration> with <command> on <platform>" comment right above them or their call (CONTRIBUTING.md, "Slow tests and explicit timeouts")',
    ).toEqual([]);
  });

  it("are found at all: the scan reads vitest.config.ts", () => {
    expect(
      explicitTimeouts("vitest.config.ts", read("vitest.config.ts")).length,
    ).toBeGreaterThan(0);
  });
});
