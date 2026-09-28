/** @noSelfInFile */

import { Frame } from "../handles/frame";
import type { Trigger } from "../handles/trigger";
import { required } from "./descriptor";
import { eventRows } from "./rows";

/**
 * The payload of `FrameEvents.of`: the Frame and the event are always set,
 * the text only for the events that carry one.
 */
export interface FramePayload {
  /** The Frame the event happened on. */
  frame: Frame;
  /** The frame event type that happened. */
  event: frameeventtype;
  /**
   * The Frame's value, for the events that carry one (a slider's);
   * meaningless for the others.
   */
  value: number;
  /** The Frame's text, or undefined when the event carries none. */
  text: string | undefined;
}

/**
 * The frame Event descriptors: `FrameEvents.of(frame, frameEventType)` for
 * one event of one Frame. The payload is a {@link FramePayload}.
 */
export const FrameEvents = eventRows("FrameEvents", {
  /**
   * `frameEventType` happens on `frame`; `text` is undefined when the event
   * carries none.
   * @native BlzTriggerRegisterFrameEvent
   */
  of: {
    /** Registers `frameEventType` of `frame` on the Trigger. */
    register: (
      trigger: Trigger,
      frame: Frame,
      frameEventType: frameeventtype,
    ) => {
      trigger.registerFrameEvent(frame, frameEventType);
    },
    /** Reads the Frame, the event type, the value and the text. */
    read: (event): FramePayload => ({
      frame: required(Frame.fromEvent(), "frame", event),
      event: required(BlzGetTriggerFrameEvent(), "event", event),
      value: BlzGetTriggerFrameValue(),
      text: BlzGetTriggerFrameText(),
    }),
  },
});
