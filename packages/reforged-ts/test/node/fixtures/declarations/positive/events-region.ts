// on(RegionEvents.enter(region)) hands a payload whose unit and region are
// guaranteed; the filter is optional, a boolexpr or a plain function.
import type { EventDescriptor } from "reforged-ts";
import { on, Region, RegionEvents, Unit } from "reforged-ts";

declare const region: Region;
declare const onlyHeroes: boolexpr;

const subscription = on(RegionEvents.enter(region), ({ unit, region }) => {
  const entering: Unit = unit;
  const entered: Region = region;
  entered.containsUnit(entering);
});

const filtered: EventDescriptor<{ unit: Unit; region: Region }> =
  RegionEvents.leave(region, () => true);
const byBoolexpr: EventDescriptor<{ unit: Unit; region: Region }> =
  RegionEvents.enter(region, onlyHeroes);
const entering: Unit | undefined = Unit.fromEntering();
const leaving: Unit | undefined = Unit.fromLeaving();

export { subscription, filtered, byBoolexpr, entering, leaving };
