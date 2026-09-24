// WeatherEffect.fromHandle was typed non-null in w3ts 3.x; it is a lookup
// like every other: WeatherEffect | undefined is not assignable to
// WeatherEffect.
import { WeatherEffect } from "reforged-ts";

declare const h: weathereffect;

const found: WeatherEffect = WeatherEffect.fromHandle(h); // error TS2322

export { found };
