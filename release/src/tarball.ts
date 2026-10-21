/**
 * Unpacking an npm package tarball, with no dependency: the gzipped tar
 * `pnpm pack` and `changeset pack` write, every entry under `package/`. It
 * reads ustar headers and pax paths, files and folders; any other entry is
 * an error, since a package the workspace packs holds none.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { gunzipSync } from "node:zlib";

const BLOCK = 512;

/**
 * Writes the files of the package tarball at `tarball` into `folder`, as
 * npm unpacks them: under `folder/package/`. Throws on a tarball it cannot
 * read, an entry it refuses or a path that leaves `folder`.
 */
export async function unpackTarball(
  tarball: string,
  folder: string,
): Promise<void> {
  const archive = gunzipSync(await readFile(tarball));
  // The path of the next entry, from a pax header.
  let paxPath: string | undefined;
  for (let offset = 0; offset + BLOCK <= archive.length;) {
    const header = archive.subarray(offset, offset + BLOCK);
    if (header.every((byte) => byte === 0)) break;
    const field = (start: number, length: number) =>
      header.toString("utf8", start, start + length).replace(/\0.*$/s, "");
    const size = parseInt(field(124, 12).trim() || "0", 8);
    const type = field(156, 1);
    const content = archive.subarray(offset + BLOCK, offset + BLOCK + size);
    offset += BLOCK + Math.ceil(size / BLOCK) * BLOCK;
    if (type === "g") continue;
    if (type === "x") {
      paxPath = /(?:^|\n)\d+ path=([^\n]*)\n/.exec(
        content.toString("utf8"),
      )?.[1];
      continue;
    }
    const prefix = field(345, 155);
    const path = paxPath ?? (prefix === "" ? "" : `${prefix}/`) + field(0, 100);
    paxPath = undefined;
    const segments = path.split("/").filter((segment) => segment !== "");
    if (segments.length === 0 || segments.includes("..")) {
      throw new Error(`${tarball} holds ${path}, a path outside the package.`);
    }
    const target = join(folder, ...segments);
    if (type === "5") {
      await mkdir(target, { recursive: true });
    } else if (type === "0" || type === "") {
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, content);
    } else {
      throw new Error(
        `${tarball} holds ${path}, an entry of type '${type}' a package never holds.`,
      );
    }
  }
}
