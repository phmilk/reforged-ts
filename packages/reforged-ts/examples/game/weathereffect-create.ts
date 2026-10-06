// Ashenvale Rain (Heavy), `FourCC("RAhr")`, over the centre of the map. A weather effect is
// created off, so it is enabled right after.
import { Init, Rectangle, WeatherEffect } from "reforged-ts";

Init.onGameStart(() => {
  const area = Rectangle.create(-2048, -2048, 2048, 2048);
  const rain = WeatherEffect.create(area, FourCC("RAhr"));
  rain.enable(true);
});
