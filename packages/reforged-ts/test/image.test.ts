/** @noSelfInFile */

// Image on the Handle base: `create` throws naming the image file,
// `fromHandle` returns undefined for nothing. In Dev mode `create` refuses an
// image type that is not an integer from 1 to 4 before it calls
// `CreateImage`: the Crashing case of the Nullability sweep (image type
// 2147483647 crashed the game on 3.0.0.24268; 0 returned the Placeholder
// handle of id -1).

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Image, ImageType } from "../src/index";
import { Reforged } from "../src/reforged/index";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

// Dev mode raises for a Wrapper created before the globals Init stage.
__stub_init_globals();

const file = "ReplaceableTextures/Selection/SpellAreaOfEffect.blp";

/** The image types outside 1 to 4 the Dev mode check refuses. */
const refused = [0, 5, 2147483647, 1.5];

/** How many `CreateImage` calls the call log holds. */
function createImageCalls(): number {
  return stubCalls().filter((line) => line.startsWith("CreateImage(")).length;
}

/**
 * Creates an image of `file` that differs only by its image type, given as
 * the plain number a Map project can pass for an `ImageType`.
 */
function createWithType(imageType: number): Image {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-assignment -- a number outside ImageType is what this test drives
  return Image.create(file, 64, 64, 0, 0, 0, 0, 0, 0, 0, imageType);
}

/** The call log line of `createWithType(imageType)`. */
function createLine(imageType: number): string {
  return `CreateImage("${file}", 64, 64, 0, 0, 0, 0, 0, 0, 0, ${String(imageType)})`;
}

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

describe("Image.create's image type in Dev mode", () => {
  for (const imageType of refused) {
    it(`throws for image type ${String(imageType)} at the calling line, before CreateImage`, () => {
      Reforged.configure({ devMode: true });
      const before = createImageCalls();
      const message = raisedIn(() => {
        createWithType(imageType);
      });
      Reforged.configure({ devMode: false });

      expect(message).toEqual(
        `reforged-ts: Image.create with image type ${String(imageType)}, which is not an integer from 1 to 4 (ImageType): CreateImage crashed the game with image type 2147483647 on 3.0.0.24268, and returned the invalid image (id -1) with 0`,
      );
      expect(createImageCalls()).toEqual(before);
    });
  }

  for (const imageType of [1, 2, 3, 4]) {
    it(`creates the image for image type ${String(imageType)}`, () => {
      Reforged.configure({ devMode: true });
      const image = createWithType(imageType);
      Reforged.configure({ devMode: false });

      expect(stubCalls()).toContainCall(createLine(imageType));
      expect(Image.fromHandle(image.handle)).toBe(image);
    });
  }
});

describe("Image.create's image type with Dev mode off", () => {
  for (const imageType of refused) {
    it(`calls CreateImage with image type ${String(imageType)}`, () => {
      Reforged.configure({ devMode: false });
      const image = createWithType(imageType);

      expect(stubCalls()).toContainCall(createLine(imageType));
      expect(Image.fromHandle(image.handle)).toBe(image);
    });
  }
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
