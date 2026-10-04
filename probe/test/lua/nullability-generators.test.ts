// The Nullability sweep's case generators (probes/nullability/), on the
// harness: for each family, a sample Native's generated cases against the
// family's rule in probe/README.md ("The cases per family"). Each test
// checks the cases' labels, groups and the arguments each call passes, its
// `call` a recorder in place of the Native, or a stand-in global for a
// converter. The labels are what a Slice's skip list and the PENDING lines
// name, so a test fails when one changes.

import { describe, expect, it } from "reforged-test/lua";
import type { Case, ReturnCase } from "../../probes/nullability/case-runner";
import {
  catalogueCase,
  constructorCases,
  OUTSIDE_THE_WORLD,
  registrationCases,
  UNKNOWN_NAME,
  UNKNOWN_RAWCODE,
} from "../../probes/nullability/constructor";
import { converterCases } from "../../probes/nullability/converter";
import { inGroupOrder } from "../../probes/nullability/expand";
import { filterCases } from "../../probes/nullability/filter";
import {
  enumGetterCases,
  intrinsicPropertyCases,
} from "../../probes/nullability/getter";
import {
  callbackGetterCase,
  eventResponseCase,
  lookupCase,
  nullableCatalogueCase,
  optionalPropertyCase,
} from "../../probes/nullability/nullable";
import {
  filter,
  fixed,
  handle,
  numeric,
  player,
  rawcode,
  text,
  trigger,
} from "../../probes/nullability/parameters";

/**
 * The globals the tests replace: a converter, and what the player
 * Fixtures read that the shipped stubs do not define.
 * @noSelf
 */
interface Globals {
  ConvertRace?: (i: number) => unknown;
  ConvertItemType?: (i: number) => unknown;
  ConvertAbilityBooleanField?: (i: number) => unknown;
  ConvertMapSetting?: (i: number) => unknown;
  GetBJMaxPlayers?: () => number;
  GetPlayerSlotState?: (whichPlayer: player) => playerslotstate;
  PLAYER_NEUTRAL_PASSIVE?: number;
}

const globals = _G as unknown as Globals;
globals.GetBJMaxPlayers = () => 24;
globals.PLAYER_NEUTRAL_PASSIVE = 15;

/** Each case as `<group> <label>`, in order. */
function labels(cases: readonly Case[]): string[] {
  return cases.map((testCase) => `${testCase.group} ${testCase.label}`);
}

/** What each case's call passes, as `describe` renders it, in order. */
function callsOf(cases: readonly Case[]): string[] {
  return cases.map((testCase) => tostring(testCase.call()));
}

/**
 * The integers each case of `native` passes, the converter replaced with a
 * recorder for the calls.
 */
function converterIntegers(
  native:
    | "ConvertRace"
    | "ConvertItemType"
    | "ConvertAbilityBooleanField"
    | "ConvertMapSetting",
): number[] {
  const seen: number[] = [];
  globals[native] = (i) => {
    seen.push(i);
    return undefined;
  };
  for (const testCase of converterCases(native)) testCase.call();
  return seen;
}

describe("converterCases", () => {
  it("calls every constant of the type, then -1, past the last constant, and the integer limits", () => {
    const cases = converterCases("ConvertRace");
    expect(labels(cases)).toEqual([
      "a RACE_HUMAN",
      "a RACE_ORC",
      "a RACE_UNDEAD",
      "a RACE_NIGHTELF",
      "a RACE_DEMON",
      "a RACE_OTHER",
      "a -1",
      "a past the last constant",
      "a 2147483647",
      "a -2147483648",
    ]);
    expect(cases.every((testCase) => testCase.native === "ConvertRace")).toBe(
      true,
    );
    expect(converterIntegers("ConvertRace")).toEqual([
      1, 2, 3, 4, 5, 7, -1, 8, 2147483647, -2147483648,
    ]);
  });

  // The harness's integers are 64-bit, where the literal -2147483648 is an
  // integer too, so only a 32-bit run can tell the two spellings apart.
  it("passes -2147483648 as an integer [32-bit]", () => {
    expect(math.type(converterIntegers("ConvertRace")[9])).toBe("integer");
  });

  it("calls an integer two constants hold once, labelled by both", () => {
    const cases = converterCases("ConvertItemType");
    expect(labels(cases)).toEqual([
      "a ITEM_TYPE_PERMANENT",
      "a ITEM_TYPE_CHARGED",
      "a ITEM_TYPE_POWERUP or ITEM_TYPE_TOME",
      "a ITEM_TYPE_ARTIFACT",
      "a ITEM_TYPE_PURCHASABLE",
      "a ITEM_TYPE_CAMPAIGN",
      "a ITEM_TYPE_MISCELLANEOUS",
      "a ITEM_TYPE_EQUIPMENT",
      "a ITEM_TYPE_UNKNOWN",
      "a ITEM_TYPE_ANY",
      "a -1",
      "a past the last constant",
      "a 2147483647",
      "a -2147483648",
    ]);
    expect(converterIntegers("ConvertItemType")).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, -1, 10, 2147483647, -2147483648,
    ]);
  });

  it("takes the first integer past the greatest constant, whatever its order", () => {
    expect(converterIntegers("ConvertAbilityBooleanField")).toEqual([
      1634231666, 1634301029, 1633904740, -1, 1634301030, 2147483647,
      -2147483648,
    ]);
  });

  it("calls 0, 1, -1 and 2147483647 for a type with no constant", () => {
    expect(labels(converterCases("ConvertMapSetting"))).toEqual([
      "a 0",
      "a 1",
      "a -1",
      "a 2147483647",
    ]);
    expect(converterIntegers("ConvertMapSetting")).toEqual([
      0, 1, -1, 2147483647,
    ]);
  });

  it("raises in the call when the converter is not defined", () => {
    globals.ConvertRace = undefined;
    const [first] = converterCases("ConvertRace");
    expect(() => first.call()).toThrow("ConvertRace is not defined.");
  });
});

describe("constructorCases", () => {
  it("varies each numeric, rawcode and string parameter through its odd values, one at a time", () => {
    const owner = __stub_new_handle("player");
    const cases = constructorCases(
      "CreateUnitByName",
      [
        handle("whichPlayer", owner, []),
        text("unitname", "footman"),
        rawcode("unitid", FourCC("hfoo")),
        numeric("x", 0),
        fixed("enabled", true),
      ],
      ([, unitname, unitid, x, enabled]) =>
        `${unitname} ${tostring(unitid)} ${tostring(x)} ${tostring(enabled)}`,
    );
    expect(labels(cases)).toEqual([
      "a typical arguments",
      "a unitname: empty string",
      "a unitname: unknown name",
      "a unitid: unknown rawcode",
      "a x: negative",
      "a x: outside the world",
      "a x: 2147483647",
    ]);
    const hfoo = tostring(FourCC("hfoo"));
    expect(callsOf(cases)).toEqual([
      `footman ${hfoo} 0 true`,
      ` ${hfoo} 0 true`,
      `${UNKNOWN_NAME} ${hfoo} 0 true`,
      `footman ${tostring(UNKNOWN_RAWCODE)} 0 true`,
      `footman ${hfoo} -1 true`,
      `footman ${hfoo} ${tostring(OUTSIDE_THE_WORLD)} true`,
      `footman ${hfoo} 2147483647 true`,
    ]);
  });

  it("runs 0 for a numeric parameter whose typical value is another", () => {
    const cases = constructorCases("Location", [numeric("x", 512)], ([x]) => x);
    expect(labels(cases)).toEqual([
      "a typical arguments",
      "a x: 0",
      "a x: negative",
      "a x: outside the world",
      "a x: 2147483647",
    ]);
    expect(callsOf(cases)).toEqual([
      "512",
      "0",
      "-1",
      tostring(OUTSIDE_THE_WORLD),
      "2147483647",
    ]);
  });

  it("puts each handle parameter in every stale state it declares, after the live cases", () => {
    const live = __stub_new_handle("unit");
    const dead = __stub_new_handle("unit");
    const removed = __stub_new_handle("unit");
    const cases = constructorCases(
      "UnitAddItemById",
      [
        handle("whichUnit", live, [
          ["dead unit", dead],
          ["removed unit", removed],
        ]),
        rawcode("itemId", FourCC("ratc")),
      ],
      ([whichUnit]) => whichUnit,
    );
    expect(labels(cases)).toEqual([
      "a typical arguments",
      "a itemId: unknown rawcode",
      "b whichUnit: dead unit",
      "b whichUnit: removed unit",
    ]);
    expect(cases.map((testCase) => testCase.call())).toEqual([
      live,
      live,
      dead,
      removed,
    ]);
  });

  it("runs a player parameter as Player(0) only, building no getter Fixture", () => {
    const slotState = globals.GetPlayerSlotState;
    globals.GetPlayerSlotState = () => PLAYER_SLOT_STATE_PLAYING;
    try {
      const cases = constructorCases(
        "CreateUnit",
        [player("id"), rawcode("unitid", FourCC("hfoo"))],
        ([id]) => GetPlayerId(id),
      );
      expect(labels(cases)).toEqual([
        "a typical arguments",
        "a unitid: unknown rawcode",
      ]);
      expect(callsOf(cases)).toEqual(["0", "0"]);
      expect(() =>
        enumGetterCases("GetPlayerRace", [player("whichPlayer")], () => 0),
      ).toThrow("Fixture emptySlotPlayer: the last slot is not empty");
    } finally {
      globals.GetPlayerSlotState = slotState;
    }
  });

  it("runs no stale case for a handle that declares its type has none", () => {
    const setup = __stub_new_handle("camerasetup");
    // A handle always names its stale states, `[]` when its type has none,
    // so a Slice cannot leave them out by mistake.
    // @ts-expect-error: the stale states are a required argument.
    const undeclared = (): unknown => handle("whichSetup", setup);
    expect(typeof undeclared).toBe("function");
    const cases = constructorCases(
      "CameraSetupGetDestPositionLoc",
      [handle("whichSetup", setup, [])],
      ([whichSetup]) => whichSetup,
    );
    expect(labels(cases)).toEqual(["a typical arguments"]);
  });

  it("runs one call for a constructor with no parameter", () => {
    const cases = constructorCases("CreateTimer", [], () => "called");
    expect(labels(cases)).toEqual(["a one call"]);
    expect(callsOf(cases)).toEqual(["called"]);
  });
});

describe("catalogueCase", () => {
  it("is one case of group a, labelled by its parameter and phrase", () => {
    const cases = catalogueCase(
      "UnitAddItemById",
      "whichUnit",
      "unit with no inventory",
      () => "no inventory",
    );
    expect(
      cases.map((testCase) => `${testCase.native} ${testCase.label}`),
    ).toEqual(["UnitAddItemById whichUnit: unit with no inventory"]);
    expect(labels(cases)).toEqual(["a whichUnit: unit with no inventory"]);
    expect(callsOf(cases)).toEqual(["no inventory"]);
  });
});

describe("registrationCases", () => {
  it("adds the trigger destroyed and a nil filter to the constructor's cases", () => {
    const live = __stub_new_handle("trigger") as trigger;
    const destroyed = __stub_new_handle("trigger") as trigger;
    const condition = __stub_new_handle("boolexpr") as boolexpr;
    const destroyedCondition = __stub_new_handle("boolexpr") as boolexpr;
    const event = __stub_new_handle("playerunitevent");
    const cases = registrationCases(
      "TriggerRegisterPlayerUnitEvent",
      [
        trigger("whichTrigger", live, destroyed),
        player("whichPlayer"),
        fixed("whichPlayerUnitEvent", event),
        filter("filter", condition, [
          ["destroyed boolexpr", destroyedCondition],
        ]),
      ],
      ([whichTrigger, , , whichFilter]) =>
        `${tostring(whichTrigger === live)} ${tostring(whichFilter)}`,
    );
    expect(labels(cases)).toEqual([
      "a typical arguments",
      "a filter: nil",
      "b whichTrigger: destroyed trigger",
      "b filter: destroyed boolexpr",
    ]);
    expect(callsOf(cases)).toEqual([
      `true ${tostring(condition)}`,
      "true nil",
      `false ${tostring(condition)}`,
      `true ${tostring(destroyedCondition)}`,
    ]);
  });

  it("fails a declaration without its trigger parameter", () => {
    expect(() =>
      registrationCases(
        "TriggerRegisterTimerEvent",
        [numeric("timeout", 1)],
        () => undefined,
      ),
    ).toThrow(
      "TriggerRegisterTimerEvent: a registration declares its trigger parameter.",
    );
  });
});

describe("enumGetterCases and intrinsicPropertyCases", () => {
  it("run a player parameter as a user slot, an empty slot and a neutral player", () => {
    const cases = enumGetterCases(
      "GetPlayerRace",
      [player("whichPlayer")],
      ([whichPlayer]) => GetPlayerId(whichPlayer),
    );
    expect(labels(cases)).toEqual([
      "a typical arguments",
      "a whichPlayer: empty slot",
      "a whichPlayer: neutral player",
    ]);
    expect(callsOf(cases)).toEqual(["0", "23", "15"]);
  });

  it("run each numeric parameter through the constructor's odd values, one at a time", () => {
    const cases = enumGetterCases(
      "GetStartLocPrio",
      [numeric("whichStartLoc", 0), numeric("prioSlotIndex", 1)],
      ([whichStartLoc, prioSlotIndex]) =>
        `${tostring(whichStartLoc)} ${tostring(prioSlotIndex)}`,
    );
    expect(labels(cases)).toEqual([
      "a typical arguments",
      "a whichStartLoc: negative",
      "a whichStartLoc: outside the world",
      "a whichStartLoc: 2147483647",
      "a prioSlotIndex: 0",
      "a prioSlotIndex: negative",
      "a prioSlotIndex: outside the world",
      "a prioSlotIndex: 2147483647",
    ]);
    expect(callsOf(cases)).toEqual([
      "0 1",
      "-1 1",
      `${tostring(OUTSIDE_THE_WORLD)} 1`,
      "2147483647 1",
      "0 0",
      "0 -1",
      `0 ${tostring(OUTSIDE_THE_WORLD)}`,
      "0 2147483647",
    ]);
  });

  it("run each handle parameter live and in every stale state, with no rawcode or string odd value", () => {
    const live = __stub_new_handle("unit");
    const dead = __stub_new_handle("unit");
    const removed = __stub_new_handle("unit");
    const cases = intrinsicPropertyCases(
      "GetOwningPlayer",
      [
        handle("whichUnit", live, [
          ["dead unit", dead],
          ["removed unit", removed],
        ]),
        rawcode("unusedRawcode", FourCC("hfoo")),
        text("unusedName", "footman"),
      ],
      ([whichUnit]) => whichUnit,
    );
    expect(labels(cases)).toEqual([
      "a typical arguments",
      "b whichUnit: dead unit",
      "b whichUnit: removed unit",
    ]);
    expect(cases.map((testCase) => testCase.call())).toEqual([
      live,
      dead,
      removed,
    ]);
  });

  it("run one call with no parameter", () => {
    expect(labels(enumGetterCases("VersionGet", [], () => undefined))).toEqual([
      "a one call",
    ]);
    expect(
      labels(intrinsicPropertyCases("GetLocalPlayer", [], () => undefined)),
    ).toEqual(["a one call"]);
  });
});

describe("the cheap case of the four nullable families", () => {
  it("is one case of group a, named by the family or by the Slice", () => {
    const cases = [
      ...eventResponseCase("GetTriggerUnit", () => "event"),
      ...callbackGetterCase("GetEnumUnit", () => "callback"),
      ...lookupCase("LoadUnitHandle", "unsaved key", () => "lookup"),
      ...optionalPropertyCase(
        "GetUnitRallyUnit",
        "unit with no rally point",
        () => "property",
      ),
    ];
    expect(
      cases.map((testCase) => `${testCase.native} ${testCase.label}`),
    ).toEqual([
      "GetTriggerUnit outside its event",
      "GetEnumUnit outside its callback",
      "LoadUnitHandle unsaved key",
      "GetUnitRallyUnit unit with no rally point",
    ]);
    expect(labels(cases)).toEqual([
      "a outside its event",
      "a outside its callback",
      "a unsaved key",
      "a unit with no rally point",
    ]);
    expect(callsOf(cases)).toEqual(["event", "callback", "lookup", "property"]);
  });
});

describe("nullableCatalogueCase", () => {
  it("is one case of group a, named by the Slice", () => {
    const cases = nullableCatalogueCase(
      "GetExpiredTimer",
      "callback of a destroyed timer",
      () => "destroyed",
    );
    expect(
      cases.map((testCase) => `${testCase.native} ${testCase.label}`),
    ).toEqual(["GetExpiredTimer callback of a destroyed timer"]);
    expect(labels(cases)).toEqual(["a callback of a destroyed timer"]);
    expect(callsOf(cases)).toEqual(["destroyed"]);
  });
});

describe("filterCases", () => {
  it("is three call cases of group a on the filter: always-true, nil and live", () => {
    const alwaysTrue = __stub_new_handle("boolexpr") as boolexpr;
    const live = __stub_new_handle("boolexpr") as boolexpr;
    const cases = filterCases(
      "GroupEnumUnitsInRect",
      "unit",
      { alwaysTrue, live },
      (filter) => {
        if (filter === undefined) return 0;
        return filter === alwaysTrue ? 1 : 2;
      },
    );
    expect(labels(cases)).toEqual([
      "a filter: always-true",
      "a filter: nil",
      "a filter: live",
    ]);
    expect(
      cases.map(
        (testCase) =>
          `${testCase.native} ${tostring(testCase.param)} ${tostring(testCase.argument)} ${tostring(testCase.counted)}`,
      ),
    ).toEqual([
      "GroupEnumUnitsInRect filter always-true unit",
      "GroupEnumUnitsInRect filter nil unit",
      "GroupEnumUnitsInRect filter live unit",
    ]);
    expect(callsOf(cases)).toEqual(["1", "0", "2"]);
  });
});

describe("inGroupOrder", () => {
  it("joins return cases, which every family generator produces", () => {
    // Typed as ReturnCase, which the type checker holds the generators to:
    // a family generator never builds a call case (filterCases builds those).
    const cases: readonly ReturnCase[] = inGroupOrder(
      converterCases("ConvertMapSetting"),
      constructorCases("CreateTimer", [], () => undefined),
      enumGetterCases("VersionGet", [], () => undefined),
      eventResponseCase("GetTriggerUnit", () => undefined),
    );
    expect(
      cases.map((testCase) => `${testCase.native} ${testCase.label}`),
    ).toEqual([
      "ConvertMapSetting 0",
      "ConvertMapSetting 1",
      "ConvertMapSetting -1",
      "ConvertMapSetting 2147483647",
      "CreateTimer one call",
      "VersionGet one call",
      "GetTriggerUnit outside its event",
    ]);
  });

  it("puts every (a) case of a Slice before any (b) case, each group in order", () => {
    const live = __stub_new_handle("unit");
    const dead = __stub_new_handle("unit");
    const cases = inGroupOrder(
      constructorCases(
        "UnitAddItemById",
        [handle("whichUnit", live, [["dead unit", dead]])],
        () => undefined,
      ),
      intrinsicPropertyCases(
        "GetUnitLoc",
        [handle("whichUnit", live, [["dead unit", dead]])],
        () => undefined,
      ),
    );
    expect(
      cases.map((testCase) => `${testCase.native} ${testCase.label}`),
    ).toEqual([
      "UnitAddItemById typical arguments",
      "GetUnitLoc typical arguments",
      "UnitAddItemById whichUnit: dead unit",
      "GetUnitLoc whichUnit: dead unit",
    ]);
  });
});
