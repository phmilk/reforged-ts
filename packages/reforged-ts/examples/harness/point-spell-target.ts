// The target point of every spell cast: the game allocates a new location
// for each read, so the Point is destroyed once used.
import { Init, on, Point, UnitEvents } from "reforged-ts";

Init.onTriggers(() => {
  on(UnitEvents.spellEffect, ({ caster }) => {
    const target = Point.fromSpellTarget();
    if (target === undefined) {
      return;
    }
    print(`${caster.name} targets ${String(target.x)}, ${String(target.y)}`);
    target.destroy();
  });
});
