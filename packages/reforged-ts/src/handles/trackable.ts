/** @noSelfInFile */

import { Handle } from "./handle";

/**
 * An invisible model that reports clicks and mouse-overs, for the trackable
 * events. The game has no Native that destroys a trackable, so the Wrapper
 * has no `destroy`.
 * @example Printing a message when a trackable is clicked
 * {@includeCode ../../examples/harness/trackable-hit.ts}
 * @native trackable
 */
export class Trackable extends Handle<trackable> {
  /**
   * Creates a trackable with the given model at the given point.
   * @param modelPath - The model's path; the model's shape is what reacts to
   * the mouse.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @param facing - The facing, in degrees.
   * @returns The new trackable.
   * @throws When the game returns no handle:
   * `reforged-ts: failed to create Trackable (<modelPath>)`, at the calling line.
   * In Dev mode, also when called before the globals Init stage or inside
   * `MapPlayer.runLocal`.
   * @native CreateTrackable
   */
  public static create(
    modelPath: string,
    x: number,
    y: number,
    facing: number,
  ): Trackable {
    return this.expect(CreateTrackable(modelPath, x, y, facing), modelPath);
  }

  /**
   * Gets the trackable of the trackable event being handled.
   * @returns The trackable clicked or moused over, or `undefined` outside a
   * trackable event.
   * @native GetTriggeringTrackable
   */
  public static fromEvent(): Trackable | undefined {
    return this.fromHandle(GetTriggeringTrackable());
  }
}
