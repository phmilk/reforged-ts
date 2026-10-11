# Variable: allianceChanged

> `readonly` **allianceChanged**: (...`args`) => [`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<[`PlayerPayload`](../../../../interfaces/PlayerPayload.md)\>

Defined in: [events/player.ts:254](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/player.ts#L254)

A player changes its `allianceType` alliance setting toward another.
The payload holds the player whose setting changed.

## Parameters

### args

...\[[`MapPlayer`](../../../../classes/MapPlayer.md), `alliancetype`\]

## Returns

[`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<[`PlayerPayload`](../../../../interfaces/PlayerPayload.md)\>

## Example

**Watching a player's alliances**

```ts
/**
 * Warns `player`'s allies when `player` changes their passive alliance
 * setting toward anyone: the payload holds only the player who changed it.
 */
export function watchAlliances(player: MapPlayer): Subscription {
  return on(PlayerEvents.allianceChanged(player, ALLIANCE_PASSIVE), () => {
    for (const other of tsGlobals.Players) {
      if (other !== player && other.isPlayerAlly(player)) {
        other.displayText(0, 0, `${player.name} changed their alliances`);
      }
    }
  });
}
```

## Native

[TriggerRegisterPlayerAllianceChange](/typings/3.0.0/functions/TriggerRegisterPlayerAllianceChange) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterPlayerAllianceChange))
