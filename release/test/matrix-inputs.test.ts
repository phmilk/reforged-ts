import { describe, expect, it } from "vitest";
import {
  MatrixInputError,
  parseCatalog,
  parseMatrix,
  parseSystems,
} from "../src/matrix-inputs.js";

describe("parseCatalog", () => {
  it("reads the catalog's entries, quotes and comments dropped", () => {
    expect(
      parseCatalog(
        'packages:\n  - packages/*\n\ncatalog:\n  # a comment\n  a: 1.0.0\n  "@b/c": ^2.0.0 # why\n  \'d\': "~3"\n\nother:\n  e: 4\n',
      ),
    ).toEqual({ a: "1.0.0", "@b/c": "^2.0.0", d: "~3" });
  });
});

describe("parseSystems", () => {
  it("reads the systems each minor adds, and refuses another shape", () => {
    expect(parseSystems({ minors: { "1.0": ["Camera"], "1.1": [] } })).toEqual({
      "1.0": ["Camera"],
      "1.1": [],
    });
    expect(() => parseSystems({ "1.0": [] })).toThrow(MatrixInputError);
    expect(() => parseSystems({ minors: { "1.0.0": [] } })).toThrow(
      /"1\.0\.0" must be a library minor/,
    );
  });
});

describe("parseMatrix", () => {
  it("refuses a matrix of another format or with a malformed cut date", () => {
    expect(() => parseMatrix({ format: 2, rows: [] })).toThrow(
      MatrixInputError,
    );
    expect(parseMatrix({ format: 1, rows: [] })).toEqual({
      format: 1,
      rows: [],
    });
    const row = {
      library: "1.0.0",
      typings: "1.0.0",
      harness: "1.0.0",
      plugin: "1.0.0",
      patch: "3.0.0.24268",
      typescript: "6.0.2",
      typescriptToLua: "^1.37.1",
      luaTypes: "^2.14.1",
      node: "22.13",
      systems: [],
      cutDate: "2026/10/01",
      docs: "https://phmilk.github.io/reforged-ts/docs/1.0",
    };
    expect(() => parseMatrix({ format: 1, rows: [row] })).toThrow(
      "row 0 has cutDate 2026/10/01, not YYYY-MM-DD.",
    );
  });
});
