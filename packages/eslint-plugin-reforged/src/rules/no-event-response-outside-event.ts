// Asked for by #367 (pitfall C1): an event response called where its context
// certainly does not hold. An event response (`GetTriggerUnit`,
// `GetEnumUnit`, `GetExpiredTimer`, `Unit.fromEvent()`) answers only inside
// the event or callback it belongs to; at module top level, in the callback
// of an Init stage registered at module top level or in a timer's callback
// opened from a handler it returns nothing, and the code goes on with a nil
// Handle. Only a Timer's expiry holds in a timer's callback and in the
// callback of `Init.onGameStart` (blizzard.j runs `MarkGameStarted` from a
// timer), so `GetExpiredTimer` answers there. The rule reports only those places:
// the context of an event holds through every synchronous call from its
// handler, so a helper, a method or any other callback is never reported.
import { ESLintUtils } from "@typescript-eslint/utils";
import type * as ts from "typescript";

import {
  type ContextFreePlace,
  contextFreePlaceOf,
} from "../classify/event-context.js";
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
type MessageIds = "atTopLevel" | "inInitStage" | "inTimerCallback";

/** The context of each kind, as the messages name it. */
const contextNames: Readonly<Record<EventContextKind, string>> = {
  trigger: "the context of a trigger's event",
  timer: "the context of a Timer's expiry",
  enum: "the context of an enumeration callback",
  filter: "the context of a filter function",
};

const messageIds: Readonly<Record<ContextFreePlace["kind"], MessageIds>> = {
  topLevel: "atTopLevel",
  initStage: "inInitStage",
  timerCallback: "inTimerCallback",
};

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
          "Disallow an event response where its context certainly does not hold: module top level, a top-level Init stage callback, a timer's callback",
      },
      messages: {
        atTopLevel:
          "{{name}} reads {{context}} ({{event}}), and no event or callback runs at module top level: it returns nothing there. Instead, {{advice}}.",
        inInitStage:
          "{{name}} reads {{context}} ({{event}}), and {{callee}}, registered at module top level, runs its callback from the map's initialization, where that context does not hold: it returns nothing there. Instead, {{advice}}.",
        inTimerCallback:
          "{{name}} reads {{context}} ({{event}}), and the callback of {{callee}} runs later, in its own thread, where only a Timer's expiry holds: it returns nothing there. Instead, {{advice}}.",
      },
      schema: [],
      defaultOptions: [],
    },
    create(context) {
      // Asked first, so a configuration without type information fails at
      // the first file with typescript-eslint's own error.
      const services = ESLintUtils.getParserServices(context);
      const memberNames = memberNamesOf(services.program);
      const places = new Map<FunctionNode, ContextFreePlace | undefined>();

      function check(node: EventResponseCandidate): void {
        if (!mayReadEventResponse(node, responses, memberNames)) {
          return;
        }
        const place = contextFreePlaceOf(services, node, places);
        if (place === undefined) {
          return;
        }
        const read = classifyEventResponse(services, node, responses);
        if (read === undefined) {
          return;
        }
        const { response } = read;
        if (place.timerExpiry && response.context === "timer") {
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
