// Rule 7 of #16's table (pitfall D4), as clarified by spec #50: the
// constructs typescript-to-lua lowers to Lua's `pairs`, whose order differs
// between clients. `Map` and `Set` keep insertion order in the runtime
// library and are not reported. Syntactic match first, then the checker
// through classify/iteration.ts.
import { ESLintUtils } from "@typescript-eslint/utils";

import {
  iteratesWithPairs,
  luaIterationFunction,
  objectIterationMethod,
} from "../classify/iteration.js";
import { createRule } from "../create-rule.js";
import { defineRuleEntry } from "../rule-entry.js";

export const name = "no-unordered-iteration";

type Options = [];
type MessageIds = "forIn" | "objectIteration" | "luaIteration" | "pairsForOf";

/** The consequence and the replacement, shared by every message. */
const consequence =
  "compiles to Lua's `pairs`, whose order differs between clients: a loop whose effects depend on the order desyncs the game. Use a SyncedMap or SyncedSet for a keyed collection, or `for...of` over an array.";

const rule = createRule<Options, MessageIds>({
  name,
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow iteration that compiles to Lua's `pairs` (`for...in`, `Object.keys/values/entries`, `pairs`, `next`), whose order differs between clients",
    },
    messages: {
      forIn: `\`for...in\` ${consequence}`,
      objectIteration: `\`Object.{{method}}\` ${consequence}`,
      luaIteration: `\`{{name}}\` iterates with Lua's \`pairs\` order, which differs between clients: a loop whose effects depend on the order desyncs the game. Use a SyncedMap or SyncedSet for a keyed collection, or \`for...of\` over an array.`,
      pairsForOf: `\`for...of\` over a {{type}} ${consequence}`,
    },
    schema: [],
    defaultOptions: [],
  },
  create(context) {
    // Asked first, so a configuration without type information fails at the
    // first file with typescript-eslint's own error.
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();
    return {
      ForInStatement(node) {
        context.report({ node, messageId: "forIn" });
      },
      ForOfStatement(node) {
        if (iteratesWithPairs(services, node)) {
          context.report({
            node,
            messageId: "pairsForOf",
            data: {
              type: checker.typeToString(
                services.getTypeAtLocation(node.right),
              ),
            },
          });
        }
      },
      CallExpression(node) {
        const method = objectIterationMethod(services, node);
        if (method !== undefined) {
          context.report({
            node,
            messageId: "objectIteration",
            data: { method },
          });
          return;
        }
        const lua = luaIterationFunction(services, node);
        if (lua !== undefined) {
          context.report({
            node,
            messageId: "luaIteration",
            data: { name: lua },
          });
        }
      },
    };
  },
});

export default defineRuleEntry({
  name,
  severity: "warn",
  create: () => rule,
});
