// A frame shown to one player only. The frame is created and looked up on
// every client; only the visual change runs inside runLocal.
import { Frame, Init, MapPlayer } from "reforged-ts";

let panel: Frame | undefined;

Init.onGameStart(() => {
  const gameUi = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0);
  if (gameUi !== undefined) {
    panel = Frame.create("ScorePanel", gameUi, 0, 0);
    panel.visible = false;
  }
});

/** Shows the score panel to `player` alone. */
export function showPanel(player: MapPlayer): void {
  const frame = panel;
  if (frame === undefined) {
    return;
  }
  MapPlayer.runLocal(player, () => {
    frame.visible = true;
  });
}
