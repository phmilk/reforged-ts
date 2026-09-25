/** @noSelfInFile */

// RegionEvents.enter(region, filter?) and RegionEvents.leave(region, filter?)
// through on(), and the lookups they read the unit with: the suites of
// support/events.ts, which fire the Subscription's Trigger with a stubbed
// context and observe the call log and what the handler received. The filter
// is handed to the registration: nothing when omitted, a boolexpr as is, and
// the Filter of a plain function.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import type { EventDescriptor } from "../../src/index";
import { MapPlayer, on, Region, RegionEvents, Unit } from "../../src/index";
import { defined } from "../support/defined";
import { describeDescriptor, describeLookup } from "../support/events";
import { handleRef } from "../support/handle-ref";
import { withNative } from "../support/native-override";

const owner = defined(MapPlayer.fromIndex(0), "the player in slot 0");
const crossing = Unit.create(owner, FourCC("hfoo"), 0, 0);
const region = Region.create();
const regionRef = handleRef("region", region.handle);
const condition = Condition(() => true);

/** One member of RegionEvents, and the Natives it registers and reads with. */
interface Member {
  readonly name: string;
  readonly native: string;
  readonly unitNative: "GetEnteringUnit" | "GetLeavingUnit";
  readonly descriptor: (
    filter?: boolexpr | (() => boolean),
  ) => EventDescriptor<{ unit: Unit; region: Region }>;
}

const members: Member[] = [
  {
    name: "RegionEvents.enter",
    native: "TriggerRegisterEnterRegion",
    unitNative: "GetEnteringUnit",
    descriptor: (filter) => RegionEvents.enter(region, filter),
  },
  {
    name: "RegionEvents.leave",
    native: "TriggerRegisterLeaveRegion",
    unitNative: "GetLeavingUnit",
    descriptor: (filter) => RegionEvents.leave(region, filter),
  },
];

for (const member of members) {
  const context: StubContext = {
    [member.unitNative]: crossing.handle,
    GetTriggeringRegion: region.handle,
  };
  const required = [
    ["unit", member.unitNative],
    ["region", "GetTriggeringRegion"],
  ] as const;

  describeDescriptor({
    name: member.name,
    title: `${member.name} without a filter`,
    descriptor: member.descriptor(),
    registers: (trigger) => [`${member.native}(${trigger}, ${regionRef}, nil)`],
    context,
    payload: { unit: crossing, region },
    required,
  });

  describeDescriptor({
    name: member.name,
    title: `${member.name} with a boolexpr filter`,
    descriptor: member.descriptor(condition),
    registers: (trigger) => [
      `${member.native}(${trigger}, ${regionRef}, ${handleRef("conditionfunc", condition)})`,
    ],
    context,
    payload: { unit: crossing, region },
    required,
  });

  describe(`${member.name} with a function filter`, () => {
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
          on(member.descriptor(filter), () => {
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
