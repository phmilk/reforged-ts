/**
 * BLTE, the frame format every file of a CASC storage is stored in: the
 * `BLTE` magic, a header size, then either one frame or a table of frames
 * (compressed size, decompressed size, MD5) followed by the frames. Each
 * frame opens with its mode byte. The reader decodes the two modes the
 * game's data files use, `N` (plain) and `Z` (zlib); any other mode
 * (`4` LZ4, `F` nested frame, `E` encrypted) is an error naming the file.
 */
import { inflateSync } from "node:zlib";
import { CascError } from "./error.js";

const MAGIC = "BLTE";

/**
 * Decodes the BLTE bytes of the file `path` (named in every error) into the
 * file's content.
 */
export function decodeBlte(bytes: Uint8Array, path: string): Uint8Array {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.byteLength < 8 || ascii(bytes, 0, 4) !== MAGIC) {
    throw new CascError(`${path}: not a BLTE stream (no BLTE magic).`);
  }
  const headerSize = view.getUint32(4);
  const frames: { data: Uint8Array; size: number | undefined }[] = [];
  if (headerSize === 0) {
    frames.push({ data: bytes.subarray(8), size: undefined });
  } else {
    if (headerSize < 12 || headerSize > bytes.byteLength) {
      throw new CascError(
        `${path}: BLTE header size ${String(headerSize)} is out of range.`,
      );
    }
    const count = (bytes[9] << 16) | (bytes[10] << 8) | bytes[11];
    if (12 + count * 24 > headerSize) {
      throw new CascError(
        `${path}: BLTE frame table of ${String(count)} frames overruns its header.`,
      );
    }
    let data = headerSize;
    for (let i = 0; i < count; i++) {
      const entry = 12 + i * 24;
      const compressed = view.getUint32(entry);
      const size = view.getUint32(entry + 4);
      if (data + compressed > bytes.byteLength) {
        throw new CascError(
          `${path}: BLTE frame ${String(i)} runs past the end of the file.`,
        );
      }
      frames.push({ data: bytes.subarray(data, data + compressed), size });
      data += compressed;
    }
  }
  const parts = frames.map(({ data, size }, i) => {
    const content = decodeFrame(data, path, i);
    if (size !== undefined && content.byteLength !== size) {
      throw new CascError(
        `${path}: BLTE frame ${String(i)} decodes to ${String(content.byteLength)} bytes, not the ${String(size)} its header gives.`,
      );
    }
    return content;
  });
  return concat(parts);
}

function decodeFrame(
  frame: Uint8Array,
  path: string,
  index: number,
): Uint8Array {
  if (frame.byteLength === 0) {
    throw new CascError(`${path}: BLTE frame ${String(index)} is empty.`);
  }
  const mode = String.fromCharCode(frame[0]);
  const payload = frame.subarray(1);
  switch (mode) {
    case "N":
      return payload;
    case "Z":
      try {
        return new Uint8Array(inflateSync(payload));
      } catch (error) {
        throw new CascError(
          `${path}: BLTE frame ${String(index)} is not valid zlib (${(error as Error).message}).`,
        );
      }
    default:
      throw new CascError(
        `${path}: BLTE frame ${String(index)} has mode ${JSON.stringify(mode)}; the reader decodes "N" (plain) and "Z" (zlib) only.`,
      );
  }
}

function concat(parts: readonly Uint8Array[]): Uint8Array {
  if (parts.length === 1) return parts[0];
  const out = new Uint8Array(
    parts.reduce((sum, part) => sum + part.byteLength, 0),
  );
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.byteLength;
  }
  return out;
}

function ascii(bytes: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...bytes.subarray(start, end));
}
