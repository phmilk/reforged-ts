// A Region made of a Rectangle: a unit entering it is told so. A Rectangle
// is only a shape; the enter event needs the Region.
import { Init, on, Rectangle, Region, RegionEvents } from "reforged-ts";

Init.onTriggers(() => {
  const gate = Rectangle.create(-256, -256, 256, 256);
  const zone = Region.create();
  zone.addRect(gate);
  gate.destroy();

  on(RegionEvents.enter(zone), ({ unit }) => {
    print(`${unit.name} entered the zone`);
  });
});
