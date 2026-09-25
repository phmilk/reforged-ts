// The parameterised player rows take the MapPlayer Wrapper, and the chat and
// key payloads hold the Natives' string and key types.
import type { MapPlayer } from "reforged-ts";
import { on, PlayerEvents } from "reforged-ts";

declare const host: MapPlayer;
declare const rawPlayer: player;

export function subscribe(): void {
  on(PlayerEvents.chat(rawPlayer, "-go", true), () => undefined); // error TS2345
  on(PlayerEvents.keyDown(rawPlayer, OSKEY_A, 0), () => undefined); // error TS2345
  on(PlayerEvents.chat(host, "-go", true), ({ message }) => {
    const length: number = message; // error TS2322
    return length;
  });
  on(PlayerEvents.keyUp(host, OSKEY_A, 0), ({ key }) => {
    const name: string = key; // error TS2322
    return name;
  });
}
