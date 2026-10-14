// war3map.w3i for the tests: its header up to the Game Data Version, in the
// layout of each format the reader reads (src/war3map-w3i.ts has it), with
// placeholder values in the fields the reader skips.

/** What `buildW3i` declares; the defaults are the 3.0 World Editor's for a new map. */
export interface TestW3i {
  /** 39 by default. */
  format?: number;
  /** 0 Default, 1 Custom, 2 Melee; 0 by default. */
  set?: number;
  /** 0 Reign of Chaos, 1 The Frozen Throne, 2 Forsaken Kingdom; 2 by default. Written from format 31. */
  version?: number;
  /** The melee map flag. */
  melee?: boolean;
}

/** The bytes of a war3map.w3i's header up to its Game Data Version, then a byte of the fields after it. */
export function buildW3i(w3i: TestW3i = {}): Uint8Array {
  const format = w3i.format ?? 39;
  const bytes: number[] = [];
  const int32 = (value: number) => {
    const part = new Uint8Array(4);
    new DataView(part.buffer).setInt32(0, value, true);
    bytes.push(...part);
  };
  const cString = (text: string) => {
    bytes.push(...new TextEncoder().encode(text), 0);
  };
  int32(format);
  int32(3); // saves
  int32(6116); // editor version
  if (format >= 28) for (const part of [3, 0, 0, 24268]) int32(part);
  for (const text of ["Name", "Author", "Description", "1-2"]) cString(text);
  for (let i = 0; i < 8 + 4 + 2; i++) int32(i);
  int32((w3i.melee === true ? 0x0004 : 0) | 0x8000);
  bytes.push("L".charCodeAt(0)); // main tileset
  int32(-1); // loading screen number
  if (format >= 39) int32(0); // crest race
  if (format >= 25) cString("");
  for (const text of ["Loading", "Title", "Subtitle"]) cString(text);
  int32(w3i.set ?? 0);
  for (const text of ["", "Prologue", "Title", "Subtitle"]) cString(text);
  for (let i = 0; i < 4 + 1 + (format >= 39 ? 6 : 0); i++) int32(0); // fog
  bytes.push(...[0, 0, 0, 0]); // weather
  cString("");
  bytes.push(0, 255, 255, 255, 255); // light tileset, water colour
  int32(1); // script language: Lua
  int32(3); // supported modes
  if (format >= 31) int32(w3i.version ?? 2);
  bytes.push(0);
  return Uint8Array.from(bytes);
}
