/** @noSelfInFile */

import { Players } from "../globals/index";
import { MapPlayer } from "../handles/player";
import { Timer } from "../handles/timer";
import { Trigger } from "../handles/trigger";
import { onEntryPoint } from "../init/entry-points";
import { onStage } from "../init/stages";
import { base64Decode, base64Encode } from "./base64";
import { BinaryReader } from "./binaryreader";
import { BinaryWriter } from "./binarywriter";
import { isPlayingUser } from "./playing-user";
import { type SyncResponse, SyncRequest } from "./sync";

/** The seconds an election waits for the lobby times by default. */
const DEFAULT_TIMEOUT = 10;

/** The options of the host election. */
export interface HostOptions {
  /**
   * Seconds from the start of the election before it settles with the lobby
   * times received; ten by default, zero never.
   */
  readonly timeout?: number;
}

/** The type of `Host`: the election and its result. */
export interface HostDetection {
  /**
   * Elects the host, once: every call returns the same `Promise`, and only
   * the first call's options count. The election starts at the `gameStart`
   * stage, or at the call when the game already started. Call it on every
   * client, in the same order relative to the other sync requests, as
   * `SyncRequest` requires.
   * @param options The timeout; ten seconds by default.
   * @returns A `Promise` that resolves with the elected player, the same on
   * every client, and rejects only when no lobby time arrived.
   */
  detectHost(options?: HostOptions): Promise<MapPlayer>;
  /** The elected player: undefined until the election resolved. */
  readonly host: MapPlayer | undefined;
}

/** The `os.clock` of this client when `config` ran: undefined until it ran. */
let joinedAt: number | undefined;

/** The `os.clock` of this client at the `gameStart` stage. */
let startedAt = 0;

let election: Promise<MapPlayer> | undefined;

let elected: MapPlayer | undefined;

/**
 * This client's lobby time, packed as a float and base64-encoded: zero when
 * `config` never ran.
 */
function encodedLobbyTime(): string {
  const writer = new BinaryWriter();
  writer.writeFloat(startedAt - (joinedAt ?? startedAt));
  return base64Encode(writer.toString());
}

/**
 * The election: a sync request per playing user, in slot order, a Trigger
 * for their leave events and a Timer for the timeout, all made at the
 * `gameStart` stage, or at once when it already ran. Every client runs the
 * same election over the same events, so every client settles at the same
 * moment with the same lobby times.
 */
class Election {
  /** Resolves with the elected player; rejects when no lobby time arrived. */
  public readonly promise: Promise<MapPlayer>;

  /** The slots of the playing users, in order. */
  private readonly slots: number[] = [];

  /** The lobby times received, by slot. */
  private readonly times = new LuaMap<number, number>();

  /** The requests of the players who have neither answered nor left, by slot. */
  private readonly waiting = new LuaMap<number, SyncRequest>();

  private waitingCount = 0;

  private leaveTrigger?: Trigger;

  private timer?: Timer;

  private settled = false;

  private resolve?: (host: MapPlayer) => void;

  private reject?: (reason: string) => void;

  /** @param timeout Seconds before the election settles; zero, never. */
  public constructor(timeout: number) {
    this.promise = new Promise<MapPlayer>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
    onStage(
      "gameStart",
      "library",
      () => {
        this.start(timeout);
      },
      "host election",
    );
  }

  /** Starts the requests, the leave events and the timeout, if any. */
  private start(timeout: number): void {
    const data = encodedLobbyTime();
    const leaveTrigger = Trigger.create();
    this.leaveTrigger = leaveTrigger;
    for (let slot = 0; slot < bj_MAX_PLAYERS; slot++) {
      const player = Players[slot];
      if (isPlayingUser(player)) {
        this.slots.push(slot);
        this.waiting.set(slot, new SyncRequest(player));
        this.waitingCount++;
        leaveTrigger.registerPlayerEvent(player, EVENT_PLAYER_LEAVE);
      }
    }
    leaveTrigger.addAction(() => {
      const player = MapPlayer.fromEvent();
      if (player) {
        this.leave(player.id);
      }
    });
    for (const slot of this.slots) {
      // A rejection is a cancellation by this election, or a network error
      // on the sender's client alone: the timeout drops that player on every
      // client at once.
      this.waiting
        .get(slot)
        ?.start(data)
        .then(
          (response) => {
            this.receive(response);
          },
          () => undefined,
        );
    }
    if (timeout > 0) {
      this.timer = Timer.create().start(timeout, false, () => {
        this.settle();
      });
    }
    this.settleIfComplete();
  }

  /** Stores the sender's lobby time. */
  private receive(response: SyncResponse): void {
    const slot = response.from.id;
    if (!this.stopWaiting(slot)) {
      return;
    }
    const reader = new BinaryReader(base64Decode(response.data));
    this.times.set(slot, reader.readFloat());
    this.settleIfComplete();
  }

  /** Stops waiting for the player in `slot`, who left. */
  private leave(slot: number): void {
    this.waiting.get(slot)?.cancel();
    if (this.stopWaiting(slot)) {
      this.settleIfComplete();
    }
  }

  /** Whether the election was waiting for `slot`, which it no longer does. */
  private stopWaiting(slot: number): boolean {
    if (!this.waiting.has(slot)) {
      return false;
    }
    this.waiting.delete(slot);
    this.waitingCount--;
    return true;
  }

  private settleIfComplete(): void {
    if (this.waitingCount === 0) {
      this.settle();
    }
  }

  /**
   * Elects the player with the longest lobby time, the lowest slot on a tie,
   * among those received, or rejects when none was. The requests still
   * waiting are cancelled.
   */
  private settle(): void {
    if (this.settled) {
      return;
    }
    this.settled = true;
    this.timer?.destroy();
    this.leaveTrigger?.destroy();

    let host: MapPlayer | undefined;
    let longest = 0;
    for (const slot of this.slots) {
      this.waiting.get(slot)?.cancel();
      const time = this.times.get(slot);
      if (time !== undefined && (host === undefined || time > longest)) {
        host = Players[slot];
        longest = time;
      }
    }
    if (host) {
      elected = host;
      this.resolve?.(host);
    } else {
      this.reject?.("reforged-ts: host detection received no lobby time");
    }
  }
}

class HostObject implements HostDetection {
  public get host(): MapPlayer | undefined {
    return elected;
  }

  public detectHost(options: HostOptions = {}): Promise<MapPlayer> {
    election ??= new Election(options.timeout ?? DEFAULT_TIMEOUT).promise;
    return election;
  }
}

/**
 * Elects one player as the host, the same on every client, so a Map project
 * can give one player a role without desyncing.
 *
 * The heuristic: the host created the lobby, so the host's client has sat in
 * the lobby the longest. Each client measures its own lobby time with
 * `os.clock`, from `config` to the `gameStart` stage, and the election makes
 * every measurement known to every client through `SyncRequest`, a local,
 * asynchronous value made shared through sync (#15, D6 and D9). The longest
 * time wins and a tie goes to the lowest player index. A player who leaves
 * before answering is dropped at the leave event; the timeout settles the
 * election with the times received so far.
 *
 * It assumes that `config` runs once per client when the map loads in the
 * lobby and `main` at the game start, and that `os.clock` grows with wall
 * time while the client sits in the lobby. Neither assumption was measured by
 * the probe map (#9), so the heuristic is unverified: its verification in the
 * game is a human step, tracked in its own ticket.
 *
 * @example
 * {@includeCode ../../examples/host-detect-host.ts}
 */
export const Host: HostDetection = new HostObject();

// The join time is taken at `config` time, in the lobby, which no Init
// stage has: through the internal registrar, in the library's name, not the
// deprecated alias.
onEntryPoint(
  "config::before",
  "library",
  () => {
    joinedAt ??= os.clock();
  },
  "host join time",
);
onStage(
  "gameStart",
  "library",
  () => {
    startedAt = os.clock();
  },
  "host start time",
);
