// A felled tree, tilted and in the colour of the player who cut it: the
// options name the Native, here BlzCreateDeadDestructablePitchRollWithColor.
import { Destructable, Init } from "reforged-ts";

Init.onTriggers(() => {
  Destructable.create({
    typeId: FourCC("LTlt"),
    x: 512,
    y: -256,
    dead: true,
    pitch: 30,
    color: PLAYER_COLOR_RED,
  });
});
