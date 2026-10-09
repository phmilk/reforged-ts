/**
 * The check-time measurement (#515) on a tiny case, so the script keeps
 * running: the numbers themselves are the README's, measured by hand.
 */
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  formatMeasurement,
  mapProjectSource,
  measure,
} from "../src/measure.js";
import type { BuiltinsIndex } from "../src/model.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

describe("the check-time measurement", () => {
  it("writes literal FourCC calls where their kind is expected", () => {
    const index = {
      objects: {
        hfoo: { kind: "unit", sets: [], constant: "Footman_hfoo" },
        AHbz: { kind: "ability", sets: [], constant: "Blizzard_AHbz" },
      },
    } as unknown as BuiltinsIndex;

    expect(mapProjectSource(index, 3)).toBe(
      "declare const owner: player;\n" +
        "declare const target: unit;\n" +
        'CreateUnit(owner, FourCC("hfoo"), 0, 0, 0);\n' +
        'UnitAddAbility(target, FourCC("AHbz"));\n' +
        'CreateUnit(owner, FourCC("hfoo"), 0, 0, 0);\n' +
        "export {};\n",
    );
  });

  it("type-checks the project with and without the committed overloads", () => {
    const result = measure({
      root: ROOT,
      gameVersion: "3.0.0",
      calls: [4],
      runs: 1,
    });

    expect(result.measurements).toHaveLength(1);
    expect(result.measurements[0].withOverloads).toBeGreaterThan(0);
    expect(formatMeasurement(result)).toMatch(
      /^Check time of a Map project, median, with \d+ FourCC overloads and without:\n- 4 calls: /,
    );
  }, 60_000);
});
