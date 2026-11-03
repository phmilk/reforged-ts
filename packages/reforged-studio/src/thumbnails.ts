/**
 * The thumbnail cache of model previews, as #481 settled it: the page's one
 * shared renderer draws a model's thumbnail into a PNG, lazily, and the
 * server keeps it on disk under the user's cache folder, per Build, art
 * layer and path, so that the next time the picker or the field table shows
 * that model it is read, not drawn. A thumbnail of a model the map folder
 * imports is also keyed by the file's hash, so a changed import is drawn
 * again. The cache is the developer's own: generated locally from their
 * install, never shipped, since it is Blizzard's art.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { ArtLayer } from "./paths.js";

/** The first eight bytes of every PNG file. */
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** The largest thumbnail the cache keeps, in bytes: a 128 by 128 PNG is a few KB. */
export const THUMBNAIL_LIMIT = 512 * 1024;

/** The folder under the user's cache folder that holds the Studio's cache. */
const CACHE_NAME = "reforged-studio";

/** What the default cache folder is found from; tests answer with a fake. */
export interface CacheMachine {
  platform: NodeJS.Platform;
  env: Readonly<Record<string, string | undefined>>;
  /** The user's home folder. */
  home: string;
}

/**
 * The user's cache folder for the Studio's thumbnails:
 * `%LOCALAPPDATA%\reforged-studio\thumbnails` on Windows,
 * `~/Library/Caches/reforged-studio/thumbnails` on macOS, and
 * `$XDG_CACHE_HOME/reforged-studio/thumbnails`, else
 * `~/.cache/reforged-studio/thumbnails`, elsewhere, WSL included.
 *
 * @param machine - The platform, the environment and the home folder;
 *   the running process's when left out.
 * @returns The folder, which may not exist yet.
 */
export function defaultCacheFolder(
  machine: CacheMachine = {
    platform: process.platform,
    env: process.env,
    home: os.homedir(),
  },
): string {
  const { platform, env, home } = machine;
  if (platform === "win32") {
    const local = env.LOCALAPPDATA ?? path.win32.join(home, "AppData", "Local");
    return path.win32.join(local, CACHE_NAME, "thumbnails");
  }
  if (platform === "darwin") {
    return path.posix.join(home, "Library", "Caches", CACHE_NAME, "thumbnails");
  }
  const xdg = env.XDG_CACHE_HOME;
  const base =
    xdg !== undefined && path.posix.isAbsolute(xdg)
      ? xdg
      : path.posix.join(home, ".cache");
  return path.posix.join(base, CACHE_NAME, "thumbnails");
}

/** Whether bytes are a PNG file: its signature. */
export function isPng(bytes: Uint8Array): boolean {
  return (
    bytes.byteLength > PNG_SIGNATURE.length &&
    PNG_SIGNATURE.every((byte, i) => bytes[i] === byte)
  );
}

/** What a thumbnail is of: its model's path, the art layer, and a map import's bytes. */
export interface ThumbnailKey {
  /** The model's path, as the resolver normalized it. */
  readonly path: string;
  /** The art layer the model was drawn in. */
  readonly artLayer: ArtLayer;
  /** The model's bytes when the map folder imports it, whose hash joins the key; absent for the install's. */
  readonly imported?: Uint8Array;
}

/** The thumbnails of one Build, on disk. */
export class ThumbnailCache {
  /**
   * @param folder - The cache's folder, {@link defaultCacheFolder} in the
   *   Studio.
   * @param build - The install's Build, the first part of every key.
   */
  constructor(
    readonly folder: string,
    readonly build: string,
  ) {}

  /**
   * The file a thumbnail is kept in:
   * `<folder>/<build>/<art layer>/<hash>.png`, the hash of the lower-cased
   * path and, for a map import, of its bytes.
   *
   * @param key - The thumbnail's model, art layer and import.
   * @returns The file's path.
   */
  fileOf(key: ThumbnailKey): string {
    const hash = createHash("sha256").update(key.path.toLowerCase());
    if (key.imported !== undefined) {
      hash
        .update("\0")
        .update(createHash("sha256").update(key.imported).digest());
    }
    return path.join(
      this.folder,
      safeName(this.build),
      key.artLayer,
      `${hash.digest("hex").slice(0, 40)}.png`,
    );
  }

  /**
   * Reads a thumbnail.
   *
   * @param key - The thumbnail's model, art layer and import.
   * @returns Its PNG; undefined when the cache does not hold it.
   */
  async read(key: ThumbnailKey): Promise<Uint8Array | undefined> {
    try {
      return new Uint8Array(await readFile(this.fileOf(key)));
    } catch {
      return undefined;
    }
  }

  /**
   * Keeps a thumbnail, written to a temporary file then renamed, so that a
   * reader never sees half of one.
   *
   * @param key - The thumbnail's model, art layer and import.
   * @param png - Its PNG.
   * @throws `TypeError` When the bytes are not a PNG or larger than
   *   {@link THUMBNAIL_LIMIT}.
   */
  async write(key: ThumbnailKey, png: Uint8Array): Promise<void> {
    if (!isPng(png)) throw new TypeError("A thumbnail is a PNG file.");
    if (png.byteLength > THUMBNAIL_LIMIT) {
      throw new TypeError(
        `A thumbnail is at most ${String(THUMBNAIL_LIMIT)} bytes.`,
      );
    }
    const file = this.fileOf(key);
    await mkdir(path.dirname(file), { recursive: true });
    const temporary = `${file}.${String(process.pid)}.tmp`;
    await writeFile(temporary, png);
    await rename(temporary, file);
  }
}

/** A Build as a folder's name: its characters other than letters, digits, dots and dashes replaced. */
function safeName(build: string): string {
  return build.replace(/[^A-Za-z0-9.-]/g, "_");
}
