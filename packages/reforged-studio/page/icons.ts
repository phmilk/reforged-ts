/**
 * The page's icons: the bytes of an icon's file, from the Studio's
 * `GET /api/files?path=` (the map folder's imports first, then the
 * install), decoded in the page with the BLP and DDS readers of
 * `mdx-m3-viewer-th`, the previews' viewer (#481), into a PNG it shows. A
 * path found nowhere, or a file neither reader reads, has no icon: the
 * page shows a placeholder. Each path is fetched and decoded once.
 */
import { BlpImage } from "mdx-m3-viewer-th/dist/cjs/parsers/blp/image.js";
import { DdsImage } from "mdx-m3-viewer-th/dist/cjs/parsers/dds/image.js";
import { api } from "./api.js";

/** The first four bytes of a BLP1 file, `BLP1`. */
const BLP1 = 0x31504c42;
/** The first four bytes of a DDS file, `DDS `. */
const DDS = 0x20534444;

/** The pixels of the first mipmap of an icon's file; undefined for a format neither reader reads. */
function decode(bytes: ArrayBuffer): ImageData | undefined {
  if (bytes.byteLength < 4) return undefined;
  const magic = new DataView(bytes).getUint32(0, true);
  if (magic === BLP1) {
    const image = new BlpImage();
    image.load(bytes);
    return image.getMipmap(0);
  }
  if (magic === DDS) {
    const image = new DdsImage();
    image.load(bytes);
    const { width, height, data } = image.getMipmap(0);
    return new ImageData(new Uint8ClampedArray(data), width, height);
  }
  return undefined;
}

/** An image's pixels as an object URL of a PNG. */
async function toUrl(pixels: ImageData): Promise<string | undefined> {
  const canvas = document.createElement("canvas");
  canvas.width = pixels.width;
  canvas.height = pixels.height;
  canvas.getContext("2d")?.putImageData(pixels, 0, 0);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });
  return blob === null ? undefined : URL.createObjectURL(blob);
}

const icons = new Map<string, Promise<string | undefined>>();

/**
 * The URL of an icon's PNG, decoded once per path; undefined when the
 * path resolves nowhere or its file cannot be read.
 *
 * @param path - The icon's path, as a field holds it.
 */
export function iconUrl(path: string): Promise<string | undefined> {
  const key = path.toLowerCase();
  let url = icons.get(key);
  if (url === undefined) {
    url = api.file(path).then(
      async (bytes) => {
        if (bytes === undefined) return undefined;
        try {
          const pixels = decode(bytes);
          return pixels === undefined ? undefined : await toUrl(pixels);
        } catch {
          return undefined;
        }
      },
      () => undefined,
    );
    icons.set(key, url);
  }
  return url;
}
