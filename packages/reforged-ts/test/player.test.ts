/** @noSelfInFile */

// MapPlayer on the Handle base: players are not created, so every factory is
// a lookup, except `fromLocal`, the documented non-null path (the Native
// never returns nothing, and the member throws should it ever do).

import { describe, expect, it } from "reforged-test/lua";
import { MapPlayer, tsGlobals } from "../src/index";
import { defined } from "./support/defined";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

/** A Map project's own player model, extending the library's Wrapper. */
class Contestant extends MapPlayer {
  public score = 0;
}

describe("MapPlayer.fromIndex", () => {
  it("is the object the Players global holds for the slot", () => {
    const player = MapPlayer.fromIndex(3);
    expect(player).toBe(tsGlobals.Players[3]);
    expect(player?.handle).toBe(Player(3));
  });

  it("is undefined for a slot Player returns nil for", () => {
    expect(
      withNative(
        "Player",
        () => undefined,
        () => MapPlayer.fromIndex(99),
      ),
    ).toBeUndefined();
  });
});

describe("MapPlayer.fromLocal", () => {
  it("is the player of slot 0 in the stubs, the Players entry", () => {
    const local = MapPlayer.fromLocal();
    expect(local).toBe(tsGlobals.Players[0]);
    expect(local.handle).toBe(GetLocalPlayer());
  });

  it("throws when GetLocalPlayer returns nil, never returning undefined", () => {
    const message = withNative(
      "GetLocalPlayer",
      () => undefined,
      () =>
        raisedIn(() => {
          MapPlayer.fromLocal();
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create MapPlayer");
  });
});

describe("MapPlayer event and enumeration lookups", () => {
  it("are undefined when their Native returns nil", () => {
    expect(
      withNative(
        "GetTriggerPlayer",
        () => undefined,
        () => MapPlayer.fromEvent(),
      ),
    ).toBeUndefined();
    expect(
      withNative(
        "GetEnumPlayer",
        () => undefined,
        () => MapPlayer.fromEnum(),
      ),
    ).toBeUndefined();
    expect(
      withNative(
        "GetFilterPlayer",
        () => undefined,
        () => MapPlayer.fromFilter(),
      ),
    ).toBeUndefined();
  });

  it("are the Players entry for the player their Native returns", () => {
    const handle = defined(Player(4), "Player(4)");
    const expected = tsGlobals.Players[4];
    expect(
      withNative(
        "GetTriggerPlayer",
        () => handle,
        () => MapPlayer.fromEvent(),
      ),
    ).toBe(expected);
    expect(
      withNative(
        "GetEnumPlayer",
        () => handle,
        () => MapPlayer.fromEnum(),
      ),
    ).toBe(expected);
    expect(
      withNative(
        "GetFilterPlayer",
        () => handle,
        () => MapPlayer.fromFilter(),
      ),
    ).toBe(expected);
  });
});

describe("a Map project subclass of MapPlayer", () => {
  it("gets its own instances from the inherited lookups", () => {
    const handle = defined(Player(7), "Player(7)");
    const contestant = defined(
      Contestant.fromHandle(handle),
      "Contestant.fromHandle",
    );
    expect(contestant instanceof Contestant).toEqual(true);
    expect(contestant.score).toEqual(0);
    expect(contestant.handle).toBe(handle);
    expect(contestant.id).toEqual(7);
    expect(Contestant.fromIndex(7)).toBe(contestant);
    expect(Contestant.fromIndex(6) instanceof Contestant).toEqual(true);
  });

  it("replaces the MapPlayer the Players global holds, as the upgrade rule says", () => {
    const contestant = Contestant.fromHandle(Player(8));
    expect(MapPlayer.fromIndex(8)).toBe(contestant);
    expect(tsGlobals.Players[8] === contestant).toEqual(false);
    expect(tsGlobals.Players[8]?.handle).toBe(defined(Player(8), "Player(8)"));
  });
});
