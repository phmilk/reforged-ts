// The host System is `Host`: `onHostDetect` is gone, and `Host.host` is
// read-only, set by the election alone.
import { Host, type MapPlayer, onHostDetect } from "reforged-ts"; // error TS2305

declare const player: MapPlayer;

export function takeOver(): void {
  Host.host = player; // error TS2540
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Negative: `onHostDetect` is not exported, so its type is an error
export const detected = onHostDetect;
