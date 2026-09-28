// A red "Killed!" rising above each dying unit, fading out after one second
// and gone after two. A temporary text tag destroys itself: nothing keeps it.
import { Init, TextTag, Trigger, Unit } from "reforged-ts";

Init.onTriggers(() => {
  Trigger.create()
    .registerAnyUnitEvent(EVENT_PLAYER_UNIT_DEATH)
    .addAction(() => {
      const dying = Unit.fromDying();
      if (dying === undefined) {
        return;
      }
      const tag = TextTag.create();
      tag.setText("Killed!", 10, true);
      tag.setPosUnit(dying, 0);
      tag.setColor(255, 64, 64, 255);
      tag.setVelocityAngle(64, 90);
      tag.setPermanent(false);
      tag.setFadepoint(1);
      tag.setLifespan(2);
    });
});
