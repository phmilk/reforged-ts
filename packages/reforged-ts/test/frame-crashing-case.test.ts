/** @noSelfInFile */

// The Crashing case of `Frame.createType`: on 3.0.0.24268 the Nullability
// sweep crashed the game creating a SIMPLEMESSAGEFRAME or a CONTROL frame by
// type with `inherits: ""` (`docs/research/nullability-sweep.md`). In Dev
// mode the member raises for exactly that condition, at the calling line,
// before it calls the Native; a template, another type, or Dev mode off
// lets the call through to `BlzCreateFrameByType`.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Frame, Reforged } from "../src/index";
import { defined } from "./support/defined";
import { raisedIn } from "./support/raised-in";

// Dev mode raises for a Wrapper created before the globals Init stage.
__stub_init_globals();

function gameUi(): Frame {
  return defined(Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0), "the game UI");
}

/** How many times the call log shows `BlzCreateFrameByType` called. */
function nativeCalls(): number {
  return stubCalls().filter((line) => line.startsWith("BlzCreateFrameByType("))
    .length;
}

/** The message the Guard raises for a frame of `typeName` without a template. */
function crashing(typeName: string): string {
  return `reforged-ts: Frame.createType of a ${typeName} frame with inherits "" crashes the game (a Crashing case on 3.0.0.24268): inherit an FDF template that defines the type's fields`;
}

const crashingTypes = ["SIMPLEMESSAGEFRAME", "CONTROL"];

describe("Frame.createType's Crashing case in Dev mode", () => {
  for (const typeName of crashingTypes) {
    it(`raises for ${typeName} with inherits "", at the calling line, before the Native`, () => {
      Reforged.configure({ devMode: true });
      const owner = gameUi();
      const before = nativeCalls();
      expect(
        raisedIn(() => {
          Frame.createType("Crash", owner, 0, typeName, "");
        }),
      ).toEqual(crashing(typeName));
      expect(nativeCalls()).toEqual(before);
    });

    it(`creates a ${typeName} frame that inherits a template`, () => {
      Reforged.configure({ devMode: true });
      const frame = Frame.createType(
        "Templated",
        gameUi(),
        0,
        typeName,
        "MyTemplate",
      );
      expect(Frame.fromHandle(frame.handle)).toBe(frame);
    });
  }

  it('creates a frame of another type with inherits ""', () => {
    Reforged.configure({ devMode: true });
    const frame = Frame.createType("Backdrop", gameUi(), 0, "BACKDROP", "");
    expect(Frame.fromHandle(frame.handle)).toBe(frame);
  });
});

describe("Frame.createType's Crashing case with Dev mode off", () => {
  for (const typeName of crashingTypes) {
    it(`calls the Native for ${typeName} with inherits ""`, () => {
      Reforged.configure({ devMode: false });
      const before = nativeCalls();
      const frame = Frame.createType("Unguarded", gameUi(), 0, typeName, "");
      expect(nativeCalls()).toEqual(before + 1);
      expect(Frame.fromHandle(frame.handle)).toBe(frame);
    });
  }
});
