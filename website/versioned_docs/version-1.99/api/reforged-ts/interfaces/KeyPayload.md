# Interface: KeyPayload

Defined in: [events/player.ts:40](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/events/player.ts#L40)

The payload of `PlayerEvents.keyDown` and `PlayerEvents.keyUp`: every
field is always set.

## Extends

- [`PlayerPayload`](PlayerPayload.md)

## Properties

### isDown

> `readonly` **isDown**: `boolean`

Defined in: [events/player.ts:46](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/events/player.ts#L46)

Whether the key went down: true for `keyDown`, false for `keyUp`.

***

### key

> `readonly` **key**: `oskeytype`

Defined in: [events/player.ts:42](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/events/player.ts#L42)

The key pressed or released.

***

### metaKey

> `readonly` **metaKey**: `number`

Defined in: [events/player.ts:44](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/events/player.ts#L44)

The modifier keys held with it, as the registration's `metaKey`.

***

### player

> `readonly` **player**: [`MapPlayer`](../classes/MapPlayer.md)

Defined in: [events/player.ts:25](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/events/player.ts#L25)

The player the event is about, such as the one who chatted or left.

#### Inherited from

[`PlayerPayload`](PlayerPayload.md).[`player`](PlayerPayload.md#player)
