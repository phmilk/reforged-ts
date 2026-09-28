// Event descriptors through on(): each handler gets a typed payload, `when`
// filters before it, and the Subscription on() returns ends it.
import { Init, on, PlayerEvents, UnitEvents } from "reforged-ts";
import type { MapPlayer } from "reforged-ts";

// #region on
Init.onTriggers(() => {
  // Every hero's death, whoever owns it: `killer` is undefined when no unit
  // killed it.
  on(
    UnitEvents.death,
    ({ unit, killer }) => {
      print(`${unit.name} fell to ${killer?.name ?? "no unit"}`);
    },
    ({ unit }) => unit.isUnitType(UNIT_TYPE_HERO),
  );
});
// #endregion on

// #region subscription
/** Waits for `player` to type "-ready", once: the handler ends its own Trigger. */
export function awaitReady(player: MapPlayer): void {
  const subscription = on(
    PlayerEvents.chat(player, "-ready", true),
    ({ player: ready }) => {
      print(`${ready.name} is ready`);
      subscription.destroy();
    },
  );
}
// #endregion subscription
