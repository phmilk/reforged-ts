# Interface: MousePayload

Defined in: [events/player.ts:53](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/player.ts#L53)

The payload of `PlayerEvents.mouseDown`, `mouseUp` and `mouseMove`:
every field is always set.

## Extends

- [`PlayerPayload`](PlayerPayload.md)

## Properties

### player

> `readonly` **player**: [`MapPlayer`](../classes/MapPlayer.md)

Defined in: [events/player.ts:25](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/player.ts#L25)

The player the event is about, such as the one who chatted or left.

#### Inherited from

[`PlayerPayload`](PlayerPayload.md).[`player`](PlayerPayload.md#player)

***

### x

> `readonly` **x**: `number`

Defined in: [events/player.ts:55](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/player.ts#L55)

The x coordinate of the world point under the mouse, in world units.

***

### y

> `readonly` **y**: `number`

Defined in: [events/player.ts:57](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/player.ts#L57)

The y coordinate of the world point under the mouse, in world units.
