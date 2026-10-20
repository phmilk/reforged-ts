// The World Editor check (#636): from a map folder's path to "no-window",
// "open" or "modified", read from the World Editor's window titles (#475),
// and the save that runs it before its first write. The titles are
// injected, except in the test that runs the real check, on Windows and on
// WSL, where powershell.exe reads them.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it, vi } from "vitest";
import {
  ObjectDataWriterError,
  checkWorldEditor,
  openObjectData,
} from "../src/index.js";
import { writeMapFiles } from "../src/object-data-editor.js";
import {
  PACKAGE_ROOT,
  fixtureMap,
  makeTempDir,
  mapFolder,
  removeTemporary,
} from "./support/map-folder.js";

afterAll(removeTemporary);

/** The title of a World Editor main window holding `folder`, with unsaved edits when `modified`. */
function title(folder: string, modified = false): string {
  return `Warcraft III World Editor - [${folder}${modified ? " *" : ""}]`;
}

/** Window titles a desktop shows besides the World Editor's. */
const OTHER_WINDOWS = ["Program Manager", "Warcraft III", "World Editor"];

/** Check options that read these window titles. */
const titles = (...shown: string[]) => ({
  readWindowTitles: () => [...OTHER_WINDOWS, ...shown],
});

/** Check options whose reading of the titles fails, as a powershell.exe that cannot run. */
const failing = {
  readWindowTitles: (): string[] => {
    throw new Error("spawnSync powershell.exe ENOENT");
  },
};

/** The error `run` throws, or undefined when it returns. */
function thrown(run: () => unknown): unknown {
  try {
    run();
  } catch (error) {
    return error;
  }
  return undefined;
}

/** A copy of the committed fixture `editor-objects.w3m` in a temporary folder. */
function copyFixture(): string {
  const folder = path.join(makeTempDir(), "editor-objects.w3m");
  fs.cpSync(fixtureMap("editor-objects.w3m"), folder, { recursive: true });
  return folder;
}

/** The bytes of every file of a folder, by name. */
function contents(folder: string): Map<string, string> {
  return new Map(
    fs
      .readdirSync(folder)
      .sort()
      .map((name) => [
        name,
        fs.readFileSync(path.join(folder, name)).toString("hex"),
      ]),
  );
}

/** A folder holding a copy of `folder` with a stale `war3map.w3u`, so that a save to it writes that file. */
function staleCopy(folder: string): string {
  const target = path.join(makeTempDir(), "staged.w3m");
  fs.cpSync(folder, target, { recursive: true });
  fs.writeFileSync(path.join(target, "war3map.w3u"), "stale");
  return target;
}

describe("the World Editor check", () => {
  const folder = mapFolder({});

  it("is no window when no World Editor window holds the map folder", () => {
    expect(checkWorldEditor(folder, titles())).toBe("no-window");
  });

  it("is open when a window holds it without unsaved edits", () => {
    expect(checkWorldEditor(folder, titles(title(folder)))).toBe("open");
  });

  it("is modified when the window's title ends in ' *]'", () => {
    expect(checkWorldEditor(folder, titles(title(folder, true)))).toBe(
      "modified",
    );
  });

  it("is modified when one of two windows holding it shows unsaved edits", () => {
    expect(
      checkWorldEditor(folder, titles(title(folder), title(folder, true))),
    ).toBe("modified");
  });

  it("matches a path with the other separator, another case and a trailing separator", () => {
    const swapped = folder.replace(/[\\/]/g, (separator) =>
      separator === "/" ? "\\" : "/",
    );
    const shown = `${swapped.toUpperCase()}${swapped.includes("\\") ? "\\" : "/"}`;

    expect(checkWorldEditor(folder, titles(title(shown)))).toBe("open");
    expect(checkWorldEditor(folder, titles(title(shown, true)))).toBe(
      "modified",
    );
    expect(
      checkWorldEditor(`${folder}${path.sep}`, titles(title(folder))),
    ).toBe("open");
  });

  it("ignores another map's window, one whose path only starts with the map folder's included", () => {
    const other = path.join(path.dirname(folder), "other.w3m");

    expect(
      checkWorldEditor(
        folder,
        titles(title(other, true), title(`${folder}x`, true), title(other)),
      ),
    ).toBe("no-window");
  });

  it("ignores a title that is not a World Editor main window's", () => {
    expect(
      checkWorldEditor(
        folder,
        titles(`Object Editor - [${folder} *]`, `${title(folder, true)} - x`),
      ),
    ).toBe("no-window");
  });

  it("matches a relative path against the absolute one in the title", () => {
    const relative = path.relative(process.cwd(), folder);

    expect(checkWorldEditor(relative, titles(title(folder, true)))).toBe(
      "modified",
    );
  });

  it("is no window for a folder that does not exist, without reading the titles", () => {
    const readWindowTitles = vi.fn(() => [title(folder, true)]);

    expect(
      checkWorldEditor(path.join(folder, "missing.w3m"), { readWindowTitles }),
    ).toBe("no-window");
    expect(readWindowTitles).not.toHaveBeenCalled();
  });

  it("is the writer error 'World Editor check failed' when the titles cannot be read, never no window", () => {
    const error = thrown(() => checkWorldEditor(folder, failing));

    expect(error).toBeInstanceOf(ObjectDataWriterError);
    expect(error).toMatchObject({
      name: "ObjectDataWriterError",
      reason: "world-editor-check-failed",
      file: undefined,
    });
    expect(String(error)).toContain("World Editor check");
    expect(String(error)).toContain("spawnSync powershell.exe ENOENT");
    expect(String(error)).toContain("turn the check off");
  });
});

/**
 * Whether the real check reads window titles here: on Windows, and on WSL
 * with powershell.exe on the path. Elsewhere it is no window without
 * running anything, which the test below cannot tell from a real reading.
 */
function realCheckRuns(): boolean {
  if (process.platform === "win32") return true;
  if (process.platform !== "linux") return false;
  const wsl =
    process.env.WSL_DISTRO_NAME !== undefined ||
    /microsoft/i.test(
      fs.readFileSync("/proc/sys/kernel/osrelease", { encoding: "utf8" }),
    );
  return wsl && spawnSync("which", ["powershell.exe"]).status === 0;
}

describe("the real World Editor check", () => {
  it.runIf(realCheckRuns())(
    "returns no window for a temporary folder",
    () => {
      expect(checkWorldEditor(mapFolder({}))).toBe("no-window");
    },
    60_000,
  );

  it.runIf(realCheckRuns())(
    "fails as the writer error when it times out",
    () => {
      expect(
        thrown(() => checkWorldEditor(mapFolder({}), { timeout: 1 })),
      ).toMatchObject({ reason: "world-editor-check-failed" });
    },
    60_000,
  );
});

describe("a save's World Editor check", () => {
  it("is on by default", () => {
    const folder = copyFixture();
    const target = staleCopy(folder);
    const editor = openObjectData(folder, { projectRoot: PACKAGE_ROOT });

    expect(editor.save(target)).toEqual({
      written: ["war3map.w3u"],
      worldEditor: "no-window",
    });
  }, 60_000);

  it("writes when no World Editor window holds the folder, and the result says so", () => {
    const folder = copyFixture();
    const target = staleCopy(folder);
    const editor = openObjectData(folder, { projectRoot: PACKAGE_ROOT });

    expect(
      editor.save(target, { worldEditorCheck: titles(title(folder, true)) }),
    ).toEqual({ written: ["war3map.w3u"], worldEditor: "no-window" });
    expect(contents(target)).toEqual(contents(folder));
  });

  it("writes when the World Editor holds the folder without unsaved edits, and the result carries 'open'", () => {
    const folder = copyFixture();
    const target = staleCopy(folder);
    const editor = openObjectData(folder, { projectRoot: PACKAGE_ROOT });

    expect(
      editor.save(target, { worldEditorCheck: titles(title(target)) }),
    ).toEqual({ written: ["war3map.w3u"], worldEditor: "open" });
    expect(contents(target)).toEqual(contents(folder));
  });

  it("refuses with the writer error when the World Editor shows unsaved edits, and writes nothing", () => {
    const folder = copyFixture();
    const target = staleCopy(folder);
    const before = contents(target);
    const editor = openObjectData(folder, { projectRoot: PACKAGE_ROOT });

    const error = thrown(() =>
      editor.save(target, { worldEditorCheck: titles(title(target, true)) }),
    );

    expect(error).toBeInstanceOf(ObjectDataWriterError);
    expect(error).toMatchObject({ reason: "modified-in-world-editor" });
    expect(String(error)).toContain(
      "Save or discard them in the World Editor first",
    );
    expect(contents(target)).toEqual(before);
  });

  it("refuses in the map folder too, before the first write", () => {
    const folder = mapFolder({ "war3map.w3u": new Uint8Array([1]) });

    expect(
      thrown(() =>
        writeMapFiles(
          folder,
          folder,
          [
            {
              name: "war3map.w3u",
              read: new Uint8Array([1]),
              encoded: new Uint8Array([2]),
            },
          ],
          titles(title(folder, true)),
        ),
      ),
    ).toMatchObject({ reason: "modified-in-world-editor" });
    expect([...fs.readFileSync(path.join(folder, "war3map.w3u"))]).toEqual([1]);
  });

  it("carries 'modified' without refusing when the save writes nothing", () => {
    const folder = copyFixture();
    const before = contents(folder);
    const editor = openObjectData(folder, { projectRoot: PACKAGE_ROOT });

    expect(
      editor.save(undefined, { worldEditorCheck: titles(title(folder, true)) }),
    ).toEqual({ written: [], worldEditor: "modified" });
    expect(contents(folder)).toEqual(before);
  });

  it("refuses when the check fails, and writes nothing, even a save that would write nothing", () => {
    const folder = copyFixture();
    const target = staleCopy(folder);
    const before = contents(target);
    const editor = openObjectData(folder, { projectRoot: PACKAGE_ROOT });

    expect(
      thrown(() => editor.save(target, { worldEditorCheck: failing })),
    ).toMatchObject({ reason: "world-editor-check-failed" });
    expect(contents(target)).toEqual(before);
    expect(
      thrown(() => editor.save(undefined, { worldEditorCheck: failing })),
    ).toMatchObject({ reason: "world-editor-check-failed" });
  });

  it("runs after the bytes on disk are compared", () => {
    const folder = mapFolder({ "war3map.w3u": new Uint8Array([1]) });
    fs.writeFileSync(path.join(folder, "war3map.w3u"), new Uint8Array([9]));
    const readWindowTitles = vi.fn(() => []);

    expect(
      thrown(() =>
        writeMapFiles(
          folder,
          folder,
          [
            {
              name: "war3map.w3u",
              read: new Uint8Array([1]),
              encoded: new Uint8Array([2]),
            },
          ],
          { readWindowTitles },
        ),
      ),
    ).toMatchObject({ reason: "changed-on-disk" });
    expect(readWindowTitles).not.toHaveBeenCalled();
  });

  it("is off on request: the save writes without running it, and the result carries no state", () => {
    const folder = copyFixture();
    const target = staleCopy(folder);
    const editor = openObjectData(folder, { projectRoot: PACKAGE_ROOT });

    expect(editor.save(target, { worldEditorCheck: false })).toEqual({
      written: ["war3map.w3u"],
      worldEditor: undefined,
    });
    expect(contents(target)).toEqual(contents(folder));
  });
});
