/** @noSelfInFile */

/**
 * The meta keys `Input.isMetaKeyPressed` asks for, the integer bit flags of
 * `METAKEY_NONE` to `METAKEY_WINKEYS`; combine them with `|`
 * (`MetaKey.Shift | MetaKey.Ctrl`).
 */
export enum MetaKey {
  None = 0,
  Shift = 1,
  Ctrl = 2,
  Alt = 4,
  WinKeys = 8,
}

/**
 * Raw input of the local player, polled through the input Natives of 3.0.0.
 * Every value is the local client's own, so it differs between clients.
 */
export class Input {
  private constructor() {
    // nothing
  }

  /**
   * Whether the local player holds the key down, through `BlzIsKeyPressed`
   * (3.0.0).
   * @async
   */
  public static isKeyPressed(key: oskeytype) {
    return BlzIsKeyPressed(key);
  }

  /**
   * Whether the local player holds the mouse button down, through
   * `BlzIsMouseButtonPressed` (3.0.0).
   * @async
   */
  public static isMouseButtonPressed(button: mousebuttontype) {
    return BlzIsMouseButtonPressed(button);
  }

  /**
   * Whether the local player holds the meta keys down, through
   * `BlzIsMetaKeyPressed` (3.0.0).
   * @async
   */
  public static isMetaKeyPressed(keys: MetaKey) {
    return BlzIsMetaKeyPressed(keys);
  }

  /**
   * The horizontal position of the local mouse on the screen, in pixels,
   * through `BlzGetMouseScreenPosX` (3.0.0).
   * @async
   */
  public static get mouseScreenX() {
    return BlzGetMouseScreenPosX();
  }

  /**
   * The vertical position of the local mouse on the screen, in pixels,
   * through `BlzGetMouseScreenPosY` (3.0.0).
   * @async
   */
  public static get mouseScreenY() {
    return BlzGetMouseScreenPosY();
  }
}
