/** @noSelfInFile */

// Quest and QuestItem on the Handle base: creation throws; a quest item
// keeps the quest it was created for.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Quest, QuestItem } from "../src/index";
import { handleRef } from "./support/handle-ref";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

describe("Quest", () => {
  it("is the same object for its handle", () => {
    const quest = Quest.create();
    expect(Quest.fromHandle(quest.handle)).toBe(quest);
    expect(Quest.fromHandle(undefined)).toBeUndefined();
  });
});

describe("Quest.create", () => {
  it("wraps the handle CreateQuest returns, and a lookup finds it", () => {
    const quest = Quest.create();
    expect(stubCalls()).toContainCall("CreateQuest()");
    expect(Quest.fromHandle(quest.handle)).toBe(quest);
  });

  it("throws when CreateQuest returns nil", () => {
    const message = withNative(
      "CreateQuest",
      () => undefined,
      () =>
        raisedIn(() => {
          Quest.create();
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Quest");
  });
});

describe("QuestItem", () => {
  it("is the same object for its handle", () => {
    const item = QuestItem.create(Quest.create());
    expect(QuestItem.fromHandle(item.handle)).toBe(item);
    expect(QuestItem.fromHandle(undefined)).toBeUndefined();
  });
});

describe("QuestItem.create", () => {
  const quest = Quest.create();

  it("wraps the handle QuestCreateItem returns and keeps its quest", () => {
    const item = QuestItem.create(quest);
    expect(stubCalls()).toContainCall(
      `QuestCreateItem(${handleRef("quest", quest.handle)})`,
    );
    expect(item.quest).toBe(quest);
    expect(QuestItem.fromHandle(item.handle)).toBe(item);
  });

  it("throws when QuestCreateItem returns nil", () => {
    const message = withNative(
      "QuestCreateItem",
      () => undefined,
      () =>
        raisedIn(() => {
          QuestItem.create(quest);
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create QuestItem");
  });
});

describe("quest.addItem", () => {
  const quest = Quest.create();

  it("creates an item for the quest with its description", () => {
    const item = quest.addItem("Slay the dragon");
    expect(stubCalls()).toContainCall(
      `QuestCreateItem(${handleRef("quest", quest.handle)})`,
    );
    expect(stubCalls()).toContainCall(
      `QuestItemSetDescription(${handleRef("questitem", item.handle)}, "Slay the dragon")`,
    );
    expect(item.quest).toBe(quest);
    expect(QuestItem.fromHandle(item.handle)).toBe(item);
  });

  it("throws when QuestCreateItem returns nil", () => {
    const message = withNative(
      "QuestCreateItem",
      () => undefined,
      () =>
        raisedIn(() => {
          quest.addItem("Slay the dragon");
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create QuestItem");
  });
});
