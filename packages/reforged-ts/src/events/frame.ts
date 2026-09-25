/** @noSelfInFile */

import { Frame } from "../handles/frame";
import type { Trigger } from "../handles/trigger";
import { required } from "./descriptor";
import { eventRows } from "./rows";

/** The payload of `FrameEvents.of`. */
interface FramePayload {
  frame: Frame;
  event: frameeventtype;
  value: number;
  text: string | undefined;
}

/**
 * The frame Event descriptors: `FrameEvents.of(frame, frameEventType)` for
 * one event of one Frame.
 */
export const FrameEvents = eventRows("FrameEvents", {
  /**
   * `frameEventType` happens on `frame`; `text` is undefined when the event
   * carries none.
   */
  of: {
    register: (
      trigger: Trigger,
      frame: Frame,
      frameEventType: frameeventtype,
    ) => {
      trigger.registerFrameEvent(frame, frameEventType);
    },
    read: (event): FramePayload => ({
      frame: required(Frame.fromEvent(), "frame", event),
      event: required(BlzGetTriggerFrameEvent(), "event", event),
      value: BlzGetTriggerFrameValue(),
      text: BlzGetTriggerFrameText(),
    }),
  },
});
