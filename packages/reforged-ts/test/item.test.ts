/** @noSelfInFile */

// Item on the Handle base: `create` throws naming the rawcode, `fromEvent`
// returns undefined when the game has no item to give. The equipment members
// take and return the equipment enums: `equipmentType` and `tag` match the
// Handle their Native returns against the named constants and throw naming
// the Native for one no constant names.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { EquipmentType, Item, ItemTag } from "../src/index";
import { handleRef } from "./support/handle-ref";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

const ration = FourCC("ratf");
const skin = FourCC("rde1");

describe("Item.create", () => {
  it("wraps the handle CreateItem returns, and a lookup finds it", () => {
    const item = Item.create(ration, 10, 20);
    expect(stubCalls()).toContainCall(`CreateItem(${String(ration)}, 10, 20)`);
    expect(Item.fromHandle(item.handle)).toBe(item);
  });

  it("creates with BlzCreateItemWithSkin when a skin is given", () => {
    const item = Item.create(ration, 10, 20, skin);
    expect(stubCalls()).toContainCall(
      `BlzCreateItemWithSkin(${String(ration)}, 10, 20, ${String(skin)})`,
    );
    expect(Item.fromHandle(item.handle)).toBe(item);
  });

  it("throws naming the rawcode when CreateItem returns nil", () => {
    const message = withNative(
      "CreateItem",
      () => undefined,
      () =>
        raisedIn(() => {
          Item.create(ration, 10, 20);
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Item (ratf)");
  });

  it("throws naming the rawcode when BlzCreateItemWithSkin returns nil", () => {
    const message = withNative(
      "BlzCreateItemWithSkin",
      () => undefined,
      () =>
        raisedIn(() => {
          Item.create(ration, 10, 20, skin);
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Item (ratf)");
  });
});

describe("Item.fromEvent", () => {
  it("is undefined when GetManipulatedItem returns nil", () => {
    expect(
      withNative(
        "GetManipulatedItem",
        () => undefined,
        () => Item.fromEvent(),
      ),
    ).toBeUndefined();
  });

  it("is the Wrapper of the item GetManipulatedItem returns", () => {
    const item = Item.create(ration, 0, 0);
    expect(
      withNative(
        "GetManipulatedItem",
        () => item.handle,
        () => Item.fromEvent(),
      ),
    ).toBe(item);
  });
});

describe("Item.equipmentType", () => {
  const cases: [equipmentType, EquipmentType, string][] = [
    [EQUIPMENT_TYPE_NONE, EquipmentType.None, "EQUIPMENT_TYPE_NONE"],
    [EQUIPMENT_TYPE_HEAD, EquipmentType.Head, "EQUIPMENT_TYPE_HEAD"],
    [EQUIPMENT_TYPE_CHEST, EquipmentType.Chest, "EQUIPMENT_TYPE_CHEST"],
    [EQUIPMENT_TYPE_GLOVES, EquipmentType.Gloves, "EQUIPMENT_TYPE_GLOVES"],
    [EQUIPMENT_TYPE_BOOTS, EquipmentType.Boots, "EQUIPMENT_TYPE_BOOTS"],
    [EQUIPMENT_TYPE_RING, EquipmentType.Ring, "EQUIPMENT_TYPE_RING"],
    [EQUIPMENT_TYPE_PRIMARY, EquipmentType.Primary, "EQUIPMENT_TYPE_PRIMARY"],
    [EQUIPMENT_TYPE_OFFHAND, EquipmentType.Offhand, "EQUIPMENT_TYPE_OFFHAND"],
    [EQUIPMENT_TYPE_TRINKET, EquipmentType.Trinket, "EQUIPMENT_TYPE_TRINKET"],
    [EQUIPMENT_TYPE_ANY, EquipmentType.Any, "EQUIPMENT_TYPE_ANY"],
  ];
  for (const [constant, member, name] of cases) {
    it(`is the member for ${name}`, () => {
      const item = Item.create(ration, 0, 0);
      const type = withNative(
        "GetItemEquipmentType",
        () => constant,
        () => item.equipmentType,
      );
      expect(type).toEqual(member);
      expect(stubCalls()).toContainCall(
        `GetItemEquipmentType(${handleRef("item", item.handle)})`,
      );
    });
  }

  it("throws naming GetItemEquipmentType for a handle no constant names", () => {
    const item = Item.create(ration, 0, 0);
    let read: EquipmentType | undefined;
    const message = withNative(
      "GetItemEquipmentType",
      () => ConvertEquipmentType(42),
      () =>
        raisedIn(() => {
          read = item.equipmentType;
        }),
    );
    expect(message).toEqual(
      "reforged-ts: GetItemEquipmentType returned a value EquipmentType does not name",
    );
    expect(read).toBeUndefined();
  });
});

describe("Item.tag", () => {
  const cases: [itemTag, ItemTag, string][] = [
    [ITEMTAG_TYPE_UNDEFINED, ItemTag.Undefined, "ITEMTAG_TYPE_UNDEFINED"],
    [ITEMTAG_TYPE_DROPPABLE, ItemTag.Droppable, "ITEMTAG_TYPE_DROPPABLE"],
    [ITEMTAG_TYPE_QUESTREWARD, ItemTag.QuestReward, "ITEMTAG_TYPE_QUESTREWARD"],
    [ITEMTAG_TYPE_BOSSDROP, ItemTag.BossDrop, "ITEMTAG_TYPE_BOSSDROP"],
    [ITEMTAG_TYPE_SECRET, ItemTag.Secret, "ITEMTAG_TYPE_SECRET"],
    [ITEMTAG_TYPE_PUZZLE, ItemTag.Puzzle, "ITEMTAG_TYPE_PUZZLE"],
    [ITEMTAG_TYPE_WORLD, ItemTag.World, "ITEMTAG_TYPE_WORLD"],
    [ITEMTAG_TYPE_SHOP, ItemTag.Shop, "ITEMTAG_TYPE_SHOP"],
    [ITEMTAG_TYPE_ANY, ItemTag.Any, "ITEMTAG_TYPE_ANY"],
  ];
  for (const [constant, member, name] of cases) {
    it(`is the member for ${name}`, () => {
      const item = Item.create(ration, 0, 0);
      const tag = withNative(
        "GetItemTag",
        () => constant,
        () => item.tag,
      );
      expect(tag).toEqual(member);
      expect(stubCalls()).toContainCall(
        `GetItemTag(${handleRef("item", item.handle)})`,
      );
    });
  }

  it("throws naming GetItemTag for a handle no constant names", () => {
    const item = Item.create(ration, 0, 0);
    let read: ItemTag | undefined;
    const message = withNative(
      "GetItemTag",
      () => ConvertItemTag(42),
      () =>
        raisedIn(() => {
          read = item.tag;
        }),
    );
    expect(message).toEqual(
      "reforged-ts: GetItemTag returned a value ItemTag does not name",
    );
    expect(read).toBeUndefined();
  });
});

describe("Item.isEquipped and Item.isInBag", () => {
  it("isEquipped is what IsItemEquipped answers for the item", () => {
    const item = Item.create(ration, 0, 0);
    const equipped = withNative(
      "IsItemEquipped",
      () => true,
      () => item.isEquipped,
    );
    expect(equipped).toEqual(true);
    expect(stubCalls()).toContainCall(
      `IsItemEquipped(${handleRef("item", item.handle)})`,
    );
  });

  it("isInBag is what IsItemInBag answers for the item", () => {
    const item = Item.create(ration, 0, 0);
    const bagged = withNative(
      "IsItemInBag",
      () => true,
      () => item.isInBag,
    );
    expect(bagged).toEqual(true);
    expect(stubCalls()).toContainCall(
      `IsItemInBag(${handleRef("item", item.handle)})`,
    );
  });
});

describe("Item.color", () => {
  it("sets the item's colour through SetItemColor", () => {
    const item = Item.create(ration, 0, 0);
    withNative(
      "SetItemColor",
      () => undefined,
      () => {
        item.color = PLAYER_COLOR_BLUE;
      },
    );
    expect(stubCalls()).toContainCall(
      `SetItemColor(${handleRef("item", item.handle)}, PLAYER_COLOR_BLUE)`,
    );
  });
});

describe("Item.chooseRandomWithFilter", () => {
  it("passes the item type, the level and the converted enums, and returns the item type id", () => {
    const id = withNative(
      "ChooseRandomItemExWithFilter",
      () => ration,
      () =>
        Item.chooseRandomWithFilter(
          ITEM_TYPE_PERMANENT,
          3,
          EquipmentType.Ring,
          ItemTag.Shop,
        ),
    );
    expect(id).toEqual(ration);
    expect(stubCalls()).toContainCall(
      "ChooseRandomItemExWithFilter(ITEM_TYPE_PERMANENT, 3, EQUIPMENT_TYPE_RING, ITEMTAG_TYPE_SHOP)",
    );
  });

  it("returns 0 when the game finds no item type", () => {
    expect(
      withNative(
        "ChooseRandomItemExWithFilter",
        () => 0,
        () =>
          Item.chooseRandomWithFilter(
            ITEM_TYPE_ANY,
            1,
            EquipmentType.Any,
            ItemTag.Any,
          ),
      ),
    ).toEqual(0);
  });
});
