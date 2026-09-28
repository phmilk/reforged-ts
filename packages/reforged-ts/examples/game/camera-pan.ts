// A short intro for one player: the screen fades in from black while the
// camera pans to a point and closes in. The camera and the cinematic filter
// are visuals, so they change inside runLocal, on that player's client only;
// the Timer that hides the filter afterwards is created on every client.
import { Camera, Init, MapPlayer, Timer } from "reforged-ts";

/** Fades in `player`'s screen and pans their camera to (x, y). */
export function playIntro(player: MapPlayer, x: number, y: number): void {
  MapPlayer.runLocal(player, () => {
    Camera.setCineFilterTexture(
      "ReplaceableTextures\\CameraMasks\\Black_mask.blp",
    );
    Camera.setCineFilterBlendMode(BLEND_MODE_BLEND);
    Camera.setCineFilterStartColor(0, 0, 0, 255);
    Camera.setCineFilterEndColor(0, 0, 0, 0);
    Camera.setCineFilterDuration(2);
    Camera.visible = true;
    Camera.panTimed(x, y, 2, undefined);
    Camera.setField(CAMERA_FIELD_TARGET_DISTANCE, 1200, 2);
  });
  Timer.after(2, () => {
    MapPlayer.runLocal(player, () => {
      Camera.visible = false;
    });
  });
}

Init.onGameStart(() => {
  const first = MapPlayer.fromIndex(0);
  if (first) {
    playIntro(first, 0, 0);
  }
});
