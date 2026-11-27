import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AuthorError } from "../src/errors.js";
import { PROBE_FOLDERS } from "../src/folders.js";
import { probeTitle, readTitle, writeTitle } from "../src/title.js";

const w3i = new Uint8Array(
  readFileSync(join(PROBE_FOLDERS.map, "war3map.w3i")),
);
const wts = readFileSync(join(PROBE_FOLDERS.map, "war3map.wts"), "utf8");

/** `w3i` with its name field replaced by `name`. */
function named(name: string): Uint8Array {
  return writeTitle(w3i, undefined, name).w3i;
}

describe("probeTitle", () => {
  it("names the Probe", () => {
    expect(probeTitle("player-leave")).toBe("Probe player-leave");
  });
});

describe("writeTitle", () => {
  it("rewrites the string of war3map.wts the map's name points to, and keeps war3map.w3i", () => {
    expect(readTitle(w3i, wts)).toBe("reforged-ts-templante");

    const titled = writeTitle(w3i, wts, "Probe player-leave");

    expect(titled.w3i).toBe(w3i);
    expect(readTitle(titled.w3i, titled.wts)).toBe("Probe player-leave");
    expect(
      titled.wts?.replace("Probe player-leave", "reforged-ts-templante"),
    ).toBe(wts);
  });

  it("rewrites only the string named, not one whose number starts the same", () => {
    const strings =
      "STRING 3\r\n{\r\nthree\r\n}\r\n\r\nSTRING 30\r\n{\r\nthirty\r\n}\r\n";
    const map = named("TRIGSTR_030");

    const titled = writeTitle(map, strings, "Probe x");

    expect(titled.wts).toBe(
      "STRING 3\r\n{\r\nthree\r\n}\r\n\r\nSTRING 30\r\n{\r\nProbe x\r\n}\r\n",
    );
  });

  it("rewrites a plain name in war3map.w3i, keeping every byte after it", () => {
    const map = named("My map");
    const after = map.subarray(map.indexOf(0, 28));

    const titled = writeTitle(map, wts, "Probe player-leave");

    expect(readTitle(titled.w3i, titled.wts)).toBe("Probe player-leave");
    expect(titled.wts).toBe(wts);
    expect(titled.w3i.subarray(titled.w3i.indexOf(0, 28))).toEqual(after);
  });

  it("rewrites the name in war3map.w3i when it points to a string war3map.wts lacks", () => {
    const titled = writeTitle(named("TRIGSTR_999"), wts, "Probe x");

    expect(readTitle(titled.w3i, titled.wts)).toBe("Probe x");
    expect(titled.wts).toBe(wts);
  });

  it("refuses a war3map.w3i of another format, with a one-line author error", () => {
    const other = new Uint8Array(w3i);
    new DataView(other.buffer).setInt32(0, 28, true);

    expect(() => writeTitle(other, wts, "Probe x")).toThrow(AuthorError);
    expect(() => writeTitle(other, wts, "Probe x")).toThrow(/not of format 39/);
  });
});
