// Rule 2 of #16's table (pitfall D7): a creation at module top level. A TSTL
// bundle runs module top-level code in the Lua root, before the engine is
// ready: a Handle created there can desync or crash the map at load. Syntactic
// pre-match on the callee, then the top-level walk, then the checker.
import { ESLintUtils } from "@typescript-eslint/utils";

import { classifyCreation, mayBeCreation } from "../classify/creation.js";
import { isAtModuleTopLevel } from "../classify/top-level.js";
import { createRule } from "../create-rule.js";
import type { CreationNative } from "../data/index.js";
import { defineRuleEntry } from "../rule-entry.js";

export const name = "no-handles-at-module-top-level";

type MessageIds = "handleAtTopLevel";

export function createNoHandlesAtModuleTopLevel(
  creationNatives: readonly CreationNative[],
) {
  const names: ReadonlySet<string> = new Set(
    creationNatives.map((entry) => entry.name),
  );
  return createRule<[], MessageIds>({
    name,
    meta: {
      type: "problem",
      docs: {
        description:
          "Disallow creating a Handle at module top level, which runs in the Lua root",
      },
      messages: {
        handleAtTopLevel:
          "{{callee}} creates a {{type}} at module top level, which runs in the Lua root before the engine is ready and can desync or crash the map at load. Create it in an Init.onGlobals callback (or a later Init stage).",
      },
      schema: [],
      defaultOptions: [],
    },
    create(context) {
      const services = ESLintUtils.getParserServices(context);
      return {
        CallExpression(node) {
          if (!mayBeCreation(node, names) || !isAtModuleTopLevel(node)) {
            return;
          }
          const creation = classifyCreation(services, node, names);
          if (creation === undefined) {
            return;
          }
          context.report({
            node,
            messageId: "handleAtTopLevel",
            data: { callee: creation.callee, type: creation.type },
          });
        },
      };
    },
  });
}

export default defineRuleEntry({
  name,
  severity: "error",
  create: (data) => createNoHandlesAtModuleTopLevel(data.creationNatives),
});
