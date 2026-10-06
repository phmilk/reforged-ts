// war3map.wtg files for the tests, in the 1.31+ format the reader reads
// (src/war3map-wtg.ts has the layout): the header, the variables block, and
// no trigger element, as a map whose triggers were all deleted.

/** A variable of the Variable Editor, as a test declares it. */
export interface TestVariable {
  /** Its name, without `udg_`. */
  name: string;
  /** Its Variable Editor type (`unitcode`, `integer`). */
  type: string;
  /** An array of this size; a scalar when left out. */
  arraySize?: number;
}

/** What `buildWtg` writes in the header; the reader accepts the defaults alone. */
export interface WtgHeader {
  magic?: string;
  format?: number;
  subVersion?: number;
}

/** The bytes of a war3map.wtg declaring these variables, in this order. */
export function buildWtg(
  variables: readonly TestVariable[],
  header: WtgHeader = {},
): Uint8Array {
  const parts: Uint8Array[] = [];
  const uint32 = (value: number) => {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setUint32(0, value, true);
    parts.push(bytes);
  };
  const cString = (text: string) => {
    parts.push(new TextEncoder().encode(text), new Uint8Array([0]));
  };

  parts.push(new TextEncoder().encode(header.magic ?? "WTG!"));
  uint32(header.format ?? 0x80000004);
  uint32(header.subVersion ?? 7);
  // Maps, libraries, categories, triggers, comments, scripts, variables:
  // the count and the deleted ids; one deleted category id, to skip.
  for (let list = 0; list < 7; list++) {
    uint32(list === 6 ? variables.length : 0);
    if (list === 2) {
      uint32(1);
      uint32(42);
    } else {
      uint32(0);
    }
  }
  uint32(0);
  uint32(0);
  uint32(2); // the trigger data version

  uint32(variables.length);
  variables.forEach((variable, index) => {
    cString(variable.name);
    cString(variable.type);
    uint32(1);
    uint32(variable.arraySize === undefined ? 0 : 1);
    uint32(variable.arraySize ?? 1);
    uint32(0);
    cString("");
    uint32(0x06000000 + index);
    uint32(0x02000000);
  });
  uint32(0); // no element

  const bytes = new Uint8Array(parts.reduce((sum, p) => sum + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }
  return bytes;
}
