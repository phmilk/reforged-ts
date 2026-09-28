// The ground texture of a medium human building, laid at the centre of the
// map without a building: forcePaused keeps it from fading away.
import { Init, Ubersplat } from "reforged-ts";

Init.onGameStart(() => {
  const splat = Ubersplat.create(0, 0, "HMED", 255, 255, 255, 255, true, true);
  splat.render(true, true);
  splat.show(true);
});
