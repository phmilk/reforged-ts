# Interface: HostDetection

Defined in: [system/host.ts:28](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/host.ts#L28)

The type of `Host`: the election and its result.

## Properties

### host

> `readonly` **host**: [`MapPlayer`](../classes/MapPlayer.md) \| `undefined`

Defined in: [system/host.ts:41](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/host.ts#L41)

The elected player: undefined until the election resolved.

## Methods

### detectHost()

> **detectHost**(`options?`): `Promise`\<[`MapPlayer`](../classes/MapPlayer.md)\>

Defined in: [system/host.ts:39](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/host.ts#L39)

Elects the host, once: every call returns the same `Promise`, and only
the first call's options count. The election starts at the `gameStart`
stage, or at the call when the game already started. Call it on every
client, in the same order relative to the other sync requests, as
`SyncRequest` requires.

#### Parameters

##### options?

[`HostOptions`](HostOptions.md)

The timeout; ten seconds by default.

#### Returns

`Promise`\<[`MapPlayer`](../classes/MapPlayer.md)\>

A `Promise` that resolves with the elected player, the same on
every client, and rejects only when no lobby time arrived.
