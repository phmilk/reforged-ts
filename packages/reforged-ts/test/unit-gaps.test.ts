/** @noSelfInFile */

// The pre-existing gaps of Unit and Widget (#172): one case per Native the
// Wrapper coverage report listed as missing on the two Wrappers, named by
// that Native. Each case runs its member with the Native answering `answer`
// and checks the call-log line and what the member returns; a lookup case
// also checks that the member is undefined when the Native answers nothing.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Destructable, Item, MapPlayer, Unit, Widget } from "../src/index";
import { OrderId } from "../src/globals/order";
import { defined } from "./support/defined";
import { fieldConstant, withText } from "./support/field-constant";
import { handleRef } from "./support/handle-ref";
import {
  type NativeName,
  type NativeOf,
  withNative,
} from "./support/native-override";

interface GapCase {
  /** The Native the case closes, as the report names it. */
  native: string;
  /** Runs the member with the Native overridden. */
  run: (answer: "given" | "nothing") => unknown;
  /** The call-log line the member records. */
  line: string;
  /** What the member returns when the Native answers `answer`. */
  returns: unknown;
  /** Whether the member is a lookup, undefined when the Native answers nothing. */
  lookup: boolean;
}

/** A case as written in the table, for the Native `N`. */
interface GapSpec<N extends NativeName> {
  /** What the Native answers; nothing when left out. */
  answer?: NativeOf<N>["returns"];
  /** Calls the member under test. */
  member: () => unknown;
  line: string;
  returns?: unknown;
  lookup?: boolean;
}

function gap<N extends NativeName>(native: N, spec: GapSpec<N>): GapCase {
  return {
    native,
    run: (answer) =>
      withNative(
        native,
        () => (answer === "given" ? spec.answer : undefined),
        () => spec.member(),
      ),
    line: spec.line,
    returns: spec.returns,
    lookup: spec.lookup ?? false,
  };
}

const footman = FourCC("hfoo");
const owner = defined(MapPlayer.fromIndex(0), "MapPlayer.fromIndex(0)");
const ownerRef = handleRef("player", owner.handle);
const unit = Unit.create(owner, footman, 0, 0);
const unitRef = handleRef("unit", unit.handle);
const target = Unit.create(owner, footman, 100, 100);
const targetRef = handleRef("unit", target.handle);
const item = Item.create(FourCC("ratf"), 0, 0);
const itemRef = handleRef("item", item.handle);
const tree = Destructable.create({ typeId: FourCC("LTlt"), x: 0, y: 0 });
const treeRef = handleRef("destructable", tree.handle);

const raceHuman = withText("race: 0000ABCD", "RACE_HUMAN") as race;
const heroType = withText("unittype: 0000ABCD", "UNIT_TYPE_HERO") as unittype;
const fogVisible = withText(
  "fogstate: 0000ABCD",
  "FOG_OF_WAR_VISIBLE",
) as fogstate;
const minimapIcon = withText(
  "minimapicon: 0000ABCD",
  "minimapicon",
) as minimapicon;
const weaponBoolean = fieldConstant(
  "unitweaponbooleanfield",
  "UNIT_WEAPON_BF_ATTACKS_ENABLED",
) as unitweaponbooleanfield;
const weaponInteger = fieldConstant(
  "unitweaponintegerfield",
  "UNIT_WEAPON_IF_ATTACK_DAMAGE_NUMBER_OF_DICE",
) as unitweaponintegerfield;
const weaponReal = fieldConstant(
  "unitweaponrealfield",
  "UNIT_WEAPON_RF_ATTACK_RANGE",
) as unitweaponrealfield;
const weaponString = fieldConstant(
  "unitweaponstringfield",
  "UNIT_WEAPON_SF_ATTACK_PROJECTILE_ART",
) as unitweaponstringfield;

/** A lookup of the unit an event getter answers. */
function unitLookup(native: NativeName, call: () => unknown) {
  return gap(native, {
    answer: target.handle,
    member: () => call(),
    line: `${native}()`,
    returns: target,
    lookup: true,
  });
}

const cases: GapCase[] = [
  // Event and focus lookups.
  unitLookup("GetLearningUnit", () => Unit.fromLearning()),
  unitLookup("GetRevivableUnit", () => Unit.fromRevivable()),
  unitLookup("GetRevivingUnit", () => Unit.fromReviving()),
  unitLookup("GetRescuer", () => Unit.fromRescuer()),
  unitLookup("GetDyingUnit", () => Unit.fromDying()),
  unitLookup("GetDecayingUnit", () => Unit.fromDecaying()),
  unitLookup("GetConstructingStructure", () => Unit.fromConstructing()),
  unitLookup("GetCancelledStructure", () => Unit.fromCancelled()),
  unitLookup("GetResearchingUnit", () => Unit.fromResearching()),
  unitLookup("GetDetectedUnit", () => Unit.fromDetected()),
  unitLookup("GetSellingUnit", () => Unit.fromSelling()),
  unitLookup("GetSoldUnit", () => Unit.fromSold()),
  unitLookup("GetBuyingUnit", () => Unit.fromBuying()),
  unitLookup("GetManipulatingUnit", () => Unit.fromManipulating()),
  unitLookup("GetSpellAbilityUnit", () => Unit.fromSpellAbility()),
  unitLookup("GetEventTargetUnit", () => Unit.fromEventTarget()),
  unitLookup("BlzGetMouseFocusUnit", () => Unit.fromMouseFocus()),
  gap("GetOrderTarget", {
    answer: item.handle,
    member: () => Widget.fromOrderTarget(),
    line: "GetOrderTarget()",
    returns: item,
    lookup: true,
  }),

  // Widget.
  gap("AddIndicator", {
    member: () => {
      tree.addIndicator(255, 128, 0, 200);
    },
    line: `AddIndicator(${treeRef}, 255, 128, 0, 200)`,
  }),

  // Facing, ownership, visibility and classification.
  gap("SetUnitFacingTimed", {
    member: () => {
      unit.setFacingTimed(90, 0.5);
    },
    line: `SetUnitFacingTimed(${unitRef}, 90, 0.5)`,
  }),
  gap("IsUnitOwnedByPlayer", {
    answer: true,
    member: () => unit.isOwnedByPlayer(owner),
    line: `IsUnitOwnedByPlayer(${unitRef}, ${ownerRef})`,
    returns: true,
  }),
  gap("IsUnitDetected", {
    answer: true,
    member: () => unit.isDetected(owner),
    line: `IsUnitDetected(${unitRef}, ${ownerRef})`,
    returns: true,
  }),
  gap("IsUnitInvisible", {
    answer: false,
    member: () => unit.isInvisible(owner),
    line: `IsUnitInvisible(${unitRef}, ${ownerRef})`,
    returns: false,
  }),
  gap("IsUnitRace", {
    answer: true,
    member: () => unit.isRace(raceHuman),
    line: `IsUnitRace(${unitRef}, RACE_HUMAN)`,
    returns: true,
  }),
  gap("UnitRemoveType", {
    answer: true,
    member: () => unit.removeType(heroType),
    line: `UnitRemoveType(${unitRef}, UNIT_TYPE_HERO)`,
    returns: true,
  }),
  gap("CreateMinimapIconOnUnit", {
    answer: minimapIcon,
    member: () =>
      unit.createMinimapIcon(255, 0, 0, "UI\\Minimap\\Ping.mdl", fogVisible),
    line: `CreateMinimapIconOnUnit(${unitRef}, 255, 0, 0, "UI\\\\Minimap\\\\Ping.mdl", FOG_OF_WAR_VISIBLE)`,
    returns: minimapIcon,
  }),

  // Weapon fields.
  gap("BlzGetUnitWeaponBooleanField", {
    answer: true,
    member: () => unit.getWeaponField(weaponBoolean, 0),
    line: `BlzGetUnitWeaponBooleanField(${unitRef}, UNIT_WEAPON_BF_ATTACKS_ENABLED, 0)`,
    returns: true,
  }),
  gap("BlzGetUnitWeaponIntegerField", {
    answer: 3,
    member: () => unit.getWeaponField(weaponInteger, 1),
    line: `BlzGetUnitWeaponIntegerField(${unitRef}, UNIT_WEAPON_IF_ATTACK_DAMAGE_NUMBER_OF_DICE, 1)`,
    returns: 3,
  }),
  gap("BlzGetUnitWeaponRealField", {
    answer: 128.5,
    member: () => unit.getWeaponField(weaponReal, 0),
    line: `BlzGetUnitWeaponRealField(${unitRef}, UNIT_WEAPON_RF_ATTACK_RANGE, 0)`,
    returns: 128.5,
  }),
  gap("BlzGetUnitWeaponStringField", {
    answer: "arrow.mdx",
    member: () => unit.getWeaponField(weaponString, 0),
    line: `BlzGetUnitWeaponStringField(${unitRef}, UNIT_WEAPON_SF_ATTACK_PROJECTILE_ART, 0)`,
    returns: "arrow.mdx",
  }),
  gap("BlzSetUnitWeaponBooleanField", {
    answer: true,
    member: () => unit.setWeaponField(weaponBoolean, 0, false),
    line: `BlzSetUnitWeaponBooleanField(${unitRef}, UNIT_WEAPON_BF_ATTACKS_ENABLED, 0, false)`,
    returns: true,
  }),
  gap("BlzSetUnitWeaponIntegerField", {
    answer: true,
    member: () => unit.setWeaponField(weaponInteger, 1, 4),
    line: `BlzSetUnitWeaponIntegerField(${unitRef}, UNIT_WEAPON_IF_ATTACK_DAMAGE_NUMBER_OF_DICE, 1, 4)`,
    returns: true,
  }),
  gap("BlzSetUnitWeaponRealField", {
    answer: true,
    member: () => unit.setWeaponField(weaponReal, 0, 600.5),
    line: `BlzSetUnitWeaponRealField(${unitRef}, UNIT_WEAPON_RF_ATTACK_RANGE, 0, 600.5)`,
    returns: true,
  }),
  gap("BlzSetUnitWeaponStringField", {
    answer: true,
    member: () => unit.setWeaponField(weaponString, 0, "bolt.mdx"),
    line: `BlzSetUnitWeaponStringField(${unitRef}, UNIT_WEAPON_SF_ATTACK_PROJECTILE_ART, 0, "bolt.mdx")`,
    returns: true,
  }),

  // The order queue.
  gap("BlzQueueImmediateOrderById", {
    answer: true,
    member: () => unit.queueImmediateOrder(OrderId.Stop),
    line: `BlzQueueImmediateOrderById(${unitRef}, ${String(OrderId.Stop)})`,
    returns: true,
  }),
  gap("BlzQueuePointOrderById", {
    answer: true,
    member: () => unit.queueOrderAt(OrderId.Move, 10, 20),
    line: `BlzQueuePointOrderById(${unitRef}, ${String(OrderId.Move)}, 10, 20)`,
    returns: true,
  }),
  gap("BlzQueueTargetOrderById", {
    answer: true,
    member: () => unit.queueTargetOrder(OrderId.Attack, target),
    line: `BlzQueueTargetOrderById(${unitRef}, ${String(OrderId.Attack)}, ${targetRef})`,
    returns: true,
  }),
  gap("BlzQueueInstantPointOrderById", {
    answer: true,
    member: () => unit.queueInstantOrderAt(OrderId.Move, 10, 20, item),
    line: `BlzQueueInstantPointOrderById(${unitRef}, ${String(OrderId.Move)}, 10, 20, ${itemRef})`,
    returns: true,
  }),
  gap("BlzQueueInstantTargetOrderById", {
    answer: false,
    member: () => unit.queueInstantTargetOrder(OrderId.Attack, target, item),
    line: `BlzQueueInstantTargetOrderById(${unitRef}, ${String(OrderId.Attack)}, ${targetRef}, ${itemRef})`,
    returns: false,
  }),
  gap("BlzQueueBuildOrderById", {
    answer: true,
    member: () => unit.queueBuildOrder(FourCC("hhou"), 64, 128),
    line: `BlzQueueBuildOrderById(${unitRef}, ${String(FourCC("hhou"))}, 64, 128)`,
    returns: true,
  }),
  gap("BlzGetUnitOrderCount", {
    answer: 2,
    member: () => unit.orderCount,
    line: `BlzGetUnitOrderCount(${unitRef})`,
    returns: 2,
  }),
  gap("BlzUnitClearOrders", {
    member: () => {
      unit.clearOrders(true);
    },
    line: `BlzUnitClearOrders(${unitRef}, true)`,
  }),
  gap("BlzUnitForceStopOrder", {
    member: () => {
      unit.forceStopOrder(false);
    },
    line: `BlzUnitForceStopOrder(${unitRef}, false)`,
  }),
];

describe("the pre-existing gaps of Unit and Widget", () => {
  for (const gapCase of cases) {
    it(`${gapCase.native}: records its call and returns what it answers`, () => {
      const result = gapCase.run("given");
      expect(stubCalls()).toContainCall(gapCase.line);
      expect(result).toBe(gapCase.returns);
    });

    if (gapCase.lookup) {
      it(`${gapCase.native}: is undefined when the Native answers nothing`, () => {
        expect(gapCase.run("nothing")).toBeUndefined();
      });
    }
  }
});

describe("Unit.addIndicator", () => {
  it("stays on UnitAddIndicator, not the Widget's AddIndicator", () => {
    withNative(
      "UnitAddIndicator",
      () => undefined,
      () => {
        unit.addIndicator(0, 255, 0, 255);
      },
    );
    expect(stubCalls()).toContainCall(
      `UnitAddIndicator(${unitRef}, 0, 255, 0, 255)`,
    );
  });
});

describe("Unit weapon fields", () => {
  it("getWeaponField is 0 for a value whose tostring names no type", () => {
    expect(
      unit.getWeaponField(
        withText("no type", "NOT_A_FIELD") as unitweaponbooleanfield,
        0,
      ),
    ).toBe(0);
  });

  it("setWeaponField is false for a value of the wrong type", () => {
    expect(unit.setWeaponField(weaponBoolean, 0, "yes")).toBe(false);
    expect(unit.setWeaponField(weaponString, 0, 1)).toBe(false);
  });
});
