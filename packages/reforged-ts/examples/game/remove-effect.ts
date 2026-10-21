// Ending an effect at once with remove(), where destroy() plays its death
// animation first. A channelling glow that must vanish the moment the
// channel stops is removed; a blast that should fade out is destroyed.
// Either way the Wrapper is gone afterwards: in Dev mode any later use
// raises `reforged-ts: used after destroy: <Class>#<id>`.
import { Effect, Init } from "reforged-ts";

Init.onGameStart(() => {
  const glow = Effect.create(
    "Abilities\\Spells\\Human\\Heal\\HealTarget.mdl",
    0,
    0,
  );
  const blast = Effect.create(
    "Abilities\\Spells\\Human\\ThunderClap\\ThunderClapCaster.mdl",
    256,
    0,
  );

  // The channel stopped: the glow vanishes with no animation.
  glow.remove();
  // The blast plays its death animation, then goes.
  blast.destroy();
});
