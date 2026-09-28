// Thunder Clap's caster art on a peasant's origin attachment point, destroyed
// at once: destroying plays the model's death animation.
import { Effect, Init, Unit, tsGlobals } from "reforged-ts";

Init.onTriggers(() => {
  const peasant = Unit.create(tsGlobals.Players[0], FourCC("hpea"), 0, 0);
  const clap = Effect.createSpellAttachment(
    FourCC("AHtc"),
    EFFECT_TYPE_CASTER,
    peasant,
    "origin",
  );
  clap.destroy();
});
