# Interface: SyncPayload

Defined in: [events/player.ts:64](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/player.ts#L64)

The payload of `PlayerEvents.syncData`: every field is always set, the
player being the one who sent the data.

## Extends

- [`PlayerPayload`](PlayerPayload.md)

## Properties

### data

> `readonly` **data**: `string`

Defined in: [events/player.ts:68](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/player.ts#L68)

The data the sender's client sent, the same string on every client.

***

### player

> `readonly` **player**: [`MapPlayer`](../classes/MapPlayer.md)

Defined in: [events/player.ts:25](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/player.ts#L25)

The player the event is about, such as the one who chatted or left.

#### Inherited from

[`PlayerPayload`](PlayerPayload.md).[`player`](PlayerPayload.md#player)

***

### prefix

> `readonly` **prefix**: `string`

Defined in: [events/player.ts:66](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/player.ts#L66)

The prefix the sender passed to `BlzSendSyncData`.
