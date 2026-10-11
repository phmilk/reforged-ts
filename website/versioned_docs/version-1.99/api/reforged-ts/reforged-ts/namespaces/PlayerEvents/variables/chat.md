# Variable: chat

> `readonly` **chat**: (...`args`) => [`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<[`ChatPayload`](../../../../interfaces/ChatPayload.md)\>

Defined in: [events/player.ts:156](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/player.ts#L156)

A player sends a chat message containing `text`, or equal to it when
`exactMatch`; `message` is the whole message, `matched` is `text`.
The payload is a [ChatPayload](../../../../interfaces/ChatPayload.md).

## Parameters

### args

...\[[`MapPlayer`](../../../../classes/MapPlayer.md), `string`, `boolean`\]

## Returns

[`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<[`ChatPayload`](../../../../interfaces/ChatPayload.md)\>

## Example

**A chat command with an argument**

```ts
/**
 * A "-kick <name>" command for `host`: `message` is the whole line typed,
 * `matched` the text the descriptor was registered with. Without an exact
 * match the event fires on any message containing the text, so `when` keeps
 * those that start with it.
 */
export function kickCommand(host: MapPlayer): Subscription {
  return on(
    PlayerEvents.chat(host, "-kick ", false),
    ({ message, matched }) => {
      const name = message.substring(matched.length);
      for (const player of tsGlobals.Players) {
        if (player.name === name && player !== host) {
          player.remove(PLAYER_GAME_RESULT_DEFEAT);
        }
      }
    },
    ({ message, matched }) => message.startsWith(matched),
  );
}
```

## Native

[TriggerRegisterPlayerChatEvent](/typings/3.0.0/functions/TriggerRegisterPlayerChatEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterPlayerChatEvent))
