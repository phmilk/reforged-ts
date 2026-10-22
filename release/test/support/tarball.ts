/**
 * Package tarballs for the release scripts' tests: the gzipped ustar
 * archive `pnpm pack` writes, every file under `package/`.
 */
import { gzipSync } from "node:zlib";

const BLOCK = 512;

/** A gzipped tarball holding `files`, by path under `package/`. */
export function packageTarball(
  files: Readonly<Record<string, string>>,
): Buffer {
  const blocks: Buffer[] = [];
  for (const [path, text] of Object.entries(files)) {
    const content = Buffer.from(text);
    const header = Buffer.alloc(BLOCK);
    const write = (value: string, start: number, length: number) => {
      header.write(value.slice(0, length), start, "utf8");
    };
    const octal = (value: number, start: number, length: number) => {
      write(`${value.toString(8).padStart(length - 1, "0")}\0`, start, length);
    };
    write(`package/${path}`, 0, 100);
    octal(0o644, 100, 8);
    octal(0, 108, 8);
    octal(0, 116, 8);
    octal(content.length, 124, 12);
    octal(0, 136, 12);
    write("0", 156, 1);
    write("ustar\0", 257, 6);
    write("00", 263, 2);
    // The checksum counts its own field as eight spaces.
    header.fill(" ", 148, 156);
    const sum = header.reduce((total, byte) => total + byte, 0);
    write(`${sum.toString(8).padStart(6, "0")}\0 `, 148, 8);
    const padding = (BLOCK - (content.length % BLOCK)) % BLOCK;
    blocks.push(header, content, Buffer.alloc(padding));
  }
  blocks.push(Buffer.alloc(BLOCK * 2));
  return gzipSync(Buffer.concat(blocks));
}
