// The mouse screen position is a number of pixels: Input.mouseScreenX is not
// assignable to a string.
import { Input } from "reforged-ts";

const mouseX: string = Input.mouseScreenX; // error TS2322

export { mouseX };
