# Variable: syncData

> `readonly` **syncData**: (...`args`) => [`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<[`SyncPayload`](../../../../interfaces/SyncPayload.md)\>

Defined in: [events/player.ts:234](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/player.ts#L234)

A player's synced data with `prefix` arrives at every player. The
payload is a [SyncPayload](../../../../interfaces/SyncPayload.md).

## Parameters

### args

...\[[`MapPlayer`](../../../../classes/MapPlayer.md), `string`\]

## Returns

[`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<[`SyncPayload`](../../../../interfaces/SyncPayload.md)\>

## Example

**Sending one player's pick to every client**

```ts
/**
 * Makes `player`'s pick known to every client: their client sends it with
 * `BlzSendSyncData`, and every client receives it as `data`. The handler
 * ends its own Subscription once the pick arrives.
 */
export function awaitPick(player: MapPlayer, pick: () => string): void {
  const subscription = on(PlayerEvents.syncData(player, "pick"), ({ data }) => {
    print(`${player.name} picked ${data}`);
    subscription.destroy();
  });
  MapPlayer.runLocal(player, () => {
    BlzSendSyncData("pick", pick());
  });
}
```

## Native

[BlzTriggerRegisterPlayerSyncEvent](/typings/3.0.0/functions/BlzTriggerRegisterPlayerSyncEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzTriggerRegisterPlayerSyncEvent))
