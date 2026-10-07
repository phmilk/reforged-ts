/**
 * A read-only reader of the local CASC storage of a Warcraft III install, in
 * TypeScript with no native code. It reads, in order:
 *
 * - `.build.info` at the install's root: the active row's Build (`Version`)
 *   and build config key (`Build Key`);
 * - the build config, `Data/config/<k0k1>/<k2k3>/<key>`: the content and
 *   encoding keys of the encoding file, and the content key of the root;
 * - the local indices, `Data/data/<bucket><version>.idx`, the newest version
 *   of each bucket: an encoding key's first 9 bytes to an archive, an offset
 *   and a size;
 * - the data archives, `Data/data/data.<NNN>`: a 30-byte header, then the
 *   file in BLTE frames (`blte.ts`);
 * - the encoding file: a content key to its encoding key;
 * - the root, which on 3.0 is plain text, one file per line in four fields:
 *   `path|content key|locale|`.
 *
 * Every file read is checked against its content key (its MD5). A missing
 * file, a key no index or encoding entry resolves, or a malformed structure
 * is a {@link CascError} naming the path.
 *
 * The generator reads a handful of files out of a storage of hundreds of
 * thousands, so nothing is tabulated up front: the indices and the encoding
 * file stay as bytes and are searched per key (the encoding file's pages by
 * their first key), and the root is a list searched per path.
 */
import { createHash } from "node:crypto";
import { open, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { decodeBlte } from "./blte.js";
import { CascError } from "./error.js";

export { CascError } from "./error.js";

/** The file the Battle.net app keeps the installed Build in, at the install's root. */
export const BUILD_INFO_FILE = ".build.info";

/** The data archive header before each file's BLTE stream. */
const ARCHIVE_HEADER_SIZE = 30;
/** The bytes of an encoding key a local index keeps. */
const INDEX_KEY_SIZE = 9;

/** A file read from the storage. */
export interface CascFile {
  /** Its path, as the root spells it. */
  path: string;
  /** Its content key, 32 lower-case hex digits: the MD5 of `bytes`. */
  contentKey: string;
  bytes: Uint8Array;
}

/** An opened storage. */
export interface CascStorage {
  /** The install folder, which holds `.build.info`. */
  readonly installDir: string;
  /** The Build of the active row of `.build.info`, e.g. `3.0.0.24268`. */
  readonly build: string;
  /** The build config's key (its MD5), from `.build.info`. */
  readonly buildConfigKey: string;
  /** Every path the root lists, as it spells them, in the root's order. */
  paths(): readonly string[];
  /** Reads the file at `path`, matched without regard to case. */
  read(path: string): Promise<CascFile>;
}

interface IndexEntry {
  archive: number;
  offset: number;
  size: number;
}

/** A local index file's entries block, searched per key. */
interface LocalIndex {
  bytes: Uint8Array;
  start: number;
  end: number;
  entrySize: number;
  offsetBits: number;
}

interface RootEntry {
  path: string;
  contentKey: string;
}

/** The active row of `.build.info`. */
export interface BuildInfo {
  build: string;
  buildConfigKey: string;
}

/**
 * Parses `.build.info`, a table the Battle.net app writes: a header of
 * `<name>!<type>:<size>` columns separated by `|`, then one row per region.
 * The active row (`Active` 1, or the first when there is no such column)
 * gives the Build and the build config key. `file` names it in errors.
 */
export function parseBuildInfo(text: string, file: string): BuildInfo {
  const [header = "", ...rows] = text.split(/\r?\n/);
  const columns = header.split("|").map((column) => column.split("!")[0]);
  const active = columns.indexOf("Active");
  const version = columns.indexOf("Version");
  const key = columns.indexOf("Build Key");
  const row = rows
    .filter((line) => line !== "")
    .map((line) => line.split("|"))
    .find((cells) => active === -1 || cells[active] === "1");
  const build = version === -1 ? undefined : row?.[version];
  const buildConfigKey = key === -1 ? undefined : row?.[key];
  if (build === undefined || build === "") {
    throw new CascError(`${file} names no Version in an active row.`);
  }
  if (buildConfigKey === undefined || !/^[0-9a-f]{32}$/.test(buildConfigKey)) {
    throw new CascError(`${file} names no Build Key in its active row.`);
  }
  return { build, buildConfigKey };
}

/** Opens the storage of the install at `installDir`. */
export async function openStorage(installDir: string): Promise<CascStorage> {
  const buildInfoFile = join(installDir, BUILD_INFO_FILE);
  const info = parseBuildInfo(await readDiskText(buildInfoFile), buildInfoFile);
  const dataDir = join(installDir, "Data");

  const configFile = join(
    dataDir,
    "config",
    ...keyFolders(info.buildConfigKey),
  );
  const configBytes = await readDisk(configFile);
  if (md5(configBytes) !== info.buildConfigKey) {
    throw new CascError(
      `${configFile} does not match its key ${info.buildConfigKey}.`,
    );
  }
  const config = parseConfig(new TextDecoder().decode(configBytes));
  const encodingKeys = configValue(config, "encoding", configFile);
  const [encodingContentKey, encodingKey] = encodingKeys;
  if (
    encodingKeys.length < 2 ||
    !isKey(encodingContentKey) ||
    !isKey(encodingKey)
  ) {
    throw new CascError(
      `${configFile}: "encoding" names no content and encoding key.`,
    );
  }
  const [rootContentKey] = configValue(config, "root", configFile);
  if (!isKey(rootContentKey)) {
    throw new CascError(`${configFile}: "root" names no content key.`);
  }

  const index = await readIndices(join(dataDir, "data"));

  const readEncoded = async (
    path: string,
    contentKey: string,
    ekey: string,
  ): Promise<Uint8Array> => {
    const entry = findIndexEntry(index, ekey);
    if (entry === undefined) {
      throw new CascError(
        `${path}: its encoding key ${ekey} is in no local index of ${join(dataDir, "data")}.`,
      );
    }
    const bytes = decodeBlte(
      await readArchive(dataDir, entry, path, ekey),
      path,
    );
    if (md5(bytes) !== contentKey) {
      throw new CascError(
        `${path}: its content does not match its content key ${contentKey}.`,
      );
    }
    return bytes;
  };

  const encodingLabel = `the encoding file (${encodingKey})`;
  const encoding = parseEncoding(
    await readEncoded(encodingLabel, encodingContentKey, encodingKey),
    encodingLabel,
  );
  const rootEkey = encoding(rootContentKey);
  const rootLabel = `the root (${rootContentKey})`;
  if (rootEkey === undefined) {
    throw new CascError(
      `${rootLabel}: its content key is in no entry of the encoding file.`,
    );
  }
  const root = parseRoot(
    new TextDecoder().decode(
      await readEncoded(rootLabel, rootContentKey, rootEkey),
    ),
  );
  const paths = root.map((entry) => entry.path);

  return {
    installDir,
    build: info.build,
    buildConfigKey: info.buildConfigKey,
    paths: () => paths,
    read: async (path) => {
      const lower = path.toLowerCase();
      const entry = root.find(
        (e) => e.path.length === path.length && e.path.toLowerCase() === lower,
      );
      if (entry === undefined) {
        throw new CascError(
          `${path} is not in the root of the storage at ${installDir}.`,
        );
      }
      const ekey = encoding(entry.contentKey);
      if (ekey === undefined) {
        throw new CascError(
          `${entry.path}: its content key ${entry.contentKey} is in no entry of the encoding file.`,
        );
      }
      return {
        path: entry.path,
        contentKey: entry.contentKey,
        bytes: await readEncoded(entry.path, entry.contentKey, ekey),
      };
    },
  };
}

/** `Data/config/ab/cd/abcd…`: the two folder levels and the file of a key. */
function keyFolders(key: string): string[] {
  return [key.slice(0, 2), key.slice(2, 4), key];
}

function parseConfig(text: string): Map<string, string[]> {
  const config = new Map<string, string[]>();
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("#")) continue;
    const at = line.indexOf("=");
    if (at === -1) continue;
    config.set(
      line.slice(0, at).trim(),
      line
        .slice(at + 1)
        .trim()
        .split(/\s+/)
        .filter(Boolean),
    );
  }
  return config;
}

function configValue(
  config: Map<string, string[]>,
  name: string,
  file: string,
): string[] {
  const value = config.get(name);
  if (value === undefined || value.length === 0) {
    throw new CascError(`${file} has no "${name}".`);
  }
  return value;
}

/**
 * The newest index of each bucket under `dir`, in file name order: the first
 * entry of a key, over them in that order, wins.
 */
async function readIndices(dir: string): Promise<LocalIndex[]> {
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    throw new CascError(
      `${dir}: no such folder; the install holds no local storage.`,
    );
  }
  const newest = new Map<string, string>();
  for (const name of names) {
    const match = /^([0-9a-f]{2})([0-9a-f]{8})\.idx$/i.exec(name);
    if (!match) continue;
    const bucket = match[1].toLowerCase();
    const current = newest.get(bucket);
    if (current === undefined || name.toLowerCase() > current.toLowerCase()) {
      newest.set(bucket, name);
    }
  }
  if (newest.size === 0) {
    throw new CascError(`${dir} holds no local index (.idx).`);
  }
  const indices: LocalIndex[] = [];
  for (const name of [...newest.values()].sort()) {
    indices.push(parseIndex(await readDisk(join(dir, name)), join(dir, name)));
  }
  return indices;
}

/** Checks an index file's header and locates its entries block. */
function parseIndex(bytes: Uint8Array, file: string): LocalIndex {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const fail = (what: string): never => {
    throw new CascError(`${file}: ${what}.`);
  };
  if (bytes.byteLength < 0x28) fail("too short for an index header");
  const headerSize = view.getUint32(0, true);
  const version = view.getUint16(8, true);
  const sizeBytes = bytes[12];
  const offsetBytes = bytes[13];
  const keyBytes = bytes[14];
  const offsetBits = bytes[15];
  if (version !== 7)
    fail(`index version ${String(version)}; the reader reads version 7`);
  if (sizeBytes !== 4 || offsetBytes !== 5 || keyBytes !== INDEX_KEY_SIZE) {
    fail(
      `entry layout ${String(keyBytes)}/${String(offsetBytes)}/${String(sizeBytes)}; the reader reads 9/5/4`,
    );
  }
  const block = (8 + headerSize + 15) & ~15;
  if (block + 8 > bytes.byteLength) fail("too short for its entries block");
  const blockSize = view.getUint32(block, true);
  const start = block + 8;
  const entrySize = keyBytes + offsetBytes + sizeBytes;
  if (start + blockSize > bytes.byteLength || blockSize % entrySize !== 0) {
    fail(`entries block of ${String(blockSize)} bytes does not fit the file`);
  }
  return { bytes, start, end: start + blockSize, entrySize, offsetBits };
}

/** The first entry, over `indices` in order, of the encoding key `ekey`'s first 9 bytes. */
function findIndexEntry(
  indices: readonly LocalIndex[],
  ekey: string,
): IndexEntry | undefined {
  const key = Buffer.from(ekey.slice(0, INDEX_KEY_SIZE * 2), "hex");
  for (const { bytes, start, end, entrySize, offsetBits } of indices) {
    for (let at = start; at < end; at += entrySize) {
      if (!startsWith(bytes, at, key)) continue;
      let packed = 0;
      for (let i = 0; i < 5; i++)
        packed = packed * 256 + bytes[at + INDEX_KEY_SIZE + i];
      const unit = 2 ** offsetBits;
      return {
        archive: Math.floor(packed / unit),
        offset: packed % unit,
        size: new DataView(
          bytes.buffer,
          bytes.byteOffset,
          bytes.byteLength,
        ).getUint32(at + INDEX_KEY_SIZE + 5, true),
      };
    }
  }
  return undefined;
}

/** Whether `bytes` holds `key` at `at`. */
function startsWith(bytes: Uint8Array, at: number, key: Uint8Array): boolean {
  for (let i = 0; i < key.byteLength; i++) {
    if (bytes[at + i] !== key[i]) return false;
  }
  return true;
}

/** The BLTE stream of an index entry, its 30-byte archive header removed. */
async function readArchive(
  dataDir: string,
  entry: IndexEntry,
  path: string,
  ekey: string,
): Promise<Uint8Array> {
  const file = join(
    dataDir,
    "data",
    `data.${String(entry.archive).padStart(3, "0")}`,
  );
  if (entry.size < ARCHIVE_HEADER_SIZE) {
    throw new CascError(
      `${path}: its index entry in ${file} is ${String(entry.size)} bytes, shorter than an archive header.`,
    );
  }
  let handle;
  try {
    handle = await open(file, "r");
  } catch {
    throw new CascError(`${path}: its data archive ${file} does not exist.`);
  }
  try {
    const bytes = new Uint8Array(entry.size);
    const bytesRead = await readFully(handle, bytes, entry.offset);
    if (bytesRead !== entry.size) {
      throw new CascError(
        `${path}: ${file} ends before the ${String(entry.size)} bytes at ${String(entry.offset)}.`,
      );
    }
    // The header opens with the encoding key, its bytes reversed.
    const stored = hex(bytes.slice(0, 16).reverse());
    if (
      stored.slice(0, INDEX_KEY_SIZE * 2) !== ekey.slice(0, INDEX_KEY_SIZE * 2)
    ) {
      throw new CascError(
        `${path}: ${file} holds another file at ${String(entry.offset)} (encoding key ${stored}, not ${ekey}).`,
      );
    }
    return bytes.subarray(ARCHIVE_HEADER_SIZE);
  } finally {
    await handle.close();
  }
}

/** What {@link readFully} reads through: a `FileHandle`, or a test's fake. */
export interface ReadableFile {
  read(
    buffer: Uint8Array,
    offset: number,
    length: number,
    position: number,
  ): Promise<{ bytesRead: number }>;
}

/**
 * Reads into all of `bytes` from `position`, read after read: one read may
 * return fewer bytes than asked (over a network or WSL's drvfs mount)
 * without the file ending. Returns the bytes read, fewer only at the end of
 * the file.
 */
export async function readFully(
  file: ReadableFile,
  bytes: Uint8Array,
  position: number,
): Promise<number> {
  let done = 0;
  while (done < bytes.byteLength) {
    const { bytesRead } = await file.read(
      bytes,
      done,
      bytes.byteLength - done,
      position + done,
    );
    if (bytesRead === 0) break;
    done += bytesRead;
  }
  return done;
}

/**
 * The encoding file's lookup of a content key's encoding key (the first
 * encoding key of its entry). Its pages are in the order of their first
 * content key, which the page table lists: a lookup binary-searches the
 * table, then scans one page. `label` names the file in errors.
 */
function parseEncoding(
  bytes: Uint8Array,
  label: string,
): (contentKey: string) => string | undefined {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const fail = (what: string): never => {
    throw new CascError(`${label}: ${what}.`);
  };
  if (bytes.byteLength < 22 || bytes[0] !== 0x45 || bytes[1] !== 0x4e) {
    fail("no EN magic");
  }
  const ckeySize = bytes[3];
  const ekeySize = bytes[4];
  const pageSize = view.getUint16(5) * 1024;
  const pageCount = view.getUint32(9);
  const especSize = view.getUint32(18);
  const pages = 22 + especSize + pageCount * (ckeySize + 16);
  if (pages + pageCount * pageSize > bytes.byteLength) {
    fail(
      `${String(pageCount)} pages of ${String(pageSize)} bytes overrun the file`,
    );
  }
  const tableAt = 22 + especSize;
  const firstKey = (page: number) =>
    bytes.subarray(
      tableAt + page * (ckeySize + 16),
      tableAt + page * (ckeySize + 16) + ckeySize,
    );
  return (contentKey) => {
    const key = Buffer.from(contentKey, "hex");
    // The last page whose first key is at most the key.
    let low = 0;
    let high = pageCount - 1;
    let page = -1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (Buffer.compare(firstKey(mid), key) <= 0) {
        page = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    if (page === -1) return undefined;
    let at = pages + page * pageSize;
    const end = at + pageSize;
    while (at + 6 + ckeySize <= end) {
      const keyCount = bytes[at];
      if (keyCount === 0) break;
      const ekeyAt = at + 6 + ckeySize;
      if (startsWith(bytes, at + 6, key)) {
        return hex(bytes.subarray(ekeyAt, ekeyAt + ekeySize));
      }
      at = ekeyAt + keyCount * ekeySize;
    }
    return undefined;
  };
}

/** The plain-text root's entries, in its order. */
function parseRoot(text: string): RootEntry[] {
  const root: RootEntry[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (line === "") continue;
    const [path = "", contentKey = ""] = line.split("|");
    if (path === "" || !isKey(contentKey)) {
      throw new CascError(
        `the root: line ${JSON.stringify(line)} is not path|content key|locale|.`,
      );
    }
    root.push({ path, contentKey });
  }
  return root;
}

function isKey(value: string | undefined): value is string {
  return value !== undefined && /^[0-9a-f]{32}$/.test(value);
}

function md5(bytes: Uint8Array): string {
  return createHash("md5").update(bytes).digest("hex");
}

function hex(bytes: Uint8Array): string {
  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString(
    "hex",
  );
}

async function readDisk(file: string): Promise<Uint8Array> {
  try {
    return new Uint8Array(await readFile(file));
  } catch {
    throw new CascError(`${file} does not exist.`);
  }
}

async function readDiskText(file: string): Promise<string> {
  return new TextDecoder().decode(await readDisk(file));
}
