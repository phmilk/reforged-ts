/** @noSelfInFile */

// TextTag on the Handle base: `create` throws, `fromHandle` returns
// undefined for nothing.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { TextTag } from "../src/index";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

describe("TextTag.create", () => {
  it("wraps the handle CreateTextTag returns, and a lookup finds it", () => {
    const tag = TextTag.create();
    expect(stubCalls()).toContainCall("CreateTextTag()");
    expect(TextTag.fromHandle(tag.handle)).toBe(tag);
  });

  it("throws when CreateTextTag returns nil", () => {
    const message = withNative(
      "CreateTextTag",
      () => undefined,
      () =>
        raisedIn(() => {
          TextTag.create();
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create TextTag");
  });
});

describe("TextTag.fromHandle", () => {
  it("is undefined for an undefined Handle", () => {
    expect(TextTag.fromHandle(undefined)).toBeUndefined();
  });

  it("gives the same TextTag for two lookups of one Handle", () => {
    const handle = CreateTextTag();
    const tag = TextTag.fromHandle(handle);
    expect(tag?.handle).toBe(handle);
    expect(TextTag.fromHandle(handle)).toBe(tag);
  });
});
