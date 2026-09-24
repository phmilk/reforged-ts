/** @noSelfInFile */

// Force on the Handle base: `create` and `fromPlayer` both allocate a force,
// so both follow the creation rule. `fromPlayer` builds the force from
// Natives (CreateForce, then ForceAddPlayer), not from Blizzard.j's
// GetForceOfPlayer.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Force, MapPlayer } from "../src/index";
import { defined } from "./support/defined";
import { handleRef } from "./support/handle-ref";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

/** The call-log lines written while `body` runs. */
function callsDuring(body: () => void): string[] {
  const before = stubCalls().length;
  body();
  return stubCalls().slice(before);
}

describe("Force.create", () => {
  it("wraps the handle CreateForce returns, and a lookup finds it", () => {
    const force = Force.create();
    expect(stubCalls()).toContainCall("CreateForce()");
    expect(Force.fromHandle(force.handle)).toBe(force);
  });

  it("throws when CreateForce returns nil", () => {
    const message = withNative(
      "CreateForce",
      () => undefined,
      () =>
        raisedIn(() => {
          Force.create();
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Force");
  });
});

describe("Force.fromPlayer", () => {
  const player = defined(MapPlayer.fromIndex(2), "MapPlayer.fromIndex(2)");

  it("creates a force with CreateForce and adds the player with ForceAddPlayer", () => {
    let force: Force | undefined;
    const calls = callsDuring(() => {
      force = Force.fromPlayer(player);
    });
    const created = defined(force, "Force.fromPlayer");
    expect(calls).toEqual([
      "CreateForce()",
      `ForceAddPlayer(${handleRef("force", created.handle)}, ${handleRef("player", player.handle)})`,
    ]);
    expect(Force.fromHandle(created.handle)).toBe(created);
  });

  it("creates a new force on every call", () => {
    const first = Force.fromPlayer(player);
    const second = Force.fromPlayer(player);
    expect(first === second).toEqual(false);
    expect(first.handle === second.handle).toEqual(false);
  });

  it("throws when CreateForce returns nil, adding no player", () => {
    let message = "";
    const calls = callsDuring(() => {
      message = withNative(
        "CreateForce",
        () => undefined,
        () =>
          raisedIn(() => {
            Force.fromPlayer(player);
          }),
      );
    });
    expect(message).toEqual("reforged-ts: failed to create Force");
    expect(calls).toEqual(["CreateForce()"]);
  });

  it("never calls GetForceOfPlayer", () => {
    const blizzard = stubCalls().filter((line) =>
      line.startsWith("GetForceOfPlayer("),
    );
    expect(blizzard).toEqual([]);
  });
});
