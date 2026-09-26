import { describe, expect, it } from "vitest";
import { commandLine, runInherited } from "../src/process.js";
import { tempDir, writeText } from "./support/workspace.js";

/** Node running `script`, which exits with the code it decides. */
const node = (script: string) => ({
  command: process.execPath,
  args: ["-e", script],
});

describe("runInherited", () => {
  it("resolves with the exit code", async () => {
    expect(await runInherited(node("process.exit(3)"))).toBe(3);
    expect(await runInherited(node("process.exit(0)"))).toBe(0);
  });

  it("runs in the folder given, with the variables added to the environment", async () => {
    const cwd = await tempDir("process");
    await writeText(cwd, "marker", "");
    const script =
      'process.exit(require("node:fs").existsSync("marker") && process.env.RELEASE_PROCESS_TEST === "yes" ? 0 : 1)';

    expect(
      await runInherited({
        ...node(script),
        cwd,
        env: { RELEASE_PROCESS_TEST: "yes" },
      }),
    ).toBe(0);
    expect(await runInherited({ ...node(script), cwd })).toBe(1);
  });

  it("rejects when the program cannot be started", async () => {
    await expect(
      runInherited({ command: "reforged-no-such-program", args: [] }),
    ).rejects.toThrow();
  });
});

describe("commandLine", () => {
  it("joins the command and its arguments", () => {
    expect(
      commandLine({ command: "pnpm", args: ["run", "build", "--mode"] }),
    ).toBe("pnpm run build --mode");
  });
});
