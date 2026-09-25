/** @noSelfInFile */

// The sync System across two simulated clients: every client runs the same
// code, so requests created in the same order get the same ids on every
// client, and one client's packets settle the request on all of them.

import { describe, expect, it } from "reforged-test/lua";
import type { SyncResponse } from "../src/index";
import { simulateClients } from "./support/clients";
import { defined } from "./support/defined";

declare const main: () => void;

// Client 0's local player is slot 0 and client 1's is slot 1.
const [first, second] = simulateClients(2);
const clients = [first, second];
for (const client of clients) {
  client.run(() => {
    main();
  });
}

describe("sync requests on two clients", () => {
  it("get the same ids when the clients create them in the same order", () => {
    const ids = clients.map((client) =>
      client.run(() => {
        const { MapPlayer, SyncRequest } = client.library;
        const sender = defined(
          MapPlayer.fromIndex(0),
          "MapPlayer.fromIndex(0)",
        );
        return [
          new SyncRequest(sender).id,
          new SyncRequest(sender).id,
          new SyncRequest(sender).id,
        ];
      }),
    );
    expect(ids[0]).toEqual(ids[1]);
  });

  it("resolve on every client with the sender's data and the sender", () => {
    const before = __stub_sync_packets().length;
    const responses: (SyncResponse | undefined)[] = [];
    clients.forEach((client, k) => {
      client.run(() => {
        const { MapPlayer, SyncRequest } = client.library;
        const sender = defined(
          MapPlayer.fromIndex(1),
          "MapPlayer.fromIndex(1)",
        );
        SyncRequest.send(sender, `measured on client ${String(k)}`).then(
          (response) => {
            responses[k] = response;
          },
          () => undefined,
        );
      });
    });
    const packets = __stub_sync_packets().slice(before);
    expect(packets.length).toEqual(1);
    expect(packets[0].from).toBe(defined(Player(1), "Player(1)"));
    expect(__stub_deliver_sync(packets[0])).toEqual(2);
    for (const k of [0, 1]) {
      const response = defined(responses[k], `client ${String(k)}'s response`);
      expect(response.data).toEqual("measured on client 1");
      expect(response.from.id).toEqual(1);
    }
  });
});
