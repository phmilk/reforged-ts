// A frame as each client sees it. What a player typed, where they dragged a
// slider, whether a panel shows and how large it is are that client's own:
// they feed its visuals, and reach game state only once sent to every
// client, for example with a SyncRequest.
import { Frame, Init, MapPlayer, Timer } from "reforged-ts";

// #region input
/**
 * Echoes an edit box and a slider onto a label every quarter second: each
 * client shows its own player's input, and nothing else reads it.
 */
export function echoInput(box: Frame, slider: Frame, label: Frame): Timer {
  slider.setMinMaxValue(0, 100).setValue(50);
  return Timer.every(0.25, () => {
    label.text = `${box.text}: ${slider.value.toFixed(0)} of 100`;
  });
}
// #endregion input

// #region toggle
/**
 * Shows or hides `panel` for `player` alone, as a menu button does: the
 * state is read and changed on that player's client only, inside runLocal.
 * The button is drawn faded while it takes no input.
 */
export function togglePanel(player: MapPlayer, panel: Frame, button: Frame) {
  MapPlayer.runLocal(player, () => {
    panel.visible = !panel.visible;
    if (panel.visible && panel.alpha < 255) {
      panel.alpha = 255;
    }
    button.alpha = button.enabled ? 255 : 128;
  });
}
// #endregion toggle

// #region size
/**
 * Adds a line to a text area and grows it to fit, at most 0.3 high. Each
 * client grows the size it reads: the size is a visual, so it may differ
 * between clients without harm.
 */
export function appendLine(log: Frame, line: string) {
  log.addText(line);
  log.height = Math.min(log.height + 0.012, 0.3);
  if (log.width < 0.25) {
    log.width = 0.25;
  }
}

/** Sizes a tooltip for `lines` lines of text: a width, then a height. */
export function fitTooltip(tooltip: Frame, lines: number) {
  tooltip.setWidth(0.25).setHeight(0.02 + 0.012 * lines);
}
// #endregion size

// #region tree
/**
 * Shows only `keep` among the children of `menu`. The children are read on
 * each client, so call it on every client, outside runLocal: reading a child
 * the library has not seen yet creates its Wrapper.
 */
export function showOnly(menu: Frame, keep: Frame) {
  if (keep.getParent() !== menu) {
    return;
  }
  for (const child of menu.children) {
    child.visible = child === keep;
  }
}

/** Counts the shown children of `menu`, by index. */
export function countShown(menu: Frame): number {
  let shown = 0;
  for (let i = 0; i < menu.childrenCount; i++) {
    if (menu.getChild(i)?.visible === true) {
      shown++;
    }
  }
  return shown;
}
// #endregion tree

Init.onGameStart(() => {
  const gameUi = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0);
  if (gameUi === undefined) {
    return;
  }
  const box = Frame.create("EscMenuEditBoxTemplate", gameUi, 0, 0);
  const slider = Frame.create("EscMenuSliderTemplate", gameUi, 0, 0);
  const label = Frame.createType("InputEcho", gameUi, 0, "TEXT", "");
  echoInput(box, slider, label);
});
