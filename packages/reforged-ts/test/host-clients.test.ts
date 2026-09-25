/** @noSelfInFile */

// The host System across simulated clients: every client measures its own
// lobby time between `config` and `MarkGameStarted`, the election makes each
// measurement known to every client through sync, and every client elects the
// same player. An election settles once per copy of the library, so each test
// has its own clients. Slot 2 is made a playing user here, beside the stubs'
// slots 0 and 1, so three clients answer. Nothing here reads the durations
// the System collected: the tests deliver the packets the clients sent, fire
// the election's Timer or its leave Trigger, and read the `Promise` and
// `Host.host`.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { type SimulatedClient, simulateClients } from "./support/clients";
import { defined } from "./support/defined";
import { globals } from "./support/editor-script";
import { handleRef } from "./support/handle-ref";
import { type StartedTimer, timersStarted } from "./support/timers-started";

declare const config: () => void;
declare const main: () => void;

// Slot 2 plays, for the whole file: the sync events are registered at the
// `globals` stage and the election reads the slots when it starts.
const slotState = GetPlayerSlotState;
const controller = GetPlayerController;
globals.GetPlayerSlotState = (whichPlayer: player) =>
  GetPlayerId(whichPlayer) === 2
    ? PLAYER_SLOT_STATE_PLAYING
    : slotState(whichPlayer);
globals.GetPlayerController = (whichPlayer: player) =>
  GetPlayerId(whichPlayer) === 2 ? MAP_CONTROL_USER : controller(whichPlayer);

// The clients of each test, loaded before any test runs.
const longest = simulateClients(3);
const tie = simulateClients(3);
const silent = simulateClients(3);
const leaver = simulateClients(3);
const nobody = simulateClients(1);
const late = simulateClients(1);

/** The election of the first test, which the second inspects. */
let first: Election | undefined;

/** How one client's election settled so far. */
interface Outcome {
  /** The slot of the elected player. */
  host?: number;
  reason?: unknown;
}

/** One election, as every client of a test ran it. */
interface Election {
  /** Each client's outcome, in client order. */
  readonly outcomes: Outcome[];
  /** The packets the clients sent, in client order. */
  readonly packets: StubSyncPacket[];
  /** The Timer each client's election started, in client order. */
  readonly timers: StartedTimer[];
  /** The Trigger each client's election created, in client order. */
  readonly triggers: trigger[];
}

/**
 * Runs `body` and returns the triggers `CreateTrigger` made meanwhile; the
 * stub still makes them.
 */
function triggersCreated(body: () => void): trigger[] {
  const create = CreateTrigger;
  const created: trigger[] = [];
  globals.CreateTrigger = () => {
    const whichTrigger = create();
    created.push(whichTrigger);
    return whichTrigger;
  };
  try {
    body();
  } finally {
    globals.CreateTrigger = create;
  }
  return created;
}

/**
 * Runs the game on every client: `config` at the client's `joined` clock,
 * `main`, `detectHost` with `options`, then `MarkGameStarted` at its
 * `started` clock. Returns what the election did on each client.
 */
function elect(
  clients: readonly SimulatedClient[],
  lobby: readonly (readonly [joined: number, started: number])[],
  options?: { readonly timeout?: number },
): Election {
  const outcomes: Outcome[] = [];
  const before = __stub_sync_packets().length;
  const timers: Election["timers"] = [];
  const triggers: trigger[] = [];
  clients.forEach((client, k) => {
    const [joinedAt, startedAt] = lobby[k];
    const outcome: Outcome = {};
    outcomes.push(outcome);
    client.clock = joinedAt;
    client.run(() => {
      config();
      main();
      client.library.Host.detectHost(options).then(
        (host) => {
          outcome.host = host.id;
        },
        (reason: unknown) => {
          outcome.reason = reason;
        },
      );
    });
    client.clock = startedAt;
    let started: StartedTimer[] = [];
    const created = triggersCreated(() => {
      started = timersStarted(() => {
        client.run(() => {
          MarkGameStarted();
        });
      });
    });
    triggers.push(...created);
    // The game-time Timer repeats; the election's does not.
    timers.push(...started.filter((timer) => !timer.periodic));
  });
  return {
    outcomes,
    packets: __stub_sync_packets().slice(before),
    timers,
    triggers,
  };
}

/** The slot each client's `Host.host` holds, undefined for none. */
function hosts(clients: readonly SimulatedClient[]): (number | undefined)[] {
  return clients.map((client) =>
    client.run(() => client.library.Host.host?.id),
  );
}

describe("Host.detectHost on three clients", () => {
  it("elects the player with the longest lobby time, the same on every client", () => {
    const election = elect(longest, [
      [1, 4],
      [2, 7],
      [0.5, 9.5],
    ]);
    expect(election.packets.length).toEqual(3);
    expect(election.outcomes).toEqual([{}, {}, {}]);
    expect(hosts(longest)).toEqual([undefined, undefined, undefined]);

    for (const k of [2, 0, 1]) {
      __stub_deliver_sync(election.packets[k]);
    }

    expect(election.outcomes).toEqual([{ host: 2 }, { host: 2 }, { host: 2 }]);
    expect(hosts(longest)).toEqual([2, 2, 2]);
    first = election;
  });

  it("destroys the election's Timer and Trigger once it settled", () => {
    const election = defined(first, "the first test's election");
    const calls = stubCalls();
    for (const { timer } of election.timers) {
      expect(calls).toContainCall(`DestroyTimer(${handleRef("timer", timer)})`);
    }
    for (const whichTrigger of election.triggers) {
      expect(calls).toContainCall(
        `DestroyTrigger(${handleRef("trigger", whichTrigger)})`,
      );
    }
  });

  it("breaks a tie by the lowest player index", () => {
    const election = elect(tie, [
      [2, 4],
      [1, 8],
      [3, 10],
    ]);
    for (const packet of election.packets) {
      __stub_deliver_sync(packet);
    }
    expect(election.outcomes).toEqual([{ host: 1 }, { host: 1 }, { host: 1 }]);
    expect(hosts(tie)).toEqual([1, 1, 1]);
  });

  it("drops a client that never answers when the timeout Timer fires, and still settles", () => {
    const election = elect(silent, [
      [1, 7],
      [1, 6],
      [1, 10],
    ]);
    expect(election.timers.map(({ timeout }) => timeout)).toEqual([10, 10, 10]);
    __stub_deliver_sync(election.packets[0]);
    __stub_deliver_sync(election.packets[1]);
    expect(election.outcomes).toEqual([{}, {}, {}]);

    for (const { timer } of election.timers) {
      __stub_fire_timer(timer);
    }

    expect(election.outcomes).toEqual([{ host: 0 }, { host: 0 }, { host: 0 }]);
    expect(hosts(silent)).toEqual([0, 0, 0]);
  });

  it("settles without the timeout when a player leaves before answering", () => {
    const election = elect(leaver, [
      [1, 7],
      [1, 6],
      [1, 10],
    ]);
    __stub_deliver_sync(election.packets[0]);
    __stub_deliver_sync(election.packets[1]);

    // Slot 2 left: the clients that remain see the leave event.
    const left = defined(Player(2), "Player(2)");
    for (const k of [0, 1]) {
      __stub_fire_trigger(election.triggers[k], { GetTriggerPlayer: left });
    }

    expect(election.outcomes.slice(0, 2)).toEqual([{ host: 0 }, { host: 0 }]);
    const calls = stubCalls();
    for (const k of [0, 1]) {
      expect(calls).toContainCall(
        `DestroyTimer(${handleRef("timer", election.timers[k].timer)})`,
      );
    }
  });
});

describe("Host.detectHost with nothing received", () => {
  it("takes the timeout from the options, and rejects when it fires with no lobby time", () => {
    const election = elect(nobody, [[1, 2]], { timeout: 3 });
    expect(election.timers.map(({ timeout }) => timeout)).toEqual([3]);

    __stub_fire_timer(election.timers[0].timer);

    expect(election.outcomes).toEqual([
      { reason: "reforged-ts: host detection received no lobby time" },
    ]);
    expect(hosts(nobody)).toEqual([undefined]);
  });
});

describe("Host.detectHost after the game started", () => {
  it("starts the election at the call: the game-start measurement was taken at the stage", () => {
    const [client] = late;
    client.clock = 1;
    client.run(() => {
      config();
      main();
    });
    client.clock = 4;
    const before = __stub_sync_packets().length;
    client.run(() => {
      MarkGameStarted();
    });
    expect(__stub_sync_packets().length).toEqual(before);

    client.clock = 30;
    client.run(() => {
      void client.library.Host.detectHost();
    });
    const packets = __stub_sync_packets().slice(before);
    expect(packets.length).toEqual(1);
    const payload = client.run(() =>
      client.library.base64Decode(string.sub(packets[0].data, 9)),
    );
    const [duration] = string.unpack(">f", payload);
    expect(duration).toEqual(3);
  });
});
