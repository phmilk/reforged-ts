# Variable: leave

> `readonly` **leave**: (...`args`) => [`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<[`RegionCrossing`](../../../../interfaces/RegionCrossing.md)\>

Defined in: [events/region.ts:57](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/region.ts#L57)

A unit leaves `region`, when `filter` (if given) accepts it.

## Parameters

### args

...\[[`Region`](../../../../classes/Region.md), `boolexpr` \| (() => `boolean`)\]

## Returns

[`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<[`RegionCrossing`](../../../../interfaces/RegionCrossing.md)\>

## Example

**Heroes entering and leaving a camp**

```ts
// The RegionEvents descriptors through on(): `enter(region, filter?)` and
// `leave(region, filter?)` for one Region. The payload always holds the
// unit and the region it crossed. The filter, a plain function or a
// boolexpr, is handed to the registration and decides which units fire the
// event at all; on() returns the Subscription whose destroy() ends it.
import {
  Init,
  on,
  Rectangle,
  Region,
  RegionEvents,
  Timer,
  Unit,
} from "reforged-ts";

Init.onTriggers(() => {
  const area = Rectangle.create(-512, -512, 512, 512);
  const camp = Region.create();
  camp.addRect(area);
  area.destroy();

  // Only heroes fire the event: the filter reads the entering unit.
  const heroesOnly = () => Unit.fromFilter()?.isHero() === true;
  const arrivals = on(RegionEvents.enter(camp, heroesOnly), ({ unit }) => {
    print(`${unit.name} rests at the camp`);
  });
  const departures = on(
    RegionEvents.leave(camp, heroesOnly),
    ({ unit, region }) => {
      print(`${unit.name} leaves region ${String(region.id)}`);
    },
  );

  // The camp closes after ten minutes: the Subscriptions end, then the
  // Region they were registered on.
  Timer.after(600, () => {
    arrivals.destroy();
    departures.destroy();
    camp.destroy();
  });
});
```

## Native

[TriggerRegisterLeaveRegion](/typings/3.0.0/functions/TriggerRegisterLeaveRegion) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterLeaveRegion))
