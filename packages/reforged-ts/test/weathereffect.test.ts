/** @noSelfInFile */

// WeatherEffect on the Handle base: `create` throws naming the rawcode, and
// `fromHandle`, typed non-null in w3ts 3.x, returns undefined for nothing.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Rectangle, WeatherEffect } from "../src/index";
import { handleRef } from "./support/handle-ref";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

describe("WeatherEffect.create", () => {
  const area = Rectangle.create(-256, -256, 256, 256);
  const rain = FourCC("RAhr");

  it("wraps the handle AddWeatherEffect returns, and a lookup finds it", () => {
    const weather = WeatherEffect.create(area, rain);
    expect(stubCalls()).toContainCall(
      `AddWeatherEffect(${handleRef("rect", area.handle)}, ${tostring(rain)})`,
    );
    expect(WeatherEffect.fromHandle(weather.handle)).toBe(weather);
  });

  it("throws naming the rawcode when AddWeatherEffect returns nil", () => {
    const message = withNative(
      "AddWeatherEffect",
      () => undefined,
      () =>
        raisedIn(() => {
          WeatherEffect.create(area, rain);
        }),
    );
    expect(message).toEqual(
      "reforged-ts: failed to create WeatherEffect (RAhr)",
    );
  });
});

describe("WeatherEffect.fromHandle", () => {
  it("is undefined for an undefined Handle", () => {
    expect(WeatherEffect.fromHandle(undefined)).toBeUndefined();
  });

  it("gives the same WeatherEffect for two lookups of one Handle", () => {
    const handle = AddWeatherEffect(
      Rectangle.create(0, 0, 64, 64).handle,
      FourCC("SNls"),
    );
    const weather = WeatherEffect.fromHandle(handle);
    expect(weather?.handle).toBe(handle);
    expect(WeatherEffect.fromHandle(handle)).toBe(weather);
  });
});
