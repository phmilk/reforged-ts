# Class: SyncRequest

Defined in: [system/sync.ts:163](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/sync.ts#L163)

Makes data only one client has, such as the contents of a file or a local
measurement, known to every client. `start` returns a `Promise` that
resolves on every client with the sender's data once all of it has arrived.

Every client runs the same code, so every client creates the same requests
in the same order and allocates them the same ids: the ids are a 16-bit
counter that wraps around, and a request is matched to its packets by id.
Create and start a request on every client, with any data on the clients
other than the sender's; only the sender's client sends.

The data is split into packets of `BlzSendSyncData`, all with the sync
prefix `"rts"`. Map projects should pick a different prefix for their own
sync traffic. A packet is the header then a chunk of the data, at most 252
characters, under the Native's limit of 255:

| Field       | Size           | Content                                        |
| ----------- | -------------- | ---------------------------------------------- |
| Request id  | 2 bytes        | Unsigned 16-bit, big-endian                    |
| Chunk index | 2 bytes        | Unsigned 16-bit, big-endian, from zero         |
| Chunk count | 2 bytes        | Unsigned 16-bit, big-endian, at least one      |
| Header      | 8 characters   | The three fields above, base64-encoded         |
| Chunk       | 0 to 244 bytes | The data's bytes from `index * 244`, raw       |

The data is split by byte, so a multi-byte character may straddle two
chunks; the chunks are joined before the request resolves. A request whose
data fits one chunk is chunk zero of one. The chunks go out raw, and the
game cuts a packet at its first zero byte, so the sender's data must hold
none: encode binary data first, for example with `base64Encode`.

A packet with another prefix, a header that does not decode, a chunk index
out of range, an id with no pending request, a sender other than the
request's, or a chunk already received is ignored.

## Example

```ts
// The first player's save code, read from that player's disk, made known to
// every client. Every client runs the same code: each reads its own file and
// sends the request, and only the first player's client sends its data.
import { File, Init, MapPlayer, SyncRequest } from "reforged-ts";

async function loadSaveCode(sender: MapPlayer): Promise<void> {
  try {
    const response = await SyncRequest.send(
      sender,
      File.read("savecode.txt") ?? "",
      { timeout: 10 },
    );
    print(`${response.from.name} loaded: ${response.data}`);
  } catch (reason) {
    // A timeout, a cancellation or a network error, naming the request.
    print(String(reason));
  }
}

Init.onGameStart(() => {
  const sender = MapPlayer.fromIndex(0);
  if (sender) {
    void loadSaveCode(sender);
  }
});
```

## Constructors

### Constructor

> **new SyncRequest**(`from`, `options?`): `SyncRequest`

Defined in: [system/sync.ts:220](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/sync.ts#L220)

Creates a request, which sends nothing until `start`.

#### Parameters

##### from

[`MapPlayer`](MapPlayer.md)

The player whose client sends the data.

##### options?

[`SyncOptions`](../interfaces/SyncOptions.md) = `{}`

The timeout; none by default.

#### Returns

`SyncRequest`

## Properties

### from

> `readonly` **from**: [`MapPlayer`](MapPlayer.md)

Defined in: [system/sync.ts:165](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/sync.ts#L165)

The player whose client sends the data.

***

### id

> `readonly` **id**: `number`

Defined in: [system/sync.ts:168](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/sync.ts#L168)

The id the request's packets carry: the same on every client.

***

### options

> `readonly` **options**: [`SyncOptions`](../interfaces/SyncOptions.md)

Defined in: [system/sync.ts:171](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/sync.ts#L171)

The options the request was created with.

## Accessors

### startTime

#### Get Signature

> **get** **startTime**(): `number`

Defined in: [system/sync.ts:233](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/sync.ts#L233)

The elapsed game time when the request started.

##### Returns

`number`

The time, in seconds, as [getElapsedTime](../functions/getElapsedTime.md) read it; 0
until `start`.

***

### status

#### Get Signature

> **get** **status**(): [`SyncStatus`](../enumerations/SyncStatus.md)

Defined in: [system/sync.ts:242](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/sync.ts#L242)

Where the request stands.

##### Returns

[`SyncStatus`](../enumerations/SyncStatus.md)

The status: `None` until `start`, `Syncing` while it waits,
then how it settled.

## Methods

### cancel()

> **cancel**(): `void`

Defined in: [system/sync.ts:274](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/sync.ts#L274)

Rejects the request's `Promise` with
`reforged-ts: sync request <id> was cancelled` if it is still syncing;
does nothing on a request not started or already settled.

#### Returns

`void`

***

### start()

> **start**(`data`): `Promise`\<[`SyncResponse`](../interfaces/SyncResponse.md)\>

Defined in: [system/sync.ts:302](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/sync.ts#L302)

Starts the request: the sender's client sends the data, one packet per
chunk, in order. Call it once per request, on every client.

#### Parameters

##### data

`string`

The data to send, with no zero byte (encode binary data
first, for example with `base64Encode`); ignored on the other clients.

#### Returns

`Promise`\<[`SyncResponse`](../interfaces/SyncResponse.md)\>

A `Promise` that resolves with the sender's data when every
chunk has arrived, and rejects with a message naming the request on a
timeout, a cancellation or a packet the game refused to send.

#### Remarks

A rejection's reason is a string, like every error the library raises,
where w3ts rejected with an `Error` object:
`reforged-ts: sync request <id> timed out after <seconds> seconds`,
`reforged-ts: sync request <id> was cancelled` or
`reforged-ts: sync request <id> could not be sent (network error)`. A
network failure rejects on the sender's client, where w3ts printed
`SyncData: Network Error`.

#### Throws

Before the request starts, at the calling line: on a second
call, `reforged-ts: sync request <id> was already started`; on the
sender's client, when the data holds a zero byte,
`reforged-ts: sync request <id> has a zero byte at position <position>: encode binary data first, for example with base64Encode`,
or needs more than 65,535 chunks,
`reforged-ts: sync request <id> has <length> bytes, more than the 15990540 a request carries`.

#### Native

[BlzSendSyncData](/typings/3.0.0/functions/BlzSendSyncData) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSendSyncData))

***

### send()

> `static` **send**(`from`, `data`, `options?`): `Promise`\<[`SyncResponse`](../interfaces/SyncResponse.md)\>

Defined in: [system/sync.ts:259](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/sync.ts#L259)

Creates a request and starts it, as `new SyncRequest(from, options)`
then `start(data)` do.

#### Parameters

##### from

[`MapPlayer`](MapPlayer.md)

The player whose client sends the data.

##### data

`string`

The data to send, with no zero byte; ignored on the other
clients.

##### options?

[`SyncOptions`](../interfaces/SyncOptions.md)

The timeout; none by default.

#### Returns

`Promise`\<[`SyncResponse`](../interfaces/SyncResponse.md)\>

The `Promise` `start` returns.

#### Throws

On the sender's client, as `start` does, at the calling line:
`reforged-ts: sync request <id> has a zero byte at position <position>: encode binary data first, for example with base64Encode`,
or `reforged-ts: sync request <id> has <length> bytes, more than the 15990540 a request carries`.

#### Native

[BlzSendSyncData](/typings/3.0.0/functions/BlzSendSyncData) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSendSyncData))
