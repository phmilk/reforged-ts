/** @noSelfInFile */

// Item on the Handle base: `create` throws naming the rawcode, `fromEvent`
// returns undefined when the game has no item to give.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Item } from "../src/index";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

const ration = FourCC("ratf");
const skin = FourCC("rde1");

describe("Item.create", () => {
  it("wraps the handle CreateItem returns, and a lookup finds it", () => {
    const item = Item.create(ration, 10, 20);
    expect(stubCalls()).toContainCall(`CreateItem(${String(ration)}, 10, 20)`);
    expect(Item.fromHandle(item.handle)).toBe(item);
  });

  it("creates with BlzCreateItemWithSkin when a skin is given", () => {
    const item = Item.create(ration, 10, 20, skin);
    expect(stubCalls()).toContainCall(
      `BlzCreateItemWithSkin(${String(ration)}, 10, 20, ${String(skin)})`,
    );
    expect(Item.fromHandle(item.handle)).toBe(item);
  });

  it("throws naming the rawcode when CreateItem returns nil", () => {
    const message = withNative(
      "CreateItem",
      () => undefined,
      () =>
        raisedIn(() => {
          Item.create(ration, 10, 20);
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Item (ratf)");
  });

  it("throws naming the rawcode when BlzCreateItemWithSkin returns nil", () => {
    const message = withNative(
      "BlzCreateItemWithSkin",
      () => undefined,
      () =>
        raisedIn(() => {
          Item.create(ration, 10, 20, skin);
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Item (ratf)");
  });
});

describe("Item.fromEvent", () => {
  it("is undefined when GetManipulatedItem returns nil", () => {
    expect(
      withNative(
        "GetManipulatedItem",
        () => undefined,
        () => Item.fromEvent(),
      ),
    ).toBeUndefined();
  });

  it("is the Wrapper of the item GetManipulatedItem returns", () => {
    const item = Item.create(ration, 0, 0);
    expect(
      withNative(
        "GetManipulatedItem",
        () => item.handle,
        () => Item.fromEvent(),
      ),
    ).toBe(item);
  });
});
