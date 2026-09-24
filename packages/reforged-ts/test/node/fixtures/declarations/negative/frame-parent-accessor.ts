// The deprecated `parent` accessor is gone: `getParent` and `setParent` stay.
import { Frame } from "reforged-ts";

declare const frame: Frame;

export function reparent(): void {
  frame.parent = frame; // error TS2339
}
