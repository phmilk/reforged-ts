/** @noSelfInFile */

import { Handle } from "./handle";

/**
 * A game object that has hit points and a position: a unit, an item or a
 * destructable. The base of `Unit`, `Item` and `Destructable`, and what a
 * Native taking any of them (a death event, a target order) gives back.
 * @example Reacting to the death of a unit or a destructable alike
 * {@includeCode ../../examples/harness/widget-death.ts}
 * @native widget
 */
export class Widget extends Handle<widget> {
  /**
   * Gets the widget's hit points.
   * @returns The current hit points.
   * @native GetWidgetLife
   */
  public get life() {
    return GetWidgetLife(this.handle);
  }

  /**
   * The widget's current hit points, an amount rather than a percentage.
   * @native SetWidgetLife
   */
  public set life(value: number) {
    SetWidgetLife(this.handle, value);
  }

  /**
   * Gets the x-coordinate of the widget's position.
   * @returns The x-coordinate, in world units.
   * @native GetWidgetX
   */
  public get x() {
    return GetWidgetX(this.handle);
  }

  /**
   * Gets the y-coordinate of the widget's position.
   * @returns The y-coordinate, in world units.
   * @native GetWidgetY
   */
  public get y() {
    return GetWidgetY(this.handle);
  }

  /**
   * Adds a colored indicator to the widget, through `AddIndicator`.
   * @param red - An integer from 0-255 determining the amount of red color.
   * @param green - An integer from 0-255 determining the amount of green color.
   * @param blue - An integer from 0-255 determining the amount of blue color.
   * @param alpha - An integer from 0-255 determining the amount of alpha color.
   * @native AddIndicator
   */
  public addIndicator(red: number, green: number, blue: number, alpha: number) {
    AddIndicator(this.handle, red, green, blue, alpha);
  }

  /**
   * Gets the widget a trigger event is about, such as the one that died in
   * a death event (`Trigger.registerDeathEvent`).
   * @returns The widget, or `undefined` outside an event about one.
   * @native GetTriggerWidget
   */
  public static fromEvent(): Widget | undefined {
    return this.fromHandle(GetTriggerWidget());
  }

  /**
   * Gets the target of the order being issued.
   * @returns The unit, item or destructable the order targets, or
   * `undefined` outside a target order.
   * @native GetOrderTarget
   */
  public static fromOrderTarget(): Widget | undefined {
    return this.fromHandle(GetOrderTarget());
  }
}
