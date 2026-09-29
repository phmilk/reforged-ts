/** @noSelfInFile */

// GameCache on the Handle base: `create` throws naming the campaign file,
// `fromHandle` returns undefined for nothing. `restoreUnit` is a creation of
// a Unit, and `store` takes a Unit.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { GameCache, MapPlayer, Unit } from "../src/index";
import { defined } from "./support/defined";
import { handleRef } from "./support/handle-ref";
import { describeNatives, nativeCase } from "./support/native-cases";
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

describe("GameCache.restoreUnit", () => {
  const owner = defined(MapPlayer.fromIndex(0), "MapPlayer.fromIndex(0)");
  const footman = FourCC("hfoo");

  it("wraps the unit RestoreUnit creates, and a lookup finds it", () => {
    const cache = GameCache.create("restore.w3v");
    const created = defined(
      CreateUnit(owner.handle, footman, 0, 0, 0),
      "CreateUnit",
    );
    const unit = withNative(
      "RestoreUnit",
      () => created,
      () => cache.restoreUnit("mission", "hero", owner, 10, 20, 270),
    );
    expect(unit.handle).toBe(created);
    expect(Unit.fromHandle(created)).toBe(unit);
    expect(stubCalls()).toContainCall(
      `RestoreUnit(${handleRef("gamecache", cache.handle)}, "mission", "hero", ${handleRef("player", owner.handle)}, 10, 20, 270)`,
    );
  });

  it("throws naming the key when RestoreUnit returns nil", () => {
    const cache = GameCache.create("restore.w3v");
    const message = withNative(
      "RestoreUnit",
      () => undefined,
      () =>
        raisedIn(() => {
          cache.restoreUnit("mission", "hero", owner, 0, 0, 0);
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Unit (hero)");
  });
});

describe("GameCache.store", () => {
  it("passes a Unit's Handle to StoreUnit", () => {
    const cache = GameCache.create("store.w3v");
    const owner = defined(MapPlayer.fromIndex(0), "MapPlayer.fromIndex(0)");
    const unit = Unit.create(owner, FourCC("hfoo"), 0, 0);
    withNative(
      "StoreUnit",
      () => undefined,
      () => {
        cache.store("mission", "hero", unit);
      },
    );
    expect(stubCalls()).toContainCall(
      `StoreUnit(${handleRef("gamecache", cache.handle)}, "mission", "hero", ${handleRef("unit", unit.handle)})`,
    );
  });
});

{
  const cache = GameCache.create("members.w3v");
  const ref = handleRef("gamecache", cache.handle);

  describeNatives("GameCache members", [
    nativeCase({
      native: "StoreInteger",
      answer: () => undefined,
      member: () => {
        cache.storeInteger("mission", "gold", 250);
      },
      line: `StoreInteger(${ref}, "mission", "gold", 250)`,
    }),
    nativeCase({
      native: "HaveStoredUnit",
      answer: () => true,
      member: () => cache.hasUnit("mission", "hero"),
      line: `HaveStoredUnit(${ref}, "mission", "hero")`,
      returns: true,
    }),
    nativeCase({
      native: "FlushStoredReal",
      answer: () => undefined,
      member: () => {
        cache.flushNumber("mission", "ratio");
      },
      line: `FlushStoredReal(${ref}, "mission", "ratio")`,
    }),
  ]);
}
