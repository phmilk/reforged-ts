/** @noSelfInFile */

// FrameEvents through on(): the suites of support/events.ts, iterating the
// namespace's members, which fire the Subscription's Trigger with a stubbed
// context and observe the call log and the Frame, event, value and text the
// handler received.

import { Frame, FrameEvents } from "../../src/index";
import { defined } from "../support/defined";
import { describeNamespace } from "../support/events";
import { handleRef } from "../support/handle-ref";

const frame = Frame.create(
  "EventsFrame",
  defined(Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0), "the game UI frame"),
  0,
  0,
);

describeNamespace("FrameEvents", FrameEvents, {
  of: [
    {
      args: [frame, FRAMEEVENT_EDITBOX_TEXT_CHANGED],
      registers: (trigger) => [
        `BlzTriggerRegisterFrameEvent(${trigger}, ${handleRef("framehandle", frame.handle)}, FRAMEEVENT_EDITBOX_TEXT_CHANGED)`,
      ],
      context: {
        BlzGetTriggerFrame: frame.handle,
        BlzGetTriggerFrameEvent: FRAMEEVENT_EDITBOX_TEXT_CHANGED,
        BlzGetTriggerFrameValue: 0.5,
        BlzGetTriggerFrameText: "typed",
      },
      payload: {
        frame,
        event: FRAMEEVENT_EDITBOX_TEXT_CHANGED,
        value: 0.5,
        text: "typed",
      },
      required: [
        ["frame", "BlzGetTriggerFrame"],
        ["event", "BlzGetTriggerFrameEvent"],
      ],
      optional: [["text", "BlzGetTriggerFrameText"]],
    },
  ],
});
