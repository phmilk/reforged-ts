/** @noSelfInFile */

// The field members of Unit and Item: getField and setField take a field
// constant of any of the four field types and call the Native of its type,
// read from the constant's `tostring`, which the game writes as the type
// name, a colon and the address. The stubs define no field constant and no
// field Native, so a constant is built here with that `tostring` and each
// Native is supplied with `withNative`.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Item, MapPlayer, Unit } from "../src/index";
import { defined } from "./support/defined";
import { handleRef } from "./support/handle-ref";
import { withNative } from "./support/native-override";

/** A value whose `tostring` is `text`, rendered in the call log by `name`. */
function withText(text: string, name: string): handle {
  return setmetatable(
    { __name: name },
    {
      __tostring(this: unknown): string {
        return text;
      },
    },
  ) as unknown as handle;
}

/** A field constant of `kind`, whose `tostring` begins as the game's does. */
function fieldConstant(kind: string, name: string): handle {
  return withText(`${kind}: 0000ABCD`, name);
}

const owner = defined(MapPlayer.fromIndex(0), "MapPlayer.fromIndex(0)");
const unit = Unit.create(owner, FourCC("hfoo"), 0, 0);
const unitRef = handleRef("unit", unit.handle);
const item = Item.create(FourCC("ratf"), 0, 0);
const itemRef = handleRef("item", item.handle);

const unitBoolean = fieldConstant(
  "unitbooleanfield",
  "UNIT_BF_HERO_HIDE_HERO_INTERFACE_ICON",
) as unitbooleanfield;
const unitInteger = fieldConstant(
  "unitintegerfield",
  "UNIT_IF_GOLD_BOUNTY_AWARDED_BASE",
) as unitintegerfield;
const unitReal = fieldConstant(
  "unitrealfield",
  "UNIT_RF_CAST_RANGE",
) as unitrealfield;
const unitString = fieldConstant(
  "unitstringfield",
  "UNIT_SF_NAME",
) as unitstringfield;
const itemBoolean = fieldConstant(
  "itembooleanfield",
  "ITEM_BF_DROPPED_WHEN_CARRIER_DIES",
) as itembooleanfield;
const itemInteger = fieldConstant(
  "itemintegerfield",
  "ITEM_IF_LEVEL",
) as itemintegerfield;
const itemReal = fieldConstant(
  "itemrealfield",
  "ITEM_RF_SCALING_VALUE",
) as itemrealfield;
const itemString = fieldConstant(
  "itemstringfield",
  "ITEM_SF_MODEL_USED",
) as itemstringfield;

describe("Unit.getField", () => {
  it("reads a boolean field with BlzGetUnitBooleanField", () => {
    const value = withNative(
      "BlzGetUnitBooleanField",
      () => true,
      () => unit.getField(unitBoolean),
    );
    expect(value).toBe(true);
    expect(stubCalls()).toContainCall(
      `BlzGetUnitBooleanField(${unitRef}, UNIT_BF_HERO_HIDE_HERO_INTERFACE_ICON)`,
    );
  });

  it("reads an integer field with BlzGetUnitIntegerField", () => {
    const value = withNative(
      "BlzGetUnitIntegerField",
      () => 25,
      () => unit.getField(unitInteger),
    );
    expect(value).toBe(25);
    expect(stubCalls()).toContainCall(
      `BlzGetUnitIntegerField(${unitRef}, UNIT_IF_GOLD_BOUNTY_AWARDED_BASE)`,
    );
  });

  it("reads a real field with BlzGetUnitRealField", () => {
    const value = withNative(
      "BlzGetUnitRealField",
      () => 600.5,
      () => unit.getField(unitReal),
    );
    expect(value).toBe(600.5);
    expect(stubCalls()).toContainCall(
      `BlzGetUnitRealField(${unitRef}, UNIT_RF_CAST_RANGE)`,
    );
  });

  it("reads a string field with BlzGetUnitStringField", () => {
    const value = withNative(
      "BlzGetUnitStringField",
      () => "Footman",
      () => unit.getField(unitString),
    );
    expect(value).toBe("Footman");
    expect(stubCalls()).toContainCall(
      `BlzGetUnitStringField(${unitRef}, UNIT_SF_NAME)`,
    );
  });

  it("is 0 for a value whose tostring names no type", () => {
    expect(
      unit.getField(withText("no type", "NOT_A_FIELD") as unitbooleanfield),
    ).toBe(0);
  });
});

describe("Unit.setField", () => {
  it("writes a boolean field with BlzSetUnitBooleanField", () => {
    const done = withNative(
      "BlzSetUnitBooleanField",
      () => true,
      () => unit.setField(unitBoolean, true),
    );
    expect(done).toBe(true);
    expect(stubCalls()).toContainCall(
      `BlzSetUnitBooleanField(${unitRef}, UNIT_BF_HERO_HIDE_HERO_INTERFACE_ICON, true)`,
    );
  });

  it("writes an integer field with BlzSetUnitIntegerField", () => {
    const done = withNative(
      "BlzSetUnitIntegerField",
      () => true,
      () => unit.setField(unitInteger, 30),
    );
    expect(done).toBe(true);
    expect(stubCalls()).toContainCall(
      `BlzSetUnitIntegerField(${unitRef}, UNIT_IF_GOLD_BOUNTY_AWARDED_BASE, 30)`,
    );
  });

  it("writes a real field with BlzSetUnitRealField", () => {
    const done = withNative(
      "BlzSetUnitRealField",
      () => true,
      () => unit.setField(unitReal, 700.5),
    );
    expect(done).toBe(true);
    expect(stubCalls()).toContainCall(
      `BlzSetUnitRealField(${unitRef}, UNIT_RF_CAST_RANGE, 700.5)`,
    );
  });

  it("writes a string field with BlzSetUnitStringField", () => {
    const done = withNative(
      "BlzSetUnitStringField",
      () => true,
      () => unit.setField(unitString, "Captain"),
    );
    expect(done).toBe(true);
    expect(stubCalls()).toContainCall(
      `BlzSetUnitStringField(${unitRef}, UNIT_SF_NAME, "Captain")`,
    );
  });

  it("is false for a value of the wrong type", () => {
    expect(unit.setField(unitBoolean, "yes")).toBe(false);
    expect(unit.setField(unitString, 1)).toBe(false);
  });
});

describe("Item.getField", () => {
  it("reads a boolean field with BlzGetItemBooleanField", () => {
    const value = withNative(
      "BlzGetItemBooleanField",
      () => true,
      () => item.getField(itemBoolean),
    );
    expect(value).toBe(true);
    expect(stubCalls()).toContainCall(
      `BlzGetItemBooleanField(${itemRef}, ITEM_BF_DROPPED_WHEN_CARRIER_DIES)`,
    );
  });

  it("reads an integer field with BlzGetItemIntegerField", () => {
    const value = withNative(
      "BlzGetItemIntegerField",
      () => 3,
      () => item.getField(itemInteger),
    );
    expect(value).toBe(3);
    expect(stubCalls()).toContainCall(
      `BlzGetItemIntegerField(${itemRef}, ITEM_IF_LEVEL)`,
    );
  });

  it("reads a real field with BlzGetItemRealField", () => {
    const value = withNative(
      "BlzGetItemRealField",
      () => 1.5,
      () => item.getField(itemReal),
    );
    expect(value).toBe(1.5);
    expect(stubCalls()).toContainCall(
      `BlzGetItemRealField(${itemRef}, ITEM_RF_SCALING_VALUE)`,
    );
  });

  it("reads a string field with BlzGetItemStringField", () => {
    const value = withNative(
      "BlzGetItemStringField",
      () => "ration.mdx",
      () => item.getField(itemString),
    );
    expect(value).toBe("ration.mdx");
    expect(stubCalls()).toContainCall(
      `BlzGetItemStringField(${itemRef}, ITEM_SF_MODEL_USED)`,
    );
  });
});

describe("Item.setField", () => {
  it("writes a boolean field with BlzSetItemBooleanField", () => {
    const done = withNative(
      "BlzSetItemBooleanField",
      () => true,
      () => item.setField(itemBoolean, false),
    );
    expect(done).toBe(true);
    expect(stubCalls()).toContainCall(
      `BlzSetItemBooleanField(${itemRef}, ITEM_BF_DROPPED_WHEN_CARRIER_DIES, false)`,
    );
  });

  it("writes an integer field with BlzSetItemIntegerField", () => {
    const done = withNative(
      "BlzSetItemIntegerField",
      () => true,
      () => item.setField(itemInteger, 4),
    );
    expect(done).toBe(true);
    expect(stubCalls()).toContainCall(
      `BlzSetItemIntegerField(${itemRef}, ITEM_IF_LEVEL, 4)`,
    );
  });

  it("writes a real field with BlzSetItemRealField", () => {
    const done = withNative(
      "BlzSetItemRealField",
      () => true,
      () => item.setField(itemReal, 2.5),
    );
    expect(done).toBe(true);
    expect(stubCalls()).toContainCall(
      `BlzSetItemRealField(${itemRef}, ITEM_RF_SCALING_VALUE, 2.5)`,
    );
  });

  it("writes a string field with BlzSetItemStringField", () => {
    const done = withNative(
      "BlzSetItemStringField",
      () => true,
      () => item.setField(itemString, "bread.mdx"),
    );
    expect(done).toBe(true);
    expect(stubCalls()).toContainCall(
      `BlzSetItemStringField(${itemRef}, ITEM_SF_MODEL_USED, "bread.mdx")`,
    );
  });
});
