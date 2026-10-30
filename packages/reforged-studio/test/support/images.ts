/**
 * Synthetic icons, in the two formats the game's icons come in: a DDS of
 * one DXT1 block, as the 3.0 storage holds its icons, and a paletted BLP1,
 * as a map's imports often are. Each is 4 by 4 pixels of one colour; every
 * byte is the tests' own.
 */

/** A 4 by 4 DDS of one DXT1 block, every pixel `rgb565`. */
export function dds(rgb565: number): Uint8Array {
  const bytes = new Uint8Array(128 + 8);
  const view = new DataView(bytes.buffer);
  bytes.set(new TextEncoder().encode("DDS "), 0);
  view.setUint32(4, 124, true); // the header's size
  view.setUint32(8, 0x1 | 0x2 | 0x4 | 0x1000, true); // caps, height, width, pixel format
  view.setUint32(12, 4, true); // height
  view.setUint32(16, 4, true); // width
  view.setUint32(20, 8, true); // the linear size of the one block
  view.setUint32(76, 32, true); // the pixel format's size
  view.setUint32(80, 0x4, true); // DDPF_FOURCC
  bytes.set(new TextEncoder().encode("DXT1"), 84);
  view.setUint32(108, 0x1000, true); // DDSCAPS_TEXTURE
  // The block: colour 0 is the colour, colour 1 black, every index 0.
  view.setUint16(128, rgb565, true);
  return bytes;
}

/** A 4 by 4 paletted BLP1 with no alpha, every pixel `[red, green, blue]`. */
export function blp(rgb: readonly [number, number, number]): Uint8Array {
  const header = 156;
  const palette = 256 * 4;
  const pixels = 16;
  const bytes = new Uint8Array(header + palette + pixels);
  const view = new DataView(bytes.buffer);
  bytes.set(new TextEncoder().encode("BLP1"), 0);
  view.setUint32(4, 1, true); // paletted content
  view.setUint32(8, 0, true); // no alpha bits
  view.setUint32(12, 4, true); // width
  view.setUint32(16, 4, true); // height
  view.setUint32(20, 5, true); // the picture type
  view.setUint32(24, 0, true); // no mipmaps
  view.setUint32(28, header + palette, true); // the first mipmap's offset
  view.setUint32(92, pixels, true); // its size
  // Palette entry 0, in BGRA; every pixel is index 0.
  bytes[header] = rgb[2];
  bytes[header + 1] = rgb[1];
  bytes[header + 2] = rgb[0];
  bytes[header + 3] = 255;
  return bytes;
}

/** The Footman's icon of the synthetic install, pure red. */
export const FOOTMAN_ICON = dds(0xf800);

/** The path the synthetic install holds the Footman's icon at, in its HD layer: the skin file names its `.blp`. */
export const FOOTMAN_ICON_FILE =
  "War3.w3mod:_HD.w3mod:ReplaceableTextures/CommandButtons/BTNFootman.dds";

/** An icon a map imports, pure blue. */
export const IMPORTED_ICON = blp([0, 0, 255]);
