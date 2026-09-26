// Destructable.create takes one options object: the rawcode and the position
// are enough, and every option the family's Natives take is typed.
import { Destructable, type DestructableOptions } from "reforged-ts";

const tree: Destructable = Destructable.create({
  typeId: FourCC("LTlt"),
  x: 0,
  y: 0,
});

const options: DestructableOptions = {
  typeId: FourCC("LTlt"),
  x: 0,
  y: 0,
  z: 64,
  face: 270,
  scale: 1.5,
  variation: 2,
  pitch: 0.5,
  roll: 0.25,
  skin: FourCC("ATtr"),
  color: PLAYER_COLOR_RED,
  dead: true,
};
const felled: Destructable = Destructable.create(options);

tree.setColor(PLAYER_COLOR_BLUE);
felled.setVertexColor(255, 255, 255, 128);

export { tree, felled };
