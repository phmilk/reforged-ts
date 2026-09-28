// Thunder Clap's caster art at the center of the map: the ability id picks
// the art, the effect type which of its models.
import { Effect, Init } from "reforged-ts";

Init.onTriggers(() => {
  Effect.createSpell(FourCC("AHtc"), EFFECT_TYPE_CASTER, 0, 0);
});
