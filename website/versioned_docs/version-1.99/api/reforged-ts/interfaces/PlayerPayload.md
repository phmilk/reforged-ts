# Interface: PlayerPayload

Defined in: [events/player.ts:23](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/player.ts#L23)

The payload of a player event that carries only its player
(`PlayerEvents.leave`, `allianceChanged`, `victory`, `defeat`), and
the base of every player event's payload. The player is always set.

## Extended by

- [`ChatPayload`](ChatPayload.md)
- [`KeyPayload`](KeyPayload.md)
- [`MousePayload`](MousePayload.md)
- [`SyncPayload`](SyncPayload.md)

## Properties

### player

> `readonly` **player**: [`MapPlayer`](../classes/MapPlayer.md)

Defined in: [events/player.ts:25](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/player.ts#L25)

The player the event is about, such as the one who chatted or left.
