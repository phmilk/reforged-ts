// The local client's camera, read on each client. Every player moves their
// own camera, so the values differ between clients: they drive what that
// client shows, such as its own camera or a line of text, and never game
// state, such as a unit order or a synced variable.
import { Camera, Init, Timer } from "reforged-ts";

// #region position
/**
 * Keeps the local camera near (x, y): every quarter second each client pans
 * its own camera back when its target strays further than `radius`. The
 * centre is kept inside the camera bounds, which the camera cannot leave.
 */
export function leashCamera(x: number, y: number, radius: number): Timer {
  const centerX = Math.min(Math.max(x, Camera.boundMinX), Camera.boundMaxX);
  const centerY = Math.min(Math.max(y, Camera.boundMinY), Camera.boundMaxY);
  return Timer.every(0.25, () => {
    const dx = Camera.targetX - centerX;
    const dy = Camera.targetY - centerY;
    if (dx * dx + dy * dy > radius * radius) {
      Camera.pan(centerX, centerY, undefined);
    }
  });
}
// #endregion position

// #region eye
/**
 * Prints how high the local camera's eye is above the ground under it, and
 * how far it is from its target: a printed line shows on the local screen
 * only. The Points are created on every client, as any Wrapper must be, and
 * destroyed once read.
 */
export function printCameraHeight(): void {
  const eye = Camera.eyePoint;
  const target = Camera.targetPoint;
  const height = Camera.eyeZ - eye.z;
  const dx = Camera.eyeX - Camera.targetX;
  const dy = Camera.eyeY - Camera.targetY;
  const dz = Camera.eyeZ - Camera.targetZ;
  print(
    `Eye ${height.toFixed(0)} above the ground, ` +
      `${Math.sqrt(dx * dx + dy * dy + dz * dz).toFixed(0)} from a target ` +
      `${(Camera.targetZ - target.z).toFixed(0)} above the ground`,
  );
  eye.destroy();
  target.destroy();
}
// #endregion eye

// #region fields
/**
 * Zooms the local camera out by 250, up to 3000, unless the player's input
 * controls the distance. A field is read in world units for a distance and
 * in radians for an angle, but an angle is set in degrees.
 */
export function zoomOut(): void {
  if (Camera.isFieldControlledByInput(CAMERA_FIELD_TARGET_DISTANCE)) {
    return;
  }
  const distance = Camera.getField(CAMERA_FIELD_TARGET_DISTANCE);
  Camera.setField(
    CAMERA_FIELD_TARGET_DISTANCE,
    Math.min(distance + 250, 3000),
    0.5,
  );
  const angle = (Camera.getField(CAMERA_FIELD_ANGLE_OF_ATTACK) * 180) / Math.PI;
  print(
    `Camera type ${String(Camera.type)}, looking down at ${angle.toFixed(0)} degrees`,
  );
}
// #endregion fields

Init.onGameStart(() => {
  leashCamera(0, 0, 2048);
  Timer.every(5, () => {
    printCameraHeight();
    zoomOut();
  });
});
