/** @noSelfInFile */

import { Handle } from "./handle";

/**
 * One cell of a {@link Multiboard}: the handle through which its text, icon,
 * colour and width are set.
 * @remarks
 * Every {@link MultiboardItem.create} returns a new handle, even for a cell
 * that already has one: {@link MultiboardItem.destroy} releases it when done,
 * and the cell keeps what was set.
 * @example Filling the cells of a multiboard
 * {@includeCode ../../examples/harness/multiboard-scores.ts}
 * @native multiboarditem
 */
export class MultiboardItem extends Handle<multiboarditem> {
  /**
   * Gets a handle to one cell of a multiboard.
   * @param board - The multiboard that holds the cell.
   * @param x - The cell's row, counted from 1 at the top.
   * @param y - The cell's column, counted from 1 on the left.
   * @returns A new handle to the cell.
   * @throws When the game returns no handle: `reforged-ts: failed to create MultiboardItem`, at the calling line.
   * In Dev mode, also when called before the globals Init stage or inside `MapPlayer.runLocal`.
   * @native MultiboardGetItem
   */
  public static create(
    board: Multiboard,
    x: number,
    y: number,
  ): MultiboardItem {
    return this.expect(MultiboardGetItem(board.handle, x - 1, y - 1));
  }

  /**
   * Releases the MultiboardItem's handle through its Native; the cell keeps
   * its text, icon and style.
   * @remarks
   * In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
   * a second `destroy()` included, raises
   * `reforged-ts: used after destroy: <Class>#<id>`, and
   * `Reforged.debug.report()` counts it destroyed.
   * @example Tearing down a round's interface
   * {@includeCode ../../examples/game/destroy-ui.ts}
   * @native MultiboardReleaseItem
   */
  public destroy() {
    MultiboardReleaseItem(this.handle);
    this.release();
  }

  /**
   * Sets the icon shown in the cell.
   * @param icon - The path of the icon's texture, such as
   * `"ReplaceableTextures\\CommandButtons\\BTNFootman.blp"`.
   * @native MultiboardSetItemIcon
   */
  public setIcon(icon: string) {
    MultiboardSetItemIcon(this.handle, icon);
  }

  /**
   * Chooses whether the cell shows its text and its icon; a hidden part is
   * kept, not erased.
   * @param showValue - Whether the text shows.
   * @param showIcon - Whether the icon shows.
   * @native MultiboardSetItemStyle
   */
  public setStyle(showValue: boolean, showIcon: boolean) {
    MultiboardSetItemStyle(this.handle, showValue, showIcon);
  }

  /**
   * Sets the text shown in the cell; text wider than the cell is cut off.
   * @param val - The text to show, colour codes included.
   * @native MultiboardSetItemValue
   */
  public setValue(val: string) {
    MultiboardSetItemValue(this.handle, val);
  }

  /**
   * Sets the colour of the cell's text; a colour code in the text wins over it.
   * @param red - The red component, from 0 to 255.
   * @param green - The green component, from 0 to 255.
   * @param blue - The blue component, from 0 to 255.
   * @param alpha - The opacity, from 0 to 255; the game ignores it, so pass 255.
   * @native MultiboardSetItemValueColor
   */
  public setValueColor(
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ) {
    MultiboardSetItemValueColor(this.handle, red, green, blue, alpha);
  }

  /**
   * Sets the cell's width.
   * @remarks
   * The board's width follows the cells of its first row only, and it is
   * redrawn at the new width only once it is displayed or minimized again.
   * @param width - The width, as a fraction of the screen's width: 0.03, the
   * default, fits a few characters; 1 is the whole screen.
   * @native MultiboardSetItemWidth
   */
  public setWidth(width: number) {
    MultiboardSetItemWidth(this.handle, width);
  }
}

/**
 * A table in the top-right corner of the screen, with a title and rows and
 * columns of cells that each show a text and an icon.
 * @remarks
 * Only one multiboard shows at a time, and none during map initialization:
 * display it from a Timer once the game runs. Each cell is reached through a
 * {@link MultiboardItem}.
 * @example A score table, one row per player
 * {@includeCode ../../examples/harness/multiboard-scores.ts}
 * @native multiboard
 */
export class Multiboard extends Handle<multiboard> {
  /**
   * Creates a multiboard with no title, no row and no column, hidden and
   * maximized.
   * @returns The new multiboard.
   * @throws When the game returns no handle: `reforged-ts: failed to create Multiboard`, at the calling line.
   * In Dev mode, also when called before the globals Init stage or inside `MapPlayer.runLocal`.
   * @native CreateMultiboard
   * @bug Called from a global variable's initial value, it crashes the game.
   */
  public static create(): Multiboard {
    return this.expect(CreateMultiboard());
  }

  /**
   * The number of columns of cells, 0 on a new board.
   * @returns The column count: a cell's column runs from 1 to it.
   * @native MultiboardGetColumnCount
   */
  public get columns() {
    return MultiboardGetColumnCount(this.handle);
  }

  /**
   * The number of columns of cells: `createItem` reaches the columns 1 to
   * this count, so set it before filling the cells.
   * @native MultiboardSetColumnCount
   */
  public set columns(count: number) {
    MultiboardSetColumnCount(this.handle, count);
  }

  /**
   * Whether the multiboard is on screen, for every player at once.
   * @returns True when it is shown; false when it is hidden, as a new one
   * is.
   * @native IsMultiboardDisplayed
   */
  public get displayed() {
    return IsMultiboardDisplayed(this.handle);
  }

  /**
   * The number of rows of cells, 0 on a new board.
   * @returns The row count: a cell's row runs from 1 to it.
   * @native MultiboardGetRowCount
   */
  public get rows() {
    return MultiboardGetRowCount(this.handle);
  }

  /**
   * The number of rows of cells: `createItem` reaches the rows 1 to this
   * count, so set it before filling the cells.
   * @native MultiboardSetRowCount
   * @bug Only a change of one row at a time is safe: to add or remove
   * several, set the count once per row.
   */
  public set rows(count: number) {
    MultiboardSetRowCount(this.handle, count);
  }

  /**
   * The title shown above the cells; the board widens to fit it.
   * @native MultiboardSetTitleText
   */
  public set title(label: string) {
    MultiboardSetTitleText(this.handle, label);
  }

  /**
   * The title shown above the cells.
   * @returns The title, or an empty string when it has none.
   * @native MultiboardGetTitleText
   */
  public get title() {
    return MultiboardGetTitleText(this.handle) ?? "";
  }

  /**
   * Removes every cell, leaving no row and no column; the title stays.
   * @remarks
   * Release the {@link MultiboardItem} handles of the old cells with their
   * `destroy()`: reusing them after the board grows again is not reliable.
   * @native MultiboardClear
   */
  public clear() {
    MultiboardClear(this.handle);
  }

  /**
   * Gets a handle to one cell, as {@link MultiboardItem.create} does.
   * @param x - The cell's row, counted from 1 at the top.
   * @param y - The cell's column, counted from 1 on the left.
   * @returns A new handle to the cell.
   * @throws When the game returns no handle: `reforged-ts: failed to create MultiboardItem`, at the calling line.
   * In Dev mode, also when called before the globals Init stage or inside `MapPlayer.runLocal`.
   * @native MultiboardGetItem
   */
  public createItem(x: number, y: number): MultiboardItem {
    return MultiboardItem.create(this, x, y);
  }

  /**
   * Destroys the Multiboard through its Native.
   * @remarks
   * In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
   * a second `destroy()` included, raises
   * `reforged-ts: used after destroy: <Class>#<id>`, and
   * `Reforged.debug.report()` counts it destroyed.
   * @example Tearing down a round's interface
   * {@includeCode ../../examples/game/destroy-ui.ts}
   * @native DestroyMultiboard
   */
  public destroy() {
    DestroyMultiboard(this.handle);
    this.release();
  }

  /**
   * Shows or hides the multiboard for every player; showing it again redraws
   * it.
   * @remarks A multiboard does not appear when shown during map
   * initialisation: show it after a wait, or from a Timer of zero seconds, to
   * have it up as early as the game allows.
   * @param show - True to show it, false to hide it.
   * @native MultiboardDisplay
   */
  public display(show: boolean) {
    MultiboardDisplay(this.handle, show);
  }

  /**
   * Minimizes the multiboard to its title, or opens it to show its cells, as
   * the arrow button on it does; either way it is redrawn.
   * @param flag - True to minimize it, false to open it.
   * @native MultiboardMinimize
   */
  public minimize(flag: boolean) {
    MultiboardMinimize(this.handle, flag);
  }

  /**
   * Whether the multiboard is minimized to its title on the local client.
   * @remarks
   * A player can minimize or open the board themselves, so the value can
   * differ between clients: never let it decide game state.
   * @example Reopening a minimized board for one player
   * {@includeCode ../../examples/harness/multiboard-minimized.ts}
   * @returns True when it is minimized, false when its cells show.
   * @native IsMultiboardMinimized
   * @async
   */
  public minimized() {
    return IsMultiboardMinimized(this.handle);
  }

  /**
   * Sets the icon shown in every cell.
   * @param icon - The path of the icon's texture.
   * @native MultiboardSetItemsIcon
   */
  public setItemsIcons(icon: string) {
    MultiboardSetItemsIcon(this.handle, icon);
  }

  /**
   * Chooses whether every cell shows its text and its icon.
   * @param showValues - Whether the texts show.
   * @param showIcons - Whether the icons show.
   * @native MultiboardSetItemsStyle
   */
  public setItemsStyle(showValues: boolean, showIcons: boolean) {
    MultiboardSetItemsStyle(this.handle, showValues, showIcons);
  }

  /**
   * Sets the text shown in every cell.
   * @param value - The text every cell shows, colour codes included.
   * @native MultiboardSetItemsValue
   */
  public setItemsValue(value: string) {
    MultiboardSetItemsValue(this.handle, value);
  }

  /**
   * Sets the colour of every cell's text; a colour code in a text wins over it.
   * @param red - The red component, from 0 to 255.
   * @param green - The green component, from 0 to 255.
   * @param blue - The blue component, from 0 to 255.
   * @param alpha - The opacity, from 0 to 255; the game ignores it, so pass 255.
   * @native MultiboardSetItemsValueColor
   */
  public setItemsValueColor(
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ) {
    MultiboardSetItemsValueColor(this.handle, red, green, blue, alpha);
  }

  /**
   * Sets the width of every cell.
   * @param width - The width, as a fraction of the screen's width: 0.03, the
   * default, fits a few characters; 1 is the whole screen.
   * @native MultiboardSetItemsWidth
   */
  public setItemsWidth(width: number) {
    MultiboardSetItemsWidth(this.handle, width);
  }

  /**
   * Sets the colour of the title; a colour code in the title wins over it.
   * @param red - The red component, from 0 to 255.
   * @param green - The green component, from 0 to 255.
   * @param blue - The blue component, from 0 to 255.
   * @param alpha - The opacity, from 0 to 255; the game ignores it, so pass 255.
   * @native MultiboardSetTitleTextColor
   */
  public setTitleTextColor(
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ) {
    MultiboardSetTitleTextColor(this.handle, red, green, blue, alpha);
  }

  /**
   * Hides every multiboard while suppressed, without changing whether each
   * one is displayed, as for a cinematic.
   * @param flag - True to hide every multiboard; false to show again the one
   * displayed last.
   * @native MultiboardSuppressDisplay
   */
  public static suppressDisplay(flag: boolean) {
    MultiboardSuppressDisplay(flag);
  }
}
