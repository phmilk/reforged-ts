# Variable: keyDown

> `readonly` **keyDown**: (...`args`) => [`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<[`KeyPayload`](../../../../interfaces/KeyPayload.md)\>

Defined in: [events/player.ts:189](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/player.ts#L189)

A player presses `key` with the modifiers `metaKey`, and again
repeatedly while holding it. The payload is a [KeyPayload](../../../../interfaces/KeyPayload.md).

## Parameters

### args

...\[[`MapPlayer`](../../../../classes/MapPlayer.md), `oskeytype`, `number`\]

## Returns

[`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<[`KeyPayload`](../../../../interfaces/KeyPayload.md)\>

## Example

**Sprinting while a key is held**

```ts
/**
 * Makes `hero` sprint while `player` holds Shift+Space. `keyDown` fires
 * again and again while the key is held and `keyUp` once on release; the
 * payload holds the `key`, the `metaKey` modifiers and `isDown`. The key
 * events are synced, so the handlers may change game state.
 */
export function sprintKey(player: MapPlayer, hero: Unit): Subscription[] {
  const sprint = ({ isDown }: KeyPayload) => {
    hero.moveSpeed = isDown ? 400 : hero.defaultMoveSpeed;
  };
  return [
    on(PlayerEvents.keyDown(player, OSKEY_SPACE, MetaKey.Shift), sprint),
    on(PlayerEvents.keyUp(player, OSKEY_SPACE, MetaKey.Shift), sprint),
  ];
}
```

## Native

[BlzTriggerRegisterPlayerKeyEvent](/typings/3.0.0/functions/BlzTriggerRegisterPlayerKeyEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzTriggerRegisterPlayerKeyEvent))
