# Variable: mouseDown

> `readonly` **mouseDown**: [`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<[`MousePayload`](../../../../interfaces/MousePayload.md)\>

Defined in: [events/player.ts:207](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/player.ts#L207)

A player presses a mouse button; `x` and `y` are the world point. The payload is a
[MousePayload](../../../../interfaces/MousePayload.md).

## Example

**Following mouse drags**

```ts
/**
 * Reports where each player drags the mouse with a button held: `x` and
 * `y` are the world point under the mouse. The mouse
 * events are synced, and fire for every player once registered.
 */
export function trackDrags(): Subscription[] {
  const dragging = new Set<MapPlayer>();
  return [
    on(PlayerEvents.mouseDown, ({ player }) => {
      dragging.add(player);
    }),
    on(PlayerEvents.mouseUp, ({ player }) => {
      dragging.delete(player);
    }),
    on(PlayerEvents.mouseMove, ({ player, x, y }) => {
      if (dragging.has(player)) {
        print(`${player.name} drags over ${x.toFixed(0)}, ${y.toFixed(0)}`);
      }
    }),
  ];
}
```

## Native

[TriggerRegisterPlayerEvent](/typings/3.0.0/functions/TriggerRegisterPlayerEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterPlayerEvent))
