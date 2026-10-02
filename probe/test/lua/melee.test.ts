// The runner's wrapped `main` on the hello Probe's bundle: the map's Melee
// Initialization, which `main` runs, calls `MeleeInitVictoryDefeat`, which
// would end a game with no enemy player in victory within seconds (#348).
// The runner replaces it before the editor's `main` runs.

import { describe, expect, it } from "reforged-test/lua";
import { globals } from "./bundle";

describe("the runner's main", () => {
  it("runs the editor's main with MeleeInitVictoryDefeat replaced by a no-op", () => {
    let victoryDefeat = 0;
    let editorMain = 0;
    globals.MeleeInitVictoryDefeat = () => {
      victoryDefeat++;
    };
    globals.main = () => {
      editorMain++;
      globals.MeleeInitVictoryDefeat?.();
    };
    globals.require("hello_bundle");
    globals.main();
    expect(editorMain).toEqual(1);
    expect(victoryDefeat).toEqual(0);
  });
});
