// The check-time measurement of the map's overloads (#584) on a tiny case,
// so the script keeps running: the numbers themselves are measured by hand
// with `map:measure`.

import { afterAll, describe, expect, it } from "vitest";
import {
  customUnitRawcode,
  formatMeasurement,
  mapProjectSource,
  measure,
} from "./measure/measure.js";
import { removeTemporary } from "./support/map-folder.js";

afterAll(removeTemporary);

describe("the check-time measurement of the map's overloads", () => {
  it("numbers the Custom units as the World Editor does, in base 36", () => {
    expect(
      [0, 9, 10, 35, 36, 499].map((index) => customUnitRawcode(index)),
    ).toEqual(["h000", "h009", "h00A", "h00Z", "h010", "h0DV"]);
  });

  it("writes literal FourCC calls of the Custom units where a unit's Rawcode is expected", () => {
    expect(mapProjectSource(["h000", "h001"], 3)).toBe(
      "declare const owner: player;\n" +
        'CreateUnit(owner, FourCC("h000"), 0, 0, 0);\n' +
        'CreateUnit(owner, FourCC("h001"), 0, 0, 0);\n' +
        'CreateUnit(owner, FourCC("h000"), 0, 0, 0);\n' +
        "export {};\n",
    );
  });

  it("type-checks the project with and without the overloads generateObjects writes", () => {
    const result = measure({ objects: 3, calls: [4], runs: 1 });

    expect(result.objects).toBe(3);
    expect(result.measurements).toHaveLength(1);
    expect(result.measurements[0].withOverloads).toBeGreaterThan(0);
    expect(formatMeasurement(result)).toMatch(
      /^Check time of a Map project, median, with the FourCC overloads of 3 Custom units and without:\n- 4 calls: /,
    );
  }, 60_000);
});
