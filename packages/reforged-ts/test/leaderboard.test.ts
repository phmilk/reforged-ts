/** @noSelfInFile */

// Leaderboard on the Handle base: creation throws, the player's leaderboard
// is a lookup.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Leaderboard, MapPlayer } from "../src/index";
import { defined } from "./support/defined";
import { handleRef } from "./support/handle-ref";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

describe("Leaderboard", () => {
  it("is the same object for its handle", () => {
    const board = Leaderboard.create();
    expect(Leaderboard.fromHandle(board.handle)).toBe(board);
    expect(Leaderboard.fromHandle(undefined)).toBeUndefined();
  });
});

describe("Leaderboard.create", () => {
  it("wraps the handle CreateLeaderboard returns, and a lookup finds it", () => {
    const board = Leaderboard.create();
    expect(stubCalls()).toContainCall("CreateLeaderboard()");
    expect(Leaderboard.fromHandle(board.handle)).toBe(board);
  });

  it("throws when CreateLeaderboard returns nil", () => {
    const message = withNative(
      "CreateLeaderboard",
      () => undefined,
      () =>
        raisedIn(() => {
          Leaderboard.create();
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Leaderboard");
  });
});

describe("Leaderboard.fromPlayer", () => {
  const player = defined(MapPlayer.fromIndex(0), "player 0");

  it("is undefined when PlayerGetLeaderboard returns nil", () => {
    const board = withNative(
      "PlayerGetLeaderboard",
      () => undefined,
      () => Leaderboard.fromPlayer(player),
    );
    expect(board).toBeUndefined();
    expect(stubCalls()).toContainCall(
      `PlayerGetLeaderboard(${handleRef("player", player.handle)})`,
    );
  });

  it("wraps the player's leaderboard, the same object a lookup finds", () => {
    const handle = CreateLeaderboard();
    const board = withNative(
      "PlayerGetLeaderboard",
      () => handle,
      () => Leaderboard.fromPlayer(player),
    );
    expect(board?.handle).toBe(handle);
    expect(Leaderboard.fromHandle(handle)).toBe(board);
  });
});
