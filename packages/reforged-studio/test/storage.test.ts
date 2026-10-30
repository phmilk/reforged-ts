/**
 * Seam 3, the CASC reader: `openStorage` on synthetic storages the helpers
 * write in a temporary folder, with no byte of Blizzard's. The tests assert
 * what it reads and the errors it throws.
 */
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CascError, openStorage, readFully } from "../src/index.js";
import { tempDir, writeStorage, type StorageOptions } from "./support/casc.js";

const UNIT_DATA = "War3.w3mod:Units/UnitData.slk";
const FILES: StorageOptions["files"] = {
  [UNIT_DATA]: "unit data\r\n",
  "War3.w3mod:_HD.w3mod:Units/Human/Footman/Footman.mdx": "MDLX",
  "War3.w3mod:_Locales/enUS.w3mod:Units/HumanUnitStrings.txt": "[hfoo]\r\n",
};

const text = (bytes: Uint8Array) => new TextDecoder().decode(bytes);

describe("openStorage", () => {
  it("lists the root's paths and reads a file by its path, matched without regard to case", async () => {
    const storage = await writeStorage({ files: FILES });

    const opened = await openStorage(storage.installDir);

    expect(opened.paths()).toEqual(Object.keys(FILES));
    expect(opened.build).toBe("3.0.0.24268");
    const file = await opened.read("war3.w3mod:units/unitdata.slk");
    expect(file.path).toBe(UNIT_DATA);
    expect(file.contentKey).toBe(storage.contentKeys[UNIT_DATA]);
    expect(text(file.bytes)).toBe("unit data\r\n");
  });

  it("reads files in plain, zlib and mixed BLTE frames alike", async () => {
    for (const framing of ["plain", "zlib", "mixed"]) {
      const storage = await writeStorage({
        files: FILES,
        framing: Object.fromEntries(
          Object.keys(FILES).map((path) => [path, framing]),
        ),
      });
      const opened = await openStorage(storage.installDir);
      for (const [path, content] of Object.entries(FILES)) {
        expect(text((await opened.read(path)).bytes)).toBe(content);
      }
    }
  });

  it("gives the Build its build config names, and .build.info's Version apart", async () => {
    const storage = await writeStorage({
      files: FILES,
      buildInfoVersion: "3.0.0.24248",
    });

    const opened = await openStorage(storage.installDir);

    expect(opened.build).toBe("3.0.0.24268");
    expect(opened.buildInfoVersion).toBe("3.0.0.24248");
    expect(opened.buildConfigKey).toBe(storage.buildConfigKey);
  });

  it("finds every file of a storage whose encoding file spans many pages", async () => {
    const files = Object.fromEntries(
      Array.from({ length: 120 }, (_, i) => [
        `War3.w3mod:Filler/f${String(i)}.txt`,
        `filler ${String(i)}`,
      ]),
    );
    const opened = await openStorage(
      (await writeStorage({ files })).installDir,
    );

    for (const [path, content] of Object.entries(files)) {
      expect(text((await opened.read(path)).bytes)).toBe(content);
    }
  });
});

describe("openStorage refuses, naming the path", () => {
  it("a folder that holds no storage", async () => {
    const installDir = await tempDir("empty");

    await expect(openStorage(installDir)).rejects.toThrow(
      new CascError(`${join(installDir, ".build.info")} does not exist.`),
    );
  });

  it("a file the root does not list", async () => {
    const storage = await writeStorage({ files: FILES });
    const opened = await openStorage(storage.installDir);

    await expect(opened.read("War3.w3mod:Units/Nothing.slk")).rejects.toThrow(
      new CascError(
        `War3.w3mod:Units/Nothing.slk is not in the root of the storage at ${storage.installDir}.`,
      ),
    );
  });

  it("a content key the encoding file does not resolve", async () => {
    const storage = await writeStorage({
      files: FILES,
      notInEncoding: [UNIT_DATA],
    });
    const opened = await openStorage(storage.installDir);

    await expect(opened.read(UNIT_DATA)).rejects.toThrow(
      new CascError(
        `${UNIT_DATA}: its content key ${storage.contentKeys[UNIT_DATA] ?? ""} is in no entry of the encoding file.`,
      ),
    );
  });

  it("a BLTE frame of a mode other than plain and zlib", async () => {
    const storage = await writeStorage({
      files: FILES,
      framing: { [UNIT_DATA]: "4" },
    });
    const opened = await openStorage(storage.installDir);

    await expect(opened.read(UNIT_DATA)).rejects.toThrow(
      new CascError(
        `${UNIT_DATA}: BLTE frame 0 has mode "4"; the reader decodes "N" (plain) and "Z" (zlib) only.`,
      ),
    );
  });
});

describe("readFully", () => {
  it("reads on after a short read, and stops at the end of the file", async () => {
    const content = Uint8Array.from({ length: 10 }, (_, i) => i + 1);
    const calls: number[] = [];
    // A file that returns at most 3 bytes per read.
    const file = {
      read: (
        buffer: Uint8Array,
        offset: number,
        length: number,
        position: number,
      ) => {
        calls.push(position);
        const chunk = content.subarray(
          position,
          Math.min(position + Math.min(length, 3), content.byteLength),
        );
        buffer.set(chunk, offset);
        return Promise.resolve({ bytesRead: chunk.byteLength });
      },
    };

    const whole = new Uint8Array(8);
    expect(await readFully(file, whole, 2)).toBe(8);
    expect([...whole]).toEqual([3, 4, 5, 6, 7, 8, 9, 10]);
    expect(calls).toEqual([2, 5, 8]);

    expect(await readFully(file, new Uint8Array(8), 6)).toBe(4);
  });
});
