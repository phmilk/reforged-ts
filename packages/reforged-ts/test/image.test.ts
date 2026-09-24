/** @noSelfInFile */

// Image on the Handle base: `create` throws naming the image file,
// `fromHandle` returns undefined for nothing.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Image, ImageType } from "../src/index";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

const file = "ReplaceableTextures/Selection/SpellAreaOfEffect.blp";

describe("Image.create", () => {
  it("wraps the handle CreateImage returns, and a lookup finds it", () => {
    const image = Image.create(
      file,
      128,
      128,
      0,
      16,
      32,
      0,
      64,
      64,
      0,
      ImageType.Indicator,
    );
    expect(stubCalls()).toContainCall(
      `CreateImage("${file}", 128, 128, 0, 16, 32, 0, 64, 64, 0, 2)`,
    );
    expect(Image.fromHandle(image.handle)).toBe(image);
  });

  it("throws naming the file when CreateImage returns nil", () => {
    const message = withNative(
      "CreateImage",
      () => undefined,
      () =>
        raisedIn(() => {
          Image.create(file, 64, 64, 0, 0, 0, 0, 0, 0, 0, ImageType.Selection);
        }),
    );
    expect(message).toEqual(`reforged-ts: failed to create Image (${file})`);
  });
});

describe("Image.fromHandle", () => {
  it("is undefined for an undefined Handle", () => {
    expect(Image.fromHandle(undefined)).toBeUndefined();
  });

  it("gives the same Image for two lookups of one Handle", () => {
    const handle = CreateImage(file, 64, 64, 0, 0, 0, 0, 0, 0, 0, 1);
    const image = Image.fromHandle(handle);
    expect(image?.handle).toBe(handle);
    expect(Image.fromHandle(handle)).toBe(image);
  });
});
