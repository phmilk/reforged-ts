/** @noSelfInFile */

import { configuration } from "../reforged/configuration";
import { runLocalGuarded } from "../reforged/local";
import type { Force } from "./force";
import { Handle } from "./handle";
import type { Point } from "./point";
import type { Rectangle } from "./rect";

/**
 * A player slot. Players are not created: the game has one per slot, and
 * `fromIndex` looks it up. A Map project may extend this class with its own
 * player model; the lookups inherited from the base then give instances of
 * the subclass.
 */
export class MapPlayer extends Handle<player> {
  /** The difficulty of the player's computer AI, through `GetAIDifficulty`. */
  public get aiDifficulty() {
    return GetAIDifficulty(this.handle);
  }

  public set color(color: playercolor) {
    SetPlayerColor(this.handle, color);
  }

  public get color() {
    return GetPlayerColor(this.handle);
  }

  public get controller() {
    return GetPlayerController(this.handle);
  }

  public set controller(controlType: mapcontrol) {
    SetPlayerController(this.handle, controlType);
  }

  public get handicap() {
    return GetPlayerHandicap(this.handle);
  }

  public set handicap(handicap: number) {
    SetPlayerHandicap(this.handle, handicap);
  }

  public get handicapDamage() {
    return GetPlayerHandicapDamage(this.handle);
  }

  public set handicapDamage(handicap: number) {
    SetPlayerHandicapDamage(this.handle, handicap);
  }

  public get handicapReviveTime() {
    return GetPlayerHandicapReviveTime(this.handle);
  }

  public set handicapReviveTime(handicap: number) {
    SetPlayerHandicapReviveTime(this.handle, handicap);
  }

  public get handicapXp() {
    return GetPlayerHandicapXP(this.handle);
  }

  public set handicapXp(handicap: number) {
    SetPlayerHandicapXP(this.handle, handicap);
  }

  public override get id() {
    return GetPlayerId(this.handle);
  }

  public get name() {
    return GetPlayerName(this.handle) ?? "";
  }

  public set name(value: string) {
    SetPlayerName(this.handle, value);
  }

  public get race() {
    return GetPlayerRace(this.handle);
  }

  public get slotState() {
    return GetPlayerSlotState(this.handle);
  }

  /** The index of the player's start location. */
  public get startLocation() {
    return GetPlayerStartLocation(this.handle);
  }

  public set startLocation(startLocIndex: number) {
    SetPlayerStartLocation(this.handle, startLocIndex);
  }

  public get startLocationX() {
    return GetStartLocationX(this.startLocation);
  }

  public get startLocationY() {
    return GetStartLocationY(this.startLocation);
  }

  public get startLocationPoint() {
    return GetStartLocationLoc(this.startLocation);
  }

  public get team() {
    return GetPlayerTeam(this.handle);
  }

  public set team(whichTeam: number) {
    SetPlayerTeam(this.handle, whichTeam);
  }

  /** The player's score in a tournament game, through `GetTournamentScore`. */
  public get tournamentScore() {
    return GetTournamentScore(this.handle);
  }

  public get townHallCount() {
    return BlzGetPlayerTownHallCount(this.handle);
  }

  /**
   * In upgrades that have multiple levels, it will research the upgrade by the number of levels specified.
   * @param techId The four digit rawcode ID of the upgrade.
   * @param levels The number of levels to add to the current research level of the upgrade.
   */
  public addTechResearched(techId: number, levels: number) {
    AddPlayerTechResearched(this.handle, techId, levels);
  }

  public decTechResearched(techId: number, levels: number) {
    BlzDecPlayerTechResearched(this.handle, techId, levels);
  }

  /**
   * Used to store hero level data for the scorescreen, before units are moved to neutral passive in melee games.
   */
  public cacheHeroData() {
    CachePlayerHeroData(this.handle);
  }

  /**
   * Sends a command to the player's AI script, which reads it with
   * `GetLastCommand` and `GetLastData`.
   */
  public commandAI(command: number, data: number) {
    CommandAI(this.handle, command, data);
  }

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

  public coordsFogged(x: number, y: number) {
    return IsFoggedToPlayer(x, y, this.handle);
  }

  public coordsMasked(x: number, y: number) {
    return IsMaskedToPlayer(x, y, this.handle);
  }

  public coordsVisible(x: number, y: number) {
    return IsVisibleToPlayer(x, y, this.handle);
  }

  /**
   * Reveals a player's remaining buildings to a force.
   * The black mask over the buildings will be removed as if the territory had been discovered
   * @param toWhichPlayers The players who will see whichPlayer's buildings.
   * @param flag If true, the buildings will be revealed. If false, the buildings will not be revealed.
   * Note that if you set it to false, it will not hide the buildings with a black mask.
   * @note his function will not check whether the player has a town hall before revealing.
   */
  public cripple(toWhichPlayers: Force, flag: boolean) {
    CripplePlayer(this.handle, toWhichPlayers.handle, flag);
  }

  /**
   * Shows `message` in the chat log as a chat message this player sent,
   * through `BlzDisplayChatMessage`. This player is the sender, not the
   * viewer: the message shows on every client that runs the call, so
   * `MapPlayer.runLocal` shows it to one player. `recipient` is the chat
   * audience the message is labelled with, as the Native's number.
   */
  public displayChatMessage(recipient: number, message: string) {
    BlzDisplayChatMessage(this.handle, recipient, message);
  }

  /**
   * Shows `message` on the player's screen at the offset `x`, `y`, through
   * `DisplayTextToPlayer`. The game formats the string: a lone `%` garbles
   * it.
   */
  public displayText(x: number, y: number, message: string) {
    DisplayTextToPlayer(this.handle, x, y, message);
  }

  /**
   * Shows `message` on the player's screen for `duration` seconds, through
   * `DisplayTimedTextToPlayer`. The game formats the string: a lone `%`
   * garbles it.
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
   * Shows `message` on the player's screen for `duration` seconds, through
   * `DisplayTimedTextFromPlayer`. The game formats the string: a lone `%`
   * garbles it, and jassdoc reports that a `%s` shows garbage or, in Lua,
   * crashes the game.
   */
  public displayTimedTextFrom(
    x: number,
    y: number,
    duration: number,
    message: string,
  ) {
    DisplayTimedTextFromPlayer(this.handle, x, y, duration, message);
  }

  public forceStartLocation(startLocIndex: number) {
    ForcePlayerStartLocation(this.handle, startLocIndex);
  }

  public getScore(whichPlayerScore: playerscore) {
    return GetPlayerScore(this.handle, whichPlayerScore);
  }

  public getState(whichPlayerState: playerstate) {
    return GetPlayerState(this.handle, whichPlayerState);
  }

  public getStructureCount(includeIncomplete: boolean) {
    return GetPlayerStructureCount(this.handle, includeIncomplete);
  }

  public getTaxRate(otherPlayer: player, whichResource: playerstate) {
    return GetPlayerTaxRate(this.handle, otherPlayer, whichResource);
  }

  public getTechCount(techId: number, specificonly: boolean) {
    return GetPlayerTechCount(this.handle, techId, specificonly);
  }

  public getTechMaxAllowed(techId: number) {
    return GetPlayerTechMaxAllowed(this.handle, techId);
  }

  public getTechResearched(techId: number, specificonly: boolean) {
    return GetPlayerTechResearched(this.handle, techId, specificonly);
  }

  public getUnitCount(includeIncomplete: boolean) {
    return GetPlayerUnitCount(this.handle, includeIncomplete);
  }

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

  public inForce(whichForce: Force) {
    return IsPlayerInForce(this.handle, whichForce.handle);
  }

  public isLocal() {
    return GetLocalPlayer() === this.handle;
  }

  public isObserver() {
    return IsPlayerObserver(this.handle);
  }

  public isPlayerAlly(otherPlayer: MapPlayer) {
    return IsPlayerAlly(this.handle, otherPlayer.handle);
  }

  public isPlayerEnemy(otherPlayer: MapPlayer) {
    return IsPlayerEnemy(this.handle, otherPlayer.handle);
  }

  public isRacePrefSet(pref: racepreference) {
    return IsPlayerRacePrefSet(this.handle, pref);
  }

  public isSelectable() {
    return GetPlayerSelectable(this.handle);
  }

  public pauseCompAI(pause: boolean) {
    PauseCompAI(this.handle, pause);
  }

  public pointFogged(whichPoint: Point) {
    return IsLocationFoggedToPlayer(whichPoint.handle, this.handle);
  }

  public pointMasked(whichPoint: Point) {
    return IsLocationMaskedToPlayer(whichPoint.handle, this.handle);
  }

  public pointVisible(whichPoint: Point) {
    return IsLocationVisibleToPlayer(whichPoint.handle, this.handle);
  }

  public remove(gameResult: playergameresult) {
    RemovePlayer(this.handle, gameResult);
  }

  public removeAllGuardPositions() {
    RemoveAllGuardPositions(this.handle);
  }

  public setAbilityAvailable(abilId: number, avail: boolean) {
    SetPlayerAbilityAvailable(this.handle, abilId, avail);
  }

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

  /** Adds or removes blight in a circle, through `SetBlight`. */
  public setBlight(x: number, y: number, radius: number, addBlight: boolean) {
    SetBlight(this.handle, x, y, radius, addBlight);
  }

  /**
   * Adds or removes blight in a circle around `where`, through
   * `SetBlightLoc`.
   */
  public setBlightLoc(where: Point, radius: number, addBlight: boolean) {
    SetBlightLoc(this.handle, where.handle, radius, addBlight);
  }

  /** Adds or removes blight at one point, through `SetBlightPoint`. */
  public setBlightPoint(x: number, y: number, addBlight: boolean) {
    SetBlightPoint(this.handle, x, y, addBlight);
  }

  /** Adds or removes blight over `where`, through `SetBlightRect`. */
  public setBlightRect(where: Rectangle, addBlight: boolean) {
    SetBlightRect(this.handle, where.handle, addBlight);
  }

  /**
   * Sets the fog state over a circle for the player, through
   * `SetFogStateRadius`.
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
   * Sets the fog state over a circle around `center` for the player, through
   * `SetFogStateRadiusLoc`.
   */
  public setFogStateRadiusLoc(
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
   * Sets the fog state over `where` for the player, through
   * `SetFogStateRect`.
   */
  public setFogStateRect(
    whichState: fogstate,
    where: Rectangle,
    useSharedVision: boolean,
  ) {
    SetFogStateRect(this.handle, whichState, where.handle, useSharedVision);
  }

  public setOnScoreScreen(flag: boolean) {
    SetPlayerOnScoreScreen(this.handle, flag);
  }

  public setRacePreference(whichRacePreference: racepreference) {
    SetPlayerRacePreference(this.handle, whichRacePreference);
  }

  /** Sets whether the player may choose a race; `isSelectable` reads it. */
  public setRaceSelectable(value: boolean) {
    SetPlayerRaceSelectable(this.handle, value);
  }

  /**
   * Sets the player's race skin, such as `RACE_PREF_FORSAKEN`, through
   * `SetPlayerRaceSkin` (3.0.0).
   */
  public setRaceSkin(pref: racepreference) {
    SetPlayerRaceSkin(this.handle, pref);
  }

  public setState(whichPlayerState: playerstate, value: number) {
    SetPlayerState(this.handle, whichPlayerState, value);
  }

  public setTaxRate(
    otherPlayer: MapPlayer,
    whichResource: playerstate,
    rate: number,
  ) {
    SetPlayerTaxRate(this.handle, otherPlayer.handle, whichResource, rate);
  }

  public setTechMaxAllowed(techId: number, maximum: number) {
    SetPlayerTechMaxAllowed(this.handle, techId, maximum);
  }

  public setTechResearched(techId: number, setToLevel: number) {
    SetPlayerTechResearched(this.handle, techId, setToLevel);
  }

  public setUnitsOwner(newOwner: number) {
    SetPlayerUnitsOwner(this.handle, newOwner);
  }

  /** Starts the campaign AI script `script` for the player. */
  public startCampaignAI(script: string) {
    StartCampaignAI(this.handle, script);
  }

  /** Starts the melee AI script `script` for the player. */
  public startMeleeAI(script: string) {
    StartMeleeAI(this.handle, script);
  }

  /**
   * The player detecting a unit, or undefined outside a detection event,
   * through `GetEventDetectingPlayer`.
   */
  public static fromDetecting(): MapPlayer | undefined {
    return this.fromHandle(GetEventDetectingPlayer());
  }

  public static fromEnum(): MapPlayer | undefined {
    return this.fromHandle(GetEnumPlayer());
  }

  public static fromEvent(): MapPlayer | undefined {
    return this.fromHandle(GetTriggerPlayer());
  }

  public static fromFilter(): MapPlayer | undefined {
    return this.fromHandle(GetFilterPlayer());
  }

  /**
   * The player in slot `index`, or undefined for a slot the game has no
   * player for.
   */
  public static fromIndex(index: number): MapPlayer | undefined {
    return this.fromHandle(Player(index));
  }

  /**
   * The local player. `GetLocalPlayer` never returns nothing, which the
   * Typings cannot express for the Wrapper, so this goes through the non-null
   * lookup helper: typed non-null, and should the game ever break that invariant it
   * throws `reforged-ts: failed to create MapPlayer` instead of returning
   * undefined.
   * @async
   */
  public static fromLocal(): MapPlayer {
    return this.expectFound(GetLocalPlayer());
  }

  /**
   * The owner a unit had before an ownership change, or undefined outside
   * one, through `GetChangingUnitPrevOwner`.
   */
  public static fromPreviousOwner(): MapPlayer | undefined {
    return this.fromHandle(GetChangingUnitPrevOwner());
  }

  /**
   * The player who ended a tournament game early, or undefined outside that
   * event, through `GetTournamentFinishNowPlayer`.
   */
  public static fromTournamentFinishNow(): MapPlayer | undefined {
    return this.fromHandle(GetTournamentFinishNowPlayer());
  }

  /**
   * The winning player, or undefined outside a victory event, through
   * `GetWinningPlayer`.
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
   * like a failing callback's (`reforged-ts: MapPlayer#<id>
   * MapPlayer.runLocal failed: <error>`), once per function and message,
   * and does not escape; and inside it creating or destroying a Wrapper,
   * `Group.for`, `Force.for` and the first `Frame.fromName` of a frame raise
   * `reforged-ts: <action> inside MapPlayer.runLocal changes game state for
   * one client, which desyncs the game: only visuals belong inside
   * runLocal`. A creation or destruction raises after its Native ran, so the
   * Guard does not undo it: it names the offending line while you test in
   * Dev mode, so the bug is found before a release build reaches a lobby.
   * Create what `fn` needs before calling `runLocal`, on every client.
   * @example
   * {@includeCode ../../examples/run-local-frame.ts}
   * @param player - The player whose client runs `fn`.
   * @param fn - What to run there: visuals only.
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
