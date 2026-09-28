/** @noSelfInFile */

import { Handle } from "./handle";

/**
 * The layers an image is drawn in, which decide which images cover others;
 * the game takes them as integers from 1 to 4.
 */
export enum ImageType {
  /**
   * The top layer, over every other type.
   */
  Selection = 1,
  /**
   * Over Ubersplat; under Selection and OcclusionMask.
   */
  Indicator = 2,
  /**
   * Over Ubersplat and Indicator; under Selection.
   */
  OcclusionMask = 3,
  /**
   * The bottom layer, under every other type. The time of day and the fog of
   * war tint the images of this layer too.
   */
  Ubersplat = 4,
}

/**
 * An image: a texture drawn flat on the ground of the map, such as an
 * area-of-effect marker.
 * @remarks
 * - `setRender(true)` makes the game draw it; `show` hides and shows it
 *   after that.
 * - Its position is the bottom-left corner of the texture, not its centre.
 * @example An area-of-effect marker around a point
 * {@includeCode ../../examples/game/image-create.ts}
 * @native image
 */
export class Image extends Handle<image> {
  /**
   * Creates an image of a texture at the given point.
   * @remarks
   * - Image ids start at 0 and go up by one with each image created.
   * - Within one layer, images are drawn in the order they were created: a
   *   newer image covers an older one.
   * @param file - The texture's path. Its border should be fully
   * transparent. An invalid path makes `CreateImage` return the invalid
   * image, id -1.
   * @param sizeX - The image's extent along x, in world units.
   * @param sizeY - The image's extent along y, in world units.
   * @param sizeZ - The image's extent along z, in world units.
   * @param posX - The x-coordinate of the image's bottom-left corner.
   * @param posY - The y-coordinate of the image's bottom-left corner.
   * @param posZ - The z-coordinate of the image.
   * @param originX - How far the bottom-left corner moves from `posX`,
   * towards negative x.
   * @param originY - How far the bottom-left corner moves from `posY`,
   * towards negative y.
   * @param originZ - How far the bottom-left corner moves from `posZ`,
   * towards negative z.
   * @param imageType - The layer the image is drawn in.
   * @returns The new image.
   * @throws When the game returns no handle:
   * `reforged-ts: failed to create Image (<file>)`, at the calling line. In
   * Dev mode, also when called before the globals Init stage or inside
   * `MapPlayer.runLocal`.
   * @native CreateImage
   */
  public static create(
    file: string,
    sizeX: number,
    sizeY: number,
    sizeZ: number,
    posX: number,
    posY: number,
    posZ: number,
    originX: number,
    originY: number,
    originZ: number,
    imageType: ImageType,
  ): Image {
    return this.expect(
      CreateImage(
        file,
        sizeX,
        sizeY,
        sizeZ,
        posX,
        posY,
        posZ,
        originX,
        originY,
        originZ,
        imageType,
      ),
      file,
    );
  }

  /**
   * Destroys the image; images have no reference count, so the game can
   * reuse its handle id at once.
   * @remarks
   * In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
   * a second `destroy()` included, raises
   * `reforged-ts: used after destroy: <Class>#<id>`, and
   * `Reforged.debug.report()` counts it destroyed.
   * @native DestroyImage
   * @bug Given an invalid image, such as `null` or one from before any image
   * was created, it can crash the game.
   */
  public destroy() {
    DestroyImage(this.handle);
    this.release();
  }

  /**
   * Sets whether the image is drawn above water.
   * @remarks
   * Only images of the Selection layer appear to show above water.
   * @param flag - `true` to draw the image over the water.
   * @param useWaterAlpha - Whether the image takes the water's transparency.
   * @native SetImageAboveWater
   */
  public setAboveWater(flag: boolean, useWaterAlpha: boolean) {
    SetImageAboveWater(this.handle, flag, useWaterAlpha);
  }

  /**
   * Tints the image and sets its transparency.
   * @param red - The red channel, from 0 to 255.
   * @param green - The green channel, from 0 to 255.
   * @param blue - The blue channel, from 0 to 255.
   * @param alpha - The opacity, from 0 (invisible) to 255 (opaque).
   * @native SetImageColor
   */
  public setColor(red: number, green: number, blue: number, alpha: number) {
    SetImageColor(this.handle, red, green, blue, alpha);
  }

  /**
   * Sets whether the image is drawn at a fixed height instead of on the
   * ground.
   * @remarks
   * No other function changes an image's z-offset.
   * @param flag - `true` to draw the image at `height`.
   * @param height - The height to draw the image at, in world units.
   * @native SetImageConstantHeight
   */
  public setConstantHeight(flag: boolean, height: number) {
    SetImageConstantHeight(this.handle, flag, height);
  }

  /**
   * Moves the image so that its bottom-left corner is at the point, less the
   * `originX`, `originY` and `originZ` offsets it was created with.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @param z - The z-coordinate; the height changes through
   * `setConstantHeight` only.
   * @native SetImagePosition
   */
  public setPosition(x: number, y: number, z: number) {
    SetImagePosition(this.handle, x, y, z);
  }

  /**
   * Enable or disable the rendering of the image.
   * @param flag - render if true, don't render if false
   * @native SetImageRenderAlways
   */
  public setRender(flag: boolean) {
    SetImageRenderAlways(this.handle, flag);
  }

  /**
   * Moves the image to another layer.
   * @param imageType - The layer, which decides the images it covers and the
   * images that cover it.
   * @native SetImageType
   */
  public setType(imageType: ImageType) {
    SetImageType(this.handle, imageType);
  }

  /**
   * Shows or hides the image.
   * @remarks It appears to do the same as `setRender`.
   * @param flag - `true` to show the image, `false` to hide it.
   * @native ShowImage
   */
  public show(flag: boolean) {
    ShowImage(this.handle, flag);
  }
}
