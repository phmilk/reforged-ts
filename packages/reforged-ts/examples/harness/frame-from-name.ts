// Finding a frame again by the name and create context it was created
// under, where no reference to it is at hand. A name the game does not know
// gives undefined, never a frame.
import { Frame, Init } from "reforged-ts";

Init.onGameStart(() => {
  const gameUi = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0);
  if (gameUi === undefined) {
    return;
  }
  Frame.create("ScorePanel", gameUi, 0, 0);

  const panel = Frame.fromName("ScorePanel", 0);
  if (panel?.getParent() === gameUi) {
    print("Found the score panel under the game UI.");
  }
  if (Frame.fromName("NoSuchPanel", 0) === undefined) {
    print("No frame is named NoSuchPanel.");
  }
});
