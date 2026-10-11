# Variable: defeat

> `readonly` **defeat**: [`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<[`PlayerPayload`](../../../../interfaces/PlayerPayload.md)\>

Defined in: [events/player.ts:281](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/player.ts#L281)

A player loses the game.

## Example

**Announcing how players leave the game**

```ts
/** Tells everyone when a player leaves, wins or loses. */
export function announceOutcomes(): Subscription[] {
  return [
    on(PlayerEvents.leave, ({ player }) => {
      print(`${player.name} left the game`);
    }),
    on(PlayerEvents.victory, ({ player }) => {
      print(`${player.name} won`);
    }),
    on(PlayerEvents.defeat, ({ player }) => {
      print(`${player.name} was defeated`);
    }),
  ];
}
```

## Native

[TriggerRegisterPlayerEvent](/typings/3.0.0/functions/TriggerRegisterPlayerEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterPlayerEvent))
