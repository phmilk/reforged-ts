/** @noSelfInFile */

// Sound on the Handle base: `create` throws naming the sound file,
// `fromHandle` returns undefined for nothing.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Sound } from "../src/index";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

const file = "Sound/Interface/Warning.flac";

describe("Sound.create", () => {
  it("wraps the handle CreateSound returns, and a lookup finds it", () => {
    const sound = Sound.create(file, false, true, true, 10, 10, "DefaultEAXON");
    expect(stubCalls()).toContainCall(
      `CreateSound("${file}", false, true, true, 10, 10, "DefaultEAXON")`,
    );
    expect(Sound.fromHandle(sound.handle)).toBe(sound);
  });

  it("throws naming the file when CreateSound returns nil", () => {
    const message = withNative(
      "CreateSound",
      () => undefined,
      () =>
        raisedIn(() => {
          Sound.create(file, false, false, false, 10, 10, "");
        }),
    );
    expect(message).toEqual(`reforged-ts: failed to create Sound (${file})`);
  });
});

describe("Sound.fromHandle", () => {
  it("is undefined for an undefined Handle", () => {
    expect(Sound.fromHandle(undefined)).toBeUndefined();
  });

  it("gives the same Sound for two lookups of one Handle", () => {
    const handle = CreateSound(file, false, false, false, 10, 10, "");
    const sound = Sound.fromHandle(handle);
    expect(sound?.handle).toBe(handle);
    expect(Sound.fromHandle(handle)).toBe(sound);
  });
});
