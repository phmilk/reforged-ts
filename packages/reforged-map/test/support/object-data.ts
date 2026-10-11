// Object data files (war3map.w3u and its siblings) and war3map.wts for the
// tests, in the layout the reader reads (src/object-data.ts has it).

/** One modification, as a test declares it; its type follows its value when left out. */
export interface TestModification {
  field: string;
  value: number | string;
  /** 0 int, 1 real, 2 unreal, 3 string. */
  type?: number;
  level?: number;
  dataPointer?: number;
}

/** One object, as a test declares it: a Built-in object when `custom` is left out. */
export interface TestObject {
  original: string;
  custom?: string;
  modifications?: TestModification[];
  /** The sets of format version 3; one set of flag 0 holding `modifications` when left out. */
  sets?: { flag: number; modifications: TestModification[] }[];
}

/** What `buildObjectData` writes; the reader accepts the defaults. */
export interface TestObjectData {
  version?: number;
  original?: TestObject[];
  custom?: TestObject[];
  /** Whether each modification has a level and a data pointer, as in the abilities, doodads and upgrades files. */
  levels?: boolean;
}

/** The bytes of an Object data file holding these objects, in this order. */
export function buildObjectData(data: TestObjectData): Uint8Array {
  const writer = new Writer();
  const version = data.version ?? 3;
  writer.uint32(version);
  for (const table of [data.original ?? [], data.custom ?? []]) {
    writer.uint32(table.length);
    for (const object of table) {
      writer.rawcode(object.original);
      writer.rawcode(object.custom ?? "\0\0\0\0");
      const sets = object.sets ?? [
        { flag: 0, modifications: object.modifications ?? [] },
      ];
      if (version >= 3) writer.uint32(sets.length);
      for (const set of version >= 3 ? sets : sets.slice(0, 1)) {
        if (version >= 3) writer.uint32(set.flag);
        writer.uint32(set.modifications.length);
        for (const modification of set.modifications) {
          writer.rawcode(modification.field);
          if (data.levels === true) {
            writer.uint32(modification.level ?? 0);
            writer.uint32(modification.dataPointer ?? 0);
          }
          const type =
            modification.type ??
            (typeof modification.value === "string" ? 3 : 0);
          writer.uint32(type);
          if (typeof modification.value === "string") {
            writer.cString(modification.value);
          } else if (type === 0) {
            writer.uint32(modification.value);
          } else {
            writer.float32(modification.value);
          }
          writer.rawcode(object.custom ?? object.original);
        }
      }
    }
  }
  return writer.bytes();
}

/** What `buildWts` writes around its strings. */
export interface WtsLayout {
  /** A byte order mark first. */
  bom?: boolean;
  /** CRLF line ends, LF otherwise. */
  crlf?: boolean;
  /** A `//` comment line before each string's body. */
  comments?: boolean;
}

/** The text of a war3map.wts holding these strings, by their number. */
export function buildWts(
  strings: Readonly<Record<number, string>>,
  layout: WtsLayout = {},
): string {
  const lines: string[] = [];
  for (const [number, text] of Object.entries(strings)) {
    lines.push(`STRING ${number}`);
    if (layout.comments === true) lines.push(`// Units: h000 (Name)`);
    lines.push("{", ...text.split("\n"), "}", "");
  }
  const eol = layout.crlf === true ? "\r\n" : "\n";
  return (layout.bom === true ? "﻿" : "") + lines.join(eol);
}

class Writer {
  readonly #parts: Uint8Array[] = [];

  uint32(value: number): void {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setUint32(0, value, true);
    this.#parts.push(bytes);
  }

  float32(value: number): void {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setFloat32(0, value, true);
    this.#parts.push(bytes);
  }

  /** Four bytes, each character's code a byte. */
  rawcode(text: string): void {
    this.#parts.push(Uint8Array.from(text, (c) => c.charCodeAt(0)));
  }

  cString(text: string): void {
    this.#parts.push(new TextEncoder().encode(text), new Uint8Array([0]));
  }

  bytes(): Uint8Array {
    const bytes = new Uint8Array(
      this.#parts.reduce((sum, part) => sum + part.length, 0),
    );
    let offset = 0;
    for (const part of this.#parts) {
      bytes.set(part, offset);
      offset += part.length;
    }
    return bytes;
  }
}
