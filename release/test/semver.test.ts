import { describe, expect, it } from "vitest";
import {
  compareSemver,
  isPrerelease,
  parseSemver,
  type SemVer,
} from "../src/semver.js";

function version(text: string): SemVer {
  const parsed = parseSemver(text);
  if (parsed === undefined) throw new Error(`${text} is not semver`);
  return parsed;
}

describe("parseSemver", () => {
  it("reads the numbers, the prerelease and the build metadata", () => {
    expect(parseSemver("1.0.0-alpha.12+sha.5114f85")).toEqual({
      major: 1,
      minor: 0,
      patch: 0,
      prerelease: ["alpha", "12"],
      build: ["sha", "5114f85"],
    });
    expect(parseSemver("10.33.0")).toEqual({
      major: 10,
      minor: 33,
      patch: 0,
      prerelease: [],
      build: [],
    });
  });

  it.each([
    "1.0.0",
    "0.0.0",
    "1.0.0-0",
    "1.0.0-alpha.0",
    "1.0.0-0a.1",
    "1.0.0-x-y.1",
    "1.0.0+001",
  ])("accepts %s", (text) => {
    expect(parseSemver(text)).toBeDefined();
  });

  it.each([
    "1.0",
    "1.0.0.0",
    "v1.0.0",
    " 1.0.0",
    "01.0.0",
    "1.00.0",
    "1.0.00",
    "1.0.0-01",
    "1.0.0-alpha.01",
    "1.0.0-",
    "1.0.0-alpha..1",
    "1.0.0+",
    "1.0.0-alpha_1",
  ])("refuses %s", (text) => {
    expect(parseSemver(text)).toBeUndefined();
  });
});

describe("isPrerelease", () => {
  it("is true only with prerelease identifiers, whatever the build metadata", () => {
    expect(isPrerelease(version("1.0.0-alpha.0"))).toBe(true);
    expect(isPrerelease(version("1.0.0-0"))).toBe(true);
    expect(isPrerelease(version("1.0.0"))).toBe(false);
    expect(isPrerelease(version("1.0.0+build-1"))).toBe(false);
  });
});

describe("compareSemver", () => {
  it("orders versions by semver precedence", () => {
    const ordered = [
      "0.9.9",
      "1.0.0-0",
      "1.0.0-alpha",
      "1.0.0-alpha.1",
      "1.0.0-alpha.2",
      "1.0.0-alpha.10",
      "1.0.0-alpha.beta",
      "1.0.0-beta",
      "1.0.0-rc.1",
      "1.0.0",
      "1.2.0",
      "1.10.0",
      "2.0.0",
    ];
    const shuffled = [...ordered].reverse();
    expect(
      shuffled
        .map(version)
        .sort(compareSemver)
        .map(
          (v) =>
            `${String(v.major)}.${String(v.minor)}.${String(v.patch)}` +
            (v.prerelease.length > 0 ? `-${v.prerelease.join(".")}` : ""),
        ),
    ).toEqual(ordered);
  });

  it("ignores build metadata", () => {
    expect(compareSemver(version("1.0.0+a"), version("1.0.0+b"))).toBe(0);
    expect(
      compareSemver(version("1.0.0-alpha.1+a"), version("1.0.0-alpha.1")),
    ).toBe(0);
  });
});
