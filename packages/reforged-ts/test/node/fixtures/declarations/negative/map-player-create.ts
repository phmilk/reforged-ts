// Players are not created: MapPlayer has no create, fromIndex is the lookup.
import { MapPlayer } from "reforged-ts";

export function makePlayer(): void {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- Negative: the member does not exist, so its type does not resolve
  MapPlayer.create(0); // error TS2339
}
