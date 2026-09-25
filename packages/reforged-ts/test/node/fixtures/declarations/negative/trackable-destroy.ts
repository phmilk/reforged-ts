// The game has no Native that destroys a trackable, so the Wrapper has no
// destroy.
import { Trackable } from "reforged-ts";

declare const trackable: Trackable;

export function destroy(): void {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- Negative: the member does not exist, so its type does not resolve
  trackable.destroy(); // error TS2339
}
