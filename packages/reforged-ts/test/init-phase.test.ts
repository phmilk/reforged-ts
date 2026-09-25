/** @noSelfInFile */

// Init-phase creation: in Dev mode the base's creation step raises for a
// Wrapper created before the globals Init stage was entered, naming
// `Init.onGlobals`; with Dev mode off it never does. The file's Lua state
// starts before the stage, so the cases run in order: before the stage, in
// an `Init.onGlobals` callback (which enters it), after it.

import { describe, expect, it } from "reforged-test/lua";
import { Init, Timer } from "../src/index";
import { Reforged } from "../src/reforged/index";
import { raisedIn } from "./support/raised-in";

const tooEarly =
  "reforged-ts: Timer created before the globals Init stage: create Handles in Init.onGlobals or a later stage, not at module top level";

describe("Init-phase creation, before the globals stage", () => {
  it("raises naming Init.onGlobals in Dev mode, at the calling line", () => {
    Reforged.configure({ devMode: true });

    expect(
      raisedIn(() => {
        Timer.create();
      }),
    ).toEqual(tooEarly);
  });

  it("succeeds with Dev mode off", () => {
    Reforged.configure({ devMode: false });

    expect(Timer.create() instanceof Timer).toEqual(true);
  });
});

describe("Init-phase creation, in an Init.onGlobals callback", () => {
  it("passes in Dev mode", () => {
    Reforged.configure({ devMode: true });
    let created: Timer | undefined;
    let failure: string | undefined;
    Init.onGlobals(() => {
      const [ok, raised] = pcall(() => Timer.create());
      if (ok) {
        created = raised;
      } else {
        failure = tostring(raised);
      }
    });

    __stub_init_globals();

    expect(failure).toBeUndefined();
    expect(created instanceof Timer).toEqual(true);
  });
});

describe("Init-phase creation, after the globals stage", () => {
  for (const devMode of [false, true]) {
    it(`succeeds ${devMode ? "in Dev mode" : "in release"}`, () => {
      Reforged.configure({ devMode });

      expect(Timer.create() instanceof Timer).toEqual(true);
    });
  }
});
