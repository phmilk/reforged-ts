/** @noSelfInFile */

// Frame on the Handle base, with the one class-specific validity rule: the
// game hands back a frame whose handle id is 0 when it finds none (a name it
// does not know, a missing FDF definition), and that frame is never a
// Wrapper. Lookups return undefined for it; creations throw. In Dev mode
// `createType` refuses the Crashing case of the Nullability sweep before it
// calls `BlzCreateFrameByType`: a SIMPLEMESSAGEFRAME or a CONTROL frame with
// `inherits: ""` crashed the game on 3.0.0.24268
// (`docs/research/nullability-sweep.md`).

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Frame } from "../src/index";
import { Reforged } from "../src/reforged/index";
import { handleRef } from "./support/handle-ref";
import { describeNatives, nativeCase } from "./support/native-cases";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

// Dev mode raises for a Wrapper created before the globals Init stage.
__stub_init_globals();

/** The frames stub's "not found" frame, handle id 0 (stubs/frames.lua). */
declare function __stub_frame_not_found(): framehandle;

const notFound = __stub_frame_not_found();

/** How many times the call log shows the id of the "not found" frame read. */
function notFoundIdReads(): number {
  return stubCalls().filter((line) => line === "GetHandleId(framehandle#0)")
    .length;
}

/** A real frame to own the frames the tests create. */
function gameUi(): Frame {
  const frame = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0);
  if (frame === undefined) {
    error("the frames stub returned no origin frame");
  }
  return frame;
}

class MyFrame extends Frame {}

describe("Frame lookups of a frame the game found", () => {
  it("fromOrigin wraps the origin frame, the same object on a second lookup", () => {
    const frame = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0);
    expect(frame).toBeTruthy();
    expect(Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0)).toBe(frame);
    expect(Frame.fromHandle(frame?.handle)).toBe(frame);
  });

  it("fromName finds the frame created under that name and context", () => {
    const created = Frame.create("NamedFrame", gameUi(), 0, 3);
    expect(Frame.fromName("NamedFrame", 3)).toBe(created);
    expect(stubCalls()).toContainCall('BlzGetFrameByName("NamedFrame", 3)');
  });

  it("fromEvent wraps the triggering frame", () => {
    const created = Frame.create("EventFrame", gameUi(), 0, 0);
    const frame = withNative(
      "BlzGetTriggerFrame",
      () => created.handle,
      () => Frame.fromEvent(),
    );
    expect(frame).toBe(created);
  });

  it("getParent wraps the owner the frame was created with", () => {
    const owner = gameUi();
    const child = Frame.create("ParentedFrame", owner, 0, 0);
    expect(child.getParent()).toBe(owner);
  });

  it("getChild wraps the owner's child at that index", () => {
    const owner = Frame.create("ChildOwner", gameUi(), 0, 0);
    const first = Frame.createSimple("FirstChild", owner, 0);
    const second = Frame.createSimple("SecondChild", owner, 0);
    expect(owner.getChild(0)).toBe(first);
    expect(owner.getChild(1)).toBe(second);
    expect(stubCalls()).toContainCall(
      `BlzFrameGetChild(${handleRef("framehandle", owner.handle)}, 1)`,
    );
  });
});

describe("Frame lookups of the game's not-found frame (handle id 0)", () => {
  it("fromName is undefined for a name the game does not know", () => {
    expect(Frame.fromName("NoSuchFrame", 0)).toBeUndefined();
  });

  it("fromOrigin is undefined", () => {
    expect(
      withNative(
        "BlzGetOriginFrame",
        () => notFound,
        () => Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0),
      ),
    ).toBeUndefined();
  });

  it("fromEvent is undefined", () => {
    expect(
      withNative(
        "BlzGetTriggerFrame",
        () => notFound,
        () => Frame.fromEvent(),
      ),
    ).toBeUndefined();
  });

  it("getParent is undefined", () => {
    const frame = Frame.create("OrphanFrame", gameUi(), 0, 0);
    expect(
      withNative(
        "BlzFrameGetParent",
        () => notFound,
        () => frame.getParent(),
      ),
    ).toBeUndefined();
  });

  it("getChild is undefined", () => {
    const frame = Frame.create("ChildlessFrame", gameUi(), 0, 0);
    expect(
      withNative(
        "BlzFrameGetChild",
        () => notFound,
        () => frame.getChild(0),
      ),
    ).toBeUndefined();
  });

  it("fromHandle is undefined, for Frame and for a subclass", () => {
    expect(Frame.fromHandle(notFound)).toBeUndefined();
    expect(MyFrame.fromHandle(notFound)).toBeUndefined();
  });

  it("reads the id once per lookup and makes no Wrapper, twice over", () => {
    const before = notFoundIdReads();
    expect(Frame.fromName("StillMissing", 0)).toBeUndefined();
    expect(notFoundIdReads()).toEqual(before + 1);
    expect(Frame.fromName("StillMissing", 0)).toBeUndefined();
    expect(notFoundIdReads()).toEqual(before + 2);
  });

  it("leaves a real frame looked up afterwards unaffected", () => {
    expect(Frame.fromName("LateFrame", 0)).toBeUndefined();
    const created = Frame.create("LateFrame", gameUi(), 0, 0);
    const found = Frame.fromName("LateFrame", 0);
    expect(found).toBe(created);
    expect(found?.handle).toBe(created.handle);
    expect(Frame.fromName("LateFrame", 0)).toBe(found);
  });
});

describe("Frame lookups when the Native returns nil", () => {
  it("fromName is undefined", () => {
    expect(
      withNative(
        "BlzGetFrameByName",
        () => undefined,
        () => Frame.fromName("NilFrame", 0),
      ),
    ).toBeUndefined();
  });

  it("fromOrigin is undefined", () => {
    expect(
      withNative(
        "BlzGetOriginFrame",
        () => undefined,
        () => Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0),
      ),
    ).toBeUndefined();
  });

  it("fromEvent is undefined outside a frame event", () => {
    expect(Frame.fromEvent()).toBeUndefined();
  });

  it("getParent is undefined for a frame with no parent", () => {
    expect(gameUi().getParent()).toBeUndefined();
  });

  it("getChild is undefined past the last child", () => {
    const frame = Frame.create("NoChildren", gameUi(), 0, 0);
    expect(frame.getChild(0)).toBeUndefined();
  });

  it("fromHandle is undefined", () => {
    expect(Frame.fromHandle(undefined)).toBeUndefined();
  });
});

describe("Frame identity through the fromHandle override", () => {
  it("gives the same object for the same frame", () => {
    const frame = Frame.create("SameFrame", gameUi(), 0, 0);
    expect(Frame.fromHandle(frame.handle)).toBe(frame);
    expect(Frame.fromHandle(frame.handle)).toBe(Frame.fromHandle(frame.handle));
  });

  it("upgrades to a subclass asked for, which Frame lookups then return", () => {
    const frame = Frame.create("UpgradedFrame", gameUi(), 0, 0);
    const mine = MyFrame.fromHandle(frame.handle);
    expect(mine instanceof MyFrame).toBeTruthy();
    expect(mine?.handle).toBe(frame.handle);
    expect(Frame.fromHandle(frame.handle)).toBe(mine);
    expect(Frame.fromName("UpgradedFrame", 0)).toBe(mine);
  });
});

describe("Frame.create", () => {
  it("wraps the frame BlzCreateFrame returns, and a lookup finds it", () => {
    const owner = gameUi();
    const frame = Frame.create("CreatedFrame", owner, 1, 2);
    expect(stubCalls()).toContainCall(
      `BlzCreateFrame("CreatedFrame", ${handleRef("framehandle", owner.handle)}, 1, 2)`,
    );
    expect(Frame.fromHandle(frame.handle)).toBe(frame);
  });

  it("throws at the caller's line, naming the frame, for a missing FDF", () => {
    const owner = gameUi();
    const message = withNative(
      "BlzCreateFrame",
      () => notFound,
      () =>
        raisedIn(() => {
          Frame.create("MissingFdf", owner, 0, 0);
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Frame (MissingFdf)");
  });

  it("throws when BlzCreateFrame returns nil", () => {
    const owner = gameUi();
    const message = withNative(
      "BlzCreateFrame",
      () => undefined,
      () =>
        raisedIn(() => {
          Frame.create("NilFdf", owner, 0, 0);
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Frame (NilFdf)");
  });
});

describe("Frame.createSimple", () => {
  it("wraps the frame BlzCreateSimpleFrame returns, and a lookup finds it", () => {
    const owner = gameUi();
    const frame = Frame.createSimple("CreatedSimple", owner, 4);
    expect(stubCalls()).toContainCall(
      `BlzCreateSimpleFrame("CreatedSimple", ${handleRef("framehandle", owner.handle)}, 4)`,
    );
    expect(Frame.fromHandle(frame.handle)).toBe(frame);
  });

  it("throws at the caller's line, naming the frame, for a missing FDF", () => {
    const owner = gameUi();
    const message = withNative(
      "BlzCreateSimpleFrame",
      () => notFound,
      () =>
        raisedIn(() => {
          Frame.createSimple("MissingSimple", owner, 0);
        }),
    );
    expect(message).toEqual(
      "reforged-ts: failed to create Frame (MissingSimple)",
    );
  });

  it("throws when BlzCreateSimpleFrame returns nil", () => {
    const owner = gameUi();
    const message = withNative(
      "BlzCreateSimpleFrame",
      () => undefined,
      () =>
        raisedIn(() => {
          Frame.createSimple("NilSimple", owner, 0);
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Frame (NilSimple)");
  });
});

describe("Frame.createType", () => {
  it("wraps the frame BlzCreateFrameByType returns, and a lookup finds it", () => {
    const owner = gameUi();
    const frame = Frame.createType("CreatedType", owner, 5, "BACKDROP", "");
    expect(stubCalls()).toContainCall(
      `BlzCreateFrameByType("BACKDROP", "CreatedType", ${handleRef("framehandle", owner.handle)}, "", 5)`,
    );
    expect(Frame.fromHandle(frame.handle)).toBe(frame);
  });

  it("throws at the caller's line, naming the frame, for a missing FDF", () => {
    const owner = gameUi();
    const message = withNative(
      "BlzCreateFrameByType",
      () => notFound,
      () =>
        raisedIn(() => {
          Frame.createType("MissingType", owner, 0, "GLUEBUTTON", "NoSuch");
        }),
    );
    expect(message).toEqual(
      "reforged-ts: failed to create Frame (MissingType)",
    );
  });

  it("throws when BlzCreateFrameByType returns nil", () => {
    const owner = gameUi();
    const message = withNative(
      "BlzCreateFrameByType",
      () => undefined,
      () =>
        raisedIn(() => {
          Frame.createType("NilType", owner, 0, "GLUEBUTTON", "");
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Frame (NilType)");
  });
});

describe("Frame event reads", () => {
  it("getEventText reads the text of the frame event", () => {
    const text = withNative(
      "BlzGetTriggerFrameText",
      () => "typed",
      () => Frame.getEventText(),
    );
    expect(text).toEqual("typed");
  });
});

describe("Frame.setTextAreaAutoScroll", () => {
  it("passes the flag to BlzTextAreaFrameSetAutoScroll and returns the Frame", () => {
    const frame = gameUi();
    const returned = withNative(
      "BlzTextAreaFrameSetAutoScroll",
      () => undefined,
      () => frame.setTextAreaAutoScroll(true),
    );
    expect(returned).toBe(frame);
    expect(stubCalls()).toContainCall(
      `BlzTextAreaFrameSetAutoScroll(${handleRef("framehandle", frame.handle)}, true)`,
    );
  });
});

describe("Frame.setTextAlignment", () => {
  // The harness defines no textaligntype constant: sentinels the call log
  // renders by name, as it renders the game's constants.
  const middle = { __name: "TEXT_JUSTIFY_MIDDLE" } as unknown as textaligntype;
  const center = { __name: "TEXT_JUSTIFY_CENTER" } as unknown as textaligntype;

  it("passes both alignments to BlzFrameSetTextAlignment and returns the Frame", () => {
    const frame = gameUi();
    const returned = withNative(
      "BlzFrameSetTextAlignment",
      () => undefined,
      () => frame.setTextAlignment(middle, center),
    );
    expect(returned).toBe(frame);
    expect(stubCalls()).toContainCall(
      `BlzFrameSetTextAlignment(${handleRef("framehandle", frame.handle)}, TEXT_JUSTIFY_MIDDLE, TEXT_JUSTIFY_CENTER)`,
    );
  });
});

describe("Frame pixel conversions", () => {
  it("pixelToFrameX and pixelToFrameY are what their Natives answer", () => {
    const x = withNative(
      "BlzPixelToFrameX",
      () => 0.125,
      () => Frame.pixelToFrameX(240),
    );
    const y = withNative(
      "BlzPixelToFrameY",
      () => 0.25,
      () => Frame.pixelToFrameY(270),
    );
    expect([x, y]).toEqual([0.125, 0.25]);
    expect(stubCalls()).toContainCall("BlzPixelToFrameX(240)");
    expect(stubCalls()).toContainCall("BlzPixelToFrameY(270)");
  });

  it("frameToPixelX and frameToPixelY are what their Natives answer", () => {
    const x = withNative(
      "BlzFrameToPixelX",
      () => 1536,
      () => Frame.frameToPixelX(0.8),
    );
    const y = withNative(
      "BlzFrameToPixelY",
      () => 540,
      () => Frame.frameToPixelY(0.3),
    );
    expect([x, y]).toEqual([1536, 540]);
    expect(stubCalls()).toContainCall("BlzFrameToPixelX(0.8)");
    expect(stubCalls()).toContainCall("BlzFrameToPixelY(0.3)");
  });
});

/** How many times the call log shows `BlzCreateFrameByType` called. */
function createFrameByTypeCalls(): number {
  return stubCalls().filter((line) => line.startsWith("BlzCreateFrameByType("))
    .length;
}

/** The message the Guard raises for a frame of `typeName` without a template. */
function crashingMessage(typeName: string): string {
  return `reforged-ts: Frame.createType of a ${typeName} frame with inherits "" crashes the game (a Crashing case on 3.0.0.24268): inherit an FDF template that defines the type's fields`;
}

const crashingTypes = ["SIMPLEMESSAGEFRAME", "CONTROL"];

describe("Frame.createType's Crashing case in Dev mode", () => {
  for (const typeName of crashingTypes) {
    it(`raises for ${typeName} with inherits "", at the calling line, before the Native`, () => {
      const owner = gameUi();
      const before = createFrameByTypeCalls();
      Reforged.configure({ devMode: true });
      const message = raisedIn(() => {
        Frame.createType("Crash", owner, 0, typeName, "");
      });
      Reforged.configure({ devMode: false });

      expect(message).toEqual(crashingMessage(typeName));
      expect(createFrameByTypeCalls()).toEqual(before);
    });

    it(`creates a ${typeName} frame that inherits a template`, () => {
      const owner = gameUi();
      Reforged.configure({ devMode: true });
      const frame = Frame.createType(
        "Templated",
        owner,
        0,
        typeName,
        "MyTemplate",
      );
      Reforged.configure({ devMode: false });

      expect(Frame.fromHandle(frame.handle)).toBe(frame);
    });
  }

  it('creates a frame of another type with inherits ""', () => {
    const owner = gameUi();
    Reforged.configure({ devMode: true });
    const frame = Frame.createType("Backdrop", owner, 0, "BACKDROP", "");
    Reforged.configure({ devMode: false });

    expect(Frame.fromHandle(frame.handle)).toBe(frame);
  });
});

describe("Frame.createType's Crashing case with Dev mode off", () => {
  for (const typeName of crashingTypes) {
    it(`calls the Native for ${typeName} with inherits ""`, () => {
      Reforged.configure({ devMode: false });
      const before = createFrameByTypeCalls();
      const frame = Frame.createType("Unguarded", gameUi(), 0, typeName, "");

      expect(createFrameByTypeCalls()).toEqual(before + 1);
      expect(Frame.fromHandle(frame.handle)).toBe(frame);
    });
  }
});

{
  const frame = gameUi();
  const ref = handleRef("framehandle", frame.handle);

  describeNatives("Frame members", [
    nativeCase({
      native: "BlzFrameGetName",
      answer: () => "ConsoleUI",
      member: () => frame.name,
      line: `BlzFrameGetName(${ref})`,
      returns: "ConsoleUI",
    }),
  ]);

  describeNatives("Frame members when their Native answers nil", [
    nativeCase({
      native: "BlzFrameGetName",
      answer: () => undefined,
      member: () => frame.name,
      line: `BlzFrameGetName(${ref})`,
      returns: "",
    }),
  ]);
}
