/** @noSelfInFile */

import { Handle } from "./handle";

export class QuestItem extends Handle<questitem> {
  public readonly quest?: Quest;

  public static create(whichQuest: Quest): QuestItem {
    return this.expect(QuestCreateItem(whichQuest.handle), "", (item) => {
      item.quest = whichQuest;
    });
  }

  public setDescription(description: string) {
    QuestItemSetDescription(this.handle, description);
  }

  public get completed() {
    return IsQuestItemCompleted(this.handle);
  }

  public set completed(completed: boolean) {
    QuestItemSetCompleted(this.handle, completed);
  }
}

export class Quest extends Handle<quest> {
  /**
   * @bug Do not use this in a global initialisation as it crashes the game there.
   */
  public static create(): Quest {
    return this.expect(CreateQuest());
  }

  public get completed() {
    return IsQuestCompleted(this.handle);
  }

  public set completed(completed: boolean) {
    QuestSetCompleted(this.handle, completed);
  }

  public get discovered() {
    return IsQuestDiscovered(this.handle);
  }

  public set discovered(discovered: boolean) {
    QuestSetDiscovered(this.handle, discovered);
  }

  public get enabled() {
    return IsQuestEnabled(this.handle);
  }

  public set enabled(enabled: boolean) {
    QuestSetEnabled(this.handle, enabled);
  }

  public get failed() {
    return IsQuestFailed(this.handle);
  }

  public set failed(failed: boolean) {
    QuestSetFailed(this.handle, failed);
  }

  public get required() {
    return IsQuestRequired(this.handle);
  }

  public set required(required: boolean) {
    QuestSetRequired(this.handle, required);
  }

  public addItem(description: string): QuestItem {
    return QuestItem.expect(QuestCreateItem(this.handle), "", (item) => {
      item.quest = this;
      item.setDescription(description);
    });
  }

  public destroy() {
    DestroyQuest(this.handle);
    this.release();
  }

  public setDescription(description: string) {
    QuestSetDescription(this.handle, description);
  }

  public setIcon(iconPath: string) {
    QuestSetIconPath(this.handle, iconPath);
  }

  public setTitle(title: string) {
    QuestSetTitle(this.handle, title);
  }

  public static flashQuestDialogButton() {
    FlashQuestDialogButton();
  }

  public static forceQuestDialogUpdate() {
    ForceQuestDialogUpdate();
  }
}
