import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main, type Context } from "../src/cli/read.js";
import {
  listsImage,
  systemMachine,
  tasklistArgs,
  type SpawnCommand,
} from "../src/machine.js";
import {
  decodeValue,
  field,
  formatLine,
  formatValue,
  joinContinuationLines,
  parseResultLine,
  readProbeRun,
  resultFile,
  unwrapPreloadFile,
} from "../src/read.js";
import { stateFile } from "../src/state.js";
import { USER_FOLDER_VARIABLE } from "../src/user-folder.js";
import {
  BRIDGE_PROBE,
  BRIDGE_RUN_ID,
  FAILING_PROBE,
  bridgeLines,
  preloadFile,
} from "./support/bridge.js";
import { fakeMachine } from "./support/machine.js";

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
async function setup(
  runId = BRIDGE_RUN_ID,
  probe = BRIDGE_PROBE,
): Promise<Setup> {
  const dir = await mkdtemp(join(tmpdir(), "probe-read-"));
  const userFolder = join(dir, "Warcraft III");
  const stateFolder = join(dir, "state");
  await mkdir(stateFolder);
  await writeFile(
    stateFile(stateFolder, probe),
    JSON.stringify({ probe, runId }),
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
      `${probe}.txt`,
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
        seq: 3,
        kind: "greeting",
        fields: [
          ["count", "1"],
          ["word", "hello"],
        ],
      },
      {
        seq: 5,
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

  it("prints failed, the ERROR message and the records of the failing bridge fixture, with exit code 1", async () => {
    const { context, resultFile } = await setup(BRIDGE_RUN_ID, FAILING_PROBE);
    await writeResult(resultFile, preloadFile(bridgeLines("failed")));

    expect(read([FAILING_PROBE], context)).toEqual({
      code: 1,
      stdout: [
        String.raw`failed: Probe failing, run bridge, 1 record, then the error "Error: The step \"after\" broke."`,
        "step name=before",
        "",
      ].join("\n"),
      stderr: "",
    });
    expect(readProbeRun(FAILING_PROBE, context)).toMatchObject({
      state: "failed",
      error: 'Error: The step "after" broke.',
      records: [{ seq: 2, kind: "step", fields: [["name", "before"]] }],
    });
  });

  it("prints an ERROR message on one line, a newline and an escape quoted", async () => {
    const { context, resultFile } = await setup();
    await writeResult(
      resultFile,
      preloadFile([
        "1 BEGIN probe=hello run=bridge",
        "2 ERROR message=a%0Ab%1B[m",
        "3 END status=failed",
      ]),
    );

    expect(read([BRIDGE_PROBE], context)).toEqual({
      code: 1,
      stdout:
        String.raw`failed: Probe hello, run bridge, 0 records, then the error "a\nb\u001b[m"` +
        "\n",
      stderr: "",
    });
  });

  it("fails with exit code 4 on END status=failed without an ERROR line", async () => {
    const { context, resultFile } = await setup();
    await writeResult(
      resultFile,
      preloadFile(["1 BEGIN probe=hello run=bridge", "2 END status=failed"]),
    );

    expect(read([BRIDGE_PROBE], context)).toEqual({
      code: 4,
      stdout: "",
      stderr: `probe:read failed: ${resultFile} ends with END status=failed but holds no ERROR line with a message.\n`,
    });
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

  it("gives not-started, exit code 3, for the Result file of another run, without reading past its BEGIN line", async () => {
    const { context, resultFile } = await setup("newer-build");
    await writeResult(
      resultFile,
      preloadFile([
        "1 BEGIN probe=hello run=older-build",
        "2 note value=50%",
        "3 note value=%c3%a9 other",
        "3+ orphan",
      ]),
    );

    expect(read([BRIDGE_PROBE], context)).toEqual({
      code: 3,
      stdout:
        "not-started: the Result file is from run older-build, not from this build's run newer-build\n",
      stderr: "",
    });
  });

  it("still refuses the same lines in a Result file of the expected run", async () => {
    const { context, resultFile } = await setup();
    await writeResult(
      resultFile,
      preloadFile(["1 BEGIN probe=hello run=bridge", "2 note value=50%"]),
    );

    const { code, stderr } = read([BRIDGE_PROBE], context);
    expect(code).toBe(4);
    expect(stderr).toBe(
      'probe:read failed: Not a Result file line: "2 note value=50%".\n',
    );
  });

  it("prints the runId of another run on one line, quoted when it holds a control character", async () => {
    const { context, resultFile } = await setup("newer-build");
    await writeResult(
      resultFile,
      preloadFile(["1 BEGIN probe=hello run=a%0Ab%1B[m"]),
    );

    expect(read([BRIDGE_PROBE], context)).toEqual({
      code: 3,
      stdout:
        String.raw`not-started: the Result file is from run "a\nb\u001b[m", not from this build's run newer-build` +
        "\n",
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

/** The state folder of the fake machines' builds. */
const FAKE_STATE_FOLDER = join(tmpdir(), "probe-read-fake-state");

/** The user folder WC3_USER_FOLDER names on each fake machine. */
const FAKE_USER_FOLDERS = {
  win32: "C:\\Users\\me\\Documents\\Warcraft III",
  linux: "/home/me/Warcraft III",
} as const;

interface FakeRun {
  context: Context;
  /** The fake machine's files, by path: the state file and the Result file. */
  files: Record<string, string>;
  /** The image names the process list was asked about. */
  processQueries: string[];
  /** The programs the machine was asked to start. */
  spawned: SpawnCommand[];
}

/**
 * A fake machine of `platform`, whose process list holds `processes`,
 * holding a build of the bridge Probe and the Result file `strings`, the
 * bridge's checkpoint fixture by default, as the game writes them.
 */
function fakeRun(
  platform: keyof typeof FAKE_USER_FOLDERS,
  processes: readonly string[] = [],
  strings: readonly string[] = bridgeLines("checkpoint"),
): FakeRun {
  const files: Record<string, string> = {};
  const processQueries: string[] = [];
  const spawned: SpawnCommand[] = [];
  const machine = fakeMachine({
    platform,
    env: { [USER_FOLDER_VARIABLE]: FAKE_USER_FOLDERS[platform] },
    files,
    processes,
    processQueries,
    spawned,
  });
  files[stateFile(FAKE_STATE_FOLDER, BRIDGE_PROBE)] = JSON.stringify({
    probe: BRIDGE_PROBE,
    runId: BRIDGE_RUN_ID,
  });
  files[resultFile(machine, BRIDGE_PROBE)] = preloadFile(strings);
  return {
    context: { machine, stateFolder: FAKE_STATE_FOLDER },
    files,
    processQueries,
    spawned,
  };
}

/** The records of the bridge's checkpoint fixture, as probe:read prints them. */
const CHECKPOINT_RECORDS = [
  "greeting count=1 word=hello",
  String.raw`encoded ascii="\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\b\t\n\u000b\f\r\u000e\u000f\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001a\u001b\u001c\u001d\u001e\u001f \"%=\\\u007f" utf8="héllo, wörld: ✓ 日本語"`,
];

describe("probe:read of a Result file that ends with a checkpoint", () => {
  it("gives incomplete off Windows, exit code 2, with the last PENDING label and the records, without looking for the game's process", () => {
    const { context, processQueries } = fakeRun("linux", ["Warcraft III.exe"]);

    expect(read([BRIDGE_PROBE], context)).toEqual({
      code: 2,
      stdout: [
        "incomplete: Probe hello, run bridge, 2 records to its last checkpoint, pending step encode; the game's process is looked for on Windows only",
        ...CHECKPOINT_RECORDS,
        "",
      ].join("\n"),
      stderr: "",
    });
    expect(processQueries).toEqual([]);
  });

  it("decodes the bridge's checkpoint fixture back to the records and the last PENDING label", () => {
    const { context } = fakeRun("linux");

    const run = readProbeRun(BRIDGE_PROBE, context);
    expect(run.state).toBe("incomplete");
    expect(run.pending).toBe("encode");
    expect(run.records.map((record) => [record.seq, record.kind])).toEqual([
      [3, "greeting"],
      [5, "encoded"],
    ]);
    expect(
      field(run.records[1] ?? { seq: 0, kind: "", fields: [] }, "utf8"),
    ).toBe(UTF8_TEXT);
  });

  it("gives running on Windows, exit code 2, while the process list holds Warcraft III.exe", () => {
    const { context, processQueries } = fakeRun("win32", [
      "explorer.exe",
      "Warcraft III.exe",
    ]);

    expect(read([BRIDGE_PROBE], context)).toEqual({
      code: 2,
      stdout: [
        "running: Probe hello, run bridge, 2 records to its last checkpoint, pending step encode; Warcraft III.exe is running",
        ...CHECKPOINT_RECORDS,
        "",
      ].join("\n"),
      stderr: "",
    });
    expect(processQueries).toEqual(["Warcraft III.exe"]);
  });

  it("gives crashed on Windows, exit code 2, when the process list lacks Warcraft III.exe", () => {
    const { context } = fakeRun("win32", ["explorer.exe"]);

    expect(read([BRIDGE_PROBE], context)).toEqual({
      code: 2,
      stdout: [
        "crashed: Probe hello, run bridge, 2 records to its last checkpoint, pending step encode; Warcraft III.exe is not running",
        ...CHECKPOINT_RECORDS,
        "",
      ].join("\n"),
      stderr: "",
    });
  });

  it("reports the last PENDING line, and says so when there is none", () => {
    const withTwo = fakeRun(
      "linux",
      [],
      [
        "1 BEGIN probe=hello run=bridge",
        "2 PENDING label=first%20step",
        "3 PENDING label=second%20step",
        "4 CHECKPOINT",
      ],
    );
    const { code, stdout } = read([BRIDGE_PROBE], withTwo.context);
    expect(code).toBe(2);
    expect(stdout).toBe(
      `incomplete: Probe hello, run bridge, 0 records to its last checkpoint, pending step "second step"; the game's process is looked for on Windows only\n`,
    );

    const withNone = fakeRun(
      "win32",
      [],
      ["1 BEGIN probe=hello run=bridge", "2 note a=1", "3 CHECKPOINT"],
    );
    expect(read([BRIDGE_PROBE], withNone.context)).toEqual({
      code: 2,
      stdout:
        "crashed: Probe hello, run bridge, 1 record to its last checkpoint, no pending step; Warcraft III.exe is not running\nnote a=1\n",
      stderr: "",
    });
    expect(
      readProbeRun(BRIDGE_PROBE, withNone.context).pending,
    ).toBeUndefined();
  });

  it("gives not-started, not crashed, for the checkpoint of another run", () => {
    const { context, processQueries } = fakeRun(
      "win32",
      [],
      ["1 BEGIN probe=hello run=older-build", "2 CHECKPOINT"],
    );

    expect(read([BRIDGE_PROBE], context)).toEqual({
      code: 3,
      stdout:
        "not-started: the Result file is from run older-build, not from this build's run bridge\n",
      stderr: "",
    });
    expect(processQueries).toEqual([]);
  });

  it("writes, starts and stops nothing: it only reads the files and the process list", () => {
    const { context, files, processQueries, spawned } = fakeRun("win32", [
      "Warcraft III.exe",
    ]);
    const before = { ...files };

    expect(read([BRIDGE_PROBE], context).code).toBe(2);
    expect(files).toEqual(before);
    expect(spawned).toEqual([]);
    expect(processQueries).toEqual(["Warcraft III.exe"]);
  });
});

describe("the process-list query", () => {
  it("runs tasklist as a query of one image name, which stops no process", () => {
    expect(tasklistArgs("Warcraft III.exe")).toEqual([
      "/FI",
      "IMAGENAME eq Warcraft III.exe",
      "/FO",
      "CSV",
      "/NH",
    ]);
  });

  it("finds the image in tasklist's CSV output, ignoring case, and not in its line for no match", () => {
    const listed = '"Warcraft III.exe","4242","Console","1","1,234,567 K"\r\n';
    expect(listsImage(listed, "Warcraft III.exe")).toBe(true);
    expect(listsImage(listed.toUpperCase(), "Warcraft III.exe")).toBe(true);
    expect(
      listsImage(
        "INFO: No tasks are running which match the specified criteria.\r\n",
        "Warcraft III.exe",
      ),
    ).toBe(false);
    expect(
      listsImage(
        '"Warcraft III.exe.bak","1","Console","1","1 K"\r\n',
        "Warcraft III.exe",
      ),
    ).toBe(false);
  });

  it.runIf(process.platform === "win32")(
    "reads the real process list on Windows",
    () => {
      expect(systemMachine.isRunning("no-such-probe-image.exe")).toBe(false);
    },
  );
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

  it("gives undefined for an escape with a lowercase hexadecimal digit, which the writer does not write", () => {
    expect(decodeValue("%c3%a9")).toBeUndefined();
    expect(decodeValue("%C3%a9")).toBeUndefined();
    expect(decodeValue("%0a")).toBeUndefined();
  });

  it("accepts the escape of each byte the writer escapes, and of no byte it keeps", () => {
    for (let byte = 0; byte < 256; byte++) {
      const escape = `%${byte.toString(16).toUpperCase().padStart(2, "0")}`;
      const kept =
        byte > 32 && byte < 127 && !'=%"\\'.includes(String.fromCharCode(byte));
      expect(decodeValue(escape) === undefined, escape).toBe(kept);
    }
    expect(decodeValue("%41")).toBeUndefined();
    expect(decodeValue("a%2Db")).toBeUndefined();
  });

  it("decodes a byte outside a valid UTF-8 sequence to its escape, in uppercase, so no byte is lost", () => {
    expect(decodeValue("%C8%C9")).toBe("%C8%C9");
    expect(decodeValue("a%E2%9C")).toBe("a%E2%9C");
    expect(decodeValue("%E2%9C%93%FF%E2%9C%93")).toBe("✓%FF✓");
    expect(decodeValue("%E2%9Cb")).toBe("%E2%9Cb");
    expect(decodeValue("%80")).toBe("%80");
  });

  it("decodes an overlong form, a surrogate or a code point above U+10FFFF to escapes", () => {
    expect(decodeValue("%C0%AF")).toBe("%C0%AF");
    expect(decodeValue("%E0%80%AF")).toBe("%E0%80%AF");
    expect(decodeValue("%ED%A0%80")).toBe("%ED%A0%80");
    expect(decodeValue("%F4%90%80%80")).toBe("%F4%90%80%80");
  });

  it("decodes every well-formed UTF-8 sequence to its character", () => {
    expect(decodeValue("%7F%C2%80%DF%BF")).toBe("\u007f\u0080\u07ff");
    expect(decodeValue("%E0%A0%80%ED%9F%BF%EE%80%80%EF%BF%BF")).toBe(
      "\u0800\ud7ff\ue000\uffff",
    );
    expect(decodeValue("%F0%9F%98%80%F4%8F%BF%BF")).toBe("😀\u{10ffff}");
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
