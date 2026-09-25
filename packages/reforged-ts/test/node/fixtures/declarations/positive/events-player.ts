// on(PlayerEvents.chat) and on(PlayerEvents.keyDown) hand payloads whose
// player and scalars are guaranteed; the fixed rows are descriptors, the
// parameterised ones take the MapPlayer they register for.
import type { EventDescriptor, MapPlayer, Subscription } from "reforged-ts";
import { on, PlayerEvents } from "reforged-ts";

declare const host: MapPlayer;

const chat: Subscription = on(
  PlayerEvents.chat(host, "-go", true),
  ({ player, message, matched }) => {
    const from: MapPlayer = player;
    const text: string = message;
    const detected: string = matched;
    from.name = `${text} ${detected}`;
  },
  ({ message }) => message.length > 0,
);
chat.destroy();

const keys: Subscription = on(
  PlayerEvents.keyDown(host, OSKEY_A, 0),
  ({ player, key, metaKey, isDown }) => {
    const from: MapPlayer = player;
    const pressed: oskeytype = key;
    const modifiers: number = metaKey;
    const down: boolean = isDown;
    from.name = `${tostring(pressed)} ${tostring(modifiers)} ${tostring(down)}`;
  },
);

const keyUp: EventDescriptor<{
  readonly player: MapPlayer;
  readonly key: oskeytype;
  readonly metaKey: number;
  readonly isDown: boolean;
}> = PlayerEvents.keyUp(host, OSKEY_A, 0);
const leave: EventDescriptor<{ readonly player: MapPlayer }> =
  PlayerEvents.leave;
const mouse: EventDescriptor<{
  readonly player: MapPlayer;
  readonly x: number;
  readonly y: number;
}> = PlayerEvents.mouseMove;
const sync: EventDescriptor<{
  readonly player: MapPlayer;
  readonly prefix: string;
  readonly data: string;
}> = PlayerEvents.syncData(host, "save");

export { chat, keys, keyUp, leave, mouse, sync };
