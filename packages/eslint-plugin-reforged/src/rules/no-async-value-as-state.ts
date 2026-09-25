// Rule 9 of #16's table (pitfalls D3, D6): a value that differs between
// clients (an `@async` Native or library member, an `@async` getter, the
// local clock of `os`) that flows into game state: an argument of a call
// that is neither a text sink nor a visual allowlist entry, a module-level or
// exported variable, a table key. Each client then computes different state
// and the game desyncs. The sync System shares a local value first.
//
// Order: a syntactic pre-match of the source (a plain call by the
// async-natives.json list reforged-types publishes, a member call, a member
// read), then the walk to a state sink (state-sink.ts), then the checker for
// the source's tag, only for a node that reaches a sink.
import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";

import { createAllowlist } from "../classify/allowlist.js";
import {
  type AsyncCandidate,
  classifyAsyncSource,
  mayBeAsyncSource,
} from "../classify/async-source.js";
import {
  reachedStateSink,
  type StateSinkKind,
} from "../classify/state-sink.js";
import { createRule } from "../create-rule.js";
import type { LocalSafeEntry } from "../data/index.js";
import { defineRuleEntry } from "../rule-entry.js";

export const name = "no-async-value-as-state";

type Options = [];
type MessageIds = "asyncArgument" | "asyncVariable" | "asyncKey";

const consequence =
  "each client computes different game state from it and the game desyncs. Share the value through the sync System (`SyncRequest` of reforged-ts) first, or use it only in a text or visual call.";

const messageIdOf: Readonly<Record<StateSinkKind, MessageIds>> = {
  argument: "asyncArgument",
  variable: "asyncVariable",
  key: "asyncKey",
};

export function createNoAsyncValueAsState(
  asyncNatives: readonly string[],
  localSafe: readonly LocalSafeEntry[],
) {
  return createRule<Options, MessageIds>({
    name,
    meta: {
      type: "problem",
      docs: {
        description:
          "Disallow a value that differs between clients (@async, os.clock) in game state",
      },
      messages: {
        asyncArgument: `{{source}} differs between clients and is passed to {{sink}}: ${consequence}`,
        asyncVariable: `{{source}} differs between clients and is stored in the module-level variable {{sink}}: ${consequence}`,
        asyncKey: `{{source}} differs between clients and is used as a key of {{sink}}: ${consequence}`,
      },
      schema: [],
      defaultOptions: [],
    },
    create(context) {
      // Asked first, so a configuration without type information fails at
      // the first file with typescript-eslint's own error.
      const services = ESLintUtils.getParserServices(context);
      const natives = new Set(asyncNatives);
      const allowlist = createAllowlist(localSafe);

      const sourceOf = (node: AsyncCandidate) =>
        mayBeAsyncSource(node, natives)
          ? classifyAsyncSource(services, node)
          : undefined;
      // A source passed to another source (`os.difftime(os.time(), t)`) is
      // not state: the outer call is checked itself.
      const isSourceCall = (call: TSESTree.CallExpression) =>
        sourceOf(call) !== undefined;

      function check(node: AsyncCandidate): void {
        if (!mayBeAsyncSource(node, natives)) {
          return;
        }
        const sink = reachedStateSink(context, allowlist, node, isSourceCall);
        if (sink === undefined) {
          return;
        }
        const source = classifyAsyncSource(services, node);
        if (source === undefined) {
          return;
        }
        context.report({
          node,
          messageId: messageIdOf[sink.kind],
          data: { source: source.name, sink: sink.name },
        });
      }

      return {
        CallExpression: check,
        MemberExpression(node: TSESTree.MemberExpression) {
          check(node);
        },
      };
    },
  });
}

export default defineRuleEntry({
  name,
  severity: "warn",
  requires: ["reforged-types"],
  create: (data) =>
    createNoAsyncValueAsState(data.asyncNatives, data.localSafe),
});
