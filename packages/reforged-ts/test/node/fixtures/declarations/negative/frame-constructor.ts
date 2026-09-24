// Frame has no public constructor: creation goes through `create`,
// `createSimple` and `createType`.
import { Frame } from "reforged-ts";

declare const owner: Frame;

export function makeFrame(): void {
  new Frame("MyFrame", owner, 0, 0); // error TS2674
}
