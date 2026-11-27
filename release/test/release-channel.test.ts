import { describe, expect, it } from "vitest";
import {
  readReleaseChannel,
  releaseChannel,
  ReleaseChannelError,
} from "../src/release-channel.js";
import { writeWorkspace } from "./support/workspace.js";

const ALPHA = "1.0.0-alpha.23";

describe("releaseChannel", () => {
  it("answers latest, main and a major for every package on master in the build phase", () => {
    expect(
      releaseChannel("master", [
        { name: "reforged-ts", version: ALPHA },
        { name: "create-reforged-map", version: "1.0.0-alpha.2" },
      ]),
    ).toEqual({
      branch: "master",
      distTag: "latest",
      templateRef: "main",
      majors: { "reforged-ts": true, "create-reforged-map": true },
    });
  });

  it("refuses a major on master to a package at its first stable or after, not to one still before it", () => {
    expect(
      releaseChannel("master", [
        { name: "reforged-ts", version: "1.0.0" },
        { name: "reforged-types", version: "1.4.2" },
        { name: "reforged-studio", version: "1.0.0-rc.1" },
        { name: "reforged-builtins", version: "0.3.0" },
      ]),
    ).toEqual({
      branch: "master",
      distTag: "latest",
      templateRef: "main",
      majors: {
        "reforged-ts": false,
        "reforged-types": false,
        "reforged-studio": true,
        "reforged-builtins": true,
      },
    });
  });

  it("answers next, the Template's next and a major for every package on next", () => {
    expect(
      releaseChannel("next", [
        { name: "reforged-ts", version: "2.0.0-beta.1" },
        { name: "reforged-types", version: "1.4.2" },
        { name: "reforged-studio", version: "1.0.0-alpha.9" },
      ]),
    ).toEqual({
      branch: "next",
      distTag: "next",
      templateRef: "next",
      majors: {
        "reforged-ts": true,
        "reforged-types": true,
        "reforged-studio": true,
      },
    });
  });

  it("refuses any other branch, naming master and next", () => {
    for (const branch of ["feature/1063", "main", "v1", ""]) {
      expect(() => releaseChannel(branch, [])).toThrow(ReleaseChannelError);
      expect(() => releaseChannel(branch, [])).toThrow(
        /A release runs from master or next, and .* is neither: master publishes on latest, next on next \(docs\/release\.md, "Release channels"\)\./,
      );
    }
    expect(() => releaseChannel("feature/1063", [])).toThrow(
      '"feature/1063" is neither',
    );
  });

  it("refuses a package whose version is not a semantic version, naming it", () => {
    expect(() =>
      releaseChannel("master", [{ name: "reforged-ts", version: "1.0" }]),
    ).toThrow('reforged-ts: its version "1.0" is not a semantic version.');
  });
});

describe("readReleaseChannel", () => {
  it("reads the versions of the workspace's publishable packages", async () => {
    const root = await writeWorkspace([
      { dir: "packages/reforged-ts", name: "reforged-ts" },
      {
        dir: "packages/reforged-studio",
        name: "reforged-studio",
        fields: { version: ALPHA },
      },
      { dir: "release", name: "reforged-ts-release", private: true },
    ]);
    expect(await readReleaseChannel("master", root)).toEqual({
      branch: "master",
      distTag: "latest",
      templateRef: "main",
      majors: { "reforged-studio": true, "reforged-ts": false },
    });
  });
});
