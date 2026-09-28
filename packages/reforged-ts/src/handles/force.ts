/** @noSelfInFile */

import { assertNotLocal } from "../reforged/local";
import { protect } from "../reforged/protect";
import { filterOf } from "./boolexpr";
import { Handle } from "./handle";
import { MapPlayer } from "./player";

/**
 * A set of players, such as a team, that Natives take as a whole: to show
 * them something, to reveal buildings to them, or to run code once per
 * player.
 * @remarks
 * A player is in a force at most once, and the game runs through a force in
 * slot order, whatever order the players were added in.
 * @example Making a force of the users in the game
 * {@includeCode ../../examples/harness/force-create.ts}
 * @native force
 */
export class Force extends Handle<force> {
  /**
   * Creates an empty force.
   * @returns The new force.
   * @throws When the game returns no handle:
   * `reforged-ts: failed to create Force`, at the calling line.
   * @throws In Dev mode, when called before the globals Init stage:
   * `reforged-ts: Force created before the globals Init stage: create Handles in Init.onGlobals or a later stage, not at module top level`.
   * @throws In Dev mode, inside `MapPlayer.runLocal`:
   * `reforged-ts: creating a Force inside MapPlayer.runLocal changes game state for one client, which desyncs the game: only visuals belong inside runLocal`.
   * @native CreateForce
   */
  public static create(): Force {
    return this.expect(CreateForce());
  }

  /**
   * Adds a player to the force; a player already in it stays in it once.
   * @param whichPlayer - The player to add.
   * @native ForceAddPlayer
   */
  public addPlayer(whichPlayer: MapPlayer) {
    ForceAddPlayer(this.handle, whichPlayer.handle);
  }

  /**
   * Removes every player from the force.
   * @native ForceClear
   */
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
   * @throws In Dev mode, inside `MapPlayer.runLocal`:
   * `reforged-ts: destroying Force#<id> inside MapPlayer.runLocal changes game state for one client, which desyncs the game: only visuals belong inside runLocal`.
   * @native DestroyForce
   */
  public destroy() {
    DestroyForce(this.handle);
    this.release();
  }

  /**
   * Adds to the force every ally of `whichPlayer` that `filter` accepts.
   * @remarks
   * The filter reads the candidate with {@link MapPlayer.fromFilter}. In Dev
   * mode a function filter runs under `pcall`: one that throws is reported
   * as `Force#<id> Force.enumAllies` and leaves its candidate out.
   * @param whichPlayer - The player whose allies are candidates.
   * @param filter - A `boolexpr`, or a function returning `true` to add the
   * candidate.
   * @native ForceEnumAllies
   * @native Filter
   */
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

  /**
   * Adds to the force every enemy of `whichPlayer` that `filter` accepts.
   * @remarks
   * The filter reads the candidate with {@link MapPlayer.fromFilter}. In Dev
   * mode a function filter runs under `pcall`: one that throws is reported
   * as `Force#<id> Force.enumEnemies` and leaves its candidate out.
   * @param whichPlayer - The player whose enemies are candidates.
   * @param filter - A `boolexpr`, or a function returning `true` to add the
   * candidate.
   * @native ForceEnumEnemies
   * @native Filter
   */
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

  /**
   * Adds to the force every player that `filter` accepts, the neutral
   * players left out.
   * @remarks
   * The filter reads the candidate with {@link MapPlayer.fromFilter}. In Dev
   * mode a function filter runs under `pcall`: one that throws is reported
   * as `Force#<id> Force.enumPlayers` and leaves its candidate out.
   * {@link Force.for} visits the players of the force and leaves it as it
   * is.
   * @param filter - A `boolexpr`, or a function returning `true` to add the
   * candidate.
   * @native ForceEnumPlayers
   * @native Filter
   */
  public enumPlayers(filter: boolexpr | (() => boolean)) {
    ForceEnumPlayers(this.handle, filterOf(this, "Force.enumPlayers", filter));
  }

  /**
   * Adds to the force the players that `filter` accepts, up to `countLimit`
   * of them.
   * @remarks
   * - jassdoc reports that `countLimit` probably has no effect: expect the
   *   result of {@link Force.enumPlayers}.
   * - The filter reads the candidate with {@link MapPlayer.fromFilter}. In Dev
   *   mode a function filter runs under `pcall`: one that throws is reported
   *   as `Force#<id> Force.enumPlayersCounted` and leaves its candidate out.
   * @param filter - A `boolexpr`, or a function returning `true` to add the
   * candidate.
   * @param countLimit - The most players to add.
   * @native ForceEnumPlayersCounted
   * @native Filter
   */
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
   * Runs `callback` once per player of the force,
   * {@link MapPlayer.fromEnum} answering that player.
   * @remarks In Dev mode the callback runs under `pcall`: a call that throws
   * is reported as `Force#<id> Force.for` and the enumeration continues with
   * the next player. With Dev mode off `ForForce` receives `callback` itself.
   * @param callback - The function to run for each player, in slot order.
   * @throws In Dev mode, inside `MapPlayer.runLocal`:
   * `reforged-ts: Force.for inside MapPlayer.runLocal changes game state for one client, which desyncs the game: only visuals belong inside runLocal`.
   * @native ForForce
   */
  public for(callback: () => void) {
    assertNotLocal("Force.for", 2);
    ForForce(this.handle, protect(this, "Force.for", callback));
  }

  /**
   * Lists the players of the force.
   * @returns A new array of the players, in slot order; empty for an empty
   * force.
   * @native ForForce
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

  /**
   * Checks whether a player is in the force.
   * @remarks
   * It gives the same result as {@link MapPlayer.inForce}, which calls
   * `IsPlayerInForce`.
   * @param whichPlayer - The player to look for.
   * @returns `true` when the player is in the force.
   * @native BlzForceHasPlayer
   */
  public hasPlayer(whichPlayer: MapPlayer) {
    return BlzForceHasPlayer(this.handle, whichPlayer.handle);
  }

  /**
   * Removes a player from the force; a player not in it is ignored.
   * @param whichPlayer - The player to remove.
   * @native ForceRemovePlayer
   */
  public removePlayer(whichPlayer: MapPlayer) {
    ForceRemovePlayer(this.handle, whichPlayer.handle);
  }

  /**
   * Creates a force holding `whichPlayer`: a new force on every call, which
   * the caller destroys.
   * @remarks
   * It creates the force and adds the player with Natives; w3ts 3.x called
   * the Blizzard.j function `GetForceOfPlayer`, with the same result.
   * @param whichPlayer - The player the force holds.
   * @returns The new force.
   * @throws When the game returns no handle:
   * `reforged-ts: failed to create Force`, at the calling line.
   * @throws In Dev mode, when called before the globals Init stage:
   * `reforged-ts: Force created before the globals Init stage: create Handles in Init.onGlobals or a later stage, not at module top level`.
   * @throws In Dev mode, inside `MapPlayer.runLocal`:
   * `reforged-ts: creating a Force inside MapPlayer.runLocal changes game state for one client, which desyncs the game: only visuals belong inside runLocal`.
   * @native CreateForce
   * @native ForceAddPlayer
   */
  public static fromPlayer(whichPlayer: MapPlayer): Force {
    const handle = CreateForce();
    if (handle !== undefined) {
      ForceAddPlayer(handle, whichPlayer.handle);
    }
    return this.expect(handle);
  }
}
