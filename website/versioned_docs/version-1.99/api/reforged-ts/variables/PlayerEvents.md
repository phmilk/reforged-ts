# Variable: PlayerEvents

> `const` **PlayerEvents**: [`EventDescriptors`](../type-aliases/EventDescriptors.md)\<\{ `allianceChanged`: \{ `read`: (`event`) => [`PlayerPayload`](../interfaces/PlayerPayload.md); `register`: (`trigger`, `player`, `allianceType`) => `void`; \}; `chat`: \{ `read`: (`event`) => [`ChatPayload`](../interfaces/ChatPayload.md); `register`: (`trigger`, `player`, `text`, `exactMatch`) => `void`; \}; `defeat`: [`FixedRow`](../type-aliases/FixedRow.md)\<[`PlayerPayload`](../interfaces/PlayerPayload.md)\>; `keyDown`: [`EventRow`](../interfaces/EventRow.md)\<\[[`MapPlayer`](../classes/MapPlayer.md), `oskeytype`, `number`\], [`KeyPayload`](../interfaces/KeyPayload.md)\>; `keyUp`: [`EventRow`](../interfaces/EventRow.md)\<\[[`MapPlayer`](../classes/MapPlayer.md), `oskeytype`, `number`\], [`KeyPayload`](../interfaces/KeyPayload.md)\>; `leave`: [`FixedRow`](../type-aliases/FixedRow.md)\<[`PlayerPayload`](../interfaces/PlayerPayload.md)\>; `mouseDown`: [`FixedRow`](../type-aliases/FixedRow.md)\<[`MousePayload`](../interfaces/MousePayload.md)\>; `mouseMove`: [`FixedRow`](../type-aliases/FixedRow.md)\<[`MousePayload`](../interfaces/MousePayload.md)\>; `mouseUp`: [`FixedRow`](../type-aliases/FixedRow.md)\<[`MousePayload`](../interfaces/MousePayload.md)\>; `syncData`: \{ `read`: (`event`) => [`SyncPayload`](../interfaces/SyncPayload.md); `register`: (`trigger`, `player`, `prefix`) => `void`; \}; `victory`: [`FixedRow`](../type-aliases/FixedRow.md)\<[`PlayerPayload`](../interfaces/PlayerPayload.md)\>; \}\>

Defined in: [events/player.ts:146](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/events/player.ts#L146)

The player Event descriptors: `PlayerEvents.leave` for every player slot,
`PlayerEvents.chat(player, text, exactMatch)` for one player.

## Remarks

A member that is a descriptor registers for the player in every slot; a
member that is a function registers for the player it is given. Every
payload holds the triggering player (a [PlayerPayload](../interfaces/PlayerPayload.md)), and no
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
