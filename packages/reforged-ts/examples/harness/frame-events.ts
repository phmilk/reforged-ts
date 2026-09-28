// The FrameEvents descriptor through on(): `FrameEvents.of(frame, event)`
// for one event of one Frame. The payload always holds the `frame` and the
// `event`; `value` means something only for the events that carry one (a
// slider's), and `text` is undefined unless the event carries text, as an
// edit box's does. on() returns the Subscription whose destroy() ends the
// handler.
import { Frame, FrameEvents, Init, on } from "reforged-ts";

Init.onGameStart(() => {
  const gameUi = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0);
  if (gameUi === undefined) {
    return;
  }
  const volume = Frame.create("EscMenuSliderTemplate", gameUi, 0, 0);
  const name = Frame.create("EscMenuEditBoxTemplate", gameUi, 0, 0);

  on(FrameEvents.of(volume, FRAMEEVENT_SLIDER_VALUE_CHANGED), ({ value }) => {
    print(`Volume ${value.toFixed(0)}`);
  });
  // The first name entered is kept; the Subscription then ends.
  const naming = on(
    FrameEvents.of(name, FRAMEEVENT_EDITBOX_ENTER),
    ({ frame, text }) => {
      if (text !== undefined && text !== "") {
        print(`Named ${text}`);
        frame.enabled = false;
        naming.destroy();
      }
    },
  );
});
