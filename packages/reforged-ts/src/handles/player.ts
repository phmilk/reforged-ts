/** @noSelfInFile */

import { configuration } from "../reforged/configuration";
import { runLocalGuarded } from "../reforged/local";
import type { Force } from "./force";
import { expectWrapper, Handle } from "./handle";
import { Point } from "./point";
import type { Rectangle } from "./rect";

/**
 * A player slot. Players are not created: the game has one per slot, and
 * {@link MapPlayer.fromIndex} looks it up. A Map project may extend this
 * class with its own player model; the lookups inherited from the base then
 * give instances of the subclass.
 * @remarks
 * - Named `MapPlayer` because the Native type name, `player`, collides with
 *   the Native function `Player`.
 * - {@link tsGlobals.Players} holds one `MapPlayer` per slot, `Players[i]` for
 *   slot `i`, but only from the `globals` Init stage on: the library fills
 *   it after `InitGlobals`, before any `Init.onGlobals` callback of the Map
 *   project. At module top level it is empty (w3ts 3.x filled it when the
 *   library loaded). {@link MapPlayer.fromIndex} works at any time.
 * - A lookup through a subclass replaces the `MapPlayer` that
 *   `tsGlobals.Players` holds for that slot: the array keeps the old object,
 *   which still works but is no longer `===` to later lookups.
 * @example Greeting every user in the game
 * {@includeCode ../../examples/harness/map-player-players.ts}
 * @native player
 */
export class MapPlayer extends Handle<player> {
  /**
   * Gets the difficulty of the player's computer AI.
   * @returns The difficulty, such as `AI_DIFFICULTY_NORMAL`, or `undefined`
   * when the game gives none.
   * @native GetAIDifficulty
   */
  public get aiDifficulty() {
    return GetAIDifficulty(this.handle);
  }

  /**
   * Sets the colour the game shows the player in, such as
   * `PLAYER_COLOR_BLUE`: their name, and the units created from now on.
   * @remarks
   * The units the player owns already keep their colour: set theirs one by
   * one.
   * @native SetPlayerColor
   */
  public set color(color: playercolor) {
    SetPlayerColor(this.handle, color);
  }

  /**
   * Gets the colour the game shows the player in.
   * @returns The colour, such as `PLAYER_COLOR_RED`.
   * @native GetPlayerColor
   */
  public get color() {
    return GetPlayerColor(this.handle);
  }

  /**
   * Gets who controls the player's slot.
   * @returns The controller, such as `MAP_CONTROL_USER` for a person or
   * `MAP_CONTROL_COMPUTER` for the computer.
   * @native GetPlayerController
   */
  public get controller() {
    return GetPlayerController(this.handle);
  }

  /**
   * Sets who controls the player's slot, such as `MAP_CONTROL_COMPUTER`.
   * @remarks
   * It is meant for the map's `config` function, which the game runs while
   * it sets up the lobby.
   * @native SetPlayerController
   */
  public set controller(controlType: mapcontrol) {
    SetPlayerController(this.handle, controlType);
  }

  /**
   * Gets the player's handicap: the share of their units' maximum life they
   * get.
   * @returns The share, 1 when there is no handicap.
   * @native GetPlayerHandicap
   */
  public get handicap() {
    return GetPlayerHandicap(this.handle);
  }

  /**
   * Sets the player's handicap: the share of their units' maximum life they
   * get; 1 is no handicap.
   * @native SetPlayerHandicap
   */
  public set handicap(handicap: number) {
    SetPlayerHandicap(this.handle, handicap);
  }

  /**
   * Gets the player's damage handicap: the share of their units' damage they
   * deal.
   * @returns The share, 1 when there is no handicap.
   * @native GetPlayerHandicapDamage
   */
  public get handicapDamage() {
    return GetPlayerHandicapDamage(this.handle);
  }

  /**
   * Sets the player's damage handicap: the share of their units' damage they
   * deal; 1 is no handicap.
   * @native SetPlayerHandicapDamage
   */
  public set handicapDamage(handicap: number) {
    SetPlayerHandicapDamage(this.handle, handicap);
  }

  /**
   * Gets the player's revive time handicap: the factor applied to the time
   * their heroes take to revive.
   * @returns The factor, 1 when there is no handicap.
   * @native GetPlayerHandicapReviveTime
   */
  public get handicapReviveTime() {
    return GetPlayerHandicapReviveTime(this.handle);
  }

  /**
   * Sets the player's revive time handicap: the factor applied to the time
   * their heroes take to revive; 1 is no handicap.
   * @native SetPlayerHandicapReviveTime
   */
  public set handicapReviveTime(handicap: number) {
    SetPlayerHandicapReviveTime(this.handle, handicap);
  }

  /**
   * Gets the player's experience handicap: the share of the experience their
   * heroes gain.
   * @returns The share, 1 when there is no handicap.
   * @native GetPlayerHandicapXP
   */
  public get handicapXp() {
    return GetPlayerHandicapXP(this.handle);
  }

  /**
   * Sets the player's experience handicap: the share of the experience their
   * heroes gain; 1 is no handicap.
   * @native SetPlayerHandicapXP
   */
  public set handicapXp(handicap: number) {
    SetPlayerHandicapXP(this.handle, handicap);
  }

  /**
   * Gets the player's slot number, the index {@link MapPlayer.fromIndex} and
   * the Native `Player` take.
   * @remarks
   * Unlike the `id` of every other Wrapper, it is not the handle id.
   * @returns The slot number, from 0: 0 for the first slot (red), 1 for the
   * second (blue).
   * @native GetPlayerId
   */
  public override get id() {
    return GetPlayerId(this.handle);
  }

  /**
   * Gets the name the game shows for the player.
   * @returns The name, or an empty string when the game gives none.
   * @native GetPlayerName
   */
  public get name() {
    return GetPlayerName(this.handle) ?? "";
  }

  /**
   * Sets the name the game shows for the player, on every client.
   * @native SetPlayerName
   */
  public set name(value: string) {
    SetPlayerName(this.handle, value);
  }

  /**
   * Gets the race the player plays in this game.
   * @returns The race, such as `RACE_HUMAN`; for a player who picked random
   * in the lobby, the race the game drew.
   * @native GetPlayerRace
   */
  public get race() {
    return GetPlayerRace(this.handle);
  }

  /**
   * Gets whether the player's slot is in the game.
   * @returns `PLAYER_SLOT_STATE_PLAYING` for a player in the game,
   * `PLAYER_SLOT_STATE_LEFT` for one who left, `PLAYER_SLOT_STATE_EMPTY` for
   * an empty slot.
   * @native GetPlayerSlotState
   */
  public get slotState() {
    return GetPlayerSlotState(this.handle);
  }

  /**
   * Gets the index of the player's start location, among the start
   * locations the map places.
   * @returns The index: by default the player's slot number when the map
   * gives the slot a start location, and -1 when it gives none.
   * @native GetPlayerStartLocation
   */
  public get startLocation() {
    return GetPlayerStartLocation(this.handle);
  }

  /**
   * Sets which of the map's start locations the player starts at, by index.
   * @remarks
   * It is meant for the map's `config` function, which the game runs while
   * it sets up the lobby.
   * @native SetPlayerStartLocation
   */
  public set startLocation(startLocIndex: number) {
    SetPlayerStartLocation(this.handle, startLocIndex);
  }

  /**
   * Gets the x-coordinate of the player's start location.
   * @returns The x-coordinate, in world units.
   * @native GetPlayerStartLocation
   * @native GetStartLocationX
   */
  public get startLocationX() {
    return GetStartLocationX(this.startLocation);
  }

  /**
   * Gets the y-coordinate of the player's start location.
   * @returns The y-coordinate, in world units.
   * @native GetPlayerStartLocation
   * @native GetStartLocationY
   */
  public get startLocationY() {
    return GetStartLocationY(this.startLocation);
  }

  /**
   * Gets the player's start location as a new Point.
   * @remarks
   * - Each read creates a Point: destroy it when done, or read
   *   {@link MapPlayer.startLocationX} and {@link MapPlayer.startLocationY},
   *   which create nothing.
   * - In w3ts 3.x this returned the raw `location` Handle, which the caller
   *   removed with `RemoveLocation`, or `undefined` when the game returned
   *   none; it now returns the Point, and throws when the game returns none.
   * @returns A new Point at the start location.
   * @throws When the game returns no location:
   * `reforged-ts: failed to create Point`, at the calling line. In Dev mode
   * it also raises before the globals Init stage and inside
   * {@link MapPlayer.runLocal}, as every creation does.
   * @native GetPlayerStartLocation
   * @native GetStartLocationLoc
   */
  public get startLocationPoint(): Point {
    return expectWrapper(Point, GetStartLocationLoc(this.startLocation));
  }

  /**
   * Gets the number of the team the player is on.
   * @returns The team number, from 0.
   * @native GetPlayerTeam
   */
  public get team() {
    return GetPlayerTeam(this.handle);
  }

  /**
   * Sets the number of the team the player is on, from 0.
   * @native SetPlayerTeam
   */
  public set team(whichTeam: number) {
    SetPlayerTeam(this.handle, whichTeam);
  }

  /**
   * Gets the player's tournament score, which the melee rules compare to pick
   * the winner when a tournament game's time limit runs out.
   * @returns The score, a whole number.
   * @native GetTournamentScore
   */
  public get tournamentScore() {
    return GetTournamentScore(this.handle);
  }

  /**
   * Gets the player's town halls, counted by tier: a tier 1 hall counts 1, a
   * tier 2 hall 2, a tier 3 hall 3.
   * @returns The sum of the tiers of the player's town halls, 0 when they
   * have none.
   * @native BlzGetPlayerTownHallCount
   */
  public get townHallCount() {
    return BlzGetPlayerTownHallCount(this.handle);
  }

  /**
   * Raises the research level of one of the player's upgrades by `levels`.
   * @param techId - The upgrade's rawcode, such as `FourCC("Rhar")`.
   * @param levels - How many levels to add to its current level.
   * @native AddPlayerTechResearched
   */
  public addTechResearched(techId: number, levels: number) {
    AddPlayerTechResearched(this.handle, techId, levels);
  }

  /**
   * Lowers the research level of one of the player's upgrades by `levels`.
   * @param techId - The upgrade's rawcode, such as `FourCC("Rhar")`.
   * @param levels - How many levels to remove from its current level. A
   * negative count adds none: raise a level with
   * {@link MapPlayer.addTechResearched}.
   * @native BlzDecPlayerTechResearched
   */
  public decTechResearched(techId: number, levels: number) {
    BlzDecPlayerTechResearched(this.handle, techId, levels);
  }

  /**
   * Stores the levels of the player's heroes for the score screen. A melee
   * game calls it before it hands a defeated player's units to Neutral
   * Passive.
   * @native CachePlayerHeroData
   */
  public cacheHeroData() {
    CachePlayerHeroData(this.handle);
  }

  /**
   * Sends a command to the player's AI script, which reads it with
   * `GetLastCommand` and `GetLastData`.
   * @param command - The command number, as the AI script defines it.
   * @param data - The number sent with the command.
   * @native CommandAI
   */
  public commandAI(command: number, data: number) {
    CommandAI(this.handle, command, data);
  }

  /**
   * Checks whether the player grants `otherPlayer` one alliance setting.
   * @param otherPlayer - The player who would receive the setting.
   * @param whichAllianceSetting - The setting, such as
   * `ALLIANCE_SHARED_VISION`.
   * @returns `true` when the player grants it.
   * @native GetPlayerAlliance
   */
  public compareAlliance(
    otherPlayer: MapPlayer,
    whichAllianceSetting: alliancetype,
  ) {
    return GetPlayerAlliance(
      this.handle,
      otherPlayer.handle,
      whichAllianceSetting,
    );
  }

  /**
   * Checks whether a point is under the fog of war for the player: explored,
   * but not in sight now.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @returns `true` when the point is fogged.
   * @native IsFoggedToPlayer
   */
  public coordsFogged(x: number, y: number) {
    return IsFoggedToPlayer(x, y, this.handle);
  }

  /**
   * Checks whether a point is under the black mask for the player: never
   * explored.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @returns `true` when the point is masked.
   * @native IsMaskedToPlayer
   */
  public coordsMasked(x: number, y: number) {
    return IsMaskedToPlayer(x, y, this.handle);
  }

  /**
   * Checks whether a point is in sight of the player now.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @returns `true` when the player sees the point.
   * @native IsVisibleToPlayer
   */
  public coordsVisible(x: number, y: number) {
    return IsVisibleToPlayer(x, y, this.handle);
  }

  /**
   * Shows the player's remaining buildings to a force, lifting the black
   * mask over them as though their area were explored.
   * @remarks It reveals the buildings whether or not the player still has a
   * town hall.
   * @param toWhichPlayers - The players who get to see the buildings.
   * @param flag - `true` to reveal the buildings. `false` stops revealing
   * them, but does not put the black mask back over them.
   * @native CripplePlayer
   */
  public cripple(toWhichPlayers: Force, flag: boolean) {
    CripplePlayer(this.handle, toWhichPlayers.handle, flag);
  }

  /**
   * Shows `message` in the chat as a message this player sent. This player
   * is the sender, not the viewer: the message shows on every client that
   * runs the call, so {@link MapPlayer.runLocal} shows it to one player.
   * @remarks
   * The chat log (F12) does not keep the message.
   * @param recipient - The chat channel the message is labelled with: 0 for
   * all, 1 for allies, 2 for observers, 3 or more for private. It does not
   * change who sees the message.
   * @param message - The text, which may hold colour codes.
   * @native BlzDisplayChatMessage
   */
  public displayChatMessage(recipient: number, message: string) {
    BlzDisplayChatMessage(this.handle, recipient, message);
  }

  /**
   * Shows `message` on the player's screen for a time that grows with its
   * length. The game formats the string: a lone `%` garbles it.
   * @param x - The horizontal position of the text box, from 0 to 1; 0 is
   * the default. It moves the lines already shown too.
   * @param y - The vertical position of the text box, from 0 to 1; 0 is the
   * default.
   * @param message - The text, which may hold colour codes.
   * @native DisplayTextToPlayer
   */
  public displayText(x: number, y: number, message: string) {
    DisplayTextToPlayer(this.handle, x, y, message);
  }

  /**
   * Shows `message` on the player's screen for `duration` seconds. The game
   * formats the string: a lone `%` garbles it.
   * @param x - The horizontal position of the text box, from 0 to 1; 0 is
   * the default.
   * @param y - The vertical position of the text box, from 0 to 1; 0 is the
   * default.
   * @param duration - How long the text shows, in seconds.
   * @param message - The text, which may hold colour codes.
   * @native DisplayTimedTextToPlayer
   */
  public displayTimedText(
    x: number,
    y: number,
    duration: number,
    message: string,
  ) {
    DisplayTimedTextToPlayer(this.handle, x, y, duration, message);
  }

  /**
   * Shows `message` on every player's screen for `duration` seconds, with
   * the first `%s` in it replaced by this player's name, as the game's own
   * "has left the game" line does.
   * @remarks
   * The game formats the string: only the first `%s` is replaced, and a
   * second `%s`, any other `%` code or a lone `%` shows garbage; jassdoc
   * reports that a second `%s` can crash the game in Lua.
   * @param x - The horizontal position of the text box, from 0 to 1; 0 is
   * the default.
   * @param y - The vertical position of the text box, from 0 to 1; 0 is the
   * default.
   * @param duration - How long the text shows, in seconds.
   * @param message - The text, with at most one `%s` for the player's name.
   * @native DisplayTimedTextFromPlayer
   */
  public displayTimedTextFrom(
    x: number,
    y: number,
    duration: number,
    message: string,
  ) {
    DisplayTimedTextFromPlayer(this.handle, x, y, duration, message);
  }

  /**
   * Fixes the player's start location and marks it taken, so the random
   * placement of the other players skips it.
   * @remarks
   * It is meant for the map's `config` function, which the game runs while
   * it sets up the lobby.
   * @param startLocIndex - The index of the start location, among those the
   * map places.
   * @native ForcePlayerStartLocation
   */
  public forceStartLocation(startLocIndex: number) {
    ForcePlayerStartLocation(this.handle, startLocIndex);
  }

  /**
   * Gets one of the player's scores, as the score screen shows them.
   * @param whichPlayerScore - The score, such as
   * `PLAYER_SCORE_UNITS_KILLED`.
   * @returns The score's value.
   * @native GetPlayerScore
   */
  public getScore(whichPlayerScore: playerscore) {
    return GetPlayerScore(this.handle, whichPlayerScore);
  }

  /**
   * Gets one of the player's state values, such as their gold.
   * @param whichPlayerState - The value, such as
   * `PLAYER_STATE_RESOURCE_GOLD`.
   * @returns The value, a whole number.
   * @native GetPlayerState
   */
  public getState(whichPlayerState: playerstate) {
    return GetPlayerState(this.handle, whichPlayerState);
  }

  /**
   * Counts the player's buildings.
   * @param includeIncomplete - Whether buildings still under construction
   * count.
   * @returns The number of buildings.
   * @native GetPlayerStructureCount
   */
  public getStructureCount(includeIncomplete: boolean) {
    return GetPlayerStructureCount(this.handle, includeIncomplete);
  }

  /**
   * Gets the share of one resource the player gathers that goes to
   * `otherPlayer`.
   * @remarks
   * In w3ts 3.x `otherPlayer` was the raw `player` Handle; it is now the
   * `MapPlayer`, as {@link MapPlayer.setTaxRate} takes it.
   * @param otherPlayer - The player who receives it.
   * @param whichResource - `PLAYER_STATE_RESOURCE_GOLD` or
   * `PLAYER_STATE_RESOURCE_LUMBER`.
   * @returns The rate, in percent.
   * @native GetPlayerTaxRate
   */
  public getTaxRate(otherPlayer: MapPlayer, whichResource: playerstate) {
    return GetPlayerTaxRate(this.handle, otherPlayer.handle, whichResource);
  }

  /**
   * Gets the player's level of a tech: an upgrade's research level, or how
   * many units of a type the player controls.
   * @param techId - The tech's rawcode: an upgrade such as `FourCC("Rhar")`,
   * a unit type such as `FourCC("hfoo")`, or an equivalent such as
   * `FourCC("HERO")` (any hero) or `FourCC("TWN1")` (a tier 1 town hall).
   * @param specificonly - `true` to count exact matches only; `false` to also
   * count what the tech tree treats as the same, such as a higher tier town
   * hall for a lower one.
   * @returns The upgrade's level, 0 when not researched, or the number of
   * units.
   * @native GetPlayerTechCount
   */
  public getTechCount(techId: number, specificonly: boolean) {
    return GetPlayerTechCount(this.handle, techId, specificonly);
  }

  /**
   * Gets the player's limit on a tech: the most units of a type they may
   * have, or the highest level of an upgrade they may research.
   * @param techId - The unit type's or upgrade's rawcode, such as
   * `FourCC("hfoo")`.
   * @returns The limit; a very large number when none was set.
   * @native GetPlayerTechMaxAllowed
   */
  public getTechMaxAllowed(techId: number) {
    return GetPlayerTechMaxAllowed(this.handle, techId);
  }

  /**
   * Checks whether the player has researched an upgrade, or has a unit of a
   * type.
   * @param techId - The tech's rawcode, such as `FourCC("Rhar")`.
   * @param specificonly - `true` to count exact matches only; `false` to also
   * count what the tech tree treats as the same, as
   * {@link MapPlayer.getTechCount} does.
   * @returns `true` when the player has it.
   * @native GetPlayerTechResearched
   */
  public getTechResearched(techId: number, specificonly: boolean) {
    return GetPlayerTechResearched(this.handle, techId, specificonly);
  }

  /**
   * Counts the player's units.
   * @param includeIncomplete - Whether units still in training or under
   * construction count.
   * @returns The number of units.
   * @native GetPlayerUnitCount
   */
  public getUnitCount(includeIncomplete: boolean) {
    return GetPlayerUnitCount(this.handle, includeIncomplete);
  }

  /**
   * Counts the player's units of one type.
   * @param unitName - The unit type's internal name, such as `"footman"`
   * for `FourCC("hfoo")`, not its rawcode or its localized name.
   * @param includeIncomplete - Whether units still in training or under
   * construction count.
   * @param includeUpgrades - Whether the units this type upgrades into count.
   * @returns The number of units.
   * @native GetPlayerTypedUnitCount
   */
  public getUnitCountByType(
    unitName: string,
    includeIncomplete: boolean,
    includeUpgrades: boolean,
  ) {
    return GetPlayerTypedUnitCount(
      this.handle,
      unitName,
      includeIncomplete,
      includeUpgrades,
    );
  }

  /**
   * Checks whether the player is in a force.
   * @param whichForce - The force to look in.
   * @returns `true` when the player is in it.
   * @native IsPlayerInForce
   */
  public inForce(whichForce: Force) {
    return IsPlayerInForce(this.handle, whichForce.handle);
  }

  /**
   * Checks whether this is the local player: the player of the client
   * running the code.
   * @remarks
   * The result differs between clients: let it decide visuals only, never
   * game state. {@link MapPlayer.runLocal} runs code for one player.
   * @example A text tag its owner alone sees
   * {@includeCode ../../examples/game/local-player.ts}
   * @returns `true` on this player's client, `false` on every other.
   * @native GetLocalPlayer
   * @async
   */
  public isLocal() {
    return GetLocalPlayer() === this.handle;
  }

  /**
   * Checks whether the player watches the game as an observer instead of
   * playing it.
   * @returns `true` for an observer.
   * @native IsPlayerObserver
   */
  public isObserver() {
    return IsPlayerObserver(this.handle);
  }

  /**
   * Checks whether the player is allied to `otherPlayer`.
   * @param otherPlayer - The other player.
   * @returns `true` when they are allies.
   * @native IsPlayerAlly
   */
  public isPlayerAlly(otherPlayer: MapPlayer) {
    return IsPlayerAlly(this.handle, otherPlayer.handle);
  }

  /**
   * Checks whether the player is an enemy of `otherPlayer`.
   * @param otherPlayer - The other player.
   * @returns `true` when they are enemies.
   * @native IsPlayerEnemy
   */
  public isPlayerEnemy(otherPlayer: MapPlayer) {
    return IsPlayerEnemy(this.handle, otherPlayer.handle);
  }

  /**
   * Checks whether the player's race preference is `pref`.
   * @param pref - The preference, such as `RACE_PREF_HUMAN`.
   * @returns `true` when it is set.
   * @native IsPlayerRacePrefSet
   */
  public isRacePrefSet(pref: racepreference) {
    return IsPlayerRacePrefSet(this.handle, pref);
  }

  /**
   * Checks whether the player may choose their race, as
   * {@link MapPlayer.setRaceSelectable} sets it.
   * @returns `true` when they may.
   * @native GetPlayerSelectable
   */
  public isSelectable() {
    return GetPlayerSelectable(this.handle);
  }

  /**
   * Pauses or resumes the player's computer AI script.
   * @param pause - `true` to pause it, `false` to resume it.
   * @native PauseCompAI
   */
  public pauseCompAI(pause: boolean) {
    PauseCompAI(this.handle, pause);
  }

  /**
   * Checks whether a point is under the fog of war for the player: explored,
   * but not in sight now.
   * @param whichPoint - The point.
   * @returns `true` when the point is fogged.
   * @native IsLocationFoggedToPlayer
   */
  public pointFogged(whichPoint: Point) {
    return IsLocationFoggedToPlayer(whichPoint.handle, this.handle);
  }

  /**
   * Checks whether a point is under the black mask for the player: never
   * explored.
   * @param whichPoint - The point.
   * @returns `true` when the point is masked.
   * @native IsLocationMaskedToPlayer
   */
  public pointMasked(whichPoint: Point) {
    return IsLocationMaskedToPlayer(whichPoint.handle, this.handle);
  }

  /**
   * Checks whether a point is in sight of the player now.
   * @param whichPoint - The point.
   * @returns `true` when the player sees the point.
   * @native IsLocationVisibleToPlayer
   */
  public pointVisible(whichPoint: Point) {
    return IsLocationVisibleToPlayer(whichPoint.handle, this.handle);
  }

  /**
   * Removes the player from the game with a result, as a victory or a
   * defeat does.
   * @param gameResult - The result, such as `PLAYER_GAME_RESULT_DEFEAT`.
   * @native RemovePlayer
   */
  public remove(gameResult: playergameresult) {
    RemovePlayer(this.handle, gameResult);
  }

  /**
   * Clears the guard positions of the player's units, the places they return
   * to after a chase.
   * @native RemoveAllGuardPositions
   */
  public removeAllGuardPositions() {
    RemoveAllGuardPositions(this.handle);
  }

  /**
   * Enables or disables an ability for every unit of the player.
   * @param abilId - The ability's rawcode, such as `FourCC("AHbz")`.
   * @param avail - `true` to enable it, `false` to disable it.
   * @native SetPlayerAbilityAvailable
   */
  public setAbilityAvailable(abilId: number, avail: boolean) {
    SetPlayerAbilityAvailable(this.handle, abilId, avail);
  }

  /**
   * Grants `otherPlayer` one alliance setting from this player, or takes it
   * back. The players need not be allies.
   * @param otherPlayer - The player who receives the setting.
   * @param whichAllianceSetting - The setting, such as
   * `ALLIANCE_SHARED_VISION` to share this player's vision with
   * `otherPlayer`.
   * @param value - `true` to grant it, `false` to take it back.
   * @native SetPlayerAlliance
   */
  public setAlliance(
    otherPlayer: MapPlayer,
    whichAllianceSetting: alliancetype,
    value: boolean,
  ) {
    SetPlayerAlliance(
      this.handle,
      otherPlayer.handle,
      whichAllianceSetting,
      value,
    );
  }

  /**
   * Adds or removes blight in a circle.
   * @param x - The centre's x-coordinate, in world units.
   * @param y - The centre's y-coordinate, in world units.
   * @param radius - The radius, in world units.
   * @param addBlight - `true` to add blight, `false` to remove it.
   * @native SetBlight
   */
  public setBlight(x: number, y: number, radius: number, addBlight: boolean) {
    SetBlight(this.handle, x, y, radius, addBlight);
  }

  /**
   * Adds or removes blight in a circle around `where`.
   * @param where - The centre.
   * @param radius - The radius, in world units.
   * @param addBlight - `true` to add blight, `false` to remove it.
   * @native SetBlightLoc
   */
  public setBlightAtPoint(where: Point, radius: number, addBlight: boolean) {
    SetBlightLoc(this.handle, where.handle, radius, addBlight);
  }

  /**
   * Adds or removes blight at one point.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @param addBlight - `true` to add blight, `false` to remove it.
   * @native SetBlightPoint
   */
  public setBlightPoint(x: number, y: number, addBlight: boolean) {
    SetBlightPoint(this.handle, x, y, addBlight);
  }

  /**
   * Adds or removes blight over `where`.
   * @param where - The area.
   * @param addBlight - `true` to add blight, `false` to remove it.
   * @native SetBlightRect
   */
  public setBlightRect(where: Rectangle, addBlight: boolean) {
    SetBlightRect(this.handle, where.handle, addBlight);
  }

  /**
   * Sets the fog state over a circle for the player.
   * @param whichState - The state, such as `FOG_OF_WAR_VISIBLE`,
   * `FOG_OF_WAR_FOGGED` or `FOG_OF_WAR_MASKED`.
   * @param centerX - The centre's x-coordinate, in world units.
   * @param centerY - The centre's y-coordinate, in world units.
   * @param radius - The radius, in world units.
   * @param useSharedVision - Whether the players this player shares vision
   * with get the state too.
   * @native SetFogStateRadius
   */
  public setFogStateRadius(
    whichState: fogstate,
    centerX: number,
    centerY: number,
    radius: number,
    useSharedVision: boolean,
  ) {
    SetFogStateRadius(
      this.handle,
      whichState,
      centerX,
      centerY,
      radius,
      useSharedVision,
    );
  }

  /**
   * Sets the fog state over a circle around `center` for the player.
   * @param whichState - The state, such as `FOG_OF_WAR_VISIBLE`,
   * `FOG_OF_WAR_FOGGED` or `FOG_OF_WAR_MASKED`.
   * @param center - The centre.
   * @param radius - The radius, in world units.
   * @param useSharedVision - Whether the players this player shares vision
   * with get the state too.
   * @native SetFogStateRadiusLoc
   */
  public setFogStateRadiusAtPoint(
    whichState: fogstate,
    center: Point,
    radius: number,
    useSharedVision: boolean,
  ) {
    SetFogStateRadiusLoc(
      this.handle,
      whichState,
      center.handle,
      radius,
      useSharedVision,
    );
  }

  /**
   * Sets the fog state over `where` for the player.
   * @param whichState - The state, such as `FOG_OF_WAR_VISIBLE`,
   * `FOG_OF_WAR_FOGGED` or `FOG_OF_WAR_MASKED`.
   * @param where - The area.
   * @param useSharedVision - Whether the players this player shares vision
   * with get the state too.
   * @native SetFogStateRect
   */
  public setFogStateRect(
    whichState: fogstate,
    where: Rectangle,
    useSharedVision: boolean,
  ) {
    SetFogStateRect(this.handle, whichState, where.handle, useSharedVision);
  }

  /**
   * Shows or hides the player on the score screen at the end of the game.
   * @param flag - `true` to show the player, `false` to hide them.
   * @native SetPlayerOnScoreScreen
   */
  public setOnScoreScreen(flag: boolean) {
    SetPlayerOnScoreScreen(this.handle, flag);
  }

  /**
   * Sets the player's race preference, the race they pick in the lobby.
   * @remarks
   * It is meant for the map's `config` function, which the game runs while
   * it sets up the lobby.
   * @param whichRacePreference - The preference, such as `RACE_PREF_ORC`.
   * @native SetPlayerRacePreference
   */
  public setRacePreference(whichRacePreference: racepreference) {
    SetPlayerRacePreference(this.handle, whichRacePreference);
  }

  /**
   * Sets whether the player may choose a race; {@link MapPlayer.isSelectable}
   * reads it.
   * @remarks
   * It is meant for the map's `config` function, which the game runs while
   * it sets up the lobby.
   * @param value - `true` to let the player choose.
   * @native SetPlayerRaceSelectable
   */
  public setRaceSelectable(value: boolean) {
    SetPlayerRaceSelectable(this.handle, value);
  }

  /**
   * Sets the player's race skin, such as `RACE_PREF_FORSAKEN`.
   * @param pref - The race preference whose skin the player's units take.
   * @native SetPlayerRaceSkin
   */
  public setRaceSkin(pref: racepreference) {
    SetPlayerRaceSkin(this.handle, pref);
  }

  /**
   * Sets one of the player's state values, such as their gold.
   * @param whichPlayerState - The value, such as
   * `PLAYER_STATE_RESOURCE_GOLD`.
   * @param value - The new value, a whole number.
   * @native SetPlayerState
   */
  public setState(whichPlayerState: playerstate, value: number) {
    SetPlayerState(this.handle, whichPlayerState, value);
  }

  /**
   * Sets the share of one resource the player gathers that goes to
   * `otherPlayer`.
   * @param otherPlayer - The player who receives it.
   * @param whichResource - `PLAYER_STATE_RESOURCE_GOLD` or
   * `PLAYER_STATE_RESOURCE_LUMBER`.
   * @param rate - The rate, in percent, from 0 to 100.
   * @native SetPlayerTaxRate
   */
  public setTaxRate(
    otherPlayer: MapPlayer,
    whichResource: playerstate,
    rate: number,
  ) {
    SetPlayerTaxRate(this.handle, otherPlayer.handle, whichResource, rate);
  }

  /**
   * Limits a tech for the player: the most units of a type they may have,
   * or the highest level of an upgrade they may research.
   * @param techId - The unit type's or upgrade's rawcode, such as
   * `FourCC("hfoo")`.
   * @param maximum - The limit: 0 forbids the tech, -1 lifts the limit.
   * @native SetPlayerTechMaxAllowed
   */
  public setTechMaxAllowed(techId: number, maximum: number) {
    SetPlayerTechMaxAllowed(this.handle, techId, maximum);
  }

  /**
   * Sets the research level of one of the player's upgrades.
   * @param techId - The upgrade's rawcode, such as `FourCC("Rhar")`.
   * @param setToLevel - The research level the upgrade gets, whatever its
   * current level.
   * @native SetPlayerTechResearched
   */
  public setTechResearched(techId: number, setToLevel: number) {
    SetPlayerTechResearched(this.handle, techId, setToLevel);
  }

  /**
   * Gives every unit of the player to another player.
   * @param newOwner - The slot number of the player who receives them, as
   * {@link MapPlayer.id} gives it.
   * @native SetPlayerUnitsOwner
   */
  public setUnitsOwner(newOwner: number) {
    SetPlayerUnitsOwner(this.handle, newOwner);
  }

  /**
   * Starts the campaign AI script `script` for the player.
   * @param script - The AI script's path in the game files, such as
   * `Scripts\human.ai`.
   * @native StartCampaignAI
   */
  public startCampaignAI(script: string) {
    StartCampaignAI(this.handle, script);
  }

  /**
   * Starts the melee AI script `script` for the player.
   * @param script - The AI script's path in the game files, such as
   * `Scripts\human.ai`.
   * @native StartMeleeAI
   */
  public startMeleeAI(script: string) {
    StartMeleeAI(this.handle, script);
  }

  /**
   * Gets the player who detected a unit, in a detection event.
   * @returns The player, or `undefined` outside a detection event.
   * @native GetEventDetectingPlayer
   */
  public static fromDetecting(): MapPlayer | undefined {
    return this.fromHandle(GetEventDetectingPlayer());
  }

  /**
   * Gets the player of the current step of a force enumeration, such as a
   * {@link Force.for} callback.
   * @returns The player, or `undefined` outside an enumeration callback.
   * @native GetEnumPlayer
   */
  public static fromEnum(): MapPlayer | undefined {
    return this.fromHandle(GetEnumPlayer());
  }

  /**
   * Gets the player the running event is about, in a player event or a
   * player-unit event.
   * @returns The player, or `undefined` outside an event that has one.
   * @native GetTriggerPlayer
   */
  public static fromEvent(): MapPlayer | undefined {
    return this.fromHandle(GetTriggerPlayer());
  }

  /**
   * Gets the player a force enumeration's filter is testing, such as in the
   * filter of {@link Force.enumPlayers}.
   * @returns The player, or `undefined` outside a filter.
   * @native GetFilterPlayer
   */
  public static fromFilter(): MapPlayer | undefined {
    return this.fromHandle(GetFilterPlayer());
  }

  /**
   * Gets the player in slot `index`.
   * @param index - The slot number, from 0 (red) to `bj_MAX_PLAYER_SLOTS`
   * minus 1; the neutral players hold the last slots.
   * @returns The player, or `undefined` for an index outside the slots.
   * @native Player
   */
  public static fromIndex(index: number): MapPlayer | undefined {
    return this.fromHandle(Player(index));
  }

  /**
   * Gets the local player: the player of the client running the code.
   * @remarks
   * - The result differs between clients: let it decide visuals only, never
   *   game state. {@link MapPlayer.runLocal} runs code for one player.
   * - `GetLocalPlayer` never returns nothing, which the Typings cannot
   *   express for the Wrapper, so this goes through the non-null lookup
   *   helper: typed non-null, and should the game ever break that invariant
   *   it throws instead of returning undefined.
   * - It prints nothing. In w3ts 3.x it printed ten lines on screen when the
   *   Native returned nothing; it throws now.
   * @example A text tag its owner alone sees
   * {@includeCode ../../examples/game/local-player.ts}
   * @returns The local player, never `undefined`.
   * @throws Should the game ever return no player:
   * `reforged-ts: failed to create MapPlayer`, at the calling line.
   * @native GetLocalPlayer
   * @async
   */
  public static fromLocal(): MapPlayer {
    return this.expectFound(GetLocalPlayer());
  }

  /**
   * Gets the owner a unit had before an ownership change, in that event.
   * @returns The previous owner, or `undefined` outside an ownership change
   * event.
   * @native GetChangingUnitPrevOwner
   */
  public static fromPreviousOwner(): MapPlayer | undefined {
    return this.fromHandle(GetChangingUnitPrevOwner());
  }

  /**
   * Gets the player who ended a tournament game early, in that event.
   * @returns The player, or `undefined` outside that event.
   * @native GetTournamentFinishNowPlayer
   */
  public static fromTournamentFinishNow(): MapPlayer | undefined {
    return this.fromHandle(GetTournamentFinishNowPlayer());
  }

  /**
   * Gets the winning player, in a victory event.
   * @returns The player, or `undefined` outside a victory event.
   * @native GetWinningPlayer
   */
  public static fromWinning(): MapPlayer | undefined {
    return this.fromHandle(GetWinningPlayer());
  }

  /**
   * Runs `fn` on the client whose local player is `player`, and does nothing
   * on every other client: the one way to run code for one player, in place
   * of a `GetLocalPlayer()` comparison.
   *
   * @remarks Only visuals belong inside `fn`: what it shows (text, frames,
   * sounds, camera, colours) may differ between clients, but anything that
   * changes game state runs on one client only and desyncs the game. With
   * Dev mode off this is the bare local-player comparison. In Dev mode `fn`
   * runs under pcall, so an error inside is reported on screen and printed
   * like a failing callback's
   * (`reforged-ts: MapPlayer#<id> MapPlayer.runLocal failed: <error>`), once
   * per function and message, and does not escape; and inside it creating or
   * destroying a Wrapper, `Group.for`, `Force.for` and the first
   * `Frame.fromName` of a frame raise
   * `reforged-ts: <action> inside MapPlayer.runLocal changes game state for one client, which desyncs the game: only visuals belong inside runLocal`.
   * A creation or destruction raises after its Native ran, so the Guard does
   * not undo it: it names the offending line while you test in Dev mode, so
   * the bug is found before a release build reaches a lobby.
   * Create what `fn` needs before calling `runLocal`, on every client.
   * @example
   * {@includeCode ../../examples/game/run-local-frame.ts}
   * @param player - The player whose client runs `fn`.
   * @param fn - What to run there: visuals only.
   * @native GetLocalPlayer
   * @async
   */
  public static runLocal(player: MapPlayer, fn: () => void): void {
    if (GetLocalPlayer() !== player.handle) {
      return;
    }
    if (configuration.devMode) {
      runLocalGuarded(player, fn);
    } else {
      fn();
    }
  }
}
