// A lookup's result assigned to a non-optional Frame: Frame | undefined is
// not assignable to Frame.
import { Frame } from "reforged-ts";

const gameUi: Frame = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0); // error TS2322

export { gameUi };
