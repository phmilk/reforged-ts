/** @noSelfInFile */

// FogModifier on the Handle base: `create` and `fromRect` both allocate a
// fog modifier, so both follow the creation rule.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { FogModifier, MapPlayer, Rectangle } from "../src/index";
import { defined } from "./support/defined";
import { handleRef } from "./support/handle-ref";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

const player = defined(MapPlayer.fromIndex(1), "MapPlayer.fromIndex(1)");
const visible = defined(ConvertFogState(4), "ConvertFogState(4)");

describe("FogModifier.create", () => {
  it("wraps the handle CreateFogModifierRadius returns, and a lookup finds it", () => {
    const modifier = FogModifier.create(
      player,
      visible,
      32,
      -48,
      512,
      true,
      false,
    );
    expect(stubCalls()).toContainCall(
      `CreateFogModifierRadius(${handleRef("player", player.handle)}, ${handleRef("fogstate", visible)}, 32, -48, 512, true, false)`,
    );
    expect(FogModifier.fromHandle(modifier.handle)).toBe(modifier);
  });

  it("throws when CreateFogModifierRadius returns nil", () => {
    const message = withNative(
      "CreateFogModifierRadius",
      () => undefined,
      () =>
        raisedIn(() => {
          FogModifier.create(player, visible, 32, -48, 512, true, false);
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create FogModifier");
  });
});

describe("FogModifier.fromRect", () => {
  const where = Rectangle.create(0, 0, 256, 256);

  it("wraps the handle CreateFogModifierRect returns, and a lookup finds it", () => {
    const modifier = FogModifier.fromRect(player, visible, where, false, true);
    expect(stubCalls()).toContainCall(
      `CreateFogModifierRect(${handleRef("player", player.handle)}, ${handleRef("fogstate", visible)}, ${handleRef("rect", where.handle)}, false, true)`,
    );
    expect(FogModifier.fromHandle(modifier.handle)).toBe(modifier);
  });

  it("throws when CreateFogModifierRect returns nil", () => {
    const message = withNative(
      "CreateFogModifierRect",
      () => undefined,
      () =>
        raisedIn(() => {
          FogModifier.fromRect(player, visible, where, false, true);
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create FogModifier");
  });
});
