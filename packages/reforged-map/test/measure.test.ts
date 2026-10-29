// The check-time measurement of the map's overloads (#584) on a tiny case,
// so the script keeps running: the numbers themselves are measured by hand
// with `map:measure`.

import { afterAll, describe, expect, it } from "vitest";
import { main } from "./measure/cli.js";
import {
  formatReload,
  main as mainDefinitions,
  measureReload,
} from "./measure/definitions.js";
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

  // Measured 4.5 s with pnpm test on the windows CI leg of #815, 12.3 s on Linux
  // (WSL 2, 8 threads), 2026-10.
  it("type-checks the project with and without the overloads generateObjects writes", () => {
    const result = measure({ objects: 3, calls: [4], runs: 1 });

    expect(result.objects).toBe(3);
    expect(result.measurements).toHaveLength(1);
    expect(result.measurements[0].withOverloads).toBeGreaterThan(0);
    expect(formatMeasurement(result)).toMatch(
      /^Check time of a Map project, median, with the FourCC overloads of 3 Custom units and without:\n- 4 calls: /,
    );
  }, 30_000);

  // Measured 3.5 s with pnpm test on the windows CI leg of #815, 7.2 s on Linux
  // (WSL 2, 8 threads), 2026-10.
  it("prints the measurement of the command, and exits 2 on a bad argument", () => {
    const out: string[] = [];
    const err: string[] = [];
    const output = {
      stdout: (text: string) => out.push(text),
      stderr: (text: string) => err.push(text),
    };

    expect(main(["--runs", "0"], output)).toBe(2);
    expect(main(["--rounds", "3"], output)).toBe(2);
    expect(err).toEqual([
      "Usage: map:measure [--runs <n>]\n",
      "Usage: map:measure [--runs <n>]\n",
    ]);
    expect(main(["--", "--runs", "1"], output, 2, [2])).toBe(0);
    expect(out.join("")).toMatch(/Custom units and without:\n- 2 calls: /);
  }, 30_000);
});

describe("the reload cost of the Rawcode lookup over Object definitions", () => {
  // Measured 0.3 s with pnpm test on the windows CI leg of #815, 0.6 s on Linux
  // (WSL 2, 8 threads), 2026-10.
  it("loads every definition file, then reloads after each edit of one", () => {
    const result = measureReload({ files: 3, runs: 4 });

    expect(result.files).toBe(3);
    expect(result.reload).toBeGreaterThan(0);
    expect(formatReload(result)).toMatch(
      /^Rawcode lookup over 3 Object definition files: first load \d+ ms, reload after editing one file \d+ ms \(median\), \d+ ms at most\.\n$/,
    );
  }, 15_000);

  // Measured 0.2 s with pnpm test on the windows CI leg of #815, 0.3 s on Linux
  // (WSL 2, 8 threads), 2026-10.
  it("prints the measurement of the command, and exits 2 on a bad argument", () => {
    const out: string[] = [];
    const err: string[] = [];
    const output = {
      stdout: (text: string) => out.push(text),
      stderr: (text: string) => err.push(text),
    };

    expect(mainDefinitions(["--runs", "0"], output)).toBe(2);
    expect(err).toEqual(["Usage: map:measure:definitions [--runs <n>]\n"]);
    expect(mainDefinitions(["--", "--runs", "1"], output, 2)).toBe(0);
    expect(out.join("")).toMatch(/over 2 Object definition files/);
  }, 15_000);
});
