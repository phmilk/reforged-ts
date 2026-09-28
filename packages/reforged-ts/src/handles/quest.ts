/** @noSelfInFile */

import { Handle } from "./handle";

/**
 * One requirement of a {@link Quest}: a line of its log in the quest menu,
 * which can be marked completed.
 * @remarks
 * The quest menu shows a change only once the quest is selected again, the
 * menu is opened again, or {@link Quest.forceQuestDialogUpdate} runs.
 * @example A quest with two requirements
 * {@includeCode ../../examples/game/quest-create.ts}
 * @native questitem
 */
export class QuestItem extends Handle<questitem> {
  /** The quest the item belongs to, set when it is created. */
  public readonly quest?: Quest;

  /**
   * Adds a requirement, with no description, below the quest's earlier ones.
   * @param whichQuest - The quest that gets the requirement.
   * @returns The new requirement.
   * @throws When the game returns no handle: `reforged-ts: failed to create QuestItem`, at the calling line.
   * In Dev mode, also when called before the globals Init stage or inside `MapPlayer.runLocal`.
   * @native QuestCreateItem
   */
  public static create(whichQuest: Quest): QuestItem {
    return this.expect(QuestCreateItem(whichQuest.handle), "", (item) => {
      item.quest = whichQuest;
    });
  }

  /**
   * Sets the text of the requirement's line.
   * @param description - The text.
   * @native QuestItemSetDescription
   */
  public setDescription(description: string) {
    QuestItemSetDescription(this.handle, description);
  }

  /**
   * Whether the requirement is marked completed.
   * @returns True when it is completed.
   * @native IsQuestItemCompleted
   */
  public get completed() {
    return IsQuestItemCompleted(this.handle);
  }

  /**
   * Whether the requirement is marked completed; false for a new one.
   * @native QuestItemSetCompleted
   */
  public set completed(completed: boolean) {
    QuestItemSetCompleted(this.handle, completed);
  }
}

/**
 * A quest in the quest menu: a title, an icon, a description and a list of
 * requirements ({@link QuestItem}).
 * @remarks
 * - The quest menu shows a change only once it is opened again, or
 *   {@link Quest.forceQuestDialogUpdate} runs.
 * - The game crashes when it shows an enabled, discovered quest whose
 *   description is empty: set the description right after creating one.
 * @example A quest with two requirements
 * {@includeCode ../../examples/game/quest-create.ts}
 * @native quest
 */
export class Quest extends Handle<quest> {
  /**
   * Creates a quest, enabled, discovered and required, with no title, icon
   * or description.
   * @returns The new quest.
   * @throws When the game returns no handle: `reforged-ts: failed to create Quest`, at the calling line.
   * In Dev mode, also when called before the globals Init stage or inside `MapPlayer.runLocal`.
   * @native CreateQuest
   * @bug Do not use this in a global initialisation as it crashes the game there.
   */
  public static create(): Quest {
    return this.expect(CreateQuest());
  }

  /**
   * Whether the quest is marked completed.
   * @returns True when it is completed.
   * @native IsQuestCompleted
   */
  public get completed() {
    return IsQuestCompleted(this.handle);
  }

  /**
   * Whether the quest is marked completed; its title then gets a "Completed"
   * label, even when it is also failed.
   * @native QuestSetCompleted
   */
  public set completed(completed: boolean) {
    QuestSetCompleted(this.handle, completed);
  }

  /**
   * Whether the quest is discovered.
   * @returns True when it is discovered.
   * @native IsQuestDiscovered
   */
  public get discovered() {
    return IsQuestDiscovered(this.handle);
  }

  /**
   * Whether the quest is discovered; an undiscovered one shows a placeholder
   * title, icon and description in the quest menu. True for a new quest.
   * @native QuestSetDiscovered
   */
  public set discovered(discovered: boolean) {
    QuestSetDiscovered(this.handle, discovered);
  }

  /**
   * Whether the quest is enabled, that is listed in the quest menu.
   * @returns True when it is enabled.
   * @native IsQuestEnabled
   */
  public get enabled() {
    return IsQuestEnabled(this.handle);
  }

  /**
   * Whether the quest is enabled, that is listed in the quest menu. True for
   * a new quest.
   * @native QuestSetEnabled
   */
  public set enabled(enabled: boolean) {
    QuestSetEnabled(this.handle, enabled);
  }

  /**
   * Whether the quest is marked failed.
   * @returns True when it is failed.
   * @native IsQuestFailed
   */
  public get failed() {
    return IsQuestFailed(this.handle);
  }

  /**
   * Whether the quest is marked failed; its title then gets a "Failed" label,
   * unless it is also completed.
   * @native QuestSetFailed
   */
  public set failed(failed: boolean) {
    QuestSetFailed(this.handle, failed);
  }

  /**
   * Whether the quest is a main quest rather than an optional one.
   * @returns True for a main quest, false for an optional one.
   * @native IsQuestRequired
   */
  public get required() {
    return IsQuestRequired(this.handle);
  }

  /**
   * Whether the quest is listed with the main quests, rather than the
   * optional ones. True for a new quest.
   * @native QuestSetRequired
   */
  public set required(required: boolean) {
    QuestSetRequired(this.handle, required);
  }

  /**
   * Adds a requirement with a description below the quest's earlier ones.
   * @param description - The text of the requirement's line.
   * @returns The new requirement.
   * @throws When the game returns no handle: `reforged-ts: failed to create QuestItem`, at the calling line.
   * In Dev mode, also when called before the globals Init stage or inside `MapPlayer.runLocal`.
   * @native QuestCreateItem
   * @native QuestItemSetDescription
   */
  public addItem(description: string): QuestItem {
    return QuestItem.expect(QuestCreateItem(this.handle), "", (item) => {
      item.quest = this;
      item.setDescription(description);
    });
  }

  /**
   * Destroys the Quest through its Native.
   * @remarks
   * In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
   * a second `destroy()` included, raises
   * `reforged-ts: used after destroy: <Class>#<id>`, and
   * `Reforged.debug.report()` counts it destroyed.
   * @native DestroyQuest
   */
  public destroy() {
    DestroyQuest(this.handle);
    this.release();
  }

  /**
   * Sets the text shown when the quest is selected in the quest menu.
   * @param description - The text; never empty on an enabled, discovered
   * quest, which crashes the game.
   * @native QuestSetDescription
   */
  public setDescription(description: string) {
    QuestSetDescription(this.handle, description);
  }

  /**
   * Sets the icon shown next to the quest's title.
   * @param iconPath - The path of the icon's texture, such as
   * `"ReplaceableTextures\\CommandButtons\\BTNFootman.blp"`; an empty path
   * shows a plain green square.
   * @native QuestSetIconPath
   */
  public setIcon(iconPath: string) {
    QuestSetIconPath(this.handle, iconPath);
  }

  /**
   * Sets the title shown in the quest menu's list and above the description.
   * @param title - The title.
   * @native QuestSetTitle
   */
  public setTitle(title: string) {
    QuestSetTitle(this.handle, title);
  }

  /**
   * Makes the quest menu's button flash, for every player, until it is
   * clicked or for about ten seconds.
   * @native FlashQuestDialogButton
   */
  public static flashQuestDialogButton() {
    FlashQuestDialogButton();
  }

  /**
   * Redraws the quest menu so that it shows the quests' changes, even while
   * it is open.
   * @native ForceQuestDialogUpdate
   */
  public static forceQuestDialogUpdate() {
    ForceQuestDialogUpdate();
  }
}
