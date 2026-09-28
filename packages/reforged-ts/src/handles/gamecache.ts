/** @noSelfInFile */

import { Handle } from "./handle";
import { MapPlayer } from "./player";

/**
 * A game cache: values stored under a mission key and a key, which a
 * campaign saves to the player's campaign file to carry heroes and progress
 * to its next map.
 * @remarks
 * - Each value type has its own slots: `getInteger` does not read what
 *   `store` stored as a number, which `getNumber` reads.
 * - The `sync*` members send a stored value to every player. To share a
 *   value only one client has, {@link SyncRequest} is the library's way.
 * @example Carrying a hero to the next map of a campaign
 * {@includeCode ../../examples/game/gamecache-campaign.ts}
 * @native gamecache
 */
export class GameCache extends Handle<gamecache> {
  /** The campaign file the cache was created with. */
  public readonly filename?: string;

  /**
   * Opens the game cache saved under a campaign file name, or a new empty
   * one.
   * @remarks The game allows at most 255 game caches.
   * @param campaignFile - The cache's file name, such as `"MyCampaign.w3v"`;
   * two calls with one name give caches of the same data.
   * @returns The game cache, holding what was saved under `campaignFile`, or
   * empty when nothing was.
   * @throws When the game returns no handle:
   * `reforged-ts: failed to create GameCache (<campaignFile>)`, at the
   * calling line. In Dev mode, also when called before the globals Init stage
   * or inside `MapPlayer.runLocal`.
   * @native InitGameCache
   */
  public static create(campaignFile: string): GameCache {
    return this.expect(InitGameCache(campaignFile), campaignFile, (cache) => {
      cache.filename = campaignFile;
    });
  }

  /**
   * Removes every value of the cache, under every mission key.
   * @native FlushGameCache
   */
  public flush() {
    FlushGameCache(this.handle);
  }

  /**
   * Removes the boolean stored under the key.
   * @param missionKey - The mission key, the group the key belongs to.
   * @param key - The value's name within the mission key.
   * @native FlushStoredBoolean
   */
  public flushBoolean(missionKey: string, key: string) {
    FlushStoredBoolean(this.handle, missionKey, key);
  }

  /**
   * Removes the integer stored under the key.
   * @param missionKey - The mission key, the group the key belongs to.
   * @param key - The value's name within the mission key.
   * @native FlushStoredInteger
   */
  public flushInteger(missionKey: string, key: string) {
    FlushStoredInteger(this.handle, missionKey, key);
  }

  /**
   * Removes every value stored under a mission key.
   * @param missionKey - The mission key whose keys to empty, of every value
   * type.
   * @native FlushStoredMission
   */
  public flushMission(missionKey: string) {
    FlushStoredMission(this.handle, missionKey);
  }

  /**
   * Removes the number stored under the key.
   * @param missionKey - The mission key, the group the key belongs to.
   * @param key - The value's name within the mission key.
   * @native FlushStoredReal
   */
  public flushNumber(missionKey: string, key: string) {
    FlushStoredReal(this.handle, missionKey, key);
  }

  /**
   * Removes the string stored under the key.
   * @param missionKey - The mission key, the group the key belongs to.
   * @param key - The value's name within the mission key.
   * @native FlushStoredString
   */
  public flushString(missionKey: string, key: string) {
    FlushStoredString(this.handle, missionKey, key);
  }

  /**
   * Removes the unit stored under the key.
   * @param missionKey - The mission key, the group the key belongs to.
   * @param key - The value's name within the mission key.
   * @native FlushStoredUnit
   */
  public flushUnit(missionKey: string, key: string) {
    FlushStoredUnit(this.handle, missionKey, key);
  }

  /**
   * Gets the boolean stored under the key.
   * @param missionKey - The mission key, the group the key belongs to.
   * @param key - The value's name within the mission key.
   * @returns The boolean, or `false` when none is stored under the key.
   * @native GetStoredBoolean
   */
  public getBoolean(missionKey: string, key: string) {
    return GetStoredBoolean(this.handle, missionKey, key);
  }

  /**
   * Gets the integer stored under the key by `storeInteger`.
   * @param missionKey - The mission key, the group the key belongs to.
   * @param key - The value's name within the mission key.
   * @returns The integer, or 0 when none is stored under the key.
   * @native GetStoredInteger
   */
  public getInteger(missionKey: string, key: string) {
    return GetStoredInteger(this.handle, missionKey, key);
  }

  /**
   * Gets the number stored under the key by `store`.
   * @param missionKey - The mission key, the group the key belongs to.
   * @param key - The value's name within the mission key.
   * @returns The number, or 0 when none is stored under the key.
   * @native GetStoredReal
   */
  public getNumber(missionKey: string, key: string) {
    return GetStoredReal(this.handle, missionKey, key);
  }

  /**
   * Gets the string stored under the key.
   * @param missionKey - The mission key, the group the key belongs to.
   * @param key - The value's name within the mission key.
   * @returns The string, or `""` when none is stored under the key; the
   * Typings also allow `undefined`.
   * @native GetStoredString
   */
  public getString(missionKey: string, key: string) {
    return GetStoredString(this.handle, missionKey, key);
  }

  /**
   * Checks whether a boolean is stored under the key.
   * @param missionKey - The mission key, the group the key belongs to.
   * @param key - The value's name within the mission key.
   * @returns `true` when one is stored.
   * @native HaveStoredBoolean
   */
  public hasBoolean(missionKey: string, key: string) {
    return HaveStoredBoolean(this.handle, missionKey, key);
  }

  /**
   * Checks whether an integer is stored under the key.
   * @param missionKey - The mission key, the group the key belongs to.
   * @param key - The value's name within the mission key.
   * @returns `true` when one is stored.
   * @native HaveStoredInteger
   */
  public hasInteger(missionKey: string, key: string) {
    return HaveStoredInteger(this.handle, missionKey, key);
  }

  /**
   * Checks whether a number is stored under the key.
   * @param missionKey - The mission key, the group the key belongs to.
   * @param key - The value's name within the mission key.
   * @returns `true` when one is stored.
   * @native HaveStoredReal
   */
  public hasNumber(missionKey: string, key: string) {
    return HaveStoredReal(this.handle, missionKey, key);
  }

  /**
   * Checks whether a string is stored under the key.
   * @param missionKey - The mission key, the group the key belongs to.
   * @param key - The value's name within the mission key.
   * @returns `true` when one is stored.
   * @native HaveStoredString
   */
  public hasString(missionKey: string, key: string) {
    return HaveStoredString(this.handle, missionKey, key);
  }

  /**
   * Checks whether a unit is stored under the key, through `HaveStoredUnit`.
   * @param missionKey - The mission key, the group the key belongs to.
   * @param key - The value's name within the mission key.
   * @returns `true` when one is stored.
   * @native HaveStoredUnit
   */
  public hasUnit(missionKey: string, key: string) {
    return HaveStoredUnit(this.handle, missionKey, key);
  }

  /**
   * Creates a unit from the description `store` stored under the key.
   * @remarks
   * It returns the Native `unit`, not a `Unit`: wrap it with
   * `Unit.fromHandle`.
   * @param missionKey - The mission key, the group the key belongs to.
   * @param key - The value's name within the mission key.
   * @param forWhichPlayer - The player who owns the new unit.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @param face - The facing, in degrees.
   * @returns The new unit, or `undefined` when no unit is stored under the
   * key.
   * @native RestoreUnit
   */
  public restoreUnit(
    missionKey: string,
    key: string,
    forWhichPlayer: MapPlayer,
    x: number,
    y: number,
    face: number,
  ) {
    return RestoreUnit(
      this.handle,
      missionKey,
      key,
      forWhichPlayer.handle,
      x,
      y,
      face,
    );
  }

  /**
   * Saves the cache to the player's campaign file, for the next maps of the
   * campaign to open with `create`.
   * @returns `true` when the game saved it.
   * @native SaveGameCache
   */
  public save(): boolean {
    return SaveGameCache(this.handle);
  }

  /**
   * Stores a value under the key, through the Native for its type: a number
   * as a real, which `getNumber` reads, and a unit as a description of it,
   * which `restoreUnit` recreates.
   * @remarks
   * A stored unit keeps its type, and for a hero its level, experience,
   * attributes, items and skills.
   * @param missionKey - The mission key, the group the key belongs to.
   * @param key - The value's name within the mission key.
   * @param value - The value: a number, a string, a boolean, or a Native
   * `unit` (a `Unit`'s `handle`).
   * @native StoreString
   * @native StoreBoolean
   * @native StoreReal
   * @native StoreUnit
   */
  public store(
    missionKey: string,
    key: string,
    value: number | string | boolean | unit,
  ) {
    if (typeof value === "string") {
      StoreString(this.handle, missionKey, key, value);
    } else if (typeof value === "boolean") {
      StoreBoolean(this.handle, missionKey, key, value);
    } else if (typeof value === "number") {
      StoreReal(this.handle, missionKey, key, value);
    } else {
      StoreUnit(this.handle, missionKey, key, value);
    }
  }

  /**
   * Stores `value` as an integer, through `StoreInteger`, where `getInteger`
   * reads it; `store` stores a number as a real.
   * @param missionKey - The mission key, the group the key belongs to.
   * @param key - The value's name within the mission key.
   * @param value - The whole number to store, within the 32-bit integer
   * range.
   * @native StoreInteger
   */
  public storeInteger(missionKey: string, key: string, value: number) {
    StoreInteger(this.handle, missionKey, key, value);
  }

  /**
   * Sends the boolean stored under the key to every player: the game keeps
   * the first value to arrive, often the host's.
   * @param missionKey - The mission key, the group the key belongs to.
   * @param key - The value's name within the mission key.
   * @native SyncStoredBoolean
   */
  public syncBoolean(missionKey: string, key: string) {
    SyncStoredBoolean(this.handle, missionKey, key);
  }

  /**
   * Sends the integer stored under the key to every player: the game keeps
   * the first value to arrive, often the host's.
   * @param missionKey - The mission key, the group the key belongs to.
   * @param key - The value's name within the mission key.
   * @native SyncStoredInteger
   */
  public syncInteger(missionKey: string, key: string) {
    SyncStoredInteger(this.handle, missionKey, key);
  }

  /**
   * Sends the number stored under the key to every player: the game keeps
   * the first value to arrive, often the host's.
   * @param missionKey - The mission key, the group the key belongs to.
   * @param key - The value's name within the mission key.
   * @native SyncStoredReal
   */
  public syncNumber(missionKey: string, key: string) {
    SyncStoredReal(this.handle, missionKey, key);
  }

  /**
   * Sends the string stored under the key to every player: the game keeps
   * the first value to arrive, often the host's.
   * @param missionKey - The mission key, the group the key belongs to.
   * @param key - The value's name within the mission key.
   * @native SyncStoredString
   */
  public syncString(missionKey: string, key: string) {
    SyncStoredString(this.handle, missionKey, key);
  }

  /**
   * Sends the unit stored under the key to every player: the game keeps the
   * first value to arrive, often the host's.
   * @param missionKey - The mission key, the group the key belongs to.
   * @param key - The value's name within the mission key.
   * @native SyncStoredUnit
   */
  public syncUnit(missionKey: string, key: string) {
    SyncStoredUnit(this.handle, missionKey, key);
  }

  /**
   * Reloads every game cache from the campaign files on disk.
   * @returns `true` when the game reloaded them.
   * @native ReloadGameCachesFromDisk
   */
  public static reloadFromDisk() {
    return ReloadGameCachesFromDisk();
  }
}
