/** @noSelfInFile */

import { Players } from "../globals/index";
import { MapPlayer } from "../handles/player";
import { Timer } from "../handles/timer";
import { Trigger } from "../handles/trigger";
import { onStage } from "../init/stages";
import { base64Decode, base64Encode } from "./base64";
import { BinaryReader } from "./binaryreader";
import { BinaryWriter } from "./binarywriter";
import { getElapsedTime } from "./gametime";

/** The sync prefix of every packet the System sends. */
const SYNC_PREFIX = "rts";

/** The header's length in characters: six bytes, base64-encoded. */
const HEADER_LENGTH = 8;

/** A character of the base64 alphabet: the header has eight, no padding. */
const BASE64_CHARACTER = "[A-Za-z0-9+/]";

/** The bytes of data one packet carries after its header. */
const CHUNK_SIZE = 244;

/** Request ids, chunk indexes and chunk counts are unsigned 16-bit fields. */
const FIELD_LIMIT = 0x10000;

/** The most chunks one request can be split into. */
const MAX_CHUNKS = FIELD_LIMIT - 1;

/**
 * Packets ignored so far: the wrong prefix, a header that does not decode, a
 * chunk index out of range, an id with no pending request, the wrong sender,
 * or a chunk already received. Kept for the debug namespace (#52).
 */
const ignored = { packets: 0 };

export const enum SyncStatus {
  /** Created, not started. */
  None,
  /** Started, waiting for its packets. */
  Syncing,
  /** Every packet arrived: the `Promise` resolved. */
  Success,
  /** The timeout expired first: the `Promise` rejected. */
  Timeout,
  /** `cancel` ran first: the `Promise` rejected. */
  Cancelled,
  /** `BlzSendSyncData` refused a packet: the `Promise` rejected. */
  NetworkError,
}

/** What a sync request resolves with. */
export interface SyncResponse {
  /** The data the sender's client started the request with, joined. */
  readonly data: string;
  /** The sender, read from the event of the last packet to arrive. */
  readonly from: MapPlayer;
  /** The elapsed game time when the last packet arrived. */
  readonly time: number;
  /** The request that resolved. */
  readonly request: SyncRequest;
}

/** The options of a sync request. */
export interface SyncOptions {
  /** Seconds before a pending request rejects; zero, the default, never. */
  readonly timeout?: number;
}

/**
 * The `MapPlayer` of slot `index`: the `Players` entry, or a lookup while
 * `Players` is still empty (a request made before the `globals` stage).
 */
function playerOfSlot(index: number): MapPlayer | undefined {
  return Players[index] ?? MapPlayer.fromIndex(index);
}

/** The header of chunk `index` of `count` of request `id`. */
function writeHeader(id: number, index: number, count: number): string {
  const writer = new BinaryWriter();
  writer.writeUInt16(id);
  writer.writeUInt16(index);
  writer.writeUInt16(count);
  return base64Encode(writer.toString());
}

/** A packet the System sent, read. */
interface Packet {
  readonly id: number;
  readonly index: number;
  readonly count: number;
  readonly chunk: string;
}

/**
 * The fields of a packet, or undefined when the packet is not one the System
 * sent. The header is checked against the base64 alphabet before it is
 * decoded, so corruption is ignored, not thrown.
 */
function readPacket(
  prefix: string | undefined,
  data: string | undefined,
): Packet | undefined {
  if (prefix !== SYNC_PREFIX || data === undefined) {
    return undefined;
  }
  const header = string.sub(data, 1, HEADER_LENGTH);
  const [, valid] = string.gsub(header, BASE64_CHARACTER, "");
  if (valid !== HEADER_LENGTH) {
    return undefined;
  }
  const reader = new BinaryReader(base64Decode(header));
  const id = reader.readUInt16();
  const index = reader.readUInt16();
  const count = reader.readUInt16();
  if (index >= count) {
    return undefined;
  }
  return { id, index, count, chunk: string.sub(data, HEADER_LENGTH + 1) };
}

/**
 * Makes data only one client has, such as the contents of a file or a local
 * measurement, known to every client. `start` returns a `Promise` that
 * resolves on every client with the sender's data once all of it has arrived.
 *
 * Every client runs the same code, so every client creates the same requests
 * in the same order and allocates them the same ids: the ids are a 16-bit
 * counter that wraps around, and a request is matched to its packets by id.
 * Create and start a request on every client, with any data on the clients
 * other than the sender's; only the sender's client sends.
 *
 * The data is split into packets of `BlzSendSyncData`, all with the sync
 * prefix `"rts"`. Map projects should pick a different prefix for their own
 * sync traffic. A packet is the header then a chunk of the data, at most 252
 * characters, under the Native's limit of 255:
 *
 * | Field       | Size           | Content                                        |
 * | ----------- | -------------- | ---------------------------------------------- |
 * | Request id  | 2 bytes        | Unsigned 16-bit, big-endian                    |
 * | Chunk index | 2 bytes        | Unsigned 16-bit, big-endian, from zero         |
 * | Chunk count | 2 bytes        | Unsigned 16-bit, big-endian, at least one      |
 * | Header      | 8 characters   | The three fields above, base64-encoded         |
 * | Chunk       | 0 to 244 bytes | The data's bytes from `index * 244`, raw       |
 *
 * The data is split by byte, so a multi-byte character may straddle two
 * chunks; the chunks are joined before the request resolves. A request whose
 * data fits one chunk is chunk zero of one. The chunks go out raw, and the
 * game cuts a packet at its first zero byte, so the sender's data must hold
 * none: encode binary data first, for example with `base64Encode`.
 *
 * A packet with another prefix, a header that does not decode, a chunk index
 * out of range, an id with no pending request, a sender other than the
 * request's, or a chunk already received is ignored.
 *
 * @example
 * {@includeCode ../../examples/sync-request-send.ts}
 */
export class SyncRequest {
  /** The player whose client sends the data. */
  public readonly from: MapPlayer;

  /** The id the request's packets carry: the same on every client. */
  public readonly id: number;

  /** The options the request was created with. */
  public readonly options: SyncOptions;

  private _startTime = 0;

  private _status = SyncStatus.None;

  /** The chunks received, by index. */
  private readonly chunks = new LuaMap<number, string>();

  /** How many chunks the sender split the data into: known from the first. */
  private chunkCount?: number;

  private received = 0;

  private resolve?: (response: SyncResponse) => void;

  private reject?: (reason: string) => void;

  private timer?: Timer;

  /** The started requests that have not settled, by id. */
  private static readonly pending = new LuaMap<number, SyncRequest>();

  /** The id of the last request created. */
  private static lastId = 0;

  /** The Trigger every sync event is registered on: born at the `globals` stage. */
  private static eventTrigger?: Trigger;

  // The library's own `globals` callback: the Trigger and its events are
  // born after `InitGlobals`, not at class definition, so requiring the
  // library creates no Handle in the Lua root. The constructor's guard below
  // stays for a request made earlier than that.
  static {
    onStage(
      "globals",
      "library",
      () => {
        SyncRequest.init();
      },
      "sync events",
    );
  }

  /**
   * Creates a request, which sends nothing until `start`.
   * @param from The player whose client sends the data.
   * @param options The timeout; none by default.
   */
  public constructor(from: MapPlayer, options: SyncOptions = {}) {
    this.from = from;
    this.options = options;
    SyncRequest.lastId = (SyncRequest.lastId + 1) % FIELD_LIMIT;
    this.id = SyncRequest.lastId;
    SyncRequest.init();
  }

  /** The elapsed game time when the request started. */
  public get startTime(): number {
    return this._startTime;
  }

  /** Where the request stands. */
  public get status(): SyncStatus {
    return this._status;
  }

  /**
   * Creates a request and starts it; throws as `start` does.
   * @param from The player whose client sends the data.
   * @param data The data to send, with no zero byte; ignored on the other
   * clients.
   * @param options The timeout; none by default.
   */
  public static send(
    from: MapPlayer,
    data: string,
    options?: SyncOptions,
  ): Promise<SyncResponse> {
    // A tail call on purpose: it drops this frame, so the errors `start`
    // raises point at the caller of `send`.
    return new SyncRequest(from, options).start(data);
  }

  /**
   * Rejects the request's `Promise` if it is still syncing; does nothing on a
   * request not started or already settled.
   */
  public cancel(): void {
    this.fail(SyncStatus.Cancelled, "was cancelled");
  }

  /**
   * Starts the request: the sender's client sends the data, one packet per
   * chunk, in order. Call it once per request, on every client.
   *
   * Throws, before the request starts, on a second call, and on the sender's
   * client when the data holds a zero byte or needs more than 65,535 chunks.
   * @param data The data to send, with no zero byte (encode binary data
   * first, for example with `base64Encode`); ignored on the other clients.
   * @returns A `Promise` that resolves with the sender's data when every
   * chunk has arrived, and rejects with a message naming the request on a
   * timeout, a cancellation or a packet the game refused to send.
   */
  public start(data: string): Promise<SyncResponse> {
    if (this._status !== SyncStatus.None) {
      error(
        `reforged-ts: sync request ${String(this.id)} was already started`,
        2,
      );
    }
    const sending = this.from === MapPlayer.fromLocal();
    const count = sending ? this.chunksOf(data) : 0;
    const promise = new Promise<SyncResponse>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
    this._startTime = getElapsedTime();
    this._status = SyncStatus.Syncing;
    SyncRequest.pending.set(this.id, this);

    if (sending && !this.sendChunks(data, count)) {
      this.fail(SyncStatus.NetworkError, "could not be sent (network error)");
      return promise;
    }

    const timeout = this.options.timeout ?? 0;
    if (timeout > 0) {
      this.timer = Timer.create().start(timeout, false, () => {
        this.fail(
          SyncStatus.Timeout,
          `timed out after ${String(timeout)} seconds`,
        );
      });
    }
    return promise;
  }

  /**
   * The chunks `data` splits into; throws, pointing at the caller of `start`,
   * when the data needs more chunks than a request carries or holds a zero
   * byte, which the game would cut the packet at.
   */
  private chunksOf(data: string): number {
    const count = Math.max(1, Math.ceil(data.length / CHUNK_SIZE));
    if (count > MAX_CHUNKS) {
      error(
        `reforged-ts: sync request ${String(this.id)} has ${String(data.length)} bytes, more than the ${String(MAX_CHUNKS * CHUNK_SIZE)} a request carries`,
        3,
      );
    }
    const zero = data.indexOf("\0");
    if (zero >= 0) {
      error(
        `reforged-ts: sync request ${String(this.id)} has a zero byte at position ${String(zero)}: encode binary data first, for example with base64Encode`,
        3,
      );
    }
    return count;
  }

  /**
   * Sends `data` in `count` chunks, one packet each, in order; false when the
   * game refused a packet, and nothing is sent after it.
   */
  private sendChunks(data: string, count: number): boolean {
    for (let index = 0; index < count; index++) {
      const chunk = string.sub(
        data,
        index * CHUNK_SIZE + 1,
        (index + 1) * CHUNK_SIZE,
      );
      if (
        !BlzSendSyncData(
          SYNC_PREFIX,
          writeHeader(this.id, index, count) + chunk,
        )
      ) {
        return false;
      }
    }
    return true;
  }

  /**
   * Stores a chunk and resolves when it was the last one; false for a packet
   * this request ignores.
   */
  private receive(packet: Packet, sender: MapPlayer | undefined): boolean {
    const { index, count } = packet;
    if (
      sender !== this.from ||
      (this.chunkCount ?? count) !== count ||
      this.chunks.has(index)
    ) {
      return false;
    }
    this.chunkCount = count;
    this.chunks.set(index, packet.chunk);
    this.received++;
    if (this.received === count) {
      const parts: string[] = [];
      for (let i = 0; i < count; i++) {
        parts.push(this.chunks.get(i) ?? "");
      }
      const resolve = this.resolve;
      this.settle(SyncStatus.Success);
      resolve?.({
        data: parts.join(""),
        from: sender,
        time: getElapsedTime(),
        request: this,
      });
    }
    return true;
  }

  /** Rejects with the cause if the request is syncing. */
  private fail(status: SyncStatus, cause: string): void {
    if (this._status !== SyncStatus.Syncing) {
      return;
    }
    const reject = this.reject;
    this.settle(status);
    reject?.(`reforged-ts: sync request ${String(this.id)} ${cause}`);
  }

  /** Ends the request: no longer pending, its timeout destroyed. */
  private settle(status: SyncStatus): void {
    this._status = status;
    SyncRequest.pending.delete(this.id);
    this.timer?.destroy();
    this.timer = undefined;
    this.resolve = undefined;
    this.reject = undefined;
  }

  /**
   * Creates the Trigger and registers the sync prefix for every playing
   * user slot, once: the `globals` stage does it, and a request made before
   * that does it on the way. The slot's `MapPlayer` is the `Players` entry,
   * or a lookup when `Players` is still empty.
   */
  private static init() {
    if (this.eventTrigger) {
      return;
    }
    const trigger = Trigger.create();
    this.eventTrigger = trigger;
    for (let i = 0; i < bj_MAX_PLAYER_SLOTS; i++) {
      const p = playerOfSlot(i);
      if (
        p?.controller === MAP_CONTROL_USER &&
        p.slotState === PLAYER_SLOT_STATE_PLAYING
      ) {
        trigger.registerPlayerSyncEvent(p, SYNC_PREFIX, false);
      }
    }
    trigger.addAction(() => {
      this.onSync();
    });
  }

  /** Hands a packet to its pending request, or counts it as ignored. */
  private static onSync() {
    const packet = readPacket(
      BlzGetTriggerSyncPrefix(),
      BlzGetTriggerSyncData(),
    );
    const request = packet && this.pending.get(packet.id);
    if (!packet || !request?.receive(packet, MapPlayer.fromEvent())) {
      ignored.packets++;
    }
  }
}
