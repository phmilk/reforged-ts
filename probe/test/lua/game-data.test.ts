// The BEGIN line of a build that staged Game data (#619): the hello Probe's
// bundle built with the Game Data Set Custom, the Game Data Version Reign of
// Chaos and the melee map flag, `hello_game_data_bundle`. The BEGIN line of
// a build that kept the map's own is hello.test.ts's, unchanged.

import { describe, expect, it } from "reforged-test/lua";
import { loadBundle } from "./bundle";

describe("the BEGIN line of a build with Game data", () => {
  it("carries each field of the Game data the build set, sorted with the others", () => {
    loadBundle("hello_game_data");
    expect(__stub_preload_file("reforged-ts\\probes\\hello.txt")).toEqual([
      "1 BEGIN gameDataSet=custom gameDataVersion=roc meleeMap=true patch=3.0.1.12345 probe=hello run=bridge",
      "2 CHECKPOINT",
    ]);
  });
});
