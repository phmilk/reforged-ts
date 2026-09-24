// A member whose Native allocates is a creation: it returns the Wrapper
// itself, whatever its name says.
import { Point, Rectangle } from "reforged-ts";

const min = Point.create(0, 0);
const max = Point.create(128, 128);
const area: Rectangle = Rectangle.fromPoint(min, max);
const bounds: Rectangle = Rectangle.getWorldBounds();

export { area, bounds };
