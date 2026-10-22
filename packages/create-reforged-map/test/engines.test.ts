import { describe, expect, it } from "vitest";
import { satisfies } from "../src/engines.js";

describe("satisfies", () => {
  it.each([
    [">=24", "v24.0.0", true],
    [">=24", "v24.14.0", true],
    [">=24", "v25.1.0", true],
    [">=24", "v23.11.1", false],
    [">=24", "v22.13.0", false],
    [">= 24", "v23.0.0", false],
    [">=22.13", "v22.12.9", false],
    [">=22.13", "v22.13.0", true],
    [">=22.13.1", "v22.13.0", false],
    [">24", "v24.9.0", false],
    [">24", "v25.0.0", true],
    ["<25", "v24.99.0", true],
    ["<25", "v25.0.0", false],
    ["<=24", "v24.99.0", true],
    ["<=24.1", "v24.2.0", false],
    ["=24.1.0", "v24.1.0", true],
    ["24", "v24.3.0", true],
    ["24.x", "v25.0.0", false],
    ["*", "v18.0.0", true],
    ["", "v18.0.0", true],
    ["^22.13", "v22.20.0", true],
    ["^22.13", "v23.0.0", false],
    ["^0.2.1", "v0.3.0", false],
    ["~24.1", "v24.1.9", true],
    ["~24.1", "v24.2.0", false],
    [">=22.13 <23", "v22.20.0", true],
    [">=22.13 <23", "v24.0.0", false],
    ["^20.19 || >=22.12", "v21.0.0", false],
    ["^20.19 || >=22.12", "v20.19.0", true],
    ["^20.19 || >=22.12", "v24.0.0", true],
    ["22.13 - 24", "v24.9.0", true],
    ["22.13 - 24", "v25.0.0", false],
    [">=24", "v24.0.0-nightly20251001", true],
  ])("reads %j as admitting Node %s: %s", (range, version, admitted) => {
    expect(satisfies(version, range)).toBe(admitted);
  });

  it.each([
    [">=twenty", "v24.0.0"],
    ["latest", "v24.0.0"],
    [">=24", "24"],
    [">=24", "node"],
  ])("cannot read the range %j with Node %j", (range, version) => {
    expect(satisfies(version, range)).toBeUndefined();
  });
});
