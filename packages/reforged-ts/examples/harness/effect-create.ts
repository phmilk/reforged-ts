// Two common effects. A one-shot, destroyed at once: the model still plays
// its death animation. And a marker over a unit's head, removed ten seconds
// later.
import { Effect, Init, Timer, Unit, tsGlobals } from "reforged-ts";

Init.onTriggers(() => {
  Effect.create(
    "Abilities\\Spells\\Human\\ThunderClap\\ThunderClapCaster.mdl",
    0,
    0,
  ).destroy();

  const footman = Unit.create(tsGlobals.Players[0], FourCC("hfoo"), 256, 0);
  const marker = Effect.createAttachment(
    "Abilities\\Spells\\Other\\TalkToMe\\TalkToMe.mdl",
    footman,
    "overhead",
  );
  Timer.after(10, () => {
    marker.destroy();
  });
});
