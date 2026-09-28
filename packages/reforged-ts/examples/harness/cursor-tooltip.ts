// A tooltip that follows the mouse and names the unit under it. The cursor,
// the unit it points at and the screen's size in pixels are each client's
// own, so every client moves its own tooltip and nothing here reaches game
// state: a click that must change the game goes through an event, such as a
// selection or an order, which every client receives.
import { Frame, Init, Input, Timer, Unit } from "reforged-ts";

Init.onGameStart(() => {
  const gameUi = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0);
  if (gameUi === undefined) {
    return;
  }
  const tooltip = Frame.createType("CursorTooltip", gameUi, 0, "TEXT", "");

  Timer.every(0.03, () => {
    const unit = Unit.fromMouseFocus();
    tooltip.visible = unit !== undefined;
    if (unit === undefined) {
      return;
    }
    tooltip.text = Input.isMouseButtonPressed(MOUSE_BUTTON_TYPE_LEFT)
      ? `|cffffcc00${unit.name}|r`
      : unit.name;
    // The cursor comes in pixels and the anchor goes in frame units. Past
    // the middle of the screen, 0.4 in frame units, the tooltip flips to the
    // cursor's left side.
    const rightHalf = Input.mouseScreenX > Frame.frameToPixelX(0.4);
    tooltip.clearPoints();
    tooltip.setAbsPoint(
      rightHalf ? FRAMEPOINT_BOTTOMRIGHT : FRAMEPOINT_BOTTOMLEFT,
      Frame.pixelToFrameX(Input.mouseScreenX),
      Frame.pixelToFrameY(Input.mouseScreenY),
    );
  });
});
