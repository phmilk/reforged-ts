// The Supported Modes of war3map.w3i (#839), which the Studio limits its
// art layer to: on map folders holding a war3map.w3i the tests build, and on
// a World Editor fixture.

import { afterAll, describe, expect, it } from "vitest";
import { readSupportedModes } from "../src/index.js";
import {
  fixtureMap,
  mapFolder,
  removeTemporary,
} from "./support/map-folder.js";
import { buildW3i } from "./support/w3i.js";

afterAll(removeTemporary);

describe("readSupportedModes", () => {
  it("reads the Supported Modes the map declares", () => {
    for (const modes of [1, 2, 3, 4]) {
      const folder = mapFolder({ "war3map.w3i": buildW3i({ modes }) });
      expect(readSupportedModes(folder)).toBe(modes);
    }
  });

  it("reads them in each format that has them", () => {
    for (const format of [31, 32, 33, 39]) {
      const folder = mapFolder({
        "war3map.w3i": buildW3i({ format, modes: 2 }),
      });
      expect(readSupportedModes(folder)).toBe(2);
    }
  });

  it("reads All Modes from a map the 3.0 World Editor saved", () => {
    expect(readSupportedModes(fixtureMap("editor-objects.w3m"))).toBe(3);
  });

  it("is undefined for a format before 31, a missing file or an unreadable one", () => {
    expect(
      readSupportedModes(
        mapFolder({ "war3map.w3i": buildW3i({ format: 28, modes: 2 }) }),
      ),
    ).toBeUndefined();
    expect(readSupportedModes(mapFolder({}))).toBeUndefined();
    expect(
      readSupportedModes(
        mapFolder({ "war3map.w3i": Uint8Array.from([39, 0, 0, 0]) }),
      ),
    ).toBeUndefined();
  });
});
