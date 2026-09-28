import { describe, expect, it } from "vitest";
import { main } from "../src/cli/docs-cut.js";
import { docsCut } from "../src/docs-cut.js";

function runCli(args: string[]) {
  let stdout = "";
  let stderr = "";
  const status = main(args, {
    stdout: (text) => (stdout += text),
    stderr: (text) => (stderr += text),
  });
  return { status, stdout, stderr };
}

describe("docsCut", () => {
  it.each([
    ["reforged-ts@1.1.0", "1.1.0", "1.1"],
    ["reforged-ts@1.0.0", "1.0.0", "1.0"],
    ["reforged-ts@2.10.0", "2.10.0", "2.10"],
    ["reforged-ts@0.3.0", "0.3.0", "0.3"],
  ])("cuts the docs version of %s", (tag, version, label) => {
    expect(docsCut(tag)).toEqual({ cut: true, version, label });
  });

  it("cuts none on a prerelease, whose docs stay on Next", () => {
    expect(docsCut("reforged-ts@1.0.0-alpha.3")).toEqual({
      cut: false,
      reason:
        "reforged-ts@1.0.0-alpha.3 is a prerelease: a docs version is cut on a stable minor only, and a prerelease's docs are Next.",
    });
    expect(docsCut("reforged-ts@1.1.0-rc.0")).toMatchObject({ cut: false });
  });

  it("cuts none on a patch release, whose minor has its docs version", () => {
    expect(docsCut("reforged-ts@1.0.1")).toEqual({
      cut: false,
      reason:
        "reforged-ts@1.0.1 is a patch release: the docs version 1.0 is cut on reforged-ts@1.0.0.",
    });
  });

  it("cuts none on a version with build metadata", () => {
    expect(docsCut("reforged-ts@1.1.0+sha.1")).toEqual({
      cut: false,
      reason:
        "reforged-ts@1.1.0+sha.1 carries build metadata: a docs version is cut on reforged-ts@<major>.<minor>.0 only.",
    });
  });

  it("cuts none on a tag of another package", () => {
    expect(docsCut("reforged-types@1.1.0")).toEqual({
      cut: false,
      reason: "reforged-types@1.1.0 is not a tag of reforged-ts.",
    });
    expect(docsCut("reforged-ts-release@1.1.0")).toMatchObject({
      cut: false,
    });
  });

  it("cuts none when the tag names no semantic version", () => {
    expect(docsCut("reforged-ts@1.1")).toEqual({
      cut: false,
      reason: "reforged-ts@1.1 does not name a semantic version.",
    });
    expect(docsCut("reforged-ts@v1.1.0")).toMatchObject({ cut: false });
    expect(docsCut("reforged-ts@")).toMatchObject({ cut: false });
  });
});

describe("release:docs-cut", () => {
  it("prints the cut of a minor tag as one JSON object", () => {
    expect(runCli(["reforged-ts@1.1.0"])).toEqual({
      status: 0,
      stdout: '{"cut":true,"version":"1.1.0","label":"1.1"}\n',
      stderr: "",
    });
  });

  it("prints why another tag cuts none, and exits 0", () => {
    const { status, stdout, stderr } = runCli(["reforged-ts@1.0.1"]);

    expect({ status, stderr }).toEqual({ status: 0, stderr: "" });
    expect(JSON.parse(stdout)).toEqual(docsCut("reforged-ts@1.0.1"));
  });

  it.each([[[]], [["reforged-ts@1.1.0", "reforged-ts@1.2.0"]], [[""]]])(
    "exits 2 with the usage on %j",
    (args) => {
      expect(runCli(args)).toEqual({
        status: 2,
        stdout: "",
        stderr: "Usage: release:docs-cut <tag>, such as reforged-ts@1.1.0\n",
      });
    },
  );
});
