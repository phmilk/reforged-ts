// on(FrameEvents.of(frame, event)) hands a payload whose frame and event are
// guaranteed, whose value is a number and whose text may be undefined.
import type { EventDescriptor } from "reforged-ts";
import { Frame, FrameEvents, on } from "reforged-ts";

declare const frame: Frame;

const subscription = on(
  FrameEvents.of(frame, FRAMEEVENT_EDITBOX_TEXT_CHANGED),
  ({ frame, event, value, text }) => {
    const changed: Frame = frame;
    const kind: frameeventtype = event;
    const at: number = value;
    const typed: string | undefined = text;
    changed.setText(typed ?? tostring(at));
    print(kind);
  },
);

const click: EventDescriptor<{
  frame: Frame;
  event: frameeventtype;
  value: number;
  text: string | undefined;
}> = FrameEvents.of(frame, FRAMEEVENT_CONTROL_CLICK);
const eventText: string | undefined = Frame.getEventText();

export { subscription, click, eventText };
