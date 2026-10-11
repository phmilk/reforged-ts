# Interface: ChatPayload

Defined in: [events/player.ts:29](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/player.ts#L29)

The payload of `PlayerEvents.chat`: every field is always set.

## Extends

- [`PlayerPayload`](PlayerPayload.md)

## Properties

### matched

> `readonly` **matched**: `string`

Defined in: [events/player.ts:33](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/player.ts#L33)

The text the descriptor was registered with.

***

### message

> `readonly` **message**: `string`

Defined in: [events/player.ts:31](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/player.ts#L31)

The whole chat message.

***

### player

> `readonly` **player**: [`MapPlayer`](../classes/MapPlayer.md)

Defined in: [events/player.ts:25](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/player.ts#L25)

The player the event is about, such as the one who chatted or left.

#### Inherited from

[`PlayerPayload`](PlayerPayload.md).[`player`](PlayerPayload.md#player)
