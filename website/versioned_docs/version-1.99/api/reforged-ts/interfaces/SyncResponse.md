# Interface: SyncResponse

Defined in: [system/sync.ts:57](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/sync.ts#L57)

What a sync request resolves with.

## Properties

### data

> `readonly` **data**: `string`

Defined in: [system/sync.ts:59](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/sync.ts#L59)

The data the sender's client started the request with, joined.

***

### from

> `readonly` **from**: [`MapPlayer`](../classes/MapPlayer.md)

Defined in: [system/sync.ts:61](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/sync.ts#L61)

The sender, read from the event of the last packet to arrive.

***

### request

> `readonly` **request**: [`SyncRequest`](../classes/SyncRequest.md)

Defined in: [system/sync.ts:65](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/sync.ts#L65)

The request that resolved.

***

### time

> `readonly` **time**: `number`

Defined in: [system/sync.ts:63](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/sync.ts#L63)

The elapsed game time when the last packet arrived.
