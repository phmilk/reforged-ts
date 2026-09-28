/** @noSelfInFile */

/**
 * The meta keys `Input.isMetaKeyPressed` asks for, the integer bit flags of
 * `METAKEY_NONE` to `METAKEY_WINKEYS`; combine them with `|`
 * (`MetaKey.Shift | MetaKey.Ctrl`).
 */
export enum MetaKey {
  /**
   * No meta key.
   * @native METAKEY_NONE
   */
  None = 0,
  /**
   * The Shift key.
   * @native METAKEY_SHIFT
   */
  Shift = 1,
  /**
   * The Ctrl key.
   * @native METAKEY_CTRL
   */
  Ctrl = 2,
  /**
   * The Alt key.
   * @native METAKEY_ALT
   */
  Alt = 4,
  /**
   * The Windows keys.
   * @native METAKEY_WINKEYS
   */
  WinKeys = 8,
}

/**
 * Raw input of the local player, polled through the input Natives of 3.0.0:
 * a Static namespace, static members over the keyboard and the mouse of the
 * whole game rather than one Handle.
 * @remarks
 * Every value is the local client's own, so it differs between clients (the
 * members are `@async`): use it for visuals, or send it with a
 * {@link SyncRequest} before it decides game state.
 * @example Panning the local camera while a key is held
 * {@includeCode ../../examples/harness/input-hold-key.ts}
 */
export class Input {
  private constructor() {
    // nothing
  }

  /**
   * Checks whether the local player holds the key down, through
   * `BlzIsKeyPressed` (3.0.0).
   * @param key - The key, such as `OSKEY_SPACE`.
   * @returns `true` while the key is down on the local client.
   * @native BlzIsKeyPressed
   * @async
   */
  public static isKeyPressed(key: oskeytype) {
    return BlzIsKeyPressed(key);
  }

  /**
   * Checks whether the local player holds the mouse button down, through
   * `BlzIsMouseButtonPressed` (3.0.0).
   * @param button - The button, such as `MOUSE_BUTTON_TYPE_LEFT`.
   * @returns `true` while the button is down on the local client.
   * @native BlzIsMouseButtonPressed
   * @async
   */
  public static isMouseButtonPressed(button: mousebuttontype) {
    return BlzIsMouseButtonPressed(button);
  }

  /**
   * Checks whether the local player holds the meta keys down, through
   * `BlzIsMetaKeyPressed` (3.0.0).
   * @param keys - The meta keys, one {@link MetaKey} or several combined
   * with `|`.
   * @returns `true` while the keys are down on the local client.
   * @native BlzIsMetaKeyPressed
   * @async
   */
  public static isMetaKeyPressed(keys: MetaKey) {
    return BlzIsMetaKeyPressed(keys);
  }

  /**
   * Gets the horizontal position of the local mouse on the screen, through
   * `BlzGetMouseScreenPosX` (3.0.0).
   * @returns The x-coordinate on the screen, in pixels.
   * @native BlzGetMouseScreenPosX
   * @async
   */
  public static get mouseScreenX() {
    return BlzGetMouseScreenPosX();
  }

  /**
   * Gets the vertical position of the local mouse on the screen, through
   * `BlzGetMouseScreenPosY` (3.0.0).
   * @returns The y-coordinate on the screen, in pixels.
   * @native BlzGetMouseScreenPosY
   * @async
   */
  public static get mouseScreenY() {
    return BlzGetMouseScreenPosY();
  }
}
