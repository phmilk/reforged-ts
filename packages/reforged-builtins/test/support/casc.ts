/**
 * Writes a minimal local CASC storage into a folder, as the Battle.net app
 * lays one out: `.build.info`, the build config, the encoding file, the
 * local indices, a data archive whose files are BLTE streams in plain and
 * zlib frames, and the plain-text root. Every byte is the tests' own: the
 * SLK and `.txt` helpers below write synthetic object data.
 */
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

/**
 * How a file is framed: `plain` is one `N` frame with no frame table,
 * `zlib` two `Z` frames with a table, `mixed` an `N` then a `Z` frame; any
 * other single character is written as the mode of one frame.
 */
export type Framing = "plain" | "zlib" | "mixed" | (string & {});

export interface StorageOptions {
  /** The Build the build config names (`build-name`); 3.0.0.24268 by default. */
  build?: string;
  /** The Version of `.build.info`; `build` by default. */
  buildInfoVersion?: string;
  /** Each file's content by its CASC path. */
  files: Record<string, string | Uint8Array>;
  /** How each file is framed; `zlib` by default, alternating with `plain`. */
  framing?: Record<string, Framing>;
  /** Paths whose content key the encoding file leaves out. */
  notInEncoding?: readonly string[];
}

export interface Storage {
  installDir: string;
  buildConfigKey: string;
  /** Each file's content key by its path. */
  contentKeys: Record<string, string>;
}

const md5 = (bytes: Uint8Array) => createHash("md5").update(bytes).digest();
const hex = (bytes: Uint8Array) => Buffer.from(bytes).toString("hex");

export const sha256 = (text: string): string =>
  createHash("sha256").update(text).digest("hex");

export const contentKey = (text: string): string => hex(md5(Buffer.from(text)));

/** A fresh temporary folder. */
export const tempDir = (name: string): Promise<string> =>
  mkdtemp(join(tmpdir(), `reforged-builtins-${name}-`));

/** The BLTE stream of `content` in the given framing. */
export function blte(content: Uint8Array, framing: Framing): Buffer {
  const frame = (mode: string, data: Uint8Array) =>
    Buffer.concat([
      Buffer.from(mode, "latin1"),
      mode === "Z" ? deflateSync(data) : data,
    ]);
  if (framing === "plain") {
    return Buffer.concat([Buffer.from("BLTE"), u32be(0), frame("N", content)]);
  }
  const half = Math.ceil(content.byteLength / 2);
  const parts =
    framing === "zlib"
      ? [
          frame("Z", content.subarray(0, half)),
          frame("Z", content.subarray(half)),
        ]
      : framing === "mixed"
        ? [
            frame("N", content.subarray(0, half)),
            frame("Z", content.subarray(half)),
          ]
        : [frame(framing, content)];
  const sizes =
    parts.length === 2
      ? [half, content.byteLength - half]
      : [content.byteLength];
  const headerSize = 12 + parts.length * 24;
  const table = parts.map((part, i) =>
    Buffer.concat([u32be(part.byteLength), u32be(sizes[i]), md5(part)]),
  );
  return Buffer.concat([
    Buffer.from("BLTE"),
    u32be(headerSize),
    Buffer.from([0x0f, 0, 0, parts.length]),
    ...table,
    ...parts,
  ]);
}

/** Writes the storage into a new temporary folder. */
export async function writeStorage(options: StorageOptions): Promise<Storage> {
  const installDir = await tempDir("install");
  const dataDir = join(installDir, "Data", "data");
  await mkdir(dataDir, { recursive: true });

  interface Stored {
    ckey: Buffer;
    ekey: Buffer;
    blte: Buffer;
    size: number;
  }
  const stored: Stored[] = [];
  const store = (content: Uint8Array, framing: Framing): Stored => {
    const stream = blte(content, framing);
    const entry = {
      ckey: md5(content),
      ekey: md5(stream),
      blte: stream,
      size: content.byteLength,
    };
    stored.push(entry);
    return entry;
  };

  const contentKeys: Record<string, string> = {};
  const rootLines: string[] = [];
  Object.entries(options.files).forEach(([path, content], i) => {
    const bytes = typeof content === "string" ? Buffer.from(content) : content;
    const framing = options.framing?.[path] ?? (i % 2 === 0 ? "zlib" : "plain");
    const entry = store(bytes, framing);
    contentKeys[path] = hex(entry.ckey);
    const locale = /_Locales\/(\w{4})\.w3mod:/.exec(path)?.[1] ?? "";
    rootLines.push(`${path}|${hex(entry.ckey)}|${locale}|`);
  });
  const root = store(Buffer.from(rootLines.join("\n") + "\n"), "zlib");

  const hidden = new Set(
    (options.notInEncoding ?? []).map((path) => contentKeys[path]),
  );
  const encodingContent = encodingFile(
    stored.filter((entry) => !hidden.has(hex(entry.ckey))),
  );
  const encoding = store(encodingContent, "zlib");

  // One archive holds every file, each after its 30-byte header.
  const archive: Buffer[] = [];
  const index: { ekey: Buffer; offset: number; size: number }[] = [];
  let offset = 0;
  for (const entry of stored) {
    const size = 30 + entry.blte.byteLength;
    const header = Buffer.concat([
      Buffer.from(entry.ekey).reverse(),
      u32le(size),
      Buffer.alloc(10),
    ]);
    archive.push(header, entry.blte);
    index.push({ ekey: entry.ekey, offset, size });
    offset += size;
  }
  await writeFile(join(dataDir, "data.000"), Buffer.concat(archive));
  // The newest version of the bucket is read; the older one points nowhere.
  await writeFile(join(dataDir, "0000000002.idx"), indexFile(index));
  await writeFile(
    join(dataDir, "0000000001.idx"),
    indexFile(index.map((e) => ({ ...e, offset: e.offset + 7 }))),
  );

  const config =
    "# Build Configuration\n\n" +
    `root = ${hex(root.ckey)}\n` +
    `encoding = ${hex(encoding.ckey)} ${hex(encoding.ekey)}\n` +
    `encoding-size = ${String(encoding.size)} ${String(encoding.blte.byteLength)}\n` +
    `build-name = ${options.build ?? "3.0.0.24268"}-retail\n`;
  const buildConfigKey = hex(md5(Buffer.from(config)));
  const configDir = join(
    installDir,
    "Data",
    "config",
    buildConfigKey.slice(0, 2),
    buildConfigKey.slice(2, 4),
  );
  await mkdir(configDir, { recursive: true });
  await writeFile(join(configDir, buildConfigKey), config);

  await writeFile(
    join(installDir, ".build.info"),
    "Branch!STRING:0|Active!DEC:1|Build Key!HEX:16|CDN Key!HEX:16|Version!STRING:0|Product!STRING:0\n" +
      `eu|0|${"0".repeat(32)}|${"0".repeat(32)}|1.0.0.1|w3\n` +
      `us|1|${buildConfigKey}|${"0".repeat(32)}|${options.buildInfoVersion ?? options.build ?? "3.0.0.24268"}|w3\n`,
  );
  return { installDir, buildConfigKey, contentKeys };
}

/** The encoding file: its header, an espec block, then pages of 1 KB. */
function encodingFile(
  entries: readonly { ckey: Buffer; ekey: Buffer; size: number }[],
): Buffer {
  const pageSize = 1024;
  const records = [...entries]
    .sort((a, b) => Buffer.compare(a.ckey, b.ckey))
    .map((e) =>
      Buffer.concat([Buffer.from([1]), u40be(e.size), e.ckey, e.ekey]),
    );
  const pages: Buffer[][] = [[]];
  let used = 0;
  for (const record of records) {
    if (used + record.byteLength > pageSize) {
      pages.push([]);
      used = 0;
    }
    pages[pages.length - 1].push(record);
    used += record.byteLength;
  }
  const padded = pages.map((page) => {
    const body = Buffer.concat(page);
    return Buffer.concat([body, Buffer.alloc(pageSize - body.byteLength)]);
  });
  const espec = Buffer.from("z\0");
  const header = Buffer.concat([
    Buffer.from("EN"),
    Buffer.from([1, 16, 16]),
    u16be(pageSize / 1024),
    u16be(pageSize / 1024),
    u32be(padded.length),
    u32be(0),
    Buffer.from([0]),
    u32be(espec.byteLength),
  ]);
  const table = padded.map((page) =>
    Buffer.concat([page.subarray(6, 22), md5(page)]),
  );
  return Buffer.concat([header, espec, ...table, ...padded]);
}

/** A version 7 local index of 9-byte keys, 5-byte offsets and 4-byte sizes. */
function indexFile(
  entries: readonly { ekey: Buffer; offset: number; size: number }[],
): Buffer {
  const header = Buffer.concat([
    u32le(0x10),
    u32le(0),
    Buffer.from([7, 0, 0, 0, 4, 5, 9, 30]),
    Buffer.alloc(8),
    Buffer.alloc(8),
  ]);
  const body = Buffer.concat(
    entries.map((e) =>
      Buffer.concat([e.ekey.subarray(0, 9), u40be(e.offset), u32le(e.size)]),
    ),
  );
  return Buffer.concat([header, u32le(body.byteLength), u32le(0), body]);
}

function u16be(value: number): Buffer {
  const b = Buffer.alloc(2);
  b.writeUInt16BE(value);
  return b;
}

function u32be(value: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(value);
  return b;
}

function u32le(value: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(value);
  return b;
}

function u40be(value: number): Buffer {
  const b = Buffer.alloc(5);
  b.writeUIntBE(value, 0, 5);
  return b;
}

/** A unit of the synthetic data: its Rawcode, race and enUS name. */
export interface SyntheticUnit {
  id: string;
  race?: string;
  /** Its `Name=` line's value; no line when undefined. */
  name?: string;
}

/** A synthetic `UnitData.slk`: columns unitID, sort, race. */
export function unitDataSlk(units: readonly SyntheticUnit[]): string {
  const lines = [
    "ID;PWXL;N;E",
    `B;X3;Y${String(units.length + 1)};D0`,
    'C;X1;Y1;K"unitID"',
    'C;X2;K"sort"',
    'C;X3;K"race"',
  ];
  units.forEach((unit, i) => {
    lines.push(`C;X1;Y${String(i + 2)};K"${unit.id}"`, 'C;X2;K"z1"');
    if (unit.race !== undefined) lines.push(`C;X3;K"${unit.race}"`);
  });
  lines.push("E");
  return lines.join("\r\n") + "\r\n";
}

/** A synthetic `UnitMetaData.slk` whose `unam` is the profile field `field`. */
export function unitMetaDataSlk(field = "Name", slk = "Profile"): string {
  return (
    [
      "ID;PWXL;N;E",
      "B;X3;Y3;D0",
      'C;X1;Y1;K"ID"',
      'C;X2;K"field"',
      'C;X3;K"slk"',
      'C;X1;Y2;K"umvs"',
      'C;X2;K"spd"',
      'C;X3;K"UnitBalance"',
      'C;X1;Y3;K"unam"',
      `C;X2;K"${field}"`,
      `C;X3;K"${slk}"`,
      "E",
    ].join("\r\n") + "\r\n"
  );
}

/** A synthetic profile file: one section per unit with a name. */
export function unitStrings(units: readonly SyntheticUnit[]): string {
  return units
    .filter((unit) => unit.name !== undefined)
    .map((unit) => `[${unit.id}]\t\r\nName=${unit.name ?? ""}\r\nHotkey=Q\r\n`)
    .join("\r\n");
}

export const UNIT_DATA = "War3.w3mod:Units/UnitData.slk";
export const UNIT_META_DATA = "War3.w3mod:Units/UnitMetaData.slk";
export const strings = (file: string): string =>
  `War3.w3mod:_Locales/enUS.w3mod:Units/${file}`;

/** A synthetic SLK table: row 1 names `columns`, each later row one object. */
export function slkTable(
  columns: readonly string[],
  rows: readonly (readonly (string | undefined)[])[],
): string {
  const lines = [
    "ID;PWXL;N;E",
    `B;X${String(columns.length)};Y${String(rows.length + 1)};D0`,
  ];
  columns.forEach((column, x) => {
    lines.push(`C;X${String(x + 1)};Y1;K"${column}"`);
  });
  rows.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== undefined) {
        lines.push(`C;X${String(x + 1)};Y${String(y + 2)};K"${value}"`);
      }
    });
  });
  lines.push("E");
  return lines.join("\r\n") + "\r\n";
}

/** A metadata row: the ID, its field, the table that holds it and its repeat. */
export interface SyntheticMeta {
  id: string;
  field: string;
  slk: string;
  repeat?: string;
}

/** A synthetic `*MetaData.slk` of the given rows. */
export function metaDataSlk(rows: readonly SyntheticMeta[]): string {
  return slkTable(
    ["ID", "field", "slk", "repeat"],
    rows.map((row) => [row.id, row.field, row.slk, row.repeat]),
  );
}

/** A synthetic profile file: one section per entry, its keys in order. */
export function profile(
  sections: Readonly<Record<string, Readonly<Record<string, string>>>>,
): string {
  return Object.entries(sections)
    .map(
      ([section, keys]) =>
        `[${section}]\r\n` +
        Object.entries(keys)
          .map(([key, value]) => `${key}=${value}\r\n`)
          .join(""),
    )
    .join("\r\n");
}

export const base = (file: string): string => `War3.w3mod:${file}`;
export const WORLD_EDIT_STRINGS =
  "War3.w3mod:_Locales/enUS.w3mod:UI/WorldEditStrings.txt";
export const WORLD_EDIT_GAME_STRINGS =
  "War3.w3mod:_Locales/enUS.w3mod:UI/WorldEditGameStrings.txt";

/**
 * The other six kinds' files, with no object: data tables of no row, their
 * metadata, and empty names files.
 */
export const NO_OTHER_KINDS: Readonly<Record<string, string>> = {
  [base("Units/ItemData.slk")]: slkTable(["itemID"], []),
  [strings("ItemStrings.txt")]: "",
  [base("Units/AbilityData.slk")]: slkTable(["alias", "race"], []),
  [base("Units/AbilityMetaData.slk")]: metaDataSlk([
    { id: "anam", field: "Name", slk: "Profile", repeat: "0" },
  ]),
  [strings("HumanAbilityStrings.txt")]: "",
  [base("Units/AbilityBuffData.slk")]: slkTable(["alias", "race"], []),
  [base("Units/AbilityBuffMetaData.slk")]: metaDataSlk([
    { id: "fnam", field: "EditorName", slk: "Profile" },
    { id: "ftip", field: "Bufftip", slk: "Profile" },
  ]),
  [base("Units/DestructableData.slk")]: slkTable(
    ["DestructableID", "Name"],
    [],
  ),
  [base("Units/DestructableMetaData.slk")]: metaDataSlk([
    { id: "bnam", field: "Name", slk: "DestructableData" },
  ]),
  [base("Doodads/Doodads.slk")]: slkTable(["doodID", "Name"], []),
  [base("Doodads/DoodadMetaData.slk")]: metaDataSlk([
    { id: "dnam", field: "Name", slk: "DoodadData" },
  ]),
  [base("Units/UpgradeData.slk")]: slkTable(["upgradeid", "race"], []),
  [base("Units/UpgradeMetaData.slk")]: metaDataSlk([
    { id: "gnam", field: "Name", slk: "Profile", repeat: "1" },
  ]),
  [strings("HumanUpgradeStrings.txt")]: "",
};
