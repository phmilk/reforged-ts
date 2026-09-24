// MultiboardItem.fromHandle is a lookup like every other: MultiboardItem |
// undefined is not assignable to MultiboardItem.
import { MultiboardItem } from "reforged-ts";

declare const h: multiboarditem;

const item: MultiboardItem = MultiboardItem.fromHandle(h); // error TS2322

export { item };
