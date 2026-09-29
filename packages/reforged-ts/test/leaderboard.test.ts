/** @noSelfInFile */

// Leaderboard on the Handle base: creation throws, the player's leaderboard
// is a lookup.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Leaderboard, MapPlayer } from "../src/index";
import { defined } from "./support/defined";
import { handleRef } from "./support/handle-ref";
import { describeNatives, nativeCase } from "./support/native-cases";
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

// hasPlayerItem returns LeaderboardHasPlayerItem's answer (#259).
{
  const board = Leaderboard.create();
  const boardRef = handleRef("leaderboard", board.handle);
  // The Native's answer is stubbed: the players only tell the calls apart.
  const first = defined(MapPlayer.fromIndex(0), "player 0");
  const second = defined(MapPlayer.fromIndex(1), "player 1");

  describeNatives("Leaderboard.hasPlayerItem", [
    nativeCase({
      native: "LeaderboardHasPlayerItem",
      answer: () => true,
      member: () => board.hasPlayerItem(first),
      line: `LeaderboardHasPlayerItem(${boardRef}, ${handleRef("player", first.handle)})`,
      returns: true,
    }),
    nativeCase({
      native: "LeaderboardHasPlayerItem",
      answer: () => false,
      member: () => board.hasPlayerItem(second),
      line: `LeaderboardHasPlayerItem(${boardRef}, ${handleRef("player", second.handle)})`,
      returns: false,
    }),
  ]);
}
