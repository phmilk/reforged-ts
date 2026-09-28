// The centre of the map kept visible to the first player for thirty seconds:
// a fog modifier does nothing until it is started.
import { FogModifier, Init, Timer, tsGlobals } from "reforged-ts";

Init.onGameStart(() => {
  const reveal = FogModifier.create(
    tsGlobals.Players[0],
    FOG_OF_WAR_VISIBLE,
    0,
    0,
    1024,
    true,
    false,
  );
  reveal.start();
  Timer.after(30, () => {
    reveal.destroy();
  });
});
