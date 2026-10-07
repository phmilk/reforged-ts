/**
 * The generator mirrors three helpers of the Probe runner, which it cannot
 * import (the packages share no code): the `.build.info` reader, the WSL
 * check and the script check. Each pair is run on the same inputs here, so
 * a fix to one that misses the other fails.
 */
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { invokedDirectly as probeInvokedDirectly } from "../../../probe/src/cli/common.js";
import { readClientBuild } from "../../../probe/src/game.js";
import { isWsl as probeIsWsl } from "../../../probe/src/machine.js";
import { parseBuildInfo } from "../src/casc/storage.js";
import { invokedDirectly, isWsl } from "../src/cli/generate.js";

const KEY = "3a9d8f26806936764d2d9ad526a65e04";
/**
 * The Probe runner joins paths by the host's rules, so the executable and
 * the file it reads are built the same way (backslashes on Windows).
 */
const EXECUTABLE = path.join("/x", "_retail_", "x86_64", "Warcraft III.exe");
const BUILD_INFO = path.join("/x", ".build.info");
const HEADER = "Branch!STRING:0|Active!DEC:1|Build Key!HEX:16|Version!STRING:0";

/** The Build each reader takes from `text`, or that it refuses it. */
function both(text: string) {
  const ours = (() => {
    try {
      return parseBuildInfo(text, "/x/.build.info").build;
    } catch {
      return "refused";
    }
  })();
  const probe = (() => {
    try {
      return readClientBuild(EXECUTABLE, {
        readFile: (file) => (file === BUILD_INFO ? text : undefined),
      }).build;
    } catch {
      return "refused";
    }
  })();
  return { ours, probe };
}

describe("parseBuildInfo and the Probe runner's readClientBuild", () => {
  it.each([
    [
      "the active row's Version",
      `${HEADER}\neu|0|${KEY}|1.0.0.1\nus|1|${KEY}|3.0.0.24268\n`,
      "3.0.0.24268",
    ],
    [
      "with CRLF line ends",
      `${HEADER}\r\neu|0|${KEY}|1.0.0.1\r\nus|1|${KEY}|3.0.0.24268\r\n`,
      "3.0.0.24268",
    ],
    [
      "the first row without an Active column",
      `Branch!STRING:0|Build Key!HEX:16|Version!STRING:0\nus|${KEY}|3.0.0.1\neu|${KEY}|3.0.0.2\n`,
      "3.0.0.1",
    ],
    ["no active row", `${HEADER}\nus|0|${KEY}|3.0.0.24268\n`, "refused"],
    ["an active row with no Version", `${HEADER}\nus|1|${KEY}|\n`, "refused"],
    [
      "no Version column",
      `Branch!STRING:0|Active!DEC:1|Build Key!HEX:16\nus|1|${KEY}\n`,
      "refused",
    ],
  ])("agree on %s", (_, text, build) => {
    expect(both(text)).toEqual({ ours: build, probe: build });
  });
});

describe("isWsl and the Probe runner's", () => {
  it.each([
    ["win32", { WSL_DISTRO_NAME: "Ubuntu" }, "Microsoft"],
    ["linux", { WSL_DISTRO_NAME: "Ubuntu" }, undefined],
    ["linux", { WSL_DISTRO_NAME: "" }, "Linux version 6.6-microsoft-standard"],
    ["linux", {}, "Linux version 6.6 (gcc)"],
    ["linux", {}, undefined],
  ] as const)("agree on %s %j %j", (platform, env, procVersion) => {
    expect(isWsl(platform, env, procVersion)).toBe(
      probeIsWsl(platform, env, procVersion),
    );
  });
});

describe("invokedDirectly and the Probe runner's", () => {
  const argv = process.argv;
  afterEach(() => {
    process.argv = argv;
  });

  it.each([
    [
      ["node", "/pkg/build/cli/generate.js"],
      "file:///pkg/build/cli/generate.js",
    ],
    [["node", "/pkg/build/cli/other.js"], "file:///pkg/build/cli/generate.js"],
    [["node"], "file:///pkg/build/cli/generate.js"],
  ])("agree on %j", (args, moduleUrl) => {
    process.argv = args;
    expect(invokedDirectly(moduleUrl)).toBe(probeInvokedDirectly(moduleUrl));
  });
});
