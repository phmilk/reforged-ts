// Rule 4 of #16's table (pitfalls D8, L1): an expression statement that
// discards a creation or a `Filter`/`Condition` boolexpr. Nothing can destroy
// the dropped object, so it leaks for the rest of the game. `Timer.after` and
// the other statics not named `create*` are not creations.
import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

import {
  classifyCreation,
  filterOrConditionNatives,
  mayBeCreation,
  resolveFilterOrCondition,
} from "../classify/creation.js";
import { calleeName } from "../classify/native.js";
import { createRule } from "../create-rule.js";
import type { CreationNative } from "../data/index.js";
import { defineRuleEntry } from "../rule-entry.js";

export const name = "no-unused-handle-result";

type MessageIds = "unusedHandle";

/** The call a statement evaluates, through `!` and type assertions: `CreateTimer()!;`. */
function discardedCall(
  expression: TSESTree.Expression,
): TSESTree.CallExpression | undefined {
  let current = expression;
  while (
    current.type === AST_NODE_TYPES.TSNonNullExpression ||
    current.type === AST_NODE_TYPES.TSAsExpression ||
    current.type === AST_NODE_TYPES.TSSatisfiesExpression
  ) {
    current = current.expression;
  }
  return current.type === AST_NODE_TYPES.CallExpression ? current : undefined;
}

export function createNoUnusedHandleResult(
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
          "Disallow discarding a created Handle or a Filter/Condition boolexpr",
      },
      messages: {
        unusedHandle:
          "{{callee}} returns a {{type}} that this statement discards: nothing can destroy it, so it leaks. Keep the reference, or destroy it.",
      },
      schema: [],
      defaultOptions: [],
    },
    create(context) {
      const services = ESLintUtils.getParserServices(context);
      return {
        ExpressionStatement(node) {
          const call = discardedCall(node.expression);
          if (call === undefined) {
            return;
          }
          const callee = calleeName(call);
          const discarded =
            callee !== undefined && filterOrConditionNatives.has(callee)
              ? resolveFilterOrCondition(services, call)
              : mayBeCreation(call, names)
                ? classifyCreation(services, call, names)
                : undefined;
          if (discarded === undefined) {
            return;
          }
          context.report({
            node,
            messageId: "unusedHandle",
            data: { callee: discarded.callee, type: discarded.type },
          });
        },
      };
    },
  });
}

export default defineRuleEntry({
  name,
  severity: "error",
  create: (data) => createNoUnusedHandleResult(data.creationNatives),
});
