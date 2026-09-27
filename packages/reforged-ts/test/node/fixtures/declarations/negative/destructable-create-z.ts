// Destructable.createZ is gone: `create` takes the height as its `z` option,
// and the positional arguments of w3ts's `create` are an options object.
import { Destructable } from "reforged-ts";

export function plant(): void {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- Negative: the member does not exist, so its type does not resolve
  Destructable.createZ(FourCC("LTlt"), 0, 0, 0); // error TS2551
  Destructable.create(FourCC("LTlt"), 0, 0); // error TS2554
  Destructable.create({ x: 0, y: 0 }); // error TS2345
}
