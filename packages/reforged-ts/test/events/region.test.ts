/** @noSelfInFile */

// RegionEvents.enter(region, filter?) and RegionEvents.leave(region, filter?)
// through on(), and the lookups they read the unit with: the suites of
// support/events.ts, iterating the namespace's members, which fire the
// Subscription's Trigger with a stubbed context and observe the call log and
// what the handler received. The filter
// is handed to the registration: nothing when omitted, a boolexpr as is, and
// the Filter of a plain function.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { MapPlayer, on, Region, RegionEvents, Unit } from "../../src/index";
import { defined } from "../support/defined";
import { describeLookup, describeNamespace } from "../support/events";
import { handleRef } from "../support/handle-ref";
import { withNative } from "../support/native-override";

const owner = defined(MapPlayer.fromIndex(0), "the player in slot 0");
const crossing = Unit.create(owner, FourCC("hfoo"), 0, 0);
const region = Region.create();
const regionRef = handleRef("region", region.handle);
const condition = Condition(() => true);

/** One member of RegionEvents, and the Natives it registers and reads with. */
interface Member {
  readonly name: "enter" | "leave";
  readonly native: string;
  readonly unitNative: "GetEnteringUnit" | "GetLeavingUnit";
}

const enter: Member = {
  name: "enter",
  native: "TriggerRegisterEnterRegion",
  unitNative: "GetEnteringUnit",
};
const leave: Member = {
  name: "leave",
  native: "TriggerRegisterLeaveRegion",
  unitNative: "GetLeavingUnit",
};

/** The cases of `member`: without a filter and with a boolexpr filter. */
function regionCases(member: Member) {
  const title = `RegionEvents.${member.name}`;
  const firing = {
    context: {
      [member.unitNative]: crossing.handle,
      GetTriggeringRegion: region.handle,
    },
    payload: { unit: crossing, region },
    required: [
      ["unit", member.unitNative],
      ["region", "GetTriggeringRegion"],
    ] as const,
  };
  return [
    {
      ...firing,
      title: `${title} without a filter`,
      args: [region] as const,
      registers: (trigger: string) => [
        `${member.native}(${trigger}, ${regionRef}, nil)`,
      ],
    },
    {
      ...firing,
      title: `${title} with a boolexpr filter`,
      args: [region, condition] as const,
      registers: (trigger: string) => [
        `${member.native}(${trigger}, ${regionRef}, ${handleRef("conditionfunc", condition)})`,
      ],
    },
  ];
}

describeNamespace("RegionEvents", RegionEvents, {
  enter: regionCases(enter),
  leave: regionCases(leave),
});

for (const member of [enter, leave]) {
  describe(`RegionEvents.${member.name} with a function filter`, () => {
    it("registers with the Filter of the function", () => {
      const filter = () => true;
      const expr = Filter(filter);
      let wrapped: (() => boolean) | undefined;
      const subscription = withNative(
        "Filter",
        (func) => {
          wrapped = func;
          return expr;
        },
        () =>
          on(RegionEvents[member.name](region, filter), () => {
            // nothing to do
          }),
      );
      expect(wrapped).toBe(filter);
      expect(stubCalls()).toContainCall(
        `${member.native}(${handleRef("trigger", subscription.trigger.handle)}, ${regionRef}, ${handleRef("filterfunc", expr)})`,
      );
    });
  });
}

describeLookup({
  name: "Unit.fromEntering",
  lookup: () => Unit.fromEntering(),
  context: { GetEnteringUnit: crossing.handle },
  expected: crossing,
});

describeLookup({
  name: "Unit.fromLeaving",
  lookup: () => Unit.fromLeaving(),
  context: { GetLeavingUnit: crossing.handle },
  expected: crossing,
});
