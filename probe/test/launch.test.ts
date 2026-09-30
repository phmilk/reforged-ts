import { mkdtemp, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { main, type Context } from "../src/cli/launch.js";
import { AuthorError } from "../src/errors.js";
import { PROBE_FOLDERS } from "../src/folders.js";
import {
  EXECUTABLE_ENV,
  resolveGameLaunch,
  wellKnownExecutables,
} from "../src/game.js";
import { LAUNCH_ARGS } from "../src/launch.js";
import type { SpawnCommand } from "../src/machine.js";
import { stateFile } from "../src/state.js";
import { fakeMachine, type FakeMachineOptions } from "./support/machine.js";

const X86 =
  "C:\\Program Files (x86)\\Warcraft III\\_retail_\\x86_64\\Warcraft III.exe";
const X64 =
  "C:\\Program Files\\Warcraft III\\_retail_\\x86_64\\Warcraft III.exe";
const MAC =
  "/Applications/Warcraft III/_retail_/x86_64/Warcraft III.app/Contents/MacOS/Warcraft III";
const windowsEnv = {
  "ProgramFiles(x86)": "C:\\Program Files (x86)",
  ProgramFiles: "C:\\Program Files",
};

/** The folder relative paths resolve against: absolute on this machine. */
const root = path.resolve("fake-workspace");
/** An executable outside the well-known locations, absolute on this machine. */
const ELSEWHERE = path.resolve("elsewhere", "wc3");

/** A fake machine where exactly `existing` exist, recording what was asked. */
function probeMachine(
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

describe("resolveGameLaunch", () => {
  it("takes --game-executable before WC3_EXECUTABLE and the well-known locations, resolved against the root", () => {
    const override = path.join(root, "game", "wc3.exe");
    const { machine, asked } = probeMachine("win32", [override, X86], {
      ...windowsEnv,
      [EXECUTABLE_ENV]: X86,
    });
    expect(
      resolveGameLaunch({ gameExecutable: "game/wc3.exe" }, root, machine),
    ).toEqual({ executable: override });
    expect(asked).toEqual([override]);
  });

  it("reports a --game-executable that does not exist", () => {
    const { machine } = probeMachine("win32", [X86], windowsEnv);
    expect(() =>
      resolveGameLaunch({ gameExecutable: "missing.exe" }, root, machine),
    ).toThrow(
      new AuthorError(
        '--game-executable is set to "missing.exe", which does not exist.',
      ),
    );
  });

  it("takes WC3_EXECUTABLE before the well-known locations", () => {
    const { machine } = probeMachine("win32", [ELSEWHERE, X86], {
      ...windowsEnv,
      [EXECUTABLE_ENV]: ELSEWHERE,
    });
    expect(resolveGameLaunch({}, root, machine)).toEqual({
      executable: ELSEWHERE,
    });
  });

  it("passes over a WC3_EXECUTABLE that does not exist", () => {
    const { machine } = probeMachine("win32", [X64], {
      ...windowsEnv,
      [EXECUTABLE_ENV]: ELSEWHERE,
    });
    expect(resolveGameLaunch({}, root, machine)).toEqual({ executable: X64 });
  });

  it("looks at the well-known locations in order: Program Files (x86), then Program Files", () => {
    const both = probeMachine("win32", [X86, X64], windowsEnv);
    expect(resolveGameLaunch({}, root, both.machine)).toEqual({
      executable: X86,
    });
    expect(wellKnownExecutables("win32", {})).toEqual([X86, X64]);
    expect(wellKnownExecutables("darwin", {})).toEqual([MAC]);
    expect(wellKnownExecutables("linux", {})).toEqual([]);
  });

  it("fails with one line naming WC3_EXECUTABLE and where it looked when no game is found", () => {
    const { machine } = probeMachine("win32", [], windowsEnv);
    expect(() => resolveGameLaunch({}, root, machine)).toThrow(
      new AuthorError(
        `Warcraft III was not found. Set the ${EXECUTABLE_ENV} environment variable (or pass --game-executable) to the game's executable. Looked at: "${X86}", "${X64}".`,
      ),
    );
    const linux = probeMachine("linux", []);
    expect(() => resolveGameLaunch({}, root, linux.machine)).toThrow(
      /^Warcraft III was not found\. Set the WC3_EXECUTABLE environment variable [^\n]*executable\.$/,
    );
  });

  it("through Wine, takes --game-executable as the Windows side's path, unchecked, and resolves the prefix", () => {
    const { machine, asked } = probeMachine("linux", []);
    expect(
      resolveGameLaunch(
        { gameExecutable: X86, winePath: "wine", winePrefix: "wine-wc3" },
        root,
        machine,
      ),
    ).toEqual({
      executable: X86,
      winePath: "wine",
      winePrefix: path.join(root, "wine-wc3"),
    });
    expect(asked).toEqual([]);
  });

  it("refuses an empty option", () => {
    const { machine } = probeMachine("linux", []);
    expect(() => resolveGameLaunch({ winePath: "" }, root, machine)).toThrow(
      new AuthorError("--wine-path must not be empty."),
    );
  });
});

/** The staged map folder of a build of `probe` in `output`. */
function stagingFolder(output: string, probe: string): string {
  return path.join(output, probe, "staging", "probe.w3m");
}

interface Launch {
  code: number;
  stdout: string;
  stderr: string;
  spawned: SpawnCommand[];
  context: Context;
}

/** Runs `probe:launch` with `args` on a fake machine, building into a temporary folder. */
async function launch(
  args: string[],
  machine: FakeMachineOptions = {},
): Promise<Launch> {
  const dir = await mkdtemp(path.join(tmpdir(), "probe-launch-"));
  const spawned: SpawnCommand[] = [];
  const context: Context = {
    folders: {
      ...PROBE_FOLDERS,
      output: path.join(dir, "output"),
      state: path.join(dir, "state"),
    },
    machine: fakeMachine({ ...machine, spawned }),
    root,
  };
  let stdout = "";
  let stderr = "";
  const code = await main(
    args,
    {
      stdout: (text) => (stdout += text),
      stderr: (text) => (stderr += text),
    },
    context,
  );
  return { code, stdout, stderr, spawned, context };
}

/** The runId the last build of `probe` stored. */
async function builtRunId(context: Context, probe: string): Promise<string> {
  const state = JSON.parse(
    await readFile(stateFile(context.folders.state, probe), "utf8"),
  ) as { runId: string };
  return state.runId;
}

describe("probe:launch", () => {
  it("fails before any build when no game is found, naming WC3_EXECUTABLE, with exit code 1", async () => {
    const { code, stdout, stderr, spawned, context } = await launch(["hello"], {
      env: windowsEnv,
    });

    expect(code).toBe(1);
    expect(stdout).toBe("");
    expect(stderr).toMatch(
      /^probe:launch failed: Warcraft III was not found\. Set the WC3_EXECUTABLE environment variable [^\n]*\n$/,
    );
    expect(spawned).toEqual([]);
    expect(existsSync(context.folders.output)).toBe(false);
    expect(existsSync(stateFile(context.folders.state, "hello"))).toBe(false);
  });

  it("builds, then starts the game detached on the staged folder with the Template's arguments", async () => {
    const { code, stderr, spawned, context } = await launch(["hello"], {
      env: { ...windowsEnv, [EXECUTABLE_ENV]: ELSEWHERE },
      files: { [ELSEWHERE]: "" },
    });

    expect(stderr).toBe("");
    expect(code).toBe(0);
    const staging = stagingFolder(context.folders.output, "hello");
    expect(spawned).toEqual([
      {
        command: ELSEWHERE,
        args: [
          "-loadfile",
          staging,
          "-launch",
          "-editor",
          "-windowmode",
          "windowed",
        ],
        env: {},
      },
    ]);
    expect(existsSync(path.join(staging, "war3map.lua"))).toBe(true);
    expect(await builtRunId(context, "hello")).toMatch(/\S/);
  });

  it("starts the game through Wine with the folder as a Z: path and the prefix set", async () => {
    const { code, stderr, spawned, context } = await launch(
      [
        "hello",
        "--game-executable",
        X86,
        "--wine-path",
        "wine",
        "--wine-prefix",
        "wine-wc3",
      ],
      { platform: "linux" },
    );

    expect(stderr).toBe("");
    expect(code).toBe(0);
    const staging = stagingFolder(context.folders.output, "hello");
    expect(spawned).toEqual([
      {
        command: "wine",
        args: [
          X86,
          "-loadfile",
          `Z:${staging.split(path.sep).join("/")}`,
          ...LAUNCH_ARGS,
        ],
        env: { WINEPREFIX: path.join(root, "wine-wc3") },
      },
    ]);
  });

  it("leaves WINEPREFIX to Wine without --wine-prefix", async () => {
    const { spawned } = await launch(
      ["hello", "--game-executable", X86, "--wine-path", "wine"],
      { platform: "linux" },
    );
    expect(spawned.map((command) => command.env)).toEqual([{}]);
  });

  it("prints the build, the launch, and the three steps of the human's part, naming the Probe", async () => {
    const { stdout, context } = await launch(["hello"], {
      env: { [EXECUTABLE_ENV]: ELSEWHERE },
      files: { [ELSEWHERE]: "" },
    });

    const staging = stagingFolder(context.folders.output, "hello");
    const runId = await builtRunId(context, "hello");
    expect(stdout).toBe(
      [
        `Built Probe hello, run ${runId}: ${staging}`,
        `Started ${ELSEWHERE} on it.`,
        "",
        "Now:",
        '1. Wait until the game shows "Probe hello finished" (or "Probe hello failed").',
        "2. Close the game.",
        '3. Say "done", or "crashed" if the game crashed or froze before that message.',
        "",
      ].join("\n"),
    );
  });

  it("reports a game that cannot be started on one line, with exit code 1", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "probe-launch-"));
    let stderr = "";
    const code = await main(
      ["hello"],
      { stdout: () => undefined, stderr: (text) => (stderr += text) },
      {
        folders: {
          ...PROBE_FOLDERS,
          output: path.join(dir, "output"),
          state: path.join(dir, "state"),
        },
        machine: {
          ...fakeMachine({
            env: { [EXECUTABLE_ENV]: ELSEWHERE },
            files: { [ELSEWHERE]: "" },
          }),
          spawnDetached: () =>
            Promise.reject(
              new AuthorError(`Could not start "${ELSEWHERE}": no such file.`),
            ),
        },
        root,
      },
    );
    expect(code).toBe(1);
    expect(stderr).toBe(
      `probe:launch failed: Could not start "${ELSEWHERE}": no such file.\n`,
    );
  });

  it("refuses a bad Probe name with a one-line author error", async () => {
    const { code, stderr, spawned } = await launch(["Hello"], {
      env: { [EXECUTABLE_ENV]: ELSEWHERE },
      files: { [ELSEWHERE]: "" },
    });
    expect(code).toBe(1);
    expect(stderr).toMatch(/^probe:launch failed: [^\n]*kebab-case[^\n]*\n$/);
    expect(spawned).toEqual([]);
  });

  it.each([
    [[]],
    [["hello", "other"]],
    [["hello", "--unknown"]],
    [["hello", "--wine-path"]],
  ])(
    "prints the usage for the arguments %j, with exit code 1",
    async (args) => {
      const { code, stdout, stderr, spawned } = await launch(args);
      expect(code).toBe(1);
      expect(stdout).toBe("");
      expect(stderr).toMatch(/Usage: probe:launch <probe>/);
      expect(spawned).toEqual([]);
    },
  );
});
