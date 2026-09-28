// A clickable button in the center of the screen: a GLUEBUTTON for the
// click, with a BACKDROP over it for the image.
import { Frame, Init } from "reforged-ts";

Init.onGameStart(() => {
  const gameUi = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0);
  if (gameUi === undefined) {
    return;
  }
  const button = Frame.createType("FaceButton", gameUi, 0, "GLUEBUTTON", "");
  const icon = Frame.createType("FaceButtonIcon", button, 0, "BACKDROP", "");
  // The icon takes the button's size and position.
  icon.setAllPoints(button);
  icon.setTexture(
    "ReplaceableTextures\\CommandButtons\\BTNSelectHeroOn",
    0,
    true,
  );
  button.setAbsPoint(FRAMEPOINT_CENTER, 0.4, 0.3);
  button.setSize(0.05, 0.05);
});
