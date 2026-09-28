// A tree that grows back a minute after it falls, with its birth animation
// and at full health.
import { Destructable, Init, Timer, Trigger } from "reforged-ts";

Init.onTriggers(() => {
  const tree = Destructable.create({ typeId: FourCC("LTlt"), x: 512, y: 0 });

  Trigger.create()
    .registerDeathEvent(tree)
    .addAction(() => {
      Timer.after(60, () => {
        tree.heal(tree.maxLife, true);
      });
    });
});
