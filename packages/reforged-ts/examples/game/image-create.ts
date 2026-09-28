// A 256-wide area-of-effect marker centred on a point: the image's position
// is its bottom-left corner, so it is placed half its size away. It is drawn
// once setRender(true) is called.
import { Image, ImageType, Init } from "reforged-ts";

const SIZE = 256;

/** Marks the area around (x, y), tinted red. */
export function markArea(x: number, y: number): Image {
  const marker = Image.create(
    "ReplaceableTextures\\Selection\\SpellAreaOfEffect.blp",
    SIZE,
    SIZE,
    0,
    x - SIZE / 2,
    y - SIZE / 2,
    0,
    0,
    0,
    0,
    ImageType.Indicator,
  );
  marker.setColor(255, 64, 64, 200);
  marker.setRender(true);
  return marker;
}

Init.onGameStart(() => {
  markArea(0, 0);
});
