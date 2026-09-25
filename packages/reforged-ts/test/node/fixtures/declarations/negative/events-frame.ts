// The frame payload's text may be undefined, and FrameEvents.of takes the
// Frame Wrapper.
import { Frame, FrameEvents, on } from "reforged-ts";

declare const frame: Frame;
declare const rawFrame: framehandle;

export function subscribe(): void {
  on(FrameEvents.of(frame, FRAMEEVENT_CONTROL_CLICK), ({ text }) => {
    const typed: string = text; // error TS2322
    print(typed);
  });
  on(FrameEvents.of(rawFrame, FRAMEEVENT_CONTROL_CLICK), () => undefined); // error TS2345
}
