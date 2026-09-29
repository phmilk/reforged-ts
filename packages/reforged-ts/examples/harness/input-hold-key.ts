// Holding Shift+Space pans the local camera back to the centre of the map.
// Each client reads its own keys and moves its own camera: both are local
// visuals, so no game state depends on them and nothing needs runLocal.
import { Camera, Init, Input, MetaKey, Timer } from "reforged-ts";

Init.onGameStart(() => {
  Timer.every(0.1, () => {
    if (
      Input.isKeyPressed(OSKEY_SPACE) &&
      Input.isMetaKeyPressed(MetaKey.Shift)
    ) {
      Camera.pan(0, 0);
    }
  });
});
