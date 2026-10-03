import { readFileSync, existsSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { main, type Context } from "../src/cli/run.js";
import { AuthorError } from "../src/errors.js";
import { PROBE_FOLDERS } from "../src/folders.js";
import {
  EXECUTABLE_ENV,
  resolveGameExecutable,
  wellKnownExecutables,
} from "../src/game.js";
import type { Machine } from "../src/machine.js";
import { resultFile } from "../src/read.js";
import { HUMAN_WAIT_SECONDS, LAUNCH_ARGS, captureFile } from "../src/run.js";
import { stateFile } from "../src/state.js";
import { USER_FOLDER_VARIABLE } from "../src/user-folder.js";
import { preloadFile } from "./support/bridge.js";
import {
  fakeMachine,
  type FakeGame,
  type FakeMachineOptions,
  type GameEvent,
} from "./support/machine.js";

const X86 =
  "C:\\Program Files (x86)\\Warcraft III\\_retail_\\x86_64\\Warcraft III.exe";
const X64 =
  "C:\\Program Files\\Warcraft III\\_retail_\\x86_64\\Warcraft III.exe";
const windowsEnv = {
  "ProgramFiles(x86)": "C:\\Program Files (x86)",
  ProgramFiles: "C:\\Program Files",
};

/** The folder relative paths resolve against: absolute on this machine. */
const root = path.resolve("fake-workspace");
/** An executable outside the well-known locations, absolute on this machine. */
const ELSEWHERE = path.resolve("elsewhere", "wc3");

/** A fake machine where exactly `existing` exist, recording what was asked. */
function recordingMachine(
  platform: NodeJS.Platform,
  existing: string[],
  env: Record<string, string> = {},
) {
  const asked: string[] = [];
  const machine = fakeMachine({
    platform,
    env,
    files: Object.fromEntries(existing.map((file) => [file, ""])),
  });
  return {
    asked,
    machine: {
      ...machine,
      exists: (file: string) => {
        asked.push(file);
        return machine.exists(file);
      },
    },
  };
}

describe("resolveGameExecutable", () => {
  it("takes --game-executable before WC3_EXECUTABLE and the well-known locations, resolved against the root", () => {
    const override = path.join(root, "game", "wc3.exe");
    const { machine, asked } = recordingMachine("win32", [override, X86], {
      ...windowsEnv,
      [EXECUTABLE_ENV]: X86,
    });
    expect(
      resolveGameExecutable({ gameExecutable: "game/wc3.exe" }, root, machine),
    ).toBe(override);
    expect(asked).toEqual([override]);
  });

  it("reports a --game-executable that does not exist", () => {
    const { machine } = recordingMachine("win32", [X86], windowsEnv);
    expect(() =>
      resolveGameExecutable({ gameExecutable: "missing.exe" }, root, machine),
    ).toThrow(
      new AuthorError(
        '--game-executable is set to "missing.exe", which does not exist.',
      ),
    );
  });

  it("refuses an empty --game-executable", () => {
    const { machine } = recordingMachine("win32", [X86], windowsEnv);
    expect(() =>
      resolveGameExecutable({ gameExecutable: "" }, root, machine),
    ).toThrow(new AuthorError("--game-executable must not be empty."));
  });

  it("takes WC3_EXECUTABLE before the well-known locations", () => {
    const { machine } = recordingMachine("win32", [ELSEWHERE, X86], {
      ...windowsEnv,
      [EXECUTABLE_ENV]: ELSEWHERE,
    });
    expect(resolveGameExecutable({}, root, machine)).toBe(ELSEWHERE);
  });

  it("resolves a relative WC3_EXECUTABLE against the root, as --game-executable", () => {
    const executable = path.join(root, "game", "wc3.exe");
    const { machine } = recordingMachine("win32", [executable], {
      ...windowsEnv,
      [EXECUTABLE_ENV]: path.join("game", "wc3.exe"),
    });
    expect(resolveGameExecutable({}, root, machine)).toBe(executable);
  });

  it("passes over a WC3_EXECUTABLE that does not exist", () => {
    const { machine } = recordingMachine("win32", [X64], {
      ...windowsEnv,
      [EXECUTABLE_ENV]: ELSEWHERE,
    });
    expect(resolveGameExecutable({}, root, machine)).toBe(X64);
  });

  it("looks at the Windows install locations in order, Program Files (x86) then Program Files, and at none elsewhere", () => {
    const both = recordingMachine("win32", [X86, X64], windowsEnv);
    expect(resolveGameExecutable({}, root, both.machine)).toBe(X86);
    expect(wellKnownExecutables("win32", {})).toEqual([X86, X64]);
    expect(wellKnownExecutables("darwin", {})).toEqual([]);
    expect(wellKnownExecutables("linux", {})).toEqual([]);
  });

  it("fails with one line naming WC3_EXECUTABLE and where it looked when no game is found", () => {
    const { machine } = recordingMachine("win32", [], windowsEnv);
    expect(() => resolveGameExecutable({}, root, machine)).toThrow(
      new AuthorError(
        `Warcraft III was not found. Set the ${EXECUTABLE_ENV} environment variable (or pass --game-executable) to the game's executable. Looked at: "${X86}", "${X64}".`,
      ),
    );
  });
});

/** The game's user folder on the fake machine. */
const USER_FOLDER = "C:\\Users\\me\\Documents\\Warcraft III";

/** What a scenario's game does as the fake time moves on. */
type Script = (step: {
  /** The fake time, in seconds. */
  time: number;
  game: FakeGame | undefined;
  /** The build's runId. */
  runId: string;
  /** The times a key was posted, in seconds. */
  keys: readonly number[];
  /** Writes the Result file with these `Preload` strings. */
  write: (lines: readonly string[]) => void;
}) => void;

interface Scenario {
  args?: string[];
  machine?: FakeMachineOptions;
  /** Members of the fake machine replaced. */
  overrides?: Partial<Machine>;
  script?: Script;
  signal?: AbortSignal;
}

interface Ran {
  code: number;
  stdout: string;
  stderr: string;
  events: GameEvent[];
  context: Context;
}

/**
 * Runs `probe:run` with `args` (`hello` by default) on a fake Windows
 * machine whose game is found and whose Result file `script` writes,
 * building into a temporary folder.
 */
async function run(scenario: Scenario = {}): Promise<Ran> {
  const dir = await mkdtemp(path.join(tmpdir(), "probe-run-"));
  const folders = {
    ...PROBE_FOLDERS,
    output: path.join(dir, "output"),
    state: path.join(dir, "state"),
  };
  const events: GameEvent[] = [];
  const files: Record<string, string> = { [ELSEWHERE]: "" };
  let file = "";
  const machine = fakeMachine({
    env: { [EXECUTABLE_ENV]: ELSEWHERE, [USER_FOLDER_VARIABLE]: USER_FOLDER },
    files,
    game: events,
    ...scenario.machine,
    onTime: (time, game) => {
      const keys = events.flatMap((event) =>
        event.event === "key" ? [event.at / 1000] : [],
      );
      const state = JSON.parse(
        readFileSync(stateFile(folders.state, "hello"), "utf8"),
      ) as { runId: string };
      scenario.script?.({
        time: time / 1000,
        game,
        runId: state.runId,
        keys,
        write: (lines) => {
          files[file] = preloadFile(lines);
        },
      });
    },
  });
  file = resultFile(machine, "hello");
  const context: Context = {
    folders,
    machine: {
      ...machine,
      // The build writes the state file to the disk, which the reader reads.
      readFile: (path) =>
        path.startsWith(dir) && existsSync(path)
          ? readFileSync(path, "utf8")
          : machine.readFile(path),
      ...scenario.overrides,
    },
    root,
    ...(scenario.signal !== undefined && { signal: scenario.signal }),
  };
  let stdout = "";
  let stderr = "";
  const code = await main(
    scenario.args ?? ["hello"],
    {
      stdout: (text) => (stdout += text),
      stderr: (text) => (stderr += text),
    },
    context,
  );
  return { code, stdout, stderr, events, context };
}

/** The `BEGIN` line of the run `runId` of hello. */
const begin = (runId: string) =>
  `1 BEGIN patch=3.0.0.24268 probe=hello run=${runId}`;

/**
 * hello's game: BEGIN on disk at `beginAt` seconds, during loading, then,
 * from a second after the first key posted once "Press any key to continue"
 * shows, at `screenAt` seconds (BEGIN's by default), each write of `after`,
 * in order, one per second. A key posted before the screen is lost.
 */
function game(
  beginAt: number,
  after: readonly (readonly string[])[] = [
    ["2 greeting word=hi", "3 END status=ok"],
  ],
  screenAt = beginAt,
): Script {
  return ({ time, runId, keys, write }) => {
    if (time < beginAt) return;
    const keyAt = keys.find((at) => at >= screenAt);
    if (keyAt === undefined || time < keyAt + 1) {
      write([begin(runId), "2 CHECKPOINT"]);
      return;
    }
    const step = Math.min(Math.floor(time - keyAt), after.length);
    write([begin(runId), ...(after[step - 1] ?? [])]);
  };
}

/** The progress lines and the read: stdout without the build's line. */
const afterBuild = (stdout: string) => stdout.split("\n").slice(1);

describe("probe:run", () => {
  it("builds, starts the game on the staged folder, posts one key once BEGIN is on disk, ends the game after END and prints the read, exit code 0", async () => {
    const { code, stdout, stderr, events, context } = await run({
      script: game(12),
    });

    expect(stderr).toBe("");
    expect(code).toBe(0);
    const staging = path.join(
      context.folders.output,
      "hello",
      "staging",
      "probe.w3m",
    );
    expect(events).toEqual([
      {
        at: 0,
        event: "start",
        command: {
          command: ELSEWHERE,
          args: ["-loadfile", staging, ...LAUNCH_ARGS],
        },
      },
      { at: 12_000, event: "key", pid: 4242 },
      { at: 13_000, event: "end", pid: 4242 },
    ]);
    expect(stdout).toMatch(
      /^Built Probe hello, run [0-9a-f-]+: .*probe\.w3m\n/,
    );
    const runId = /run ([0-9a-f-]+):/.exec(stdout)?.[1] ?? "";
    expect(afterBuild(stdout)).toEqual([
      "started pid=4242",
      "BEGIN at 12s",
      "key sent at 12s",
      "END at 13s status=ok",
      "killed pid=4242 at 13s after END",
      `finished: Probe hello, run ${runId}, 1 record`,
      "greeting word=hi",
      "",
    ]);
  });

  it("posts the key again every 2 seconds until the Probe writes past BEGIN, since a key before the screen that waits for it is lost", async () => {
    const { code, stdout, events } = await run({
      script: game(12, undefined, 13.5),
    });

    expect(code).toBe(0);
    expect(events.map((event) => [event.at, event.event])).toEqual([
      [0, "start"],
      [12_000, "key"],
      [14_000, "key"],
      [15_000, "end"],
    ]);
    expect(stdout).toContain(
      "BEGIN at 12s\nkey sent at 12s\nkey sent again at 14s\nEND at 15s status=ok\n",
    );
  });

  it("sends no key before the BEGIN of this build's run, whatever the Result file holds", async () => {
    const { events, code } = await run({
      script: (step) => {
        if (step.time < 20) {
          step.write([
            "1 BEGIN patch=3.0.0.24268 probe=hello run=stale",
            "2 END status=ok",
          ]);
        } else {
          game(20)(step);
        }
      },
    });

    expect(code).toBe(0);
    expect(events.find((event) => event.event === "key")?.at).toBe(20_000);
  });

  it("posts the key again until the game has a window", async () => {
    const { events, stdout } = await run({
      machine: { hasWindow: (time) => time >= 15_000 },
      script: game(12),
    });

    expect(events.filter((event) => event.event === "key")).toEqual([
      { at: 15_000, event: "key", pid: 4242 },
    ]);
    expect(stdout).toContain("BEGIN at 12s\nkey sent at 15s\n");
  });

  it("prints a line for each checkpoint it sees, with the pending step", async () => {
    const { stdout } = await run({
      script: game(12, [
        ["2 PENDING label=CreateTimer%20valid", "3 CHECKPOINT"],
        [
          "2 PENDING label=CreateTimer%20valid",
          "3 CALL outcome=handle",
          "4 END status=ok",
        ],
      ]),
    });

    expect(stdout).toContain(
      'key sent at 12s\ncheckpoint at 13s, pending "CreateTimer valid"\nEND at 14s status=ok\n',
    );
  });

  it("exits with code 1 and probe:read's line of a failed run", async () => {
    const { code, stdout } = await run({
      script: game(12, [
        ["2 ERROR message=Error:%20broke", "3 END status=failed"],
      ]),
    });

    expect(code).toBe(1);
    expect(stdout).toContain("END at 13s status=failed\n");
    expect(stdout).toMatch(
      /\nfailed: Probe hello, run [0-9a-f-]+, 0 records, then the error "Error: broke"\n$/,
    );
  });

  it("with no BEGIN after the begin timeout, captures the window once, says it waits for a human, and carries on when BEGIN comes", async () => {
    const { code, stdout, events, context } = await run({
      script: game(300),
    });

    const png = captureFile(context.folders, "hello", "no-begin");
    expect(code).toBe(0);
    expect(events.map((event) => [event.at, event.event])).toEqual([
      [0, "start"],
      [60_000, "capture"],
      [300_000, "key"],
      [301_000, "end"],
    ]);
    expect(events[1]).toEqual({
      at: 60_000,
      event: "capture",
      pid: 4242,
      file: png,
    });
    expect(existsSync(path.dirname(png))).toBe(true);
    expect(afterBuild(stdout).slice(1, 4)).toEqual([
      `waiting for a human: no BEGIN after 60s, capture at ${png}. Waiting up to 15 min for a login; stop the command to end the game.`,
      "BEGIN at 300s",
      "key sent at 300s",
    ]);
  });

  it("takes --begin-timeout in seconds", async () => {
    const { events } = await run({
      args: ["hello", "--begin-timeout", "5"],
      script: game(12),
    });

    expect(events.map((event) => [event.at, event.event])).toEqual([
      [0, "start"],
      [5_000, "capture"],
      [12_000, "key"],
      [13_000, "end"],
    ]);
  });

  it("says why a capture failed, and waits all the same", async () => {
    const { code, stdout } = await run({
      machine: { captureFailure: "no window" },
      script: game(100),
    });

    expect(code).toBe(0);
    expect(stdout).toContain(
      "waiting for a human: no BEGIN after 60s, no capture (no window). Waiting up to 15 min",
    );
  });

  it("ends the game after the human wait with no BEGIN, exit code 3", async () => {
    const { code, stdout, events } = await run({ script: () => undefined });

    const end = 60_000 + HUMAN_WAIT_SECONDS * 1000;
    expect(code).toBe(3);
    expect(events.map((event) => [event.at, event.event])).toEqual([
      [0, "start"],
      [60_000, "capture"],
      [end, "end"],
    ]);
    expect(stdout).toContain(
      `killed pid=4242 at ${String(end / 1000)}s after 15 min waiting for a human\nnot-started: no Result file at `,
    );
  });

  it("ends the game when the Result file stays unchanged for the stall timeout, captures it first, and reads crashed with the pending step, exit code 2", async () => {
    const { code, stdout, events, context } = await run({
      script: game(12, [["2 PENDING label=GetExpiredTimer", "3 CHECKPOINT"]]),
    });

    const png = captureFile(context.folders, "hello", "stall");
    expect(code).toBe(2);
    expect(events.map((event) => [event.at, event.event])).toEqual([
      [0, "start"],
      [12_000, "key"],
      [133_000, "capture"],
      [133_000, "end"],
    ]);
    expect(afterBuild(stdout).slice(3)).toEqual([
      "checkpoint at 13s, pending GetExpiredTimer",
      `stalled: the Result file unchanged for 120s, capture at ${png}`,
      "killed pid=4242 at 133s after a 120s stall",
      expect.stringMatching(
        /^crashed: Probe hello, run [0-9a-f-]+, 0 records to its last checkpoint, pending step GetExpiredTimer; Warcraft III\.exe is not running$/,
      ) as string,
      "",
    ]);
  });

  it("takes --stall-timeout in seconds", async () => {
    const { events } = await run({
      args: ["hello", "--stall-timeout", "30"],
      script: game(12, [["2 CHECKPOINT"]]),
    });

    // Its checkpoint rewrites what BEGIN wrote: the file is unchanged since the key.
    expect(events.at(-1)).toEqual({ at: 42_000, event: "end", pid: 4242 });
  });

  it("reads a game that exited by itself as crashed, and ends nothing", async () => {
    const { code, stdout, events } = await run({
      script: (step) => {
        game(12, [["2 PENDING label=boom", "3 CHECKPOINT"]])(step);
        const keyAt = step.keys.at(0);
        if (keyAt !== undefined && step.time >= keyAt + 5) {
          step.game?.exit();
        }
      },
    });

    expect(code).toBe(2);
    expect(events.map((event) => event.event)).toEqual(["start", "key"]);
    expect(stdout).toContain("the game exited by itself at 17s\ncrashed: ");
  });

  it("reads a game that exited before BEGIN as not-started, exit code 3", async () => {
    const { code, events } = await run({
      script: ({ time, game }) => {
        if (time >= 5) game?.exit();
      },
    });

    expect(code).toBe(3);
    expect(events.map((event) => event.event)).toEqual(["start"]);
  });

  it("ends the game on a stop and reads the run", async () => {
    const stop = new AbortController();
    const { code, stdout, events } = await run({
      signal: stop.signal,
      script: (step) => {
        game(12, [["2 CHECKPOINT"]])(step);
        if (step.time >= 20) stop.abort();
      },
    });

    expect(code).toBe(2);
    expect(events.at(-1)).toEqual({ at: 20_000, event: "end", pid: 4242 });
    expect(stdout).toContain("killed pid=4242 at 20s on a stop\ncrashed: ");
  });

  it("ends the game when the command itself fails once it has started, exit code 4", async () => {
    const events: GameEvent[] = [];
    const { code, stderr } = await run({
      machine: { game: events },
      overrides: {
        postKey: () => {
          throw new AuthorError("powershell.exe is missing.");
        },
      },
      script: game(12),
    });

    expect(code).toBe(4);
    expect(stderr).toBe("probe:run failed: powershell.exe is missing.\n");
    expect(events.map((event) => event.event)).toEqual(["start", "end"]);
  });

  it("refuses to start while Warcraft III.exe runs, before any build, exit code 4", async () => {
    const { code, stdout, stderr, events, context } = await run({
      machine: { processes: ["Warcraft III.exe"] },
    });

    expect(code).toBe(4);
    expect(stdout).toBe("");
    expect(stderr).toMatch(
      /^probe:run failed: Warcraft III\.exe is running already: close it first\. [^\n]*\n$/,
    );
    expect(events).toEqual([]);
    expect(existsSync(context.folders.output)).toBe(false);
  });

  it("refuses to run off native Windows, WSL included, exit code 4", async () => {
    for (const machine of [{ platform: "linux" as const }, { wsl: {} }]) {
      const { code, stderr, events } = await run({ machine });
      expect(code).toBe(4);
      expect(stderr).toMatch(
        /^probe:run failed: probe:run runs on native Windows only: [^\n]*\n$/,
      );
      expect(events).toEqual([]);
    }
  });

  it("fails before any build when no game is found, naming WC3_EXECUTABLE, exit code 4", async () => {
    const { code, stderr, events, context } = await run({
      machine: { env: { [USER_FOLDER_VARIABLE]: USER_FOLDER }, files: {} },
    });

    expect(code).toBe(4);
    expect(stderr).toMatch(
      /^probe:run failed: Warcraft III was not found\. Set the WC3_EXECUTABLE environment variable [^\n]*\n$/,
    );
    expect(events).toEqual([]);
    expect(existsSync(context.folders.output)).toBe(false);
  });

  it("reports a game that cannot be started on one line, exit code 4", async () => {
    const { code, stderr } = await run({
      overrides: {
        startGame: () =>
          Promise.reject(
            new AuthorError(`Could not start "${ELSEWHERE}": no such file.`),
          ),
      },
    });

    expect(code).toBe(4);
    expect(stderr).toBe(
      `probe:run failed: Could not start "${ELSEWHERE}": no such file.\n`,
    );
  });

  it("refuses a bad Probe name with a one-line author error", async () => {
    const { code, stderr, events } = await run({ args: ["Hello"] });

    expect(code).toBe(4);
    expect(stderr).toMatch(/^probe:run failed: [^\n]*kebab-case[^\n]*\n$/);
    expect(events).toEqual([]);
  });

  it.each([
    [[]],
    [["hello", "other"]],
    [["hello", "--unknown"]],
    [["hello", "--begin-timeout"]],
    [["hello", "--begin-timeout", "0"]],
    [["hello", "--stall-timeout", "soon"]],
  ])("prints the usage for the arguments %j, exit code 4", async (args) => {
    const { code, stdout, stderr, events } = await run({ args });

    expect(code).toBe(4);
    expect(stdout).toBe("");
    expect(stderr).toMatch(/^Usage: probe:run <probe> /);
    expect(events).toEqual([]);
  });
});
