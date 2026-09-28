// A Trigger that fires when any unit is attacked, but runs its action only
// when the attacker's name matches: addCondition takes a plain function.
import { Init, Trigger, Unit } from "reforged-ts";

Init.onTriggers(() => {
  Trigger.create()
    .registerAnyUnitEvent(EVENT_PLAYER_UNIT_ATTACKED)
    .addCondition(() => Unit.fromAttacker()?.name === "Attacker Unit")
    .addAction(() => {
      // do something...
    });
});
