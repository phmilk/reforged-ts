// Kills counted per unit, and the units marked for a bounty. A destroyed unit
// leaves both collections by itself, and a loop over them runs in the order
// the units were added, the same on every client.
import { HandleMap, HandleSet, Init, on, Unit, UnitEvents } from "reforged-ts";

const kills = new HandleMap<Unit, number>();
const bounties = new HandleSet<Unit>();

Init.onTriggers(() => {
  on(UnitEvents.death, ({ unit, killer }) => {
    if (killer !== undefined) {
      kills.set(killer, (kills.get(killer) ?? 0) + 1);
    }
    if (bounties.has(unit)) {
      print(`${unit.name} was worth a bounty`);
    }
  });
});

/** Removes a summoned unit; its kill count and bounty go with it. */
export function unsummon(summoned: Unit): void {
  summoned.destroy();
}

/** Prints every unit's kills, in the order the units first killed. */
export function printKills(): void {
  kills.forEach((count, killer) => {
    print(`${killer.name}: ${String(count)}`);
  });
}
