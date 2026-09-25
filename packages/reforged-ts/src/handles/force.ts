/** @noSelfInFile * */

import { assertNotLocal } from "../reforged/local";
import { protect } from "../reforged/protect";
import { filterOf } from "./boolexpr";
import { Handle } from "./handle";
import { MapPlayer } from "./player";

export class Force extends Handle<force> {
  public static create(): Force {
    return this.expect(CreateForce());
  }

  public addPlayer(whichPlayer: MapPlayer) {
    ForceAddPlayer(this.handle, whichPlayer.handle);
  }

  public clear() {
    ForceClear(this.handle);
  }

  /**
   * Destroys the Force through its Native.
   * @remarks
   * In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
   * a second `destroy()` included, raises
   * `reforged-ts: used after destroy: <Class>#<id>`, and
   * `Reforged.debug.report()` counts it destroyed.
   */
  public destroy() {
    DestroyForce(this.handle);
    this.release();
  }

  public enumAllies(
    whichPlayer: MapPlayer,
    filter: boolexpr | (() => boolean),
  ) {
    ForceEnumAllies(
      this.handle,
      whichPlayer.handle,
      filterOf(this, "Force.enumAllies", filter),
    );
  }

  public enumEnemies(
    whichPlayer: MapPlayer,
    filter: boolexpr | (() => boolean),
  ) {
    ForceEnumEnemies(
      this.handle,
      whichPlayer.handle,
      filterOf(this, "Force.enumEnemies", filter),
    );
  }

  public enumPlayers(filter: boolexpr | (() => boolean)) {
    ForceEnumPlayers(this.handle, filterOf(this, "Force.enumPlayers", filter));
  }

  public enumPlayersCounted(
    filter: boolexpr | (() => boolean),
    countLimit: number,
  ) {
    ForceEnumPlayersCounted(
      this.handle,
      filterOf(this, "Force.enumPlayersCounted", filter),
      countLimit,
    );
  }

  /**
   * Runs `callback` once per player of the force, `MapPlayer.fromEnum()`
   * answering that player.
   * @remarks In Dev mode the callback runs under `pcall`: a call that throws
   * is reported as `Force#<id> Force.for` and the enumeration continues with
   * the next player. With Dev mode off `ForForce` receives `callback` itself.
   */
  public for(callback: () => void) {
    assertNotLocal("Force.for", 2);
    ForForce(this.handle, protect(this, "Force.for", callback));
  }

  /**
   * Returns all player handles belonging to this force
   */
  public getPlayers() {
    const players: MapPlayer[] = [];

    ForForce(this.handle, () => {
      const pl = MapPlayer.fromEnum();
      if (pl) {
        players.push(pl);
      }
    });

    return players;
  }

  public hasPlayer(whichPlayer: MapPlayer) {
    return IsPlayerInForce(whichPlayer.handle, this.handle);
  }

  public removePlayer(whichPlayer: MapPlayer) {
    ForceRemovePlayer(this.handle, whichPlayer.handle);
  }

  /**
   * A new force holding `whichPlayer`: a creation, a new force on every call.
   */
  public static fromPlayer(whichPlayer: MapPlayer): Force {
    const handle = CreateForce();
    if (handle !== undefined) {
      ForceAddPlayer(handle, whichPlayer.handle);
    }
    return this.expect(handle);
  }
}
