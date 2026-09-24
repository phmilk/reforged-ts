// Frame's lookups are typed Frame | undefined: the game may find no frame.
import { Frame } from "reforged-ts";

declare const frame: Frame;

const named: Frame | undefined = Frame.fromName("MyFrame", 0);
const origin: Frame | undefined = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0);
const triggering: Frame | undefined = Frame.fromEvent();
const parent: Frame | undefined = frame.getParent();
const child: Frame | undefined = frame.getChild(0);

export { child, named, origin, parent, triggering };
