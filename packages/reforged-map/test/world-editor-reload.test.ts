// The World Editor reload (#706, #871): from a map folder and the World
// Editor's executable to Close Map on the window that holds it, then
// `-launch -loadfile <Windows path>`, and what the World Editor showed after.
// The window system is a stand-in World Editor (`fakeEditor`): its windows'
// titles, what Close Map and `-loadfile` do to them, and its dialogs. The
// launcher is injected, except in the test that starts a real process (a
// shell script standing in for the editor), and the system is given, except
// in the tests that run `wslpath` on WSL and the one that refuses elsewhere.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it, vi } from "vitest";
import {
  reloadWorldEditor,
  type WorldEditorWindow,
  type WorldEditorWindows,
} from "../src/index.js";
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

/** The main window's title while it holds no map. */
const NO_MAP = "Warcraft III World Editor";

/** A main window's title holding a path, with unsaved edits or not. */
const holding = (folder: string, modified = false): string =>
  `${NO_MAP} - [${folder}${modified ? " *" : ""}]`;

/** What the stand-in World Editor does on Close Map and on `-loadfile`. */
interface Behaviour {
  /** `"close"` drops the path from the title, `"prompt"` opens the "Save changes?" Warning, `"ignore"` does nothing; `"close"` when left out. */
  readonly onClose?: "close" | "prompt" | "ignore";
  /** `"load"` shows the closed path again, `"warn"` opens the "already open" Warning, `"nothing"`; `"load"` when left out. */
  readonly onLoad?: "load" | "warn" | "nothing";
  /** How many reads of the windows Close Map takes to show; 0 when left out. */
  readonly closeAfter?: number;
}

/**
 * A stand-in World Editor: its windows by handle and title, and what it does
 * on Close Map and on `-loadfile`. Every call is logged in order.
 */
function fakeEditor(
  initial: readonly (readonly [handle: string, title: string])[],
  behaviour: Behaviour = {},
) {
  let windows: WorldEditorWindow[] = initial.map(([handle, title]) => ({
    handle,
    title,
    kind: title === "Warning" ? "warning" : "main",
  }));
  const log: string[] = [];
  let closed: { readonly handle: string; readonly title: string } | undefined;
  let closing: (() => void) | undefined;
  let reads = 0;
  const windowSystem: WorldEditorWindows = {
    list: () => {
      log.push("list");
      if (closing !== undefined && reads++ >= (behaviour.closeAfter ?? 0)) {
        closing();
        closing = undefined;
      }
      return windows;
    },
    closeMap: (handle) => {
      log.push(`close ${handle}`);
      const window = windows.find((each) => each.handle === handle);
      if (window === undefined) return;
      if (behaviour.onClose === "prompt") {
        windows = [
          ...windows,
          { handle: "prompt", title: "Warning", kind: "warning" },
        ];
      } else if (behaviour.onClose !== "ignore") {
        reads = 0;
        closing = () => {
          closed = { handle, title: window.title };
          windows = windows.map((each) =>
            each.handle === handle ? { ...each, title: NO_MAP } : each,
          );
        };
      }
    },
    cancel: (handle) => {
      log.push(`cancel ${handle}`);
      windows = windows.filter((each) => each.handle !== handle);
    },
  };
  const launch = vi.fn((_executable: string, args: readonly string[]) => {
    log.push(`launch ${args.join(" ")}`);
    if (behaviour.onLoad === "warn") {
      windows = [
        ...windows,
        { handle: "already-open", title: "Warning", kind: "warning" },
      ];
    } else if (behaviour.onLoad !== "nothing" && closed !== undefined) {
      const { handle, title } = closed;
      windows = windows.map((each) =>
        each.handle === handle ? { ...each, title } : each,
      );
    }
  });
  return {
    log,
    launch,
    titles: () => windows.map((window) => window.title),
    options: {
      system: "windows" as const,
      windows: windowSystem,
      launch,
      closeTimeout: 200,
      loadTimeout: 200,
      pollInterval: 1,
    },
  };
}

describe("reloadWorldEditor", () => {
  it("runs the executable with -launch -loadfile and the map folder's path, on Windows", () => {
    const folder = mapFolder({});
    const editor = executable();
    const launch = vi.fn();

    const result = reloadWorldEditor(folder, editor, {
      ...fakeEditor([]).options,
      launch,
    });

    expect(result).toEqual({ status: "opened" });
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

    reloadWorldEditor(folder, editor, {
      ...fakeEditor([]).options,
      system: "wsl",
      windowsPath,
      launch,
    });

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

      reloadWorldEditor(folder, executable(), {
        windows: fakeEditor([]).options.windows,
        launch,
      });

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
        ...fakeEditor([]).options,
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
      reloadWorldEditor(mapFolder({}), missing, {
        ...fakeEditor([]).options,
        launch,
      });
    });

    expect(error).toBeInstanceOf(Error);
    expect(String(error)).toContain(missing);
    expect(launch).not.toHaveBeenCalled();
  });

  it("throws when the map folder is missing, launching nothing", () => {
    const launch = vi.fn();
    const missing = path.join(makeTempDir(), "missing.w3m");

    const error = thrown(() => {
      reloadWorldEditor(missing, executable(), {
        ...fakeEditor([]).options,
        launch,
      });
    });

    expect(error).toBeInstanceOf(Error);
    expect(String(error)).toContain(missing);
    expect(launch).not.toHaveBeenCalled();
  });

  it("throws when the windows cannot be read, launching nothing", () => {
    const editor = fakeEditor([]);

    const error = thrown(() => {
      reloadWorldEditor(mapFolder({}), executable(), {
        ...editor.options,
        windows: {
          ...editor.options.windows,
          list: () => {
            throw new Error("powershell.exe could not run");
          },
        },
      });
    });

    expect(String(error)).toContain("powershell.exe could not run");
    expect(editor.launch).not.toHaveBeenCalled();
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
      reloadWorldEditor(folder, script, {
        system: "windows",
        windows: fakeEditor([]).options.windows,
      });
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

describe("reloadWorldEditor and a World Editor that holds the map", () => {
  it("closes the map in the clean window that holds it, waits for the close, then loads it again", () => {
    const folder = path.resolve(mapFolder({}));
    const editor = fakeEditor(
      [
        ["1", holding(folder)],
        ["2", holding("C:\\maps\\other.w3m")],
      ],
      { closeAfter: 3 },
    );

    const result = reloadWorldEditor(folder, executable(), editor.options);

    expect(result).toEqual({ status: "reloaded" });
    // Close Map went to window 1 only; -loadfile ran once the title had
    // dropped the path, three reads later.
    expect(editor.log).toEqual([
      "list",
      "close 1",
      "list",
      "list",
      "list",
      "list",
      `launch -launch -loadfile ${folder}`,
      "list",
    ]);
    expect(editor.titles()).toEqual([
      holding(folder),
      holding("C:\\maps\\other.w3m"),
    ]);
  });

  it("compares the title's path with slashes alike, ignoring case and a trailing separator", () => {
    const folder = path.resolve(mapFolder({}));
    const shown = `${folder.replaceAll("/", "\\").toUpperCase()}\\`;
    const editor = fakeEditor([["7", holding(shown)]]);

    const result = reloadWorldEditor(folder, executable(), editor.options);

    expect(result).toEqual({ status: "reloaded" });
    expect(editor.log).toContain("close 7");
  });

  it("never closes a window that holds another map: it only starts the executable", () => {
    const folder = path.resolve(mapFolder({}));
    const editor = fakeEditor([["2", holding("C:\\maps\\other.w3m")]]);

    const result = reloadWorldEditor(folder, executable(), editor.options);

    expect(result).toEqual({ status: "opened" });
    expect(editor.log).toEqual(["list", `launch -launch -loadfile ${folder}`]);
  });

  it("never closes a window that shows unsaved edits for the map, and starts nothing", () => {
    const folder = path.resolve(mapFolder({}));
    const editor = fakeEditor([["1", holding(folder, true)]]);

    const result = reloadWorldEditor(folder, executable(), editor.options);

    expect(result).toMatchObject({
      status: "not-reloaded",
      reason: "modified",
    });
    expect(editor.log).toEqual(["list"]);
  });

  it("starts nothing while a World Editor Warning is already open", () => {
    const folder = path.resolve(mapFolder({}));
    const editor = fakeEditor([
      ["1", holding(folder)],
      ["9", "Warning"],
    ]);

    const result = reloadWorldEditor(folder, executable(), editor.options);

    expect(result).toMatchObject({
      status: "not-reloaded",
      reason: "dialog-open",
    });
    expect(editor.log).toEqual(["list"]);
  });

  it("cancels the Save changes prompt of Close Map, keeping the map, and starts nothing", () => {
    const folder = path.resolve(mapFolder({}));
    const editor = fakeEditor([["1", holding(folder)]], { onClose: "prompt" });

    const result = reloadWorldEditor(folder, executable(), editor.options);

    expect(result).toMatchObject({
      status: "not-reloaded",
      reason: "save-prompt",
    });
    expect(editor.log).toEqual(["list", "close 1", "list", "cancel prompt"]);
    expect(editor.titles()).toEqual([holding(folder)]);
    expect(editor.launch).not.toHaveBeenCalled();
  });

  it("starts nothing when the window still shows the map once the close timeout runs out", () => {
    const folder = path.resolve(mapFolder({}));
    const editor = fakeEditor([["1", holding(folder)]], { onClose: "ignore" });

    const result = reloadWorldEditor(folder, executable(), {
      ...editor.options,
      closeTimeout: 20,
    });

    expect(result).toMatchObject({
      status: "not-reloaded",
      reason: "not-closed",
    });
    expect(editor.launch).not.toHaveBeenCalled();
  });

  it("presses away the Warning -loadfile shows, and says the map was not reloaded", () => {
    const folder = path.resolve(mapFolder({}));
    const editor = fakeEditor([["1", holding(folder)]], { onLoad: "warn" });

    const result = reloadWorldEditor(folder, executable(), editor.options);

    expect(result).toMatchObject({
      status: "not-reloaded",
      reason: "warning",
    });
    expect((result as { message: string }).message).toContain(folder);
    expect(editor.log.slice(-3)).toEqual([
      `launch -launch -loadfile ${folder}`,
      "list",
      "cancel already-open",
    ]);
    expect(editor.titles()).not.toContain("Warning");
  });

  it("says the map was not reloaded when no window shows it again before the load timeout", () => {
    const folder = path.resolve(mapFolder({}));
    const editor = fakeEditor([["1", holding(folder)]], { onLoad: "nothing" });

    const result = reloadWorldEditor(folder, executable(), {
      ...editor.options,
      loadTimeout: 20,
    });

    expect(result).toMatchObject({
      status: "not-reloaded",
      reason: "not-loaded",
    });
    expect(editor.launch).toHaveBeenCalledOnce();
  });
});
