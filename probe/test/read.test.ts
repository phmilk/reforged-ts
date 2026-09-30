import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main, type Context } from "../src/cli/read.js";
import { systemMachine } from "../src/machine.js";
import {
  decodeValue,
  field,
  formatLine,
  formatValue,
  joinContinuationLines,
  parseResultLine,
  readProbeRun,
  unwrapPreloadFile,
} from "../src/read.js";
import { stateFile } from "../src/state.js";
import { USER_FOLDER_VARIABLE } from "../src/user-folder.js";
import {
  BRIDGE_PROBE,
  BRIDGE_RUN_ID,
  bridgeLines,
  preloadFile,
} from "./support/bridge.js";

/** The hello Probe's `ascii` value: every byte of ASCII the writer escapes. */
const ESCAPED_ASCII = `${String.fromCharCode(
  ...Array.from({ length: 32 }, (_, byte) => byte),
)} "%=\\\u007f`;

/** The hello Probe's `utf8` value. */
const UTF8_TEXT = "héllo, wörld: ✓ 日本語";

interface Setup {
  context: Context;
  /** Where the game writes the Probe's Result file. */
  resultFile: string;
}

/**
 * A temporary Warcraft III user folder, named by WC3_USER_FOLDER on the real
 * machine, and a state folder holding a build of the bridge Probe with
 * `runId`.
 */
async function setup(runId = BRIDGE_RUN_ID): Promise<Setup> {
  const dir = await mkdtemp(join(tmpdir(), "probe-read-"));
  const userFolder = join(dir, "Warcraft III");
  const stateFolder = join(dir, "state");
  await mkdir(stateFolder);
  await writeFile(
    stateFile(stateFolder, BRIDGE_PROBE),
    JSON.stringify({ probe: BRIDGE_PROBE, runId }),
  );
  return {
    context: {
      machine: {
        ...systemMachine,
        env: { [USER_FOLDER_VARIABLE]: userFolder },
      },
      stateFolder,
    },
    resultFile: join(
      userFolder,
      "CustomMapData",
      "reforged-ts",
      "probes",
      `${BRIDGE_PROBE}.txt`,
    ),
  };
}

async function writeResult(file: string, text: string): Promise<void> {
  await mkdir(join(file, ".."), { recursive: true });
  await writeFile(file, text);
}

function read(args: string[], context: Context) {
  let stdout = "";
  let stderr = "";
  const code = main(
    args,
    {
      stdout: (text) => (stdout += text),
      stderr: (text) => (stderr += text),
    },
    context,
  );
  return { code, stdout, stderr };
}

describe("probe:read", () => {
  it("prints finished and the records of the bridge fixture, as the game writes it, with exit code 0", async () => {
    const { context, resultFile } = await setup();
    await writeResult(resultFile, preloadFile(bridgeLines()));

    expect(read([BRIDGE_PROBE], context)).toEqual({
      code: 0,
      stdout: [
        "finished: Probe hello, run bridge, 2 records",
        "greeting count=1 word=hello",
        String.raw`encoded ascii="\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\b\t\n\u000b\f\r\u000e\u000f\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001a\u001b\u001c\u001d\u001e\u001f \"%=\\\u007f" utf8="héllo, wörld: ✓ 日本語"`,
        "",
      ].join("\n"),
      stderr: "",
    });
  });

  it("decodes the bridge fixture's records back to the values the hello Probe recorded", async () => {
    const { context, resultFile } = await setup();
    await writeResult(resultFile, preloadFile(bridgeLines()));

    expect(readProbeRun(BRIDGE_PROBE, context).records).toEqual([
      {
        seq: 2,
        kind: "greeting",
        fields: [
          ["count", "1"],
          ["word", "hello"],
        ],
      },
      {
        seq: 3,
        kind: "encoded",
        fields: [
          ["ascii", ESCAPED_ASCII],
          ["utf8", UTF8_TEXT],
        ],
      },
    ]);
  });

  it("joins a value of exactly 200 bytes once encoded from its continuation line", async () => {
    const { context, resultFile } = await setup();
    const value = `${"é".repeat(33)}ab`;
    const encoded = `${"%C3%A9".repeat(33)}ab`;
    expect(encoded).toHaveLength(200);
    const line = `2 long value=${encoded}`;
    await writeResult(
      resultFile,
      preloadFile([
        "1 BEGIN probe=hello run=bridge",
        line.slice(0, 200),
        `2+ ${line.slice(200)}`,
        "3 END status=ok",
      ]),
    );

    expect(readProbeRun(BRIDGE_PROBE, context).records).toEqual([
      { seq: 2, kind: "long", fields: [["value", value]] },
    ]);
  });

  it("gives not-started, exit code 3, when there is no Result file", async () => {
    const { context, resultFile } = await setup();

    expect(read([BRIDGE_PROBE], context)).toEqual({
      code: 3,
      stdout: `not-started: no Result file at ${resultFile}\n`,
      stderr: "",
    });
  });

  it("gives not-started, exit code 3, for the Result file of another run, and shows its runId", async () => {
    const { context, resultFile } = await setup("newer-build");
    await writeResult(resultFile, preloadFile(bridgeLines()));

    expect(read([BRIDGE_PROBE], context)).toEqual({
      code: 3,
      stdout:
        "not-started: the Result file is from run bridge, not from this build's run newer-build\n",
      stderr: "",
    });
  });

  it.each([["Hello"], ["hello_world"], ["../hello"], ["hello.txt"]])(
    "refuses the Probe name %s with a one-line author error and exit code 4",
    async (name) => {
      const { context } = await setup();
      const { code, stdout, stderr } = read([name], context);
      expect(code).toBe(4);
      expect(stdout).toBe("");
      expect(stderr).toMatch(/^probe:read failed: .*kebab-case.*\n$/);
    },
  );

  it("prints a Result file it does not classify on one line, a newline and an escape of its values quoted", async () => {
    const { context, resultFile } = await setup();
    await writeResult(
      resultFile,
      preloadFile(["1 BEGIN probe=hello run=bridge", "2 note text=a%0Ab%1B[m"]),
    );

    const { code, stdout, stderr } = read([BRIDGE_PROBE], context);
    expect(code).toBe(4);
    expect(stdout).toBe("");
    expect(stderr).toBe(
      `probe:read failed: ${resultFile} ends with ${JSON.stringify(String.raw`note text="a\nb\u001b[m"`)}, which this reader does not classify yet.\n`,
    );
  });

  it("fails with exit code 4 when the Probe was never built", async () => {
    const { context } = await setup();
    const { code, stderr } = read(["never-built"], context);
    expect(code).toBe(4);
    expect(stderr).toBe(
      "probe:read failed: Probe never-built has no build to compare the Result file with: run `pnpm probe:build never-built` first.\n",
    );
  });

  it("prints its usage, with exit code 4, without exactly one Probe name", async () => {
    const { context } = await setup();
    expect(read([], context)).toEqual({
      code: 4,
      stdout: "",
      stderr: "Usage: probe:read <probe>\n",
    });
  });
});

describe("unwrapPreloadFile", () => {
  it("returns the Preload strings, in order, with the doubled backslashes undone", () => {
    const strings = ["1 BEGIN probe=a run=b", "a\\b\\\\c", ""];
    expect(unwrapPreloadFile(preloadFile(strings))).toEqual(strings);
  });

  it("rejects a file that is not the game's Preload wrapper", () => {
    expect(() => unwrapPreloadFile("1 BEGIN probe=a run=b\n")).toThrow(
      /not a file the game's Preload wrote/,
    );
  });
});

describe("joinContinuationLines", () => {
  it("appends each continuation line to its line before decoding, a split escape included", () => {
    const lines = joinContinuationLines([
      "1 BEGIN probe=a run=b",
      "2 note text=a%E2%9C",
      "2+ %93b",
      "2+ %20c",
      "3 END status=ok",
    ]);
    expect(lines).toEqual([
      "1 BEGIN probe=a run=b",
      "2 note text=a%E2%9C%93b%20c",
      "3 END status=ok",
    ]);
    expect(field(parseResultLine(lines[1] ?? ""), "text")).toBe("a✓b c");
  });

  it("rejects a continuation line that does not follow its line", () => {
    expect(() =>
      joinContinuationLines(["1 BEGIN probe=a run=b", "2+ more"]),
    ).toThrow(/The continuation line "2\+ more" does not follow the line 2/);
    expect(() => joinContinuationLines(["1+ more"])).toThrow(
      /does not follow the line 1/,
    );
  });
});

describe("decodeValue", () => {
  it("decodes a literal % from its escape", () => {
    expect(decodeValue("100%25")).toBe("100%");
    expect(decodeValue("%25%25")).toBe("%%");
    expect(decodeValue("%2525")).toBe("%25");
  });

  it("decodes every escaped byte of ASCII, and UTF-8 bytes to their characters", () => {
    expect(decodeValue("%00%09%0A%0D%1F%20%22%25%3D%5C%7F")).toBe(
      '\0\t\n\r\u001f "%=\\\u007f',
    );
    expect(decodeValue("h%C3%A9llo%20%E6%97%A5")).toBe("héllo 日");
  });

  it("accepts lowercase hexadecimal digits", () => {
    expect(decodeValue("%c3%a9")).toBe("é");
  });

  it("gives undefined for a % without two hexadecimal digits", () => {
    expect(decodeValue("100%")).toBeUndefined();
    expect(decodeValue("%2")).toBeUndefined();
    expect(decodeValue("%G0")).toBeUndefined();
  });

  it("makes parseResultLine reject a value with a bad escape", () => {
    expect(() => parseResultLine("2 note text=100%")).toThrow(
      /Not a Result file line/,
    );
  });

  it("gives undefined for a character the writer always escapes, found unescaped", () => {
    for (const character of ["=", '"', "\\", "\t", "\u007f", "é", "✓"]) {
      expect(decodeValue(`a${character}b`), character).toBeUndefined();
    }
  });

  it("keeps every printable ASCII character the writer keeps", () => {
    const kept = Array.from({ length: 94 }, (_, index) =>
      String.fromCharCode(33 + index),
    )
      .filter((character) => !'=%"\\'.includes(character))
      .join("");
    expect(kept).toHaveLength(90);
    expect(decodeValue(kept)).toBe(kept);
  });
});

describe("parseResultLine", () => {
  it("parses the seq, the kind and the fields, in the order written", () => {
    expect(parseResultLine("7 note b=2 a=x%20y")).toEqual({
      seq: 7,
      kind: "note",
      fields: [
        ["b", "2"],
        ["a", "x y"],
      ],
    });
  });

  it("rejects a pair without its =, or without a key, before decoding it", () => {
    expect(() => parseResultLine("2 note text")).toThrow(
      'Not a Result file line: "2 note text".',
    );
    expect(() => parseResultLine("2 note =x")).toThrow(/Not a Result file/);
    expect(() => parseResultLine("2 note %=x")).toThrow(/Not a Result file/);
  });

  it("rejects a kind or a key outside the safe alphabet", () => {
    expect(() => parseResultLine("2 n%C3%A9 a=1")).toThrow(/Not a Result file/);
    expect(() => parseResultLine("2 note k\u001b=1")).toThrow(
      String.raw`Not a Result file line: "2 note k\u001b=1".`,
    );
  });
});

describe("formatValue", () => {
  it("prints a value of printable characters without space or quote as it is", () => {
    expect(formatValue("hello")).toBe("hello");
    expect(formatValue("a=b\\c%25")).toBe("a=b\\c%25");
    expect(formatValue("héllo✓日本語")).toBe("héllo✓日本語");
  });

  it("prints the empty value, and one holding a space or a quote, as a JSON string", () => {
    expect(formatValue("")).toBe('""');
    expect(formatValue("a b")).toBe('"a b"');
    expect(formatValue('say "hi"')).toBe(String.raw`"say \"hi\""`);
  });

  it("escapes every control and format character, so a value prints on one line and moves no terminal", () => {
    const value = "a\nb\r\u001b[31m\u007f\u009b\u200e\u2028\u00a0\u{e0001}";
    const printed = formatValue(value);
    expect(printed).toBe(
      String.raw`"a\nb\r\u001b[31m\u007f\u009b\u200e\u2028\u00a0\udb40\udc01"`,
    );
    expect(JSON.parse(printed)).toBe(value);
  });
});

describe("formatLine", () => {
  it("prints the kind, then each field with its value as formatValue gives it", () => {
    expect(
      formatLine({
        seq: 3,
        kind: "note",
        fields: [
          ["word", "hi"],
          ["text", "two words"],
        ],
      }),
    ).toBe('note word=hi text="two words"');
  });
});
