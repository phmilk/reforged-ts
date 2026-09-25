// Rule 3 of #16's table (pitfalls C2, S1, D9): a call to a Native on the
// plugin's ban list. Syntactic match on the callee's name first, then the
// checker confirms the callee is the Native of reforged-types and not a
// project function of the same name.
import { ESLintUtils } from "@typescript-eslint/utils";

import { calleeName, resolveNative } from "../classify/native.js";
import { createRule } from "../create-rule.js";
import type { UnsafeNative } from "../data/index.js";
import { defineRuleEntry } from "../rule-entry.js";

export const name = "no-unsafe-natives";

type Options = [{ allow?: string[] }];
type MessageIds = "unsafeNative";

export function createNoUnsafeNatives(banList: readonly UnsafeNative[]) {
  return createRule<Options, MessageIds>({
    name,
    meta: {
      type: "problem",
      docs: {
        description:
          "Disallow the Natives that kill the thread, leak or desync (the plugin's ban list)",
      },
      messages: {
        unsafeNative: "{{name}} {{reason}} {{replacement}}",
      },
      schema: [
        {
          type: "object",
          properties: {
            allow: {
              type: "array",
              items: { type: "string" },
              uniqueItems: true,
              description: "Names of ban-list Natives this project allows.",
            },
          },
          additionalProperties: false,
        },
      ],
      defaultOptions: [{ allow: [] }],
    },
    create(context, [{ allow = [] }]) {
      // Asked first, so a configuration without type information fails at
      // the first file with typescript-eslint's own error.
      const services = ESLintUtils.getParserServices(context);
      const allowed = new Set(allow);
      const banned = new Map(
        banList
          .filter((entry) => !allowed.has(entry.name))
          .map((entry) => [entry.name, entry]),
      );
      if (banned.size === 0) {
        return {};
      }
      return {
        CallExpression(node) {
          const callee = calleeName(node);
          if (callee === undefined || !banned.has(callee)) {
            return;
          }
          const native = resolveNative(services, node);
          const entry = native && banned.get(native.name);
          if (entry === undefined) {
            return;
          }
          context.report({
            node,
            messageId: "unsafeNative",
            data: {
              name: entry.name,
              reason: entry.reason,
              replacement: entry.replacement,
            },
          });
        },
      };
    },
  });
}

export default defineRuleEntry({
  name,
  severity: "error",
  create: (data) => createNoUnsafeNatives(data.unsafeNatives),
});
