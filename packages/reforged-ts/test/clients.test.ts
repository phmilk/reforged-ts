/** @noSelfInFile */

import { describe, expect, it } from "reforged-test/lua";
import { simulateClients } from "./support/clients";
import { defined } from "./support/defined";

declare const main: () => void;

// Two clients, loaded before any test runs: client 0's local player is slot
// 0 and client 1's is slot 1, the two playing users of the stubs.
const [first, second] = simulateClients(2);
first.clock = 12.5;
second.clock = 40;
const clients = [first, second];

/** The local player's slot and the clock, as the code running now sees them. */
function observed(): [number, number] {
  return [GetPlayerId(GetLocalPlayer()), os.clock()];
}

describe("simulated clients", () => {
  it("loads one copy of the library per client", () => {
    expect(first.library === second.library).toEqual(false);
    expect(first.library.MapPlayer === second.library.MapPlayer).toEqual(false);
  });

  it("runs code as a client, with its own local player and clock", () => {
    expect(first.run(observed)).toEqual([0, 12.5]);
    expect(second.run(observed)).toEqual([1, 40]);
    expect(second.run(() => second.library.MapPlayer.fromLocal().id)).toEqual(
      1,
    );
    expect(observed()).toEqual([0, 0]);
  });

  it("keeps a clock the client's code set", () => {
    first.run(() => __stub_set_clock(13));
    expect(first.clock).toEqual(13);
    expect(os.clock()).toEqual(0);
    first.clock = 12.5;
  });

  it("runs each client's Init stages as that client and no other's", () => {
    const seen: [number, number][] = [];
    for (const client of clients) {
      client.run(() => {
        client.library.Init.onGlobals(() => {
          seen.push(observed());
        });
        main();
      });
    }
    expect(seen).toEqual([
      [0, 12.5],
      [1, 40],
    ]);
  });

  it("records a packet sent as a client with that client's local player", () => {
    second.run(() => BlzSendSyncData("clients", "from second"));
    const packets = __stub_sync_packets();
    expect(packets[packets.length - 1]).toEqual({
      prefix: "clients",
      data: "from second",
      from: defined(Player(1), "Player(1)"),
    });
  });

  it("runs every client's handler on one delivery, each as its client", () => {
    const seen: [number, number, number, string | undefined][] = [];
    for (const client of clients) {
      client.run(() => {
        const { MapPlayer, Trigger } = client.library;
        const trigger = Trigger.create();
        trigger.registerPlayerSyncEvent(
          defined(MapPlayer.fromIndex(0), "MapPlayer.fromIndex(0)"),
          "clients",
          false,
        );
        trigger.addAction(() => {
          seen.push([client.player, ...observed(), BlzGetTriggerSyncData()]);
        });
      });
    }
    const fired = __stub_deliver_sync({
      prefix: "clients",
      data: "hello",
      from: defined(Player(0), "Player(0)"),
    });
    expect(fired).toEqual(2);
    expect(seen).toEqual([
      [0, 0, 12.5, "hello"],
      [1, 1, 40, "hello"],
    ]);
  });

  it("runs a timer's handler as the client that started it", () => {
    let seen: [number, number] | undefined;
    const timer = second.run(() => {
      const created = second.library.Timer.create();
      created.start(1, false, () => {
        seen = observed();
      });
      return created;
    });
    __stub_fire_timer(timer.handle);
    expect(seen).toEqual([1, 40]);
  });
});
