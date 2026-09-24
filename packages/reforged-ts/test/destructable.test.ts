/** @noSelfInFile */

// Destructable on the Handle base: `create` and `createZ` keep their shape
// (step 7 reshapes them) and throw naming the rawcode; `skin` is set at
// creation; `fromEvent` returns undefined when the game has nothing to give.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Destructable } from "../src/index";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

const tree = FourCC("LTlt");
const skin = FourCC("ATtr");

describe("Destructable.create", () => {
  it("wraps the handle CreateDestructable returns, with the default facing, scale and variation", () => {
    const destructable = Destructable.create(tree, 1, 2);
    expect(stubCalls()).toContainCall(
      `CreateDestructable(${String(tree)}, 1, 2, 0, 1, 0)`,
    );
    expect(destructable.skin).toBeUndefined();
    expect(Destructable.fromHandle(destructable.handle)).toBe(destructable);
  });

  it("creates with BlzCreateDestructableWithSkin and keeps the skin when one is given", () => {
    const destructable = Destructable.create(tree, 1, 2, 90, 2, 3, skin);
    expect(stubCalls()).toContainCall(
      `BlzCreateDestructableWithSkin(${String(tree)}, 1, 2, 90, 2, 3, ${String(skin)})`,
    );
    expect(destructable.skin).toEqual(skin);
    expect(Destructable.fromHandle(destructable.handle)).toBe(destructable);
  });

  it("throws naming the rawcode when CreateDestructable returns nil", () => {
    const message = withNative(
      "CreateDestructable",
      () => undefined,
      () =>
        raisedIn(() => {
          Destructable.create(tree, 1, 2);
        }),
    );
    expect(message).toEqual(
      "reforged-ts: failed to create Destructable (LTlt)",
    );
  });

  it("throws naming the rawcode when BlzCreateDestructableWithSkin returns nil", () => {
    const message = withNative(
      "BlzCreateDestructableWithSkin",
      () => undefined,
      () =>
        raisedIn(() => {
          Destructable.create(tree, 1, 2, 0, 1, 0, skin);
        }),
    );
    expect(message).toEqual(
      "reforged-ts: failed to create Destructable (LTlt)",
    );
  });
});

describe("Destructable.createZ", () => {
  it("wraps the handle CreateDestructableZ returns", () => {
    const destructable = Destructable.createZ(tree, 1, 2, 3);
    expect(stubCalls()).toContainCall(
      `CreateDestructableZ(${String(tree)}, 1, 2, 3, 0, 1, 0)`,
    );
    expect(destructable.skin).toBeUndefined();
    expect(Destructable.fromHandle(destructable.handle)).toBe(destructable);
  });

  it("creates with BlzCreateDestructableZWithSkin and keeps the skin when one is given", () => {
    const destructable = Destructable.createZ(tree, 1, 2, 3, 90, 2, 3, skin);
    expect(stubCalls()).toContainCall(
      `BlzCreateDestructableZWithSkin(${String(tree)}, 1, 2, 3, 90, 2, 3, ${String(skin)})`,
    );
    expect(destructable.skin).toEqual(skin);
    expect(Destructable.fromHandle(destructable.handle)).toBe(destructable);
  });

  it("throws naming the rawcode when CreateDestructableZ returns nil", () => {
    const message = withNative(
      "CreateDestructableZ",
      () => undefined,
      () =>
        raisedIn(() => {
          Destructable.createZ(tree, 1, 2, 3);
        }),
    );
    expect(message).toEqual(
      "reforged-ts: failed to create Destructable (LTlt)",
    );
  });

  it("throws naming the rawcode when BlzCreateDestructableZWithSkin returns nil", () => {
    const message = withNative(
      "BlzCreateDestructableZWithSkin",
      () => undefined,
      () =>
        raisedIn(() => {
          Destructable.createZ(tree, 1, 2, 3, 0, 1, 0, skin);
        }),
    );
    expect(message).toEqual(
      "reforged-ts: failed to create Destructable (LTlt)",
    );
  });
});

describe("Destructable.fromEvent", () => {
  it("is undefined when GetTriggerDestructable returns nil", () => {
    expect(
      withNative(
        "GetTriggerDestructable",
        () => undefined,
        () => Destructable.fromEvent(),
      ),
    ).toBeUndefined();
  });

  it("is the Wrapper of the destructable GetTriggerDestructable returns", () => {
    const destructable = Destructable.create(tree, 0, 0);
    expect(
      withNative(
        "GetTriggerDestructable",
        () => destructable.handle,
        () => Destructable.fromEvent(),
      ),
    ).toBe(destructable);
  });
});
