// Frame's creation members are typed non-null: a missing FDF throws instead
// of handing back a frame, so no `?.` or `!` follows them.
import { Frame } from "reforged-ts";

declare const owner: Frame;

const button: Frame = Frame.createType(
  "FaceButton",
  owner,
  0,
  "GLUEBUTTON",
  "",
);
const simple: Frame = Frame.createSimple("SimpleFrame", owner, 0);
const frame: Frame = Frame.create("MyFrame", button, 0, 0);
frame.setAllPoints(button).setSize(0.05, 0.05);

export { frame, simple };
