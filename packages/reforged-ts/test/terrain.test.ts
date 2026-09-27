/** @noSelfInFile */

// `Terrain` is a static namespace over the terrain Natives: each pathability
// member asks its Native about the point and pathing type given and answers
// what the Native answers, unchanged.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Terrain } from "../src/index";
import { withNative } from "./support/native-override";

describe("Terrain", () => {
  it("isPathable asks IsTerrainPathable for the point and the pathing type", () => {
    const answer = withNative(
      "IsTerrainPathable",
      () => true,
      () => Terrain.isPathable(128, -256, PATHING_TYPE_WALKABILITY),
    );
    expect(answer).toBe(true);
    expect(stubCalls()).toContainCall(
      "IsTerrainPathable(128, -256, PATHING_TYPE_WALKABILITY)",
    );
  });

  it("isPathableEx asks BlzIsTerrainPathableEx for the point and the pathing type", () => {
    const answer = withNative(
      "BlzIsTerrainPathableEx",
      () => false,
      () => Terrain.isPathableEx(64, 32, PATHING_TYPE_FLYABILITY),
    );
    expect(answer).toBe(false);
    expect(stubCalls()).toContainCall(
      "BlzIsTerrainPathableEx(64, 32, PATHING_TYPE_FLYABILITY)",
    );
  });
});
