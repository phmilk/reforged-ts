// The BEGIN line of a build that staged players (#1043): the hello Probe's
// bundle built with two player slots, `hello_players_bundle`. The BEGIN
// line of a build that kept the map's own is hello.test.ts's, unchanged.

import { describe, expect, it } from "reforged-test/lua";
import { loadBundle } from "./bundle";

describe("the BEGIN line of a build with players", () => {
  it("carries the players the build set, sorted with the other fields", () => {
    loadBundle("hello_players");
    expect(__stub_preload_file("reforged-ts\\probes\\hello.txt")).toEqual([
      "1 BEGIN patch=3.0.1.12345 players=2 probe=hello run=bridge",
      "2 CHECKPOINT",
    ]);
  });
});
