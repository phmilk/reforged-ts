// The RegionEvents descriptors through on(): `enter(region, filter?)` and
// `leave(region, filter?)` for one Region. The payload always holds the
// unit and the region it crossed. The filter, a plain function or a
// boolexpr, is handed to the registration and decides which units fire the
// event at all; on() returns the Subscription whose destroy() ends it.
import { Init, on, Rectangle, Region, RegionEvents, Unit } from "reforged-ts";

Init.onTriggers(() => {
  const area = Rectangle.create(-512, -512, 512, 512);
  const camp = Region.create();
  camp.addRect(area);
  area.destroy();

  // Only heroes fire the event: the filter reads the entering unit.
  const heroesOnly = () => Unit.fromFilter()?.isHero() === true;
  on(RegionEvents.enter(camp, heroesOnly), ({ unit }) => {
    print(`${unit.name} rests at the camp`);
  });
  on(RegionEvents.leave(camp, heroesOnly), ({ unit, region }) => {
    print(`${unit.name} leaves region ${String(region.id)}`);
  });
});
