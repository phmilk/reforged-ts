/** @noSelfInFile */

// Ubersplat on the Handle base: `create` throws naming the splat, and
// `fromHandle` returns undefined for nothing.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Ubersplat } from "../src/index";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

describe("Ubersplat.create", () => {
  it("wraps the handle CreateUbersplat returns, and a lookup finds it", () => {
    const splat = Ubersplat.create(
      16,
      32,
      "HMED",
      255,
      128,
      0,
      200,
      false,
      true,
    );
    expect(stubCalls()).toContainCall(
      'CreateUbersplat(16, 32, "HMED", 255, 128, 0, 200, false, true)',
    );
    expect(Ubersplat.fromHandle(splat.handle)).toBe(splat);
  });

  it("throws naming the splat when CreateUbersplat returns nil", () => {
    const message = withNative(
      "CreateUbersplat",
      () => undefined,
      () =>
        raisedIn(() => {
          Ubersplat.create(0, 0, "HMED", 255, 255, 255, 255, false, false);
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Ubersplat (HMED)");
  });
});

describe("Ubersplat.fromHandle", () => {
  it("is undefined for an undefined Handle", () => {
    expect(Ubersplat.fromHandle(undefined)).toBeUndefined();
  });

  it("gives the same Ubersplat for two lookups of one Handle", () => {
    const handle = CreateUbersplat(0, 0, "HMED", 0, 0, 0, 0, false, false);
    const splat = Ubersplat.fromHandle(handle);
    expect(splat?.handle).toBe(handle);
    expect(Ubersplat.fromHandle(handle)).toBe(splat);
  });
});
