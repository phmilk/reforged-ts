/** @noSelfInFile */
// PROTOTYPE: minimal MapPlayer on the new base. Name kept (design review P10).

import { Handle } from "./handle";

export class MapPlayer extends Handle<player> {
  /** Lookup by slot. `undefined` only for an out-of-range index. */
  public static fromIndex(index: number): MapPlayer | undefined {
    return this.fromHandle(Player(index));
  }

  public static fromEvent(): MapPlayer | undefined {
    return this.fromHandle(GetTriggerPlayer());
  }

  /** Never fails in the game; typed non-null through `expect`. Async: local player only. */
  public static fromLocal(): MapPlayer {
    return this.expect(GetLocalPlayer(), "local player");
  }

  public get name(): string {
    return GetPlayerName(this.handle) ?? "";
  }

  public get slot(): number {
    return GetPlayerId(this.handle);
  }
}
