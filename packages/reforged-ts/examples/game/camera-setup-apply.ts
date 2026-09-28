// A close-up shot, built once and applied for one player. A CameraSetup is
// a Handle: it is created outside runLocal, on every client; only applying
// it to the camera, a visual, runs on that player's client alone.
import { CameraSetup, Init, MapPlayer } from "reforged-ts";

let closeUp: CameraSetup | undefined;

Init.onGlobals(() => {
  const setup = CameraSetup.create();
  setup.setField(CAMERA_FIELD_TARGET_DISTANCE, 900, 0);
  setup.setField(CAMERA_FIELD_ANGLE_OF_ATTACK, 340, 0);
  setup.setDestPos(512, -256, 0);
  closeUp = setup;
});

/** Moves `player`'s camera to the close-up over one second. */
export function showCloseUp(player: MapPlayer): void {
  const setup = closeUp;
  if (setup === undefined) {
    return;
  }
  MapPlayer.runLocal(player, () => {
    setup.applyForceDuration(true, 1);
  });
}

Init.onGameStart(() => {
  const first = MapPlayer.fromIndex(0);
  if (first) {
    showCloseUp(first);
  }
});
