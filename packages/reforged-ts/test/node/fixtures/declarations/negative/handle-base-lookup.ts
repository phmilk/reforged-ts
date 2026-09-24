// The abstract base is not a Wrapper class: its lookup and creation helper
// reject it as `this`, so no plain `Handle` object is ever built.
import { Handle } from "reforged-ts";

declare const h: timer;

export function lookUp(): void {
  Handle.fromHandle(h); // error TS2684
}

export class Trackable extends Handle<trackable> {
  public static wrapBase(t: trackable): void {
    Handle.expect(t); // error TS2684
  }
}
