import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main, type Context } from "../src/cli/read.js";
import { systemMachine } from "../src/machine.js";
import { unwrapPreloadFile } from "../src/read.js";
import { stateFile } from "../src/state.js";
import { USER_FOLDER_VARIABLE } from "../src/user-folder.js";
import {
  BRIDGE_PROBE,
  BRIDGE_RUN_ID,
  bridgeLines,
  preloadFile,
} from "./support/bridge.js";

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
        "finished: Probe hello, run bridge, 1 record",
        "greeting count=1 word=hello",
        "",
      ].join("\n"),
      stderr: "",
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
