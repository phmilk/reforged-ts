/** @noSelfInFile */

import { Handle } from "./handle";

/**
 * An invisible model that reports clicks and mouse-overs, for the trackable
 * events. The game has no Native that destroys a trackable, so the Wrapper
 * has no `destroy`.
 */
export class Trackable extends Handle<trackable> {
  /** A new trackable showing `modelPath` at (`x`, `y`), facing `facing`. */
  public static create(
    modelPath: string,
    x: number,
    y: number,
    facing: number,
  ): Trackable {
    return this.expect(CreateTrackable(modelPath, x, y, facing), modelPath);
  }

  /** The hit or tracked trackable, or undefined outside a trackable event. */
  public static fromEvent(): Trackable | undefined {
    return this.fromHandle(GetTriggeringTrackable());
  }
}
