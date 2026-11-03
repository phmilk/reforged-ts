/**
 * The thumbnail cache of model previews (#839): where it is on each
 * platform, and what it keeps, in a temporary folder.
 */
import { afterAll, describe, expect, it } from "vitest";
import { defaultCacheFolder, ThumbnailCache } from "../src/index.js";
import { makeTempDir, removeTemporary } from "./support/studio.js";

afterAll(removeTemporary);

/** A PNG's bytes: its signature, then anything. */
const PNG = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3,
]);

describe("defaultCacheFolder", () => {
  it("is the user's cache folder of each platform", () => {
    expect(
      defaultCacheFolder({
        platform: "win32",
        env: { LOCALAPPDATA: "C:\\Users\\night\\AppData\\Local" },
        home: "C:\\Users\\night",
      }),
    ).toBe("C:\\Users\\night\\AppData\\Local\\reforged-studio\\thumbnails");
    expect(
      defaultCacheFolder({ platform: "darwin", env: {}, home: "/Users/night" }),
    ).toBe("/Users/night/Library/Caches/reforged-studio/thumbnails");
    expect(
      defaultCacheFolder({ platform: "linux", env: {}, home: "/home/night" }),
    ).toBe("/home/night/.cache/reforged-studio/thumbnails");
    expect(
      defaultCacheFolder({
        platform: "linux",
        env: { XDG_CACHE_HOME: "/var/cache/night" },
        home: "/home/night",
      }),
    ).toBe("/var/cache/night/reforged-studio/thumbnails");
  });
});

describe("ThumbnailCache", () => {
  it("keeps a thumbnail per Build, art layer and path, a path in any case the same", async () => {
    const folder = makeTempDir("cache");
    const cache = new ThumbnailCache(folder, "3.0.1.24371");
    const footman = {
      path: "Units/Human/Footman/Footman.mdx",
      artLayer: "hd",
    } as const;
    expect(await cache.read(footman)).toBeUndefined();
    await cache.write(footman, PNG);
    expect(await cache.read(footman)).toEqual(PNG);
    expect(
      await cache.read({ ...footman, path: footman.path.toUpperCase() }),
    ).toEqual(PNG);
    expect(await cache.read({ ...footman, artLayer: "sd" })).toBeUndefined();
    expect(
      await new ThumbnailCache(folder, "3.0.0.24268").read(footman),
    ).toBeUndefined();
    expect(cache.fileOf(footman).startsWith(folder)).toBe(true);
  });

  it("keys a map's import by its bytes too", async () => {
    const cache = new ThumbnailCache(makeTempDir("cache"), "3.0.1.24371");
    const imported = {
      path: "war3mapImported/Cube.mdx",
      artLayer: "hd",
      imported: Uint8Array.from([1, 2, 3]),
    } as const;
    await cache.write(imported, PNG);
    expect(await cache.read(imported)).toEqual(PNG);
    expect(
      await cache.read({ ...imported, imported: Uint8Array.from([1, 2, 4]) }),
    ).toBeUndefined();
  });

  it("refuses what is not a PNG", async () => {
    const cache = new ThumbnailCache(makeTempDir("cache"), "3.0.1.24371");
    await expect(
      cache.write(
        { path: "Units/Human/Footman/Footman.mdx", artLayer: "hd" },
        Uint8Array.from([1, 2, 3]),
      ),
    ).rejects.toThrow(TypeError);
  });
});
