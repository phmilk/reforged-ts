/** @noSelfInFile */

import { HandleBase } from "./handle";

export class Widget extends HandleBase<widget> {
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

  public static fromEvent(): Widget | undefined {
    return this.fromHandle(GetTriggerWidget());
  }
}
