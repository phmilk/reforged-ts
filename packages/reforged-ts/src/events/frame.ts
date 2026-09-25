/** @noSelfInFile */

import { Frame } from "../handles/frame";
import type { EventDescriptor } from "./descriptor";
import { required } from "./descriptor";

/**
 * The frame Event descriptors: `FrameEvents.of(frame, frameEventType)` for
 * one event of one Frame.
 */
export const FrameEvents = {
  /**
   * `frameEventType` happens on `frame`; `text` is undefined when the event
   * carries none.
   */
  of: (
    frame: Frame,
    frameEventType: frameeventtype,
  ): EventDescriptor<{
    frame: Frame;
    event: frameeventtype;
    value: number;
    text: string | undefined;
  }> => ({
    register: (trigger) => {
      trigger.registerFrameEvent(frame, frameEventType);
    },
    read: () => ({
      frame: required(Frame.fromEvent(), "frame", "FrameEvents.of"),
      event: required(BlzGetTriggerFrameEvent(), "event", "FrameEvents.of"),
      value: BlzGetTriggerFrameValue(),
      text: BlzGetTriggerFrameText(),
    }),
  }),
};
