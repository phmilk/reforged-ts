/** @noSelfInFile */

// GameCache on the Handle base: `create` throws naming the campaign file,
// `fromHandle` returns undefined for nothing.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { GameCache } from "../src/index";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

describe("GameCache.create", () => {
  it("wraps the handle InitGameCache returns, and a lookup finds it", () => {
    const cache = GameCache.create("reforged.w3v");
    expect(stubCalls()).toContainCall('InitGameCache("reforged.w3v")');
    expect(GameCache.fromHandle(cache.handle)).toBe(cache);
  });

  it("keeps the campaign file it was created with", () => {
    const cache = GameCache.create("campaign.w3v");
    expect(cache.filename).toEqual("campaign.w3v");
  });

  it("throws naming the campaign file when InitGameCache returns nil", () => {
    const message = withNative(
      "InitGameCache",
      () => undefined,
      () =>
        raisedIn(() => {
          GameCache.create("reforged.w3v");
        }),
    );
    expect(message).toEqual(
      "reforged-ts: failed to create GameCache (reforged.w3v)",
    );
  });
});

describe("GameCache.fromHandle", () => {
  it("is undefined for an undefined Handle", () => {
    expect(GameCache.fromHandle(undefined)).toBeUndefined();
  });

  it("gives the same GameCache for two lookups of one Handle", () => {
    const handle = InitGameCache("lookup.w3v");
    const cache = GameCache.fromHandle(handle);
    expect(cache?.handle).toBe(handle);
    expect(GameCache.fromHandle(handle)).toBe(cache);
  });
});
