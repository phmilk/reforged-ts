// The old wrapping path of w3ts 3.x is gone from the Handle base: no
// getObject, no initFromHandle (TS2551 suggests fromHandle), no constructor
// without a Handle, and the base itself is abstract, even to a subclass that
// may call its protected constructor.
import { Handle } from "reforged-ts";

export class Trackable extends Handle<trackable> {
  public static wrap(h: trackable): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- Negative: the member does not exist, so its type does not resolve
    this.getObject(h); // error TS2339
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- Negative: the member does not exist, so its type does not resolve
    this.initFromHandle(); // error TS2551
    new Handle(h); // error TS2511
  }
}

export class LabelledTrackable extends Trackable {
  public constructor() {
    super(); // error TS2554
  }
}
