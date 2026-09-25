/** @noSelfInFile */

// The sync System through its public API and the sync stubs: a request's
// packets are what `BlzSendSyncData` recorded, and the game's side is
// `__stub_deliver_sync`, which fires the library's sync Trigger with the
// packet as the event. A request settles through its `Promise`, observed
// with `then`; nothing here reads the pending requests or the chunks.
// The local player is slot 0, and slots 0 and 1 are the playing users.

// Keep this import ahead of the library's: the library wraps the entry
// points when it loads, and this file defines them.
import "./support/bundle-position";
import { describe, expect, it, stubCalls } from "reforged-test/lua";
import {
  base64Encode,
  MapPlayer,
  SyncRequest,
  type SyncResponse,
  SyncStatus,
} from "../src/index";
import { defined } from "./support/defined";
import { handleRef } from "./support/handle-ref";
import { withNative } from "./support/native-override";
import { withPrint } from "./support/print-capture";
import { raisedIn } from "./support/raised-in";

declare const InitGlobals: () => void;

// The sync Trigger and its events are created at the `globals` stage: run
// it, as `main` would.
InitGlobals();

const PREFIX = "rts";
const local = defined(MapPlayer.fromIndex(0), "MapPlayer.fromIndex(0)");
const other = defined(MapPlayer.fromIndex(1), "MapPlayer.fromIndex(1)");

/** How a request's `Promise` settled so far. */
interface Outcome {
  response?: SyncResponse;
  reason?: unknown;
}

function observe(promise: Promise<SyncResponse>): Outcome {
  const outcome: Outcome = {};
  promise.then(
    (response) => {
      outcome.response = response;
    },
    (reason: unknown) => {
      outcome.reason = reason;
    },
  );
  return outcome;
}

/** The packets `BlzSendSyncData` recorded while `body` ran. */
function sentBy(body: () => void): StubSyncPacket[] {
  const before = __stub_sync_packets().length;
  body();
  return __stub_sync_packets().slice(before);
}

/** The header of a packet, packed here rather than by the library. */
function header(id: number, index: number, count: number): string {
  return base64Encode(string.pack(">I2I2I2", id, index, count));
}

/** A packet as the game delivers it, from `from`. */
function packet(data: string, from: MapPlayer = local): StubSyncPacket {
  return { prefix: PREFIX, data, from: from.handle };
}

/** `length` bytes that differ from one position to the next. */
function bytes(length: number): string {
  const parts: string[] = [];
  for (let i = 0; i < length; i++) {
    parts.push(string.char(97 + (i % 26)));
  }
  return parts.join("");
}

describe("sending", () => {
  it("sends a short request as one packet: the 8-character header, then the raw data", () => {
    const request = new SyncRequest(local);
    const packets = sentBy(() => {
      observe(request.start("hello"));
    });
    expect(packets).toEqual([packet(`${header(request.id, 0, 1)}hello`)]);
    expect(header(request.id, 0, 1).length).toEqual(8);
  });

  it("sends no packet until start", () => {
    expect(
      sentBy(() => {
        new SyncRequest(local);
      }),
    ).toEqual([]);
  });

  it("sends empty data as chunk zero of one", () => {
    const request = new SyncRequest(local);
    const packets = sentBy(() => {
      observe(request.start(""));
    });
    expect(packets).toEqual([packet(header(request.id, 0, 1))]);
  });

  it("sends 244 bytes as one packet of 252 characters", () => {
    const request = new SyncRequest(local);
    const data = bytes(244);
    const packets = sentBy(() => {
      observe(request.start(data));
    });
    expect(packets).toEqual([packet(header(request.id, 0, 1) + data)]);
    expect(packets[0].data.length).toEqual(252);
  });

  it("sends a long request as one packet per 244 bytes, in order", () => {
    const request = new SyncRequest(local);
    const data = bytes(600);
    const packets = sentBy(() => {
      observe(request.start(data));
    });
    expect(packets).toEqual([
      packet(header(request.id, 0, 3) + string.sub(data, 1, 244)),
      packet(header(request.id, 1, 3) + string.sub(data, 245, 488)),
      packet(header(request.id, 2, 3) + string.sub(data, 489)),
    ]);
  });

  it("sends nothing from a client other than the sender's", () => {
    const request = new SyncRequest(other);
    const packets = sentBy(() => {
      observe(request.start("not mine"));
    });
    expect(packets).toEqual([]);
    expect(request.status).toEqual(SyncStatus.Syncing);
  });

  it("creates and starts a request with send", () => {
    let outcome: Outcome = {};
    const packets = sentBy(() => {
      outcome = observe(SyncRequest.send(local, "sent"));
    });
    expect(packets.length).toEqual(1);
    __stub_deliver_sync(packets[0]);
    const response = defined(outcome.response, "the response");
    expect(response.data).toEqual("sent");
    expect(response.request.status).toEqual(SyncStatus.Success);
  });
});

describe("receiving", () => {
  it("resolves with the data, the sender, the time and the request when the packets arrive shuffled", () => {
    const request = new SyncRequest(local);
    const data = bytes(1000);
    let outcome: Outcome = {};
    const packets = sentBy(() => {
      outcome = observe(request.start(data));
    });
    expect(packets.length).toEqual(5);
    for (const index of [3, 0, 4, 2]) {
      __stub_deliver_sync(packets[index]);
    }
    expect(outcome.response).toBeUndefined();
    expect(request.status).toEqual(SyncStatus.Syncing);
    __stub_deliver_sync(packets[1]);
    const response = defined(outcome.response, "the response");
    expect(response.data).toEqual(data);
    expect(response.from).toBe(local);
    expect(response.time).toEqual(0);
    expect(response.request).toBe(request);
    expect(request.status).toEqual(SyncStatus.Success);
  });

  it("keeps a three-byte character that straddles a chunk boundary", () => {
    const data = `${string.rep("a", 243)}€b`;
    let outcome: Outcome = {};
    const packets = sentBy(() => {
      outcome = observe(SyncRequest.send(local, data));
    });
    // The first chunk ends with the character's first byte.
    expect(string.byte(packets[0].data, -1)).toEqual(0xe2);
    for (const sent of packets) {
      __stub_deliver_sync(sent);
    }
    expect(defined(outcome.response, "the response").data).toEqual(data);
  });

  it("resolves a request from another client with that client's data and player", () => {
    const request = new SyncRequest(other);
    const outcome = observe(request.start("ignored here"));
    __stub_deliver_sync(packet(`${header(request.id, 0, 1)}theirs`, other));
    const response = defined(outcome.response, "the response");
    expect(response.data).toEqual("theirs");
    expect(response.from).toBe(other);
  });

  it("ignores a packet with a foreign prefix", () => {
    const request = new SyncRequest(local);
    let outcome: Outcome = {};
    const [sent] = sentBy(() => {
      outcome = observe(request.start("mine"));
    });
    const fired = __stub_deliver_sync({ ...sent, prefix: "other" });
    expect(fired).toEqual(0);
    expect(request.status).toEqual(SyncStatus.Syncing);
    __stub_deliver_sync(sent);
    expect(defined(outcome.response, "the response").data).toEqual("mine");
  });

  it("ignores a packet whose id has no pending request", () => {
    const request = new SyncRequest(local);
    let outcome: Outcome = {};
    const [sent] = sentBy(() => {
      outcome = observe(request.start("mine"));
    });
    const unknown = (request.id + 30000) % 0x10000;
    __stub_deliver_sync(packet(`${header(unknown, 0, 1)}forged`));
    expect(request.status).toEqual(SyncStatus.Syncing);
    __stub_deliver_sync(sent);
    // Delivered again, the packet's request has settled: ignored.
    __stub_deliver_sync(packet(`${header(request.id, 0, 1)}late`));
    expect(defined(outcome.response, "the response").data).toEqual("mine");
  });

  it("ignores a header that does not decode, a chunk index out of range and another sender", () => {
    const request = new SyncRequest(local);
    let outcome: Outcome = {};
    const [sent] = sentBy(() => {
      outcome = observe(request.start("mine"));
    });
    const corrupt = [
      packet(""),
      packet("short"),
      packet("!!!!!!!!forged"),
      packet(`${header(request.id, 0, 1).slice(0, 7)}=forged`),
      packet(`${header(request.id, 1, 1)}forged`),
      packet(`${header(request.id, 0, 0)}forged`),
      packet(`${header(request.id, 0, 1)}forged`, other),
    ];
    for (const forged of corrupt) {
      __stub_deliver_sync(forged);
    }
    expect(outcome.response).toBeUndefined();
    expect(request.status).toEqual(SyncStatus.Syncing);
    __stub_deliver_sync(sent);
    expect(defined(outcome.response, "the response").data).toEqual("mine");
  });

  it("ignores a chunk received twice and a chunk count that changed", () => {
    const request = new SyncRequest(local);
    let outcome: Outcome = {};
    const packets = sentBy(() => {
      outcome = observe(request.start(bytes(300)));
    });
    __stub_deliver_sync(packets[0]);
    __stub_deliver_sync(packets[0]);
    __stub_deliver_sync(packet(`${header(request.id, 1, 3)}forged`));
    expect(outcome.response).toBeUndefined();
    __stub_deliver_sync(packets[1]);
    expect(defined(outcome.response, "the response").data).toEqual(bytes(300));
  });
});

describe("request ids", () => {
  it("counts up by one per request created", () => {
    const first = new SyncRequest(local);
    const second = new SyncRequest(local);
    expect(second.id).toEqual((first.id + 1) % 0x10000);
  });

  it("wraps around after 65536 requests", () => {
    const first = new SyncRequest(local);
    for (let i = 1; i < 0x10000; i++) {
      new SyncRequest(local);
    }
    expect(new SyncRequest(local).id).toEqual(first.id);
  });
});

describe("settling", () => {
  it("throws on a second start, at the caller's line, naming the request id", () => {
    const request = new SyncRequest(local);
    observe(request.start("once"));
    expect(
      raisedIn(() => {
        void request.start("twice");
      }),
    ).toEqual(
      `reforged-ts: sync request ${String(request.id)} was already started`,
    );
  });

  it("rejects on cancel, naming the request id, and ignores its packets afterwards", () => {
    const request = new SyncRequest(local);
    let outcome: Outcome = {};
    const [sent] = sentBy(() => {
      outcome = observe(request.start("cancelled"));
    });
    request.cancel();
    expect(outcome.reason).toEqual(
      `reforged-ts: sync request ${String(request.id)} was cancelled`,
    );
    expect(request.status).toEqual(SyncStatus.Cancelled);
    __stub_deliver_sync(sent);
    expect(outcome.response).toBeUndefined();
    expect(request.status).toEqual(SyncStatus.Cancelled);
  });

  it("does nothing on cancel of a settled request or one not started", () => {
    let outcome: Outcome = {};
    const [sent] = sentBy(() => {
      outcome = observe(SyncRequest.send(local, "done"));
    });
    __stub_deliver_sync(sent);
    const response = defined(outcome.response, "the response");
    response.request.cancel();
    expect(response.request.status).toEqual(SyncStatus.Success);
    expect(outcome.reason).toBeUndefined();

    const idle = new SyncRequest(local);
    idle.cancel();
    expect(idle.status).toEqual(SyncStatus.None);
  });

  it("rejects with the timeout message when the timeout Timer fires", () => {
    const handle = CreateTimer();
    let outcome: Outcome = {};
    const request = new SyncRequest(other, { timeout: 5 });
    withNative(
      "CreateTimer",
      () => handle,
      () => {
        outcome = observe(request.start("never arrives"));
      },
    );
    expect(stubCalls()).toContainCall(
      `TimerStart(${handleRef("timer", handle)}, 5, false, <function>)`,
    );
    __stub_fire_timer(handle);
    expect(outcome.reason).toEqual(
      `reforged-ts: sync request ${String(request.id)} timed out after 5 seconds`,
    );
    expect(request.status).toEqual(SyncStatus.Timeout);
    expect(stubCalls()).toContainCall(
      `DestroyTimer(${handleRef("timer", handle)})`,
    );
  });

  it("destroys the timeout Timer when the request resolves", () => {
    const handle = CreateTimer();
    let outcome: Outcome = {};
    const packets = sentBy(() => {
      withNative(
        "CreateTimer",
        () => handle,
        () => {
          outcome = observe(SyncRequest.send(local, "in time", { timeout: 5 }));
        },
      );
    });
    __stub_deliver_sync(packets[0]);
    expect(defined(outcome.response, "the response").data).toEqual("in time");
    expect(stubCalls()).toContainCall(
      `DestroyTimer(${handleRef("timer", handle)})`,
    );
  });

  it("rejects with the network message when BlzSendSyncData returns false, sends no more and prints nothing", () => {
    const request = new SyncRequest(local);
    let outcome: Outcome = {};
    const before = stubCalls().length;
    const printed = withPrint(() => {
      withNative(
        "BlzSendSyncData",
        () => false,
        () => {
          outcome = observe(request.start(bytes(600)));
        },
      );
    });
    expect(printed).toEqual([]);
    expect(outcome.reason).toEqual(
      `reforged-ts: sync request ${String(request.id)} could not be sent (network error)`,
    );
    expect(request.status).toEqual(SyncStatus.NetworkError);
    const sends = stubCalls()
      .slice(before)
      .filter((line) => line.startsWith("BlzSendSyncData("));
    expect(sends.length).toEqual(1);
  });
});
