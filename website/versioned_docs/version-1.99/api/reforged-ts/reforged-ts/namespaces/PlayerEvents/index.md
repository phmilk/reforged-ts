# PlayerEvents

The player Event descriptors: `PlayerEvents.leave` for every player slot,
`PlayerEvents.chat(player, text, exactMatch)` for one player.

## Remarks

A member that is a descriptor registers for the player in every slot; a
member that is a function registers for the player it is given. Every
payload holds the triggering player (a [PlayerPayload](../../../interfaces/PlayerPayload.md)), and no
field of a player event's payload is ever `undefined`.

## Example

**Listening for a chat command**

```ts
/** Waits for `player` to type "-ready", once: the handler ends its own Trigger. */
export function awaitReady(player: MapPlayer): void {
  const subscription = on(
    PlayerEvents.chat(player, "-ready", true),
    ({ player: ready }) => {
      print(`${ready.name} is ready`);
      subscription.destroy();
    },
  );
}
```

## Variables

- [allianceChanged](variables/allianceChanged.md)
- [chat](variables/chat.md)
- [defeat](variables/defeat.md)
- [keyDown](variables/keyDown.md)
- [keyUp](variables/keyUp.md)
- [leave](variables/leave.md)
- [mouseDown](variables/mouseDown.md)
- [mouseMove](variables/mouseMove.md)
- [mouseUp](variables/mouseUp.md)
- [syncData](variables/syncData.md)
- [victory](variables/victory.md)
