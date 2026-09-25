/** @noSelfInFile * */

import { assertNotLocal } from "../reforged/local";
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
      typeof filter === "function" ? Filter(filter) : filter,
    );
  }

  public enumEnemies(
    whichPlayer: MapPlayer,
    filter: boolexpr | (() => boolean),
  ) {
    ForceEnumEnemies(
      this.handle,
      whichPlayer.handle,
      typeof filter === "function" ? Filter(filter) : filter,
    );
  }

  public enumPlayers(filter: boolexpr | (() => boolean)) {
    ForceEnumPlayers(
      this.handle,
      typeof filter === "function" ? Filter(filter) : filter,
    );
  }

  public enumPlayersCounted(
    filter: boolexpr | (() => boolean),
    countLimit: number,
  ) {
    ForceEnumPlayersCounted(
      this.handle,
      typeof filter === "function" ? Filter(filter) : filter,
      countLimit,
    );
  }

  public for(callback: () => void) {
    assertNotLocal("Force.for", 2);
    ForForce(this.handle, callback);
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
