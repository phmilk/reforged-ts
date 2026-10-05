// Asked for by #367 (pitfall C1): an event response called where its context
// certainly does not hold. An event response (`GetTriggerUnit`,
// `GetEnumUnit`, `GetExpiredTimer`, `Unit.fromEvent()`) answers only inside
// the event or callback it belongs to. At module top level, in the callback
// of an Init stage registered at module top level or in a timer's callback
// opened from a handler, an event response of another context returns
// nothing, and the code goes on with a nil Handle. Only a Timer's expiry
// holds in a timer's callback and in the callback of `Init.onGameStart`
// (blizzard.j runs `MarkGameStarted` from a timer), so `GetExpiredTimer`
// answers there. In a trigger's handler, `GetExpiredTimer` does not return
// nothing: it crashes the game (#448, a Crashing case of the Nullability
// sweep on 3.0.0.24268, measured with the trigger fired from a timer's
// callback, since the handler runs in a new thread). The rule reports it
// written directly in a handler given to `on`, `Trigger#addAction` or
// `TriggerAddAction`; the other event responses there return nothing and
// are not reported. The rule reports only those places: the context of an
// event holds through every synchronous call from its handler, so a helper,
// a method or any other callback is never reported.
import { ESLintUtils } from "@typescript-eslint/utils";
import type * as ts from "typescript";

import { type EventPlace, eventPlaceOf } from "../classify/event-context.js";
import {
  type EventResponseCandidate,
  classifyEventResponse,
  eventResponseMemberNames,
  mayReadEventResponse,
} from "../classify/event-response.js";
import type { FunctionNode } from "../classify/function.js";
import { createRule } from "../create-rule.js";
import type { EventContextKind, EventResponse } from "../data/index.js";
import { defineRuleEntry } from "../rule-entry.js";

export const name = "no-event-response-outside-event";

type Options = [];
type MessageIds =
  "atTopLevel" | "inInitStage" | "inTimerCallback" | "inTriggerHandler";

/** The context of each kind, as the messages name it. */
const contextNames: Readonly<Record<EventContextKind, string>> = {
  trigger: "the context of a trigger's event",
  timer: "the context of a Timer's expiry",
  enum: "the context of an enumeration callback",
  filter: "the context of a filter function",
};

const messageIds: Readonly<Record<EventPlace["kind"], MessageIds>> = {
  topLevel: "atTopLevel",
  initStage: "inInitStage",
  timerCallback: "inTimerCallback",
  triggerHandler: "inTriggerHandler",
};

/**
 * The event responses reported in a trigger's handler: the Crashing cases
 * of the Nullability sweep there. `GetExpiredTimer` crashed the game in a
 * trigger's action on 3.0.0.24268. The other responses there return
 * nothing, which is out of the rule's scope (#373).
 */
const crashingInTriggerHandler: ReadonlySet<string> = new Set([
  "GetExpiredTimer",
]);

/** The replacement each context kind advises. */
const advice: Readonly<Record<EventContextKind, string>> = {
  trigger:
    "read it in the event's handler and capture the value (`const unit = Unit.fromEvent()` before the timer starts), or take it from the `on()` payload",
  timer: "call it inside the timer's callback",
  enum: "call it inside the enumeration callback (`ForGroup`, `ForForce`, `EnumItemsInRect`, `EnumDestructablesInRect`)",
  filter: "call it inside the filter function",
};

export function createNoEventResponseOutsideEvent(
  eventResponses: readonly EventResponse[],
) {
  const responses = new Map(eventResponses.map((entry) => [entry.name, entry]));
  // The member names of the pre-match, built on the first file of each
  // program.
  const memberNamesByProgram = new WeakMap<ts.Program, ReadonlySet<string>>();
  const memberNamesOf = (program: ts.Program): ReadonlySet<string> => {
    let names = memberNamesByProgram.get(program);
    if (names === undefined) {
      names = eventResponseMemberNames(program, responses);
      memberNamesByProgram.set(program, names);
    }
    return names;
  };
  return createRule<Options, MessageIds>({
    name,
    meta: {
      type: "problem",
      docs: {
        description:
          "Disallow an event response where its context certainly does not hold: module top level, a top-level Init stage callback, a timer's callback; and GetExpiredTimer in a trigger's handler, where it crashes the game",
      },
      messages: {
        atTopLevel:
          "{{name}} reads {{context}} ({{event}}), and no event or callback runs at module top level: it returns nothing there. Instead, {{advice}}.",
        inInitStage:
          "{{name}} reads {{context}} ({{event}}), and {{callee}}, registered at module top level, runs its callback from the map's initialization, where that context does not hold: it returns nothing there. Instead, {{advice}}.",
        inTimerCallback:
          "{{name}} reads {{context}} ({{event}}), and the callback of {{callee}} runs later, in its own thread, where only a Timer's expiry holds: it returns nothing there. Instead, {{advice}}.",
        inTriggerHandler:
          "{{name}} crashes the game in a trigger's handler: the handler given to {{callee}} runs in a new thread, where no Timer has expired, even when the trigger fires from a timer's callback. Instead, use the timer's own Timer, which `Timer.start` passes its handler, and keep it where the trigger's handler can read it.",
      },
      schema: [],
      defaultOptions: [],
    },
    create(context) {
      // Asked first, so a configuration without type information fails at
      // the first file with typescript-eslint's own error.
      const services = ESLintUtils.getParserServices(context);
      const memberNames = memberNamesOf(services.program);
      const places = new Map<FunctionNode, EventPlace | undefined>();

      function check(node: EventResponseCandidate): void {
        if (!mayReadEventResponse(node, responses, memberNames)) {
          return;
        }
        const place = eventPlaceOf(services, node, places);
        if (place === undefined) {
          return;
        }
        const read = classifyEventResponse(services, node, responses);
        if (read === undefined) {
          return;
        }
        const { response } = read;
        if (
          place.kind === "triggerHandler"
            ? !crashingInTriggerHandler.has(response.name)
            : place.timerExpiry && response.context === "timer"
        ) {
          return;
        }
        context.report({
          node,
          messageId: messageIds[place.kind],
          data: {
            name:
              read.name === response.name
                ? read.name
                : `${read.name} (${response.name})`,
            context: contextNames[response.context],
            event: response.event,
            callee: place.kind === "topLevel" ? "" : place.callee,
            advice: advice[response.context],
          },
        });
      }

      return {
        CallExpression: check,
        MemberExpression: check,
      };
    },
  });
}

export default defineRuleEntry({
  name,
  severity: "warn",
  create: (data) => createNoEventResponseOutsideEvent(data.eventResponses),
});
