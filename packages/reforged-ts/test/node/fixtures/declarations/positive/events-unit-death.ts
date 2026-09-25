// on(UnitEvents.death) hands a payload whose unit is guaranteed and whose
// killer may be undefined, and returns the Subscription; deathOf takes a Unit.
import type { EventDescriptor, Subscription } from "reforged-ts";
import { on, Unit, UnitEvents } from "reforged-ts";

declare const hero: Unit;

const subscription: Subscription = on(
  UnitEvents.death,
  ({ unit, killer }) => {
    const dying: Unit = unit;
    const by: Unit | undefined = killer;
    dying.kill();
    by?.kill();
  },
  ({ killer }) => killer !== undefined,
);
subscription.destroy();

const ofHero: EventDescriptor<{ unit: Unit; killer: Unit | undefined }> =
  UnitEvents.deathOf(hero);
const killing: Unit | undefined = Unit.fromKilling();

export { subscription, ofHero, killing };
