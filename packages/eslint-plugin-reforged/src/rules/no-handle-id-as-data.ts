// Rule 8 of #16's table (pitfall D5): a Handle's engine id used as data. In a
// Lua map the id of the same object can differ between clients, so a table
// key, a comparison or stored state built on it desyncs. Displaying the id is
// fine: a value that reaches a text sink (text-sink.ts) is not reported.
import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { ESLintUtils } from "@typescript-eslint/utils";

import { createAllowlist } from "../classify/allowlist.js";
import { isGetHandleIdCall, isHandleIdRead } from "../classify/handle-id.js";
import { reachesTextSink } from "../classify/text-sink.js";
import { wrapperClassOf } from "../classify/wrapper.js";
import { createRule } from "../create-rule.js";
import type { LocalSafeEntry } from "../data/index.js";
import { defineRuleEntry } from "../rule-entry.js";

export const name = "no-handle-id-as-data";

type MessageIds = "handleIdAsData";

export function createNoHandleIdAsData(localSafe: readonly LocalSafeEntry[]) {
  return createRule<[], MessageIds>({
    name,
    meta: {
      type: "problem",
      docs: {
        description:
          "Disallow using a Handle id (GetHandleId, the id accessor) as data",
      },
      messages: {
        handleIdAsData:
          "{{source}} used as data: in a Lua map the id of the same object can differ between clients, so a key, a comparison or state built on it desyncs. Key by the object itself.",
      },
      schema: [],
      defaultOptions: [],
    },
    create(context) {
      const services = ESLintUtils.getParserServices(context);
      const allowlist = createAllowlist(localSafe);

      function check(node: TSESTree.Node, source: string): void {
        if (!reachesTextSink(context, allowlist, node)) {
          context.report({
            node,
            messageId: "handleIdAsData",
            data: { source },
          });
        }
      }

      return {
        CallExpression(node) {
          if (isGetHandleIdCall(services, node)) {
            check(node, "GetHandleId");
          }
        },
        MemberExpression(node) {
          if (
            node.parent.type === AST_NODE_TYPES.AssignmentExpression &&
            node.parent.left === node
          ) {
            return;
          }
          if (isHandleIdRead(services, node)) {
            // `unit?.id` is a ChainExpression: the walk starts above it.
            const value =
              node.parent.type === AST_NODE_TYPES.ChainExpression
                ? node.parent
                : node;
            const wrapper = wrapperClassOf(
              services.program.getTypeChecker(),
              services.getTypeAtLocation(node.object),
            );
            check(value, `${wrapper ?? "Handle"}#id`);
          }
        },
      };
    },
  });
}

export default defineRuleEntry({
  name,
  severity: "warn",
  create: (data) => createNoHandleIdAsData(data.localSafe),
});
