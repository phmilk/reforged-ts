/** @noSelfInFile */

import { Handle } from "./handle";

export class Widget extends Handle<widget> {
  /**
   * Get the Widget's life.
   */
  public get life() {
    return GetWidgetLife(this.handle);
  }

  /**
   * Set the Widget's life.
   */
  public set life(value: number) {
    SetWidgetLife(this.handle, value);
  }

  /**
   * Get the Widget's x-coordinate
   */
  public get x() {
    return GetWidgetX(this.handle);
  }

  /**
   * Get the Widget's y-coordinate
   */
  public get y() {
    return GetWidgetY(this.handle);
  }

  /**
   * Adds a colored indicator to the widget, through `AddIndicator`.
   * @param red An integer from 0-255 determining the amount of red color.
   * @param green An integer from 0-255 determining the amount of green color.
   * @param blue An integer from 0-255 determining the amount of blue color.
   * @param alpha An integer from 0-255 determining the amount of alpha color.
   */
  public addIndicator(red: number, green: number, blue: number, alpha: number) {
    AddIndicator(this.handle, red, green, blue, alpha);
  }

  public static fromEvent(): Widget | undefined {
    return this.fromHandle(GetTriggerWidget());
  }

  /**
   * The widget a target order targets, or undefined outside a target order,
   * through `GetOrderTarget`.
   */
  public static fromOrderTarget(): Widget | undefined {
    return this.fromHandle(GetOrderTarget());
  }
}
