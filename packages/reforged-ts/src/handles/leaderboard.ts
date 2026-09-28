/** @noSelfInFile */

import { Handle } from "./handle";
import { MapPlayer } from "./player";

/**
 * A board in the top-right corner of the screen that lists items under a
 * title, each a label, an integer value and a player's icon.
 * @remarks
 * A player sees a leaderboard only once it is theirs
 * ({@link Leaderboard.setPlayerBoard}) and it is displayed. Items are indexed
 * from 0, in their current order.
 * @example A score board for every player
 * {@includeCode ../../examples/harness/leaderboard-scores.ts}
 * @native leaderboard
 */
export class Leaderboard extends Handle<leaderboard> {
  /**
   * Creates an empty leaderboard, which no player sees yet.
   * @remarks It starts with no row, no column and no label.
   * @returns The new leaderboard.
   * @throws When the game returns no handle: `reforged-ts: failed to create Leaderboard`, at the calling line.
   * In Dev mode, also when called before the globals Init stage or inside `MapPlayer.runLocal`.
   * @native CreateLeaderboard
   * @bug Called from a global variable's initial value, it crashes the game.
   */
  public static create(): Leaderboard {
    return this.expect(CreateLeaderboard());
  }

  /**
   * Adds an item for a player at the bottom of the leaderboard.
   * @remarks
   * The board does not grow by itself: set {@link Leaderboard.itemCount} to
   * its own value afterwards so the new item fits.
   * @param label - The item's label, usually the player's name.
   * @param value - The item's integer value, such as a score.
   * @param p - The player the item belongs to, whose icon it shows.
   * @native LeaderboardAddItem
   */
  public addItem(label: string, value: number, p: MapPlayer) {
    LeaderboardAddItem(this.handle, label, value, p.handle);
  }

  /**
   * Removes every item from the leaderboard; its title stays.
   * @native LeaderboardClear
   */
  public clear() {
    LeaderboardClear(this.handle);
  }

  /**
   * Destroys the Leaderboard through its Native.
   * @remarks
   * In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
   * a second `destroy()` included, raises
   * `reforged-ts: used after destroy: <Class>#<id>`, and
   * `Reforged.debug.report()` counts it destroyed.
   * @native DestroyLeaderboard
   */
  public destroy() {
    DestroyLeaderboard(this.handle);
    this.release();
  }

  /**
   * Shows or hides the leaderboard for the players whose leaderboard it is.
   * @param flag - True, the default, to show it; false to hide it.
   * @native LeaderboardDisplay
   */
  public display(flag = true) {
    LeaderboardDisplay(this.handle, flag);
  }

  /**
   * Whether the leaderboard is shown.
   * @returns True when it is shown, false when it is hidden.
   * @native IsLeaderboardDisplayed
   */
  public get displayed() {
    return IsLeaderboardDisplayed(this.handle);
  }

  /**
   * The number of items on the leaderboard.
   * @returns The item count.
   * @native LeaderboardGetItemCount
   */
  public get itemCount() {
    return LeaderboardGetItemCount(this.handle);
  }

  /**
   * The number of items the leaderboard is sized for. Setting it adds or
   * removes no item: it resizes the board, which does not grow as items are
   * added, so set it to {@link Leaderboard.itemCount} after adding some.
   * @native LeaderboardSetSizeByItemCount
   */
  public set itemCount(count: number) {
    LeaderboardSetSizeByItemCount(this.handle, count);
  }

  /**
   * Gets the index of a player's item.
   * @param p - The player whose item to find.
   * @returns The index of the player's item, counted from 0 in the current
   * order.
   * @native LeaderboardGetPlayerIndex
   */
  public getPlayerIndex(p: MapPlayer) {
    return LeaderboardGetPlayerIndex(this.handle, p.handle);
  }

  /**
   * Asks the game whether a player has an item on the leaderboard, and drops
   * the answer.
   * @remarks
   * This method returns nothing: the answer of its Native is lost. Call
   * `LeaderboardHasPlayerItem(board.handle, player.handle)` to read it.
   * @param p - The player to look for.
   * @native LeaderboardHasPlayerItem
   */
  public hasPlayerItem(p: MapPlayer) {
    LeaderboardHasPlayerItem(this.handle, p.handle);
  }

  /**
   * Removes the item at an index.
   * @param index - The item's index, counted from 0.
   * @native LeaderboardRemoveItem
   */
  public removeItem(index: number) {
    LeaderboardRemoveItem(this.handle, index);
  }

  /**
   * Removes a player's item.
   * @param p - The player whose item to remove.
   * @native LeaderboardRemovePlayerItem
   */
  public removePlayerItem(p: MapPlayer) {
    LeaderboardRemovePlayerItem(this.handle, p.handle);
  }

  /**
   * Sets the label of one item.
   * @param item - The item's index, counted from 0.
   * @param label - The new label.
   * @native LeaderboardSetItemLabel
   */
  public setItemLabel(item: number, label: string) {
    LeaderboardSetItemLabel(this.handle, item, label);
  }

  /**
   * Sets the colour of one item's label.
   * @param item - The item's index, counted from 0.
   * @param red - The red component, from 0 to 255.
   * @param green - The green component, from 0 to 255.
   * @param blue - The blue component, from 0 to 255.
   * @param alpha - The opacity, from 0 (transparent) to 255 (opaque).
   * @native LeaderboardSetItemLabelColor
   */
  public setItemLabelColor(
    item: number,
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ) {
    LeaderboardSetItemLabelColor(this.handle, item, red, green, blue, alpha);
  }

  /**
   * Chooses which parts of one item the leaderboard shows.
   * @param item - The item's index, counted from 0.
   * @param showLabel - Whether the item's label shows; true by default.
   * @param showValues - Whether the item's value shows; true by default.
   * @param showIcons - Whether the player's icon shows; true by default.
   * @native LeaderboardSetItemStyle
   */
  public setItemStyle(
    item: number,
    showLabel = true,
    showValues = true,
    showIcons = true,
  ) {
    LeaderboardSetItemStyle(
      this.handle,
      item,
      showLabel,
      showValues,
      showIcons,
    );
  }

  /**
   * Sets the value of one item.
   * @param item - The item's index, counted from 0.
   * @param value - The new integer value.
   * @native LeaderboardSetItemValue
   */
  public setItemValue(item: number, value: number) {
    LeaderboardSetItemValue(this.handle, item, value);
  }

  /**
   * Sets the colour of one item's value.
   * @param item - The item's index, counted from 0.
   * @param red - The red component, from 0 to 255.
   * @param green - The green component, from 0 to 255.
   * @param blue - The blue component, from 0 to 255.
   * @param alpha - The opacity, from 0 (transparent) to 255 (opaque).
   * @native LeaderboardSetItemValueColor
   */
  public setItemValueColor(
    item: number,
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ) {
    LeaderboardSetItemValueColor(this.handle, item, red, green, blue, alpha);
  }

  /**
   * Sets the colour of every item's label.
   * @param red - The red component, from 0 to 255.
   * @param green - The green component, from 0 to 255.
   * @param blue - The blue component, from 0 to 255.
   * @param alpha - The opacity, from 0 (transparent) to 255 (opaque).
   * @native LeaderboardSetLabelColor
   */
  public setLabelColor(
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ) {
    LeaderboardSetLabelColor(this.handle, red, green, blue, alpha);
  }

  /**
   * Makes the leaderboard the one a player sees; a player sees at most one.
   * @param p - The player who gets the leaderboard.
   * @native PlayerSetLeaderboard
   */
  public setPlayerBoard(p: MapPlayer) {
    PlayerSetLeaderboard(p.handle, this.handle);
  }

  /**
   * Chooses which parts the leaderboard shows.
   * @param showLabel - Whether its title shows; true by default.
   * @param showNames - Whether the items' labels show; true by default.
   * @param showValues - Whether the items' values show; true by default.
   * @param showIcons - Whether the players' icons show; true by default.
   * @native LeaderboardSetStyle
   */
  public setStyle(
    showLabel = true,
    showNames = true,
    showValues = true,
    showIcons = true,
  ) {
    LeaderboardSetStyle(
      this.handle,
      showLabel,
      showNames,
      showValues,
      showIcons,
    );
  }

  /**
   * Sets the colour of every item's value.
   * @param red - The red component, from 0 to 255.
   * @param green - The green component, from 0 to 255.
   * @param blue - The blue component, from 0 to 255.
   * @param alpha - The opacity, from 0 (transparent) to 255 (opaque).
   * @native LeaderboardSetValueColor
   */
  public setValueColor(
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ) {
    LeaderboardSetValueColor(this.handle, red, green, blue, alpha);
  }

  /**
   * Sorts the items by label, alphabetically.
   * @param asc - True, the default, for ascending order; false for descending.
   * @native LeaderboardSortItemsByLabel
   */
  public sortByLabel(asc = true) {
    LeaderboardSortItemsByLabel(this.handle, asc);
  }

  /**
   * Sorts the items by the players they belong to.
   * @param asc - True, the default, for ascending order; false for descending.
   * @native LeaderboardSortItemsByPlayer
   */
  public sortByPlayer(asc = true) {
    LeaderboardSortItemsByPlayer(this.handle, asc);
  }

  /**
   * Sorts the items by value.
   * @param asc - True, the default, for ascending order, the lowest value
   * first; false for descending, the highest first.
   * @native LeaderboardSortItemsByValue
   */
  public sortByValue(asc = true) {
    LeaderboardSortItemsByValue(this.handle, asc);
  }

  /**
   * The title shown above the items.
   * @native LeaderboardSetLabel
   */
  public set label(value: string) {
    LeaderboardSetLabel(this.handle, value);
  }

  /**
   * The title shown above the items.
   * @returns The title, or an empty string when it has none.
   * @native LeaderboardGetLabelText
   */
  public get label() {
    return LeaderboardGetLabelText(this.handle) ?? "";
  }

  /**
   * Gets the leaderboard a player sees.
   * @param p - The player whose leaderboard to get.
   * @returns The player's leaderboard, or `undefined` when none was set for
   * them.
   * @native PlayerGetLeaderboard
   */
  public static fromPlayer(p: MapPlayer): Leaderboard | undefined {
    return this.fromHandle(PlayerGetLeaderboard(p.handle));
  }
}
