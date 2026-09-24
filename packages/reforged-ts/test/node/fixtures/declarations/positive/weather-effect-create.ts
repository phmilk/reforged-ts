// A creation returns the Wrapper itself: no `!`, no `?.`.
import { Rectangle, WeatherEffect } from "reforged-ts";

const area = Rectangle.create(-256, -256, 256, 256);
const rain: WeatherEffect = WeatherEffect.create(area, FourCC("RAhr"));

export { rain };
