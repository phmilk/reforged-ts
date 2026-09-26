/** @noSelfInFile */

// Unit on the Handle base. A Wrapper passes its arguments to the Native, and
// what the Native returns comes back through the Wrapper (argument
// recording). The members whose Natives allocate (create, getPoint,
// addItemById) throw when the Native returns nothing, naming the rawcode
// where there is one; the lookups return undefined; getOwner is the
// documented non-null path (a live unit has an owner).

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import {
  Destructable,
  EquipmentType,
  Item,
  LoadoutSlot,
  MapPlayer,
  Point,
  Unit,
} from "../src/index";
import { defined } from "./support/defined";
import { handleRef } from "./support/handle-ref";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

const footman = FourCC("hfoo");
const knightSkin = FourCC("hkni");
const ration = FourCC("ratf");
const owner = defined(MapPlayer.fromIndex(0), "MapPlayer.fromIndex(0)");

describe("Unit.create", () => {
  const ownerRef = handleRef("player", owner.handle);

  it("passes the recorded arguments to CreateUnit", () => {
    Unit.create(owner, footman, 10, 20, 90);
    expect(stubCalls()).toContainCall(
      `CreateUnit(${ownerRef}, 1751543663, 10, 20, 90)`,
    );
  });

  it("passes the default facing when none is given", () => {
    Unit.create(owner, footman, -64, 128.5);
    expect(stubCalls()).toContainCall(
      `CreateUnit(${ownerRef}, 1751543663, -64, 128.5, 270.0)`,
    );
  });

  it("wraps the handle CreateUnit returns, and a lookup finds it", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    expect(unit.typeId).toEqual(footman);
    expect(Unit.fromHandle(unit.handle)).toBe(unit);
  });

  it("creates with BlzCreateUnitWithSkin when a skin is given", () => {
    const unit = Unit.create(owner, footman, 5, 6, 45, knightSkin);
    expect(stubCalls()).toContainCall(
      `BlzCreateUnitWithSkin(${ownerRef}, 1751543663, 5, 6, 45, ${String(knightSkin)})`,
    );
    expect(Unit.fromHandle(unit.handle)).toBe(unit);
  });

  it("throws naming the rawcode when CreateUnit returns nil, and still records the call", () => {
    const message = withNative(
      "CreateUnit",
      () => undefined,
      () =>
        raisedIn(() => {
          Unit.create(owner, footman, 30, 40, 180);
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Unit (hfoo)");
    expect(stubCalls()).toContainCall(
      `CreateUnit(${ownerRef}, 1751543663, 30, 40, 180)`,
    );
  });

  it("throws naming the rawcode when BlzCreateUnitWithSkin returns nil", () => {
    const message = withNative(
      "BlzCreateUnitWithSkin",
      () => undefined,
      () =>
        raisedIn(() => {
          Unit.create(owner, footman, 30, 40, 180, knightSkin);
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Unit (hfoo)");
  });
});

describe("Unit.getOwner", () => {
  it("is the owner the unit was created with", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    const found: MapPlayer = unit.getOwner();
    expect(found).toBe(owner);
    expect(found.handle).toBe(owner.handle);
  });

  it("throws when GetOwningPlayer returns nil, never returning undefined", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    const message = withNative(
      "GetOwningPlayer",
      () => undefined,
      () =>
        raisedIn(() => {
          unit.getOwner();
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create MapPlayer");
  });
});

describe("Unit ability cooldowns", () => {
  const thunderClap = FourCC("AHtc");

  it("getAbilityCooldownPercent is what BlzGetUnitAbilityCooldownPercent answers", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    const percent = withNative(
      "BlzGetUnitAbilityCooldownPercent",
      () => 0.25,
      () => unit.getAbilityCooldownPercent(thunderClap),
    );
    expect(percent).toEqual(0.25);
    expect(stubCalls()).toContainCall(
      `BlzGetUnitAbilityCooldownPercent(${handleRef("unit", unit.handle)}, ${tostring(thunderClap)})`,
    );
  });

  it("the setters and adjusters pass the ability and the value to their Native", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    const unitRef = handleRef("unit", unit.handle);
    withNative(
      "BlzSetUnitAbilityCooldownRemaining",
      () => undefined,
      () => {
        unit.setAbilityCooldownRemaining(thunderClap, 4.5);
      },
    );
    withNative(
      "BlzSetUnitAbilityCooldownPercent",
      () => undefined,
      () => {
        unit.setAbilityCooldownPercent(thunderClap, 0.5);
      },
    );
    withNative(
      "BlzAdjustUnitAbilityCooldownRemaining",
      () => undefined,
      () => {
        unit.adjustAbilityCooldownRemaining(thunderClap, -1.5);
      },
    );
    withNative(
      "BlzAdjustUnitAbilityCooldownPercent",
      () => undefined,
      () => {
        unit.adjustAbilityCooldownPercent(thunderClap, 0.125);
      },
    );
    expect(stubCalls()).toContainCall(
      `BlzSetUnitAbilityCooldownRemaining(${unitRef}, ${tostring(thunderClap)}, 4.5)`,
    );
    expect(stubCalls()).toContainCall(
      `BlzSetUnitAbilityCooldownPercent(${unitRef}, ${tostring(thunderClap)}, 0.5)`,
    );
    expect(stubCalls()).toContainCall(
      `BlzAdjustUnitAbilityCooldownRemaining(${unitRef}, ${tostring(thunderClap)}, -1.5)`,
    );
    expect(stubCalls()).toContainCall(
      `BlzAdjustUnitAbilityCooldownPercent(${unitRef}, ${tostring(thunderClap)}, 0.125)`,
    );
  });
});

describe("Unit.getAnimationDuration", () => {
  it("reads a named animation through BlzGetUnitAnimationDuration", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    const duration = withNative(
      "BlzGetUnitAnimationDuration",
      () => 1.25,
      () => unit.getAnimationDuration("attack slam"),
    );
    expect(duration).toEqual(1.25);
    expect(stubCalls()).toContainCall(
      `BlzGetUnitAnimationDuration(${handleRef("unit", unit.handle)}, "attack slam")`,
    );
  });

  it("reads an animation index through BlzGetUnitAnimationDurationByIndex", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    const duration = withNative(
      "BlzGetUnitAnimationDurationByIndex",
      () => 0.75,
      () => unit.getAnimationDuration(3),
    );
    expect(duration).toEqual(0.75);
    expect(stubCalls()).toContainCall(
      `BlzGetUnitAnimationDurationByIndex(${handleRef("unit", unit.handle)}, 3)`,
    );
  });
});

describe("Unit hero glow", () => {
  it("allowHeroGlow(true) calls AllowHeroGlowOnUnit", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    withNative(
      "AllowHeroGlowOnUnit",
      () => undefined,
      () => {
        unit.allowHeroGlow(true);
      },
    );
    expect(stubCalls()).toContainCall(
      `AllowHeroGlowOnUnit(${handleRef("unit", unit.handle)})`,
    );
  });

  it("allowHeroGlow(false) calls DisallowHeroGlowOnUnit", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    withNative(
      "DisallowHeroGlowOnUnit",
      () => undefined,
      () => {
        unit.allowHeroGlow(false);
      },
    );
    expect(stubCalls()).toContainCall(
      `DisallowHeroGlowOnUnit(${handleRef("unit", unit.handle)})`,
    );
  });

  it("isHeroGlowAllowed is what HeroGlowIsAllowedOnUnit answers", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    const allowed = withNative(
      "HeroGlowIsAllowedOnUnit",
      () => true,
      () => unit.isHeroGlowAllowed,
    );
    expect(allowed).toEqual(true);
    expect(stubCalls()).toContainCall(
      `HeroGlowIsAllowedOnUnit(${handleRef("unit", unit.handle)})`,
    );
  });
});

describe("Unit auras and attack reset", () => {
  it("enableAuras passes both flags to BlzUnitEnableAuras", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    withNative(
      "BlzUnitEnableAuras",
      () => undefined,
      () => {
        unit.enableAuras(false, true);
      },
    );
    expect(stubCalls()).toContainCall(
      `BlzUnitEnableAuras(${handleRef("unit", unit.handle)}, false, true)`,
    );
  });

  it("resetAttack passes the weapon index to BlzResetUnitAttack", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    withNative(
      "BlzResetUnitAttack",
      () => undefined,
      () => {
        unit.resetAttack(1);
      },
    );
    expect(stubCalls()).toContainCall(
      `BlzResetUnitAttack(${handleRef("unit", unit.handle)}, 1)`,
    );
  });
});

describe("Unit event and enumeration lookups", () => {
  it("are undefined when their Native returns nil", () => {
    expect(
      withNative(
        "GetTriggerUnit",
        () => undefined,
        () => Unit.fromEvent(),
      ),
    ).toBeUndefined();
    expect(
      withNative(
        "GetEnumUnit",
        () => undefined,
        () => Unit.fromEnum(),
      ),
    ).toBeUndefined();
    expect(
      withNative(
        "GetFilterUnit",
        () => undefined,
        () => Unit.fromFilter(),
      ),
    ).toBeUndefined();
  });

  it("are the Wrapper of the unit their Native returns", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    expect(
      withNative(
        "GetTriggerUnit",
        () => unit.handle,
        () => Unit.fromEvent(),
      ),
    ).toBe(unit);
    expect(
      withNative(
        "GetEnumUnit",
        () => unit.handle,
        () => Unit.fromEnum(),
      ),
    ).toBe(unit);
    expect(
      withNative(
        "GetFilterUnit",
        () => unit.handle,
        () => Unit.fromFilter(),
      ),
    ).toBe(unit);
  });
});

describe("Unit.getPoint", () => {
  it("wraps the new location GetUnitLoc returns, a new one per call", () => {
    const unit = Unit.create(owner, footman, 7, 8);
    const point: Point = unit.getPoint();
    expect(stubCalls()).toContainCall(
      `GetUnitLoc(${handleRef("unit", unit.handle)})`,
    );
    expect(Point.fromHandle(point.handle)).toBe(point);
    expect(unit.getPoint() === point).toEqual(false);
  });

  it("throws when GetUnitLoc returns nil", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    const message = withNative(
      "GetUnitLoc",
      () => undefined,
      () =>
        raisedIn(() => {
          unit.getPoint();
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Point");
  });
});

describe("Unit rally lookups", () => {
  it("are undefined for a unit with no rally", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    expect(unit.rallyPoint).toBeUndefined();
    expect(unit.rallyUnit).toBeUndefined();
    expect(unit.rallyDestructable).toBeUndefined();
  });

  it("rallyPoint wraps the location GetUnitRallyPoint returns", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    const location = Location(3, 4);
    const point = withNative(
      "GetUnitRallyPoint",
      () => location,
      () => unit.rallyPoint,
    );
    expect(point?.handle).toBe(location);
    expect(Point.fromHandle(location)).toBe(point);
  });

  it("rallyUnit is the Wrapper of the unit GetUnitRallyUnit returns", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    const target = Unit.create(owner, footman, 9, 9);
    expect(
      withNative(
        "GetUnitRallyUnit",
        () => target.handle,
        () => unit.rallyUnit,
      ),
    ).toBe(target);
  });

  it("rallyDestructable is the Wrapper of the destructable GetUnitRallyDestructable returns", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    const tree = Destructable.create({ typeId: FourCC("LTlt"), x: 0, y: 0 });
    expect(
      withNative(
        "GetUnitRallyDestructable",
        () => tree.handle,
        () => unit.rallyDestructable,
      ),
    ).toBe(tree);
  });
});

describe("Unit inventory", () => {
  it("addItemById wraps the new item UnitAddItemById returns", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    const item: Item = unit.addItemById(ration);
    expect(stubCalls()).toContainCall(
      `UnitAddItemById(${handleRef("unit", unit.handle)}, ${String(ration)})`,
    );
    expect(Item.fromHandle(item.handle)).toBe(item);
  });

  it("addItemById throws naming the rawcode when UnitAddItemById returns nil", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    const message = withNative(
      "UnitAddItemById",
      () => undefined,
      () =>
        raisedIn(() => {
          unit.addItemById(ration);
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Item (ratf)");
  });

  it("getItemInSlot is the item in the slot, undefined for an empty one", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    const first = unit.addItemById(ration);
    const second = unit.addItemById(ration);
    expect(unit.getItemInSlot(0)).toBe(first);
    expect(unit.getItemInSlot(1)).toBe(second);
    expect(unit.getItemInSlot(2)).toBeUndefined();
  });

  it("removeItemFromSlot is the item it removed, undefined for an empty slot", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    const item = unit.addItemById(ration);
    expect(unit.removeItemFromSlot(0)).toBe(item);
    expect(unit.getItemInSlot(0)).toBeUndefined();
    expect(unit.removeItemFromSlot(0)).toBeUndefined();
  });
});

describe("Unit equipment and bag", () => {
  const heroAndItem = () => {
    const unit = Unit.create(owner, footman, 0, 0);
    const item = Item.create(ration, 0, 0);
    return {
      unit,
      item,
      unitRef: handleRef("unit", unit.handle),
      itemRef: handleRef("item", item.handle),
    };
  };

  it("equip is what UnitEquipItem answers for the unit and the item", () => {
    const { unit, item, unitRef, itemRef } = heroAndItem();
    const equipped = withNative(
      "UnitEquipItem",
      () => true,
      () => unit.equip(item),
    );
    expect(equipped).toBe(true);
    expect(stubCalls()).toContainCall(`UnitEquipItem(${unitRef}, ${itemRef})`);
  });

  it("unequip passes the unit and the item to UnitUnequipItem", () => {
    const { unit, item, unitRef, itemRef } = heroAndItem();
    withNative(
      "UnitUnequipItem",
      () => undefined,
      () => {
        unit.unequip(item);
      },
    );
    expect(stubCalls()).toContainCall(
      `UnitUnequipItem(${unitRef}, ${itemRef})`,
    );
  });

  it("the item predicates are what their Native answers for the unit and the item", () => {
    const { unit, item, unitRef, itemRef } = heroAndItem();
    expect(
      withNative(
        "UnitHasItemEquipped",
        () => true,
        () => unit.hasEquipped(item),
      ),
    ).toBe(true);
    expect(
      withNative(
        "UnitHasItemBagged",
        () => false,
        () => unit.hasBagged(item),
      ),
    ).toBe(false);
    expect(stubCalls()).toContainCall(
      `UnitHasItemEquipped(${unitRef}, ${itemRef})`,
    );
    expect(stubCalls()).toContainCall(
      `UnitHasItemBagged(${unitRef}, ${itemRef})`,
    );
  });

  it("hasAnyEquipped is what UnitHasAnyItemEquiped answers for the unit", () => {
    const { unit, unitRef } = heroAndItem();
    expect(
      withNative(
        "UnitHasAnyItemEquiped",
        () => true,
        () => unit.hasAnyEquipped(),
      ),
    ).toBe(true);
    expect(stubCalls()).toContainCall(`UnitHasAnyItemEquiped(${unitRef})`);
  });

  it("bagSize is what UnitExtendedInventorySize answers for the unit", () => {
    const { unit, unitRef } = heroAndItem();
    expect(
      withNative(
        "UnitExtendedInventorySize",
        () => 12,
        () => unit.bagSize,
      ),
    ).toEqual(12);
    expect(stubCalls()).toContainCall(`UnitExtendedInventorySize(${unitRef})`);
  });

  it("the equipment-type predicates pass the converted EquipmentType to their Native", () => {
    const { unit, unitRef } = heroAndItem();
    expect(
      withNative(
        "UnitHasItemEquipmentOfType",
        () => true,
        () => unit.hasEquipmentOfType(EquipmentType.Ring),
      ),
    ).toBe(true);
    expect(
      withNative(
        "UnitCanEquipItemOfEquipmentType",
        () => false,
        () => unit.canEquip(EquipmentType.Offhand),
      ),
    ).toBe(false);
    expect(stubCalls()).toContainCall(
      `UnitHasItemEquipmentOfType(${unitRef}, EQUIPMENT_TYPE_RING)`,
    );
    expect(stubCalls()).toContainCall(
      `UnitCanEquipItemOfEquipmentType(${unitRef}, EQUIPMENT_TYPE_OFFHAND)`,
    );
  });

  it("hasEmptySlot passes the converted LoadoutSlot to UnitHasLoadoutSlotEmpty", () => {
    const { unit, unitRef } = heroAndItem();
    expect(
      withNative(
        "UnitHasLoadoutSlotEmpty",
        () => true,
        () => unit.hasEmptySlot(LoadoutSlot.RingAlt),
      ),
    ).toBe(true);
    expect(stubCalls()).toContainCall(
      `UnitHasLoadoutSlotEmpty(${unitRef}, EQUIPMENT_LOADOUT_SLOT_RINGALT)`,
    );
  });

  it("equippedItem is the registry's Item in the slot, undefined for an empty one", () => {
    const { unit, item, unitRef } = heroAndItem();
    expect(
      withNative(
        "UnitItemInEquipmentSlot",
        () => item.handle,
        () => unit.equippedItem(LoadoutSlot.Head),
      ),
    ).toBe(item);
    expect(
      withNative(
        "UnitItemInEquipmentSlot",
        () => undefined,
        () => unit.equippedItem(LoadoutSlot.Trinket),
      ),
    ).toBeUndefined();
    expect(stubCalls()).toContainCall(
      `UnitItemInEquipmentSlot(${unitRef}, EQUIPMENT_LOADOUT_SLOT_HEAD)`,
    );
    expect(stubCalls()).toContainCall(
      `UnitItemInEquipmentSlot(${unitRef}, EQUIPMENT_LOADOUT_SLOT_TRINKET)`,
    );
  });

  it("unequipSlot is the registry's Item it unequipped, undefined for an empty slot", () => {
    const { unit, item, unitRef } = heroAndItem();
    expect(
      withNative(
        "UnitUnequipItemFromSlot",
        () => item.handle,
        () => unit.unequipSlot(LoadoutSlot.Chest),
      ),
    ).toBe(item);
    expect(
      withNative(
        "UnitUnequipItemFromSlot",
        () => undefined,
        () => unit.unequipSlot(LoadoutSlot.Boots),
      ),
    ).toBeUndefined();
    expect(stubCalls()).toContainCall(
      `UnitUnequipItemFromSlot(${unitRef}, EQUIPMENT_LOADOUT_SLOT_CHEST)`,
    );
    expect(stubCalls()).toContainCall(
      `UnitUnequipItemFromSlot(${unitRef}, EQUIPMENT_LOADOUT_SLOT_BOOTS)`,
    );
  });

  it("bagItem is the registry's Item at the bag index, undefined for an empty one", () => {
    const { unit, item, unitRef } = heroAndItem();
    expect(
      withNative(
        "UnitItemInBagSlot",
        () => item.handle,
        () => unit.bagItem(3),
      ),
    ).toBe(item);
    expect(
      withNative(
        "UnitItemInBagSlot",
        () => undefined,
        () => unit.bagItem(4),
      ),
    ).toBeUndefined();
    expect(stubCalls()).toContainCall(`UnitItemInBagSlot(${unitRef}, 3)`);
    expect(stubCalls()).toContainCall(`UnitItemInBagSlot(${unitRef}, 4)`);
  });
});
