/** @noSelfInFile */

// Multiboard and MultiboardItem on the Handle base: MultiboardGetItem
// allocates an item per call, so MultiboardItem.create and
// multiboard.createItem follow the creation rule; MultiboardItem.fromHandle
// is a lookup like every other.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Multiboard, MultiboardItem } from "../src/index";
import { handleRef } from "./support/handle-ref";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

describe("Multiboard", () => {
  it("is the same object for its handle", () => {
    const board = Multiboard.create();
    expect(Multiboard.fromHandle(board.handle)).toBe(board);
    expect(Multiboard.fromHandle(undefined)).toBeUndefined();
  });
});

describe("Multiboard.create", () => {
  it("wraps the handle CreateMultiboard returns, and a lookup finds it", () => {
    const board = Multiboard.create();
    expect(stubCalls()).toContainCall("CreateMultiboard()");
    expect(Multiboard.fromHandle(board.handle)).toBe(board);
  });

  it("throws when CreateMultiboard returns nil", () => {
    const message = withNative(
      "CreateMultiboard",
      () => undefined,
      () =>
        raisedIn(() => {
          Multiboard.create();
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Multiboard");
  });
});

describe("MultiboardItem", () => {
  it("is the same object for its handle", () => {
    const item = MultiboardItem.create(Multiboard.create(), 1, 1);
    expect(MultiboardItem.fromHandle(item.handle)).toBe(item);
  });

  it("is undefined for an undefined handle", () => {
    expect(MultiboardItem.fromHandle(undefined)).toBeUndefined();
  });
});

describe("MultiboardItem.create", () => {
  const board = Multiboard.create();

  it("wraps the handle MultiboardGetItem returns, and a lookup finds it", () => {
    const item = MultiboardItem.create(board, 2, 3);
    expect(stubCalls()).toContainCall(
      `MultiboardGetItem(${handleRef("multiboard", board.handle)}, 1, 2)`,
    );
    expect(MultiboardItem.fromHandle(item.handle)).toBe(item);
  });

  it("throws when MultiboardGetItem returns nil", () => {
    const message = withNative(
      "MultiboardGetItem",
      () => undefined,
      () =>
        raisedIn(() => {
          MultiboardItem.create(board, 2, 3);
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create MultiboardItem");
  });
});

describe("multiboard.createItem", () => {
  const board = Multiboard.create();

  it("wraps the handle MultiboardGetItem returns, and a lookup finds it", () => {
    const item = board.createItem(2, 3);
    expect(stubCalls()).toContainCall(
      `MultiboardGetItem(${handleRef("multiboard", board.handle)}, 1, 2)`,
    );
    expect(MultiboardItem.fromHandle(item.handle)).toBe(item);
  });

  it("throws when MultiboardGetItem returns nil", () => {
    const message = withNative(
      "MultiboardGetItem",
      () => undefined,
      () =>
        raisedIn(() => {
          board.createItem(2, 3);
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create MultiboardItem");
  });
});
