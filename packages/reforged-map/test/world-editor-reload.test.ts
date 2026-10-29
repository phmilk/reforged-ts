// The World Editor reload (#706): from a map folder and the World Editor's
// executable to `-launch -loadfile <Windows path>`, started without waiting.
// The launcher is injected, except in the test that starts a real process
// (a shell script standing in for the editor), and the system is given, except
// in the tests that run `wslpath` on WSL and the one that refuses elsewhere.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it, vi } from "vitest";
import { reloadWorldEditor } from "../src/index.js";
import {
  makeTempDir,
  mapFolder,
  removeTemporary,
} from "./support/map-folder.js";

afterAll(removeTemporary);

/** A file standing in for the World Editor's executable. */
function executable(): string {
  const file = path.join(makeTempDir(), "World Editor.exe");
  fs.writeFileSync(file, "");
  return file;
}

/** The error `run` throws, or undefined when it returns. */
function thrown(run: () => unknown): unknown {
  try {
    run();
  } catch (error) {
    return error;
  }
  return undefined;
}

/** Whether this is WSL, where `wslpath` converts a path. */
function onWsl(): boolean {
  if (process.platform !== "linux") return false;
  const wsl =
    process.env.WSL_DISTRO_NAME !== undefined ||
    /microsoft/i.test(
      fs.readFileSync("/proc/sys/kernel/osrelease", { encoding: "utf8" }),
    );
  return wsl && spawnSync("which", ["wslpath"]).status === 0;
}

describe("reloadWorldEditor", () => {
  it("runs the executable with -launch -loadfile and the map folder's path, on Windows", () => {
    const folder = mapFolder({});
    const editor = executable();
    const launch = vi.fn();

    reloadWorldEditor(folder, editor, { system: "windows", launch });

    expect(launch).toHaveBeenCalledOnce();
    expect(launch).toHaveBeenCalledWith(editor, [
      "-launch",
      "-loadfile",
      path.resolve(folder),
    ]);
  });

  it("passes the map folder's Windows path under WSL, converted by wslpath -w", () => {
    const folder = mapFolder({});
    const editor = executable();
    const launch = vi.fn();
    const windowsPath = vi.fn(() => "C:\\maps\\test.w3m");

    reloadWorldEditor(folder, editor, { system: "wsl", windowsPath, launch });

    expect(windowsPath).toHaveBeenCalledWith(path.resolve(folder));
    expect(launch).toHaveBeenCalledWith(editor, [
      "-launch",
      "-loadfile",
      "C:\\maps\\test.w3m",
    ]);
  });

  // Measured 0.0 s with pnpm test on Linux (WSL 2, 8 threads), 2026-10: it runs
  // on WSL alone.
  it.runIf(onWsl())(
    "converts the path with the real wslpath -w on WSL",
    () => {
      const folder = mapFolder({});
      const launch = vi.fn();

      reloadWorldEditor(folder, executable(), { launch });

      const expected = spawnSync("wslpath", ["-w", folder], {
        encoding: "utf8",
      }).stdout.trim();
      expect(launch.mock.calls[0]?.[1]).toEqual([
        "-launch",
        "-loadfile",
        expected,
      ]);
    },
    15_000,
  );

  it("throws when wslpath fails, launching nothing", () => {
    const launch = vi.fn();

    const error = thrown(() => {
      reloadWorldEditor(mapFolder({}), executable(), {
        system: "wsl",
        windowsPath: () => {
          throw new Error("wslpath could not run: spawnSync wslpath ENOENT");
        },
        launch,
      });
    });

    expect(error).toBeInstanceOf(Error);
    expect(String(error)).toContain("wslpath could not run");
    expect(launch).not.toHaveBeenCalled();
  });

  it("throws when the executable is not a file, launching nothing", () => {
    const launch = vi.fn();
    const missing = path.join(makeTempDir(), "World Editor.exe");

    const error = thrown(() => {
      reloadWorldEditor(mapFolder({}), missing, { system: "windows", launch });
    });

    expect(error).toBeInstanceOf(Error);
    expect(String(error)).toContain(missing);
    expect(launch).not.toHaveBeenCalled();
  });

  it("throws when the map folder is missing, launching nothing", () => {
    const launch = vi.fn();
    const missing = path.join(makeTempDir(), "missing.w3m");

    const error = thrown(() => {
      reloadWorldEditor(missing, executable(), { system: "windows", launch });
    });

    expect(error).toBeInstanceOf(Error);
    expect(String(error)).toContain(missing);
    expect(launch).not.toHaveBeenCalled();
  });

  it.runIf(process.platform !== "win32" && !onWsl())(
    "throws on a system that is neither Windows nor WSL, launching nothing",
    () => {
      const launch = vi.fn();

      const error = thrown(() => {
        reloadWorldEditor(mapFolder({}), executable(), { launch });
      });

      expect(error).toBeInstanceOf(Error);
      expect(String(error)).toContain("Windows or WSL");
      expect(launch).not.toHaveBeenCalled();
    },
  );

  // Measured 0.1 s with pnpm test on Linux (WSL 2, 8 threads), 2026-10, skipped
  // on windows. Kept above its own waits, 5 s and 10 s.
  it.runIf(process.platform !== "win32")(
    "starts the executable and returns without waiting for it",
    async () => {
      const folder = mapFolder({});
      const dir = makeTempDir();
      const out = path.join(dir, "arguments.txt");
      const script = path.join(dir, "editor.sh");
      fs.writeFileSync(
        script,
        `#!/bin/sh\nprintf '%s\\n' "$@" > '${out}.part'\nmv '${out}.part' '${out}'\nsleep 30\n`,
      );
      fs.chmodSync(script, 0o755);

      const start = Date.now();
      reloadWorldEditor(folder, script, { system: "windows" });
      expect(Date.now() - start).toBeLessThan(5_000);

      await vi.waitFor(
        () => {
          expect(fs.existsSync(out)).toBe(true);
        },
        { timeout: 10_000, interval: 50 },
      );
      expect(fs.readFileSync(out, "utf8").split("\n")).toEqual([
        "-launch",
        "-loadfile",
        path.resolve(folder),
        "",
      ]);
    },
    20_000,
  );
});
