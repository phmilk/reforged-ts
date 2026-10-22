import * as fs from "node:fs/promises";
import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { create } from "../src/create.js";
import { localTemplate } from "../src/template.js";
import {
  lines,
  recordingRunner,
  tempDir,
  templateArchive,
} from "./support/template.js";

// `rename`, wrapped so that a test can fail the move into place partway.
vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return { ...actual, rename: vi.fn(actual.rename) };
});

describe("create: the move into place", () => {
  afterEach(() => {
    vi.mocked(fs.rename).mockReset();
  });

  it("leaves an empty folder that exists empty, and no temporary folder, when a rename fails partway", async () => {
    const actual =
      await vi.importActual<typeof import("node:fs/promises")>(
        "node:fs/promises",
      );
    let renames = 0;
    vi.mocked(fs.rename).mockImplementation((from, to) =>
      ++renames === 3
        ? Promise.reject(new Error("EBUSY: resource busy or locked"))
        : actual.rename(from, to),
    );
    const parent = await tempDir("parent");
    const folder = join(parent, "my-map");
    await mkdir(folder);
    const runner = recordingRunner();

    const result = await create({
      answers: { folder, skipInstall: false, skipGit: false },
      template: localTemplate(await templateArchive()),
      run: runner.run,
      print: () => undefined,
      nodeVersion: "v24.0.0",
    });

    expect(result).toEqual({
      ok: false,
      stage: "move",
      message:
        "The creation stopped at the move into place: EBUSY: resource busy or locked",
    });
    expect(renames).toBe(3);
    expect(await readdir(parent)).toEqual(["my-map"]);
    expect(await readdir(folder)).toEqual([]);
    expect(lines(runner.commands)).toEqual(["pnpm --version", "git --version"]);
  });
});
