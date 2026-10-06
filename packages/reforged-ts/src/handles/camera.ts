/** @noSelfInFile */

import { expectWrapper, Handle } from "./handle";
import { Point } from "./point";
import type { Unit } from "./unit";

/**
 * The game camera and the cinematic filter: a Static namespace, static
 * members over the camera of the whole game rather than one Handle.
 * @remarks
 * - Each client has its own camera. The getters read the local client's, so their values differ between clients (they are `@async`): never let one decide game state.
 * - A setter or a method changes the camera of every client that runs it. Call it inside {@link MapPlayer.runLocal} to change one player's camera: a camera change is a visual, safe on one client.
 * - Angles: {@link Camera.getField} returns radians, while {@link Camera.setField} takes degrees.
 * @example Panning one player's camera
 * {@includeCode ../../examples/game/camera-pan.ts}
 */
export class Camera {
  private constructor() {
    // nothing
  }

  /**
   * Shows the cinematic filter when `true`, with the texture, colours and
   * duration the `setCineFilter*` members set, and hides it when `false`.
   * @native DisplayCineFilter
   */
  public static set visible(flag: boolean) {
    DisplayCineFilter(flag);
  }

  /**
   * Tells whether the cinematic filter shows.
   * @returns `true` while the filter is displayed.
   * @native IsCineFilterDisplayed
   */
  public static get visible() {
    return IsCineFilterDisplayed();
  }

  /**
   * Gets the western edge of the area the local client's camera target can
   * move in.
   * @remarks
   * The value is the local client's own: it can differ between clients.
   * @example Keeping the local camera near a point
   * {@includeCode ../../examples/game/camera-local.ts#position}
   * @returns The smallest x-coordinate of the camera bounds, in world units.
   * @native GetCameraBoundMinX
   * @async
   */
  public static get boundMinX() {
    return GetCameraBoundMinX();
  }

  /**
   * Gets the southern edge of the area the local client's camera target can
   * move in.
   * @remarks
   * The value is the local client's own: it can differ between clients.
   * @example Keeping the local camera near a point
   * {@includeCode ../../examples/game/camera-local.ts#position}
   * @returns The smallest y-coordinate of the camera bounds, in world units.
   * @native GetCameraBoundMinY
   * @async
   */
  public static get boundMinY() {
    return GetCameraBoundMinY();
  }

  /**
   * Gets the eastern edge of the area the local client's camera target can
   * move in.
   * @remarks
   * The value is the local client's own: it can differ between clients.
   * @example Keeping the local camera near a point
   * {@includeCode ../../examples/game/camera-local.ts#position}
   * @returns The largest x-coordinate of the camera bounds, in world units.
   * @native GetCameraBoundMaxX
   * @async
   */
  public static get boundMaxX() {
    return GetCameraBoundMaxX();
  }

  /**
   * Gets the northern edge of the area the local client's camera target can
   * move in.
   * @remarks
   * The value is the local client's own: it can differ between clients.
   * @example Keeping the local camera near a point
   * {@includeCode ../../examples/game/camera-local.ts#position}
   * @returns The largest y-coordinate of the camera bounds, in world units.
   * @native GetCameraBoundMaxY
   * @async
   */
  public static get boundMaxY() {
    return GetCameraBoundMaxY();
  }

  /**
   * Gets the x-coordinate of the local client's camera target, the point the
   * camera looks at.
   * @remarks
   * The value is the local client's own: it can differ between clients.
   * @example Keeping the local camera near a point
   * {@includeCode ../../examples/game/camera-local.ts#position}
   * @returns The x-coordinate, in world units.
   * @native GetCameraTargetPositionX
   * @async
   */
  public static get targetX() {
    return GetCameraTargetPositionX();
  }

  /**
   * Gets the y-coordinate of the local client's camera target, the point the
   * camera looks at.
   * @remarks
   * The value is the local client's own: it can differ between clients.
   * @example Keeping the local camera near a point
   * {@includeCode ../../examples/game/camera-local.ts#position}
   * @returns The y-coordinate, in world units.
   * @native GetCameraTargetPositionY
   * @async
   */
  public static get targetY() {
    return GetCameraTargetPositionY();
  }

  /**
   * Gets the height of the local client's camera target, the point the
   * camera looks at.
   * @remarks
   * The value is the local client's own: it can differ between clients.
   * @example Measuring the local camera's height
   * {@includeCode ../../examples/game/camera-local.ts#eye}
   * @returns The z-coordinate, in world units.
   * @native GetCameraTargetPositionZ
   * @async
   */
  public static get targetZ() {
    return GetCameraTargetPositionZ();
  }

  /**
   * Gets the x-coordinate of the local client's camera eye, the point the
   * camera looks from.
   * @remarks
   * The value is the local client's own: it can differ between clients.
   * @example Measuring the local camera's height
   * {@includeCode ../../examples/game/camera-local.ts#eye}
   * @returns The x-coordinate, in world units.
   * @native GetCameraEyePositionX
   * @async
   */
  public static get eyeX() {
    return GetCameraEyePositionX();
  }

  /**
   * Gets the y-coordinate of the local client's camera eye, the point the
   * camera looks from.
   * @remarks
   * The value is the local client's own: it can differ between clients.
   * @example Measuring the local camera's height
   * {@includeCode ../../examples/game/camera-local.ts#eye}
   * @returns The y-coordinate, in world units.
   * @native GetCameraEyePositionY
   * @async
   */
  public static get eyeY() {
    return GetCameraEyePositionY();
  }

  /**
   * Gets the height of the local client's camera eye, the point the camera
   * looks from.
   * @remarks
   * The value is the local client's own: it can differ between clients.
   * @example Measuring the local camera's height
   * {@includeCode ../../examples/game/camera-local.ts#eye}
   * @returns The z-coordinate, in world units.
   * @native GetCameraEyePositionZ
   * @async
   */
  public static get eyeZ() {
    return GetCameraEyePositionZ();
  }

  /**
   * Gets the local client's camera eye, the point the camera looks from, as
   * a new Point.
   * @remarks
   * - The position is the local client's own: it can differ between clients.
   * - Each read creates a Point: destroy it when done.
   * @example Measuring the local camera's height
   * {@includeCode ../../examples/game/camera-local.ts#eye}
   * @returns A new Point at the camera eye.
   * @throws When the game returns no location:
   * `reforged-ts: failed to create Point`, at the calling line. In Dev mode
   * it also raises before the globals Init stage and inside
   * {@link MapPlayer.runLocal}, as every creation does.
   * @native GetCameraEyePositionLoc
   * @async
   */
  public static get eyePoint(): Point {
    return expectWrapper(Point, GetCameraEyePositionLoc());
  }

  /**
   * Gets the local client's camera target, the point the camera looks at, as
   * a new Point.
   * @remarks
   * - The position is the local client's own: it can differ between clients.
   * - Each read creates a Point: destroy it when done.
   * @example Measuring the local camera's height
   * {@includeCode ../../examples/game/camera-local.ts#eye}
   * @returns A new Point at the camera target.
   * @throws When the game returns no location:
   * `reforged-ts: failed to create Point`, at the calling line. In Dev mode
   * it also raises before the globals Init stage and inside
   * {@link MapPlayer.runLocal}, as every creation does.
   * @native GetCameraTargetPositionLoc
   * @async
   */
  public static get targetPoint(): Point {
    return expectWrapper(Point, GetCameraTargetPositionLoc());
  }

  /**
   * Gets the type of the game camera, through `BlzCameraGetCameraType`
   * (3.0.0): an integer the Patch does not name.
   * @remarks
   * The value is the local player's own.
   * @example Zooming the local camera out
   * {@includeCode ../../examples/game/camera-local.ts#fields}
   * @returns The camera type, as the bare integer the Native gives.
   * @native BlzCameraGetCameraType
   * @async
   */
  public static get type(): number {
    return BlzCameraGetCameraType();
  }

  /**
   * Sets the type of the game camera, through `BlzCameraSetCameraType`
   * (3.0.0): an integer the Patch does not name.
   * @native BlzCameraSetCameraType
   */
  public static set type(cameraType: number) {
    BlzCameraSetCameraType(cameraType);
  }

  /**
   * Adds `offset` to one field of the game camera, gradually over `duration`.
   * @param whichField - The field, such as `CAMERA_FIELD_TARGET_DISTANCE`.
   * @param offset - The amount added to the field's current value.
   * @param duration - The time the change takes, in seconds; 0 applies it at
   * once.
   * @native AdjustCameraField
   */
  public static adjustField(
    whichField: camerafield,
    offset: number,
    duration: number,
  ) {
    AdjustCameraField(whichField, offset, duration);
  }

  /**
   * Ends the cinematic scene {@link Camera.setCinematicScene} started,
   * before its duration runs out.
   * @native EndCinematicScene
   */
  public static endCinematicScene() {
    EndCinematicScene();
  }

  /**
   * Shows the text of cinematic scenes even to a player who turned subtitles
   * off in the game options.
   * @param flag - `true` to force the subtitles, `false` to follow each
   * player's option again.
   * @native ForceCinematicSubtitles
   */
  public static forceCinematicSubtitles(flag: boolean) {
    ForceCinematicSubtitles(flag);
  }

  /**
   * Gets the current value of one field of the local client's game camera.
   * @remarks
   * - The value is the local client's own: it can differ between clients.
   * - An angle comes back in radians, while {@link Camera.setField} and {@link CameraSetup.getField} use degrees.
   * @example Zooming the local camera out
   * {@includeCode ../../examples/game/camera-local.ts#fields}
   * @param field - The field, such as `CAMERA_FIELD_ANGLE_OF_ATTACK`.
   * @returns The value: radians for an angle, world units for a distance.
   * @native GetCameraField
   * @async
   */
  public static getField(field: camerafield) {
    return GetCameraField(field);
  }

  /**
   * Gets one margin of the map: the strip between the camera bounds and the
   * edge of the playable area on one side.
   * @param whichMargin - The side: `CAMERA_MARGIN_LEFT`,
   * `CAMERA_MARGIN_RIGHT`, `CAMERA_MARGIN_TOP` or `CAMERA_MARGIN_BOTTOM`.
   * @returns The width of the margin, in world units.
   * @native GetCameraMargin
   */
  public static getMargin(whichMargin: number) {
    return GetCameraMargin(whichMargin);
  }

  /**
   * Checks whether player input controls one field of the game camera,
   * through `GetCameraFieldControlledByInput` (3.0.0).
   * @remarks
   * The value is the local player's own.
   * @example Zooming the local camera out
   * {@includeCode ../../examples/game/camera-local.ts#fields}
   * @param field - The field, such as `CAMERA_FIELD_ROTATION`.
   * @returns `true` when player input controls the field.
   * @native GetCameraFieldControlledByInput
   * @async
   */
  public static isFieldControlledByInput(field: camerafield) {
    return GetCameraFieldControlledByInput(field);
  }

  /**
   * Pans the game camera until its target is at the point.
   * @remarks
   * In w3ts 3.x `zOffsetDest` was not optional: a pan without a z-offset
   * passed `undefined`, which still works.
   * @param x - The x-coordinate to pan to, in world units.
   * @param y - The y-coordinate to pan to, in world units.
   * @param zOffsetDest - The z-offset the camera has at the point, in world
   * units; left out, the camera pans without one.
   * @native PanCameraTo
   * @native PanCameraToWithZ
   */
  public static pan(x: number, y: number, zOffsetDest?: number) {
    if (zOffsetDest === undefined) {
      PanCameraTo(x, y);
    } else {
      PanCameraToWithZ(x, y, zOffsetDest);
    }
  }

  /**
   * Pans the game camera until its target is at the point, over `duration`.
   * @remarks
   * In w3ts 3.x `zOffsetDest` was not optional: a pan without a z-offset
   * passed `undefined`, which still works. The parameters keep their order.
   * @param x - The x-coordinate to pan to, in world units.
   * @param y - The y-coordinate to pan to, in world units.
   * @param duration - The time the pan takes, in seconds.
   * @param zOffsetDest - The z-offset the camera has at the point, in world
   * units; left out, the camera pans without one.
   * @native PanCameraToTimed
   * @native PanCameraToTimedWithZ
   */
  public static panTimed(
    x: number,
    y: number,
    duration: number,
    zOffsetDest?: number,
  ) {
    if (zOffsetDest === undefined) {
      PanCameraToTimed(x, y, duration);
    } else {
      PanCameraToTimedWithZ(x, y, zOffsetDest, duration);
    }
  }

  /**
   * Returns the game camera to the fields of the default game camera, over
   * `duration`.
   * @param duration - The time the change takes, in seconds.
   * @native ResetToGameCamera
   */
  public static reset(duration: number) {
    ResetToGameCamera(duration);
  }

  /**
   * Limits where the game camera's target can move to a quadrilateral given
   * by its four corners.
   * @remarks
   * For a rectangle, give its corners in turn: (minX, minY), (minX, maxY),
   * (maxX, maxY), (maxX, minY).
   * @param x1 - The first corner's x-coordinate, in world units.
   * @param y1 - The first corner's y-coordinate, in world units.
   * @param x2 - The second corner's x-coordinate, in world units.
   * @param y2 - The second corner's y-coordinate, in world units.
   * @param x3 - The third corner's x-coordinate, in world units.
   * @param y3 - The third corner's y-coordinate, in world units.
   * @param x4 - The fourth corner's x-coordinate, in world units.
   * @param y4 - The fourth corner's y-coordinate, in world units.
   * @native SetCameraBounds
   */
  public static setBounds(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    x4: number,
    y4: number,
  ) {
    SetCameraBounds(x1, y1, x2, y2, x3, y3, x4, y4);
  }

  /**
   * Locks the game camera's orientation to a unit, at an offset from it.
   * @remarks
   * In w3ts 3.x it was named `setCameraOrientController`, and took the raw
   * `unit` Handle, `unit.handle`; it now takes the `Unit`.
   * @param whichUnit - The unit.
   * @param xOffset - The offset along the x-axis, in world units.
   * @param yOffset - The offset along the y-axis, in world units.
   * @native SetCameraOrientController
   */
  public static setOrientController(
    whichUnit: Unit,
    xOffset: number,
    yOffset: number,
  ) {
    SetCameraOrientController(whichUnit.handle, xOffset, yOffset);
  }

  /**
   * Sets how the cinematic filter's texture blends with the scene behind it.
   * @param whichMode - The blend mode, such as `BLEND_MODE_BLEND` or
   * `BLEND_MODE_ADDITIVE`.
   * @native SetCineFilterBlendMode
   */
  public static setCineFilterBlendMode(whichMode: blendmode) {
    SetCineFilterBlendMode(whichMode);
  }

  /**
   * Sets the time the cinematic filter takes to go from its start colour and
   * texture coordinates to its end ones.
   * @param duration - The time, in seconds.
   * @native SetCineFilterDuration
   */
  public static setCineFilterDuration(duration: number) {
    SetCineFilterDuration(duration);
  }

  /**
   * Sets the colour the cinematic filter ends on.
   * @param red - The red channel, from 0 to 255.
   * @param green - The green channel, from 0 to 255.
   * @param blue - The blue channel, from 0 to 255.
   * @param alpha - The opacity, from 0 (transparent) to 255 (opaque).
   * @native SetCineFilterEndColor
   */
  public static setCineFilterEndColor(
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ) {
    SetCineFilterEndColor(red, green, blue, alpha);
  }

  /**
   * Sets the part of the texture the cinematic filter ends on, in texture
   * coordinates: 0, 0, 1, 1 is the whole texture.
   * @param minU - The smallest U coordinate, from 0 to 1.
   * @param minV - The smallest V coordinate, from 0 to 1.
   * @param maxU - The largest U coordinate, from 0 to 1.
   * @param maxV - The largest V coordinate, from 0 to 1.
   * @native SetCineFilterEndUV
   */
  public static setCineFilterEndUV(
    minU: number,
    minV: number,
    maxU: number,
    maxV: number,
  ) {
    SetCineFilterEndUV(minU, minV, maxU, maxV);
  }

  /**
   * Sets the colour the cinematic filter starts from.
   * @param red - The red channel, from 0 to 255.
   * @param green - The green channel, from 0 to 255.
   * @param blue - The blue channel, from 0 to 255.
   * @param alpha - The opacity, from 0 (transparent) to 255 (opaque).
   * @native SetCineFilterStartColor
   */
  public static setCineFilterStartColor(
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ) {
    SetCineFilterStartColor(red, green, blue, alpha);
  }

  /**
   * Sets the part of the texture the cinematic filter starts from, in
   * texture coordinates: 0, 0, 1, 1 is the whole texture.
   * @param minU - The smallest U coordinate, from 0 to 1.
   * @param minV - The smallest V coordinate, from 0 to 1.
   * @param maxU - The largest U coordinate, from 0 to 1.
   * @param maxV - The largest V coordinate, from 0 to 1.
   * @native SetCineFilterStartUV
   */
  public static setCineFilterStartUV(
    minU: number,
    minV: number,
    maxU: number,
    maxV: number,
  ) {
    SetCineFilterStartUV(minU, minV, maxU, maxV);
  }

  /**
   * Sets whether the cinematic filter's texture repeats along U, along V or
   * along both.
   * @param whichFlags - `TEXMAP_FLAG_NONE`, `TEXMAP_FLAG_WRAP_U`,
   * `TEXMAP_FLAG_WRAP_V` or `TEXMAP_FLAG_WRAP_UV`.
   * @native SetCineFilterTexMapFlags
   */
  public static setCineFilterTexMapFlags(whichFlags: texmapflags) {
    SetCineFilterTexMapFlags(whichFlags);
  }

  /**
   * Sets the texture the cinematic filter shows.
   * @param fileName - The texture's path, such as
   * `"ReplaceableTextures\\CameraMasks\\White_mask.blp"`.
   * @native SetCineFilterTexture
   */
  public static setCineFilterTexture(fileName: string) {
    SetCineFilterTexture(fileName);
  }

  /**
   * Switches the game's sound to the cinematic audio, or back.
   * @param cinematicAudio - `true` for the cinematic audio, `false` for the
   * game's normal audio.
   * @native SetCinematicAudio
   */
  public static setCinematicAudio(cinematicAudio: boolean) {
    SetCinematicAudio(cinematicAudio);
  }

  /**
   * Plays the camera animation of a model file on the game camera.
   * @param cameraModelFile - The path of the model holding the camera
   * animation.
   * @native SetCinematicCamera
   */
  public static setCinematicCamera(cameraModelFile: string) {
    SetCinematicCamera(cameraModelFile);
  }

  /**
   * Starts a cinematic scene: a unit type's portrait speaking `text` under
   * the speaker's name, in the cinematic panel.
   * @remarks
   * - {@link Camera.endCinematicScene} ends it early.
   * - In w3ts 3.x it was named `SetCinematicScene`, the one member not in
   *   camelCase.
   * @param portraitUnitId - The rawcode of the unit type whose portrait
   * shows, such as the Paladin's, `FourCC("Hpal")`.
   * @param color - The player colour the speaker's name shows in.
   * @param speakerTitle - The speaker's name.
   * @param text - The text the speaker says.
   * @param sceneDuration - The time the scene shows, in seconds.
   * @param voiceoverDuration - The length of the spoken line, in seconds.
   * @native SetCinematicScene
   */
  public static setCinematicScene(
    portraitUnitId: Rawcode<"unit">,
    color: playercolor,
    speakerTitle: string,
    text: string,
    sceneDuration: number,
    voiceoverDuration: number,
  ) {
    SetCinematicScene(
      portraitUnitId,
      color,
      speakerTitle,
      text,
      sceneDuration,
      voiceoverDuration,
    );
  }

  /**
   * Sets how strongly the game camera blurs what lies away from its focal
   * distance.
   * @remarks
   * Only the HD graphics of Reforged show the depth of field. A tutorial:
   * https://www.hiveworkshop.com/threads/how-to-camera-focal-distance-and-depth-of-field.331038/
   * @param scale - The strength of the blur.
   * @native CameraSetDepthOfFieldScale
   */
  public static setDepthOfFieldScale(scale: number) {
    CameraSetDepthOfFieldScale(scale);
  }

  /**
   * Sets one field of the game camera, gradually over `duration`.
   * @param whichField - The field, such as `CAMERA_FIELD_TARGET_DISTANCE`.
   * @param value - The new value: degrees for an angle, unlike the radians
   * of {@link Camera.getField}; world units for a distance.
   * @param duration - The time the change takes, in seconds; 0 applies it at
   * once.
   * @native SetCameraField
   */
  public static setField(
    whichField: camerafield,
    value: number,
    duration: number,
  ) {
    SetCameraField(whichField, value, duration);
  }

  /**
   * Hands the field of the game camera to player input, or takes it back,
   * through `SetCameraFieldControlledByInput` (3.0.0).
   * @param field - The field, such as `CAMERA_FIELD_ROTATION`.
   * @param controlled - `true` to let player input control the field,
   * `false` to take it back.
   * @native SetCameraFieldControlledByInput
   */
  public static setFieldControlledByInput(
    field: camerafield,
    controlled: boolean,
  ) {
    SetCameraFieldControlledByInput(field, controlled);
  }

  /**
   * Sets the distance from the game camera at which the depth of field is
   * sharp.
   * @remarks
   * Only the HD graphics of Reforged show the depth of field. A tutorial:
   * https://www.hiveworkshop.com/threads/how-to-camera-focal-distance-and-depth-of-field.331038/
   * @param distance - The focal distance, in world units.
   * @native CameraSetFocalDistance
   */
  public static setFocalDistance(distance: number) {
    CameraSetFocalDistance(distance);
  }

  /**
   * Moves the game camera's target to the point at once, without a pan.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @native SetCameraPosition
   */
  public static setPos(x: number, y: number) {
    SetCameraPosition(x, y);
  }

  /**
   * Turns the game camera around a point, sweeping an angle over `duration`.
   * @param x - The x-coordinate of the point to turn around, in world units.
   * @param y - The y-coordinate of the point to turn around, in world units.
   * @param radiansToSweep - The angle to sweep, in radians.
   * @param duration - The time the sweep takes, in seconds.
   * @native SetCameraRotateMode
   */
  public static setRotateMode(
    x: number,
    y: number,
    radiansToSweep: number,
    duration: number,
  ) {
    SetCameraRotateMode(x, y, radiansToSweep, duration);
  }

  /**
   * Sets how gradually the game camera comes to a stop after the player
   * scrolls it with the mouse or the keyboard.
   * @param factor - 0, the default, stops the camera at once; a larger
   * factor eases it into a stop more gradually.
   * @native CameraSetSmoothingFactor
   */
  public static setSmoothingFactor(factor: number) {
    CameraSetSmoothingFactor(factor);
  }

  /**
   * Sways the game camera's eye, the point it looks from, without moving its
   * target; a magnitude and a velocity of 0 stop it.
   * @param mag - How far the eye sways.
   * @param velocity - How fast the eye sways.
   * @param vertOnly - `true` to sway only the angle of attack, the distance
   * and the z-offset, not the rotation; `false` when left out.
   * @native CameraSetSourceNoiseEx
   */
  public static setSourceNoise(
    mag: number,
    velocity: number,
    vertOnly = false,
  ) {
    CameraSetSourceNoiseEx(mag, velocity, vertOnly);
  }

  /**
   * Makes the game camera's target follow a unit, at an offset from it.
   * @remarks
   * In w3ts 3.x it took the raw `unit` Handle, `unit.handle`; it now takes
   * the `Unit`.
   * @param whichUnit - The unit.
   * @param xOffset - The offset along the x-axis, in world units.
   * @param yOffset - The offset along the y-axis, in world units.
   * @param inheritOrientation - `true` to turn the camera with the unit's
   * facing as well.
   * @native SetCameraTargetController
   */
  public static setTargetController(
    whichUnit: Unit,
    xOffset: number,
    yOffset: number,
    inheritOrientation: boolean,
  ) {
    SetCameraTargetController(
      whichUnit.handle,
      xOffset,
      yOffset,
      inheritOrientation,
    );
  }

  /**
   * Sways the game camera's target, the point it looks at; a magnitude and a
   * velocity of 0 stop it.
   * @param mag - How far the target sways.
   * @param velocity - How fast the target sways.
   * @param vertOnly - `true` to sway only the distance and the z-offset;
   * `false` when left out.
   * @native CameraSetTargetNoiseEx
   */
  public static setTargetNoise(
    mag: number,
    velocity: number,
    vertOnly = false,
  ) {
    CameraSetTargetNoiseEx(mag, velocity, vertOnly);
  }

  /**
   * Stops the game camera where it is, ending a pan in progress.
   * @native StopCamera
   */
  public static stop() {
    StopCamera();
  }
}

/**
 * A camera setup: the fields and the target position of a camera, stored to
 * be applied to the game camera, like the cameras a map places in the World
 * Editor.
 * @example Applying a camera setup for one player
 * {@includeCode ../../examples/game/camera-setup-apply.ts}
 * @native camerasetup
 */
export class CameraSetup extends Handle<camerasetup> {
  /**
   * Creates a camera setup with the game's default fields.
   * @remarks
   * The defaults: the target at (0, 0), a z-offset of 0, a rotation of 90,
   * an angle of attack of 304, a distance of 1650, a roll of 0, a field of
   * view of 70 and a far clipping of 5000.
   * @returns The new camera setup.
   * @throws When the game returns no handle:
   * `reforged-ts: failed to create CameraSetup`, at the calling line.
   * @native CreateCameraSetup
   */
  public static create(): CameraSetup {
    return this.expect(CreateCameraSetup());
  }

  /**
   * Gets the position the camera setup moves the camera's target to, as a
   * new Point.
   * @remarks
   * Each read creates a Point: destroy it when done.
   * @returns A new Point at the target position.
   * @throws When the game returns no location:
   * `reforged-ts: failed to create Point`, at the calling line. In Dev mode
   * it also raises before the globals Init stage and inside
   * {@link MapPlayer.runLocal}, as every creation does.
   * @native CameraSetupGetDestPositionLoc
   */
  public get destPoint(): Point {
    return Point.expect(CameraSetupGetDestPositionLoc(this.handle));
  }

  /**
   * Gets the x-coordinate the camera setup moves the camera's target to.
   * @returns The x-coordinate, in world units.
   * @native CameraSetupGetDestPositionX
   */
  public get destX() {
    return CameraSetupGetDestPositionX(this.handle);
  }

  /**
   * Moves the camera setup's target position to this x-coordinate, in world
   * units, keeping its y-coordinate.
   * @remarks
   * The move has no duration: {@link CameraSetup.setDestPos} gives it one.
   * @native CameraSetupSetDestPosition
   * @native CameraSetupGetDestPositionY
   */
  public set destX(x: number) {
    CameraSetupSetDestPosition(this.handle, x, this.destY, 0);
  }

  /**
   * Gets the y-coordinate the camera setup moves the camera's target to.
   * @returns The y-coordinate, in world units.
   * @native CameraSetupGetDestPositionY
   */
  public get destY() {
    return CameraSetupGetDestPositionY(this.handle);
  }

  /**
   * Moves the camera setup's target position to this y-coordinate, in world
   * units, keeping its x-coordinate.
   * @remarks
   * The move has no duration: {@link CameraSetup.setDestPos} gives it one.
   * @native CameraSetupSetDestPosition
   * @native CameraSetupGetDestPositionX
   */
  public set destY(y: number) {
    CameraSetupSetDestPosition(this.handle, this.destX, y, 0);
  }

  /**
   * Names the camera setup with a label of free text.
   * @native BlzCameraSetupSetLabel
   */
  public set label(label: string) {
    BlzCameraSetupSetLabel(this.handle, label);
  }

  /**
   * Gets the free-text label that names the camera setup.
   * @returns The label, or an empty string when it has none.
   * @native BlzCameraSetupGetLabel
   */
  public get label() {
    return BlzCameraSetupGetLabel(this.handle) ?? "";
  }

  /**
   * Gets the camera type of the camera setup, through
   * `BlzCameraSetupGetCameraType` (3.0.0): an integer the Patch does not name.
   * @returns The camera type, as the bare integer the Native gives.
   * @native BlzCameraSetupGetCameraType
   */
  public get type(): number {
    return BlzCameraSetupGetCameraType(this.handle);
  }

  /**
   * Sets the camera type of the CameraSetup, through
   * `BlzCameraSetupSetCameraType` (3.0.0): an integer the Patch does not name.
   * @native BlzCameraSetupSetCameraType
   */
  public set type(cameraType: number) {
    BlzCameraSetupSetCameraType(this.handle, cameraType);
  }

  /**
   * Applies the camera setup's fields to the game camera.
   * @param doPan - `true` to move the camera's target to the setup's target
   * position as well; `false` to change the other fields only.
   * @param panTimed - `true` to change each field over the duration
   * {@link CameraSetup.setField} gave it; `false` to apply them at once.
   * @native CameraSetupApply
   */
  public apply(doPan: boolean, panTimed: boolean) {
    CameraSetupApply(this.handle, doPan, panTimed);
  }

  /**
   * Applies the camera setup's fields to the game camera over one duration
   * for all of them.
   * @param doPan - `true` to move the camera's target to the setup's target
   * position as well; `false` to change the other fields only.
   * @param forceDuration - The time every field takes, in seconds, in place
   * of the durations {@link CameraSetup.setField} gave them.
   * @native CameraSetupApplyForceDuration
   */
  public applyForceDuration(doPan: boolean, forceDuration: number) {
    CameraSetupApplyForceDuration(this.handle, doPan, forceDuration);
  }

  /**
   * Applies the camera setup's fields to the game camera over one duration,
   * easing the change in at the start and out at the end.
   * @param doPan - `true` to move the camera's target to the setup's target
   * position as well; `false` to change the other fields only.
   * @param forcedDuration - The time every field takes, in seconds, in place
   * of the durations {@link CameraSetup.setField} gave them.
   * @param easeInDuration - The time the change takes to speed up at the
   * start, in seconds.
   * @param easeOutDuration - The time the change takes to slow down at the
   * end, in seconds.
   * @param smoothFactor - The smoothing factor of the easing.
   * @native BlzCameraSetupApplyForceDurationSmooth
   */
  public applyForceDurationSmooth(
    doPan: boolean,
    forcedDuration: number,
    easeInDuration: number,
    easeOutDuration: number,
    smoothFactor: number,
  ) {
    BlzCameraSetupApplyForceDurationSmooth(
      this.handle,
      doPan,
      forcedDuration,
      easeInDuration,
      easeOutDuration,
      smoothFactor,
    );
  }

  /**
   * Applies the camera setup's fields to the game camera over one duration,
   * with a z-offset of its own in place of the setup's.
   * @param zDestOffset - The z-offset the camera moves to over the duration,
   * in world units.
   * @param forceDuration - The time every field takes, in seconds, in place
   * of the durations {@link CameraSetup.setField} gave them.
   * @native CameraSetupApplyForceDurationWithZ
   */
  public applyForceDurationZ(zDestOffset: number, forceDuration: number) {
    CameraSetupApplyForceDurationWithZ(this.handle, zDestOffset, forceDuration);
  }

  /**
   * Applies the camera setup's fields to the game camera, with a z-offset of
   * its own in place of the setup's.
   * @param zDestOffset - The z-offset the camera moves to, in world units.
   * @native CameraSetupApplyWithZ
   * @bug A player who pauses the game after the call gets the setup's own
   * z-offset on their game camera, in place of `zDestOffset`.
   */
  public applyZ(zDestOffset: number) {
    CameraSetupApplyWithZ(this.handle, zDestOffset);
  }

  /**
   * Gets the value the camera setup holds for one field.
   * @remarks The four angle fields (angle of attack, field of view, roll
   * and rotation) come back in degrees.
   * @param whichField - The field, such as `CAMERA_FIELD_ANGLE_OF_ATTACK`.
   * @returns The value: degrees for an angle, unlike the radians of
   * {@link Camera.getField}; world units for a distance.
   * @native CameraSetupGetField
   */
  public getField(whichField: camerafield) {
    return CameraSetupGetField(this.handle, whichField);
  }

  /**
   * Sets the position the camera setup moves the camera's target to, reached
   * over `duration` once the setup is applied.
   * @param x - The target x-coordinate, in world units.
   * @param y - The target y-coordinate, in world units.
   * @param duration - The time the move takes once the setup is applied, in
   * seconds.
   * @native CameraSetupSetDestPosition
   */
  public setDestPos(x: number, y: number, duration: number) {
    CameraSetupSetDestPosition(this.handle, x, y, duration);
  }

  /**
   * Sets the value the camera setup holds for one field, reached over
   * `duration` once the setup is applied.
   * @param whichField - The field, such as `CAMERA_FIELD_TARGET_DISTANCE`.
   * @param value - The value: degrees for an angle, world units for a
   * distance.
   * @param duration - The time the change takes once the setup is applied,
   * in seconds; 0 applies it at once.
   * @native CameraSetupSetField
   */
  public setField(whichField: camerafield, value: number, duration: number) {
    CameraSetupSetField(this.handle, whichField, value, duration);
  }
}
