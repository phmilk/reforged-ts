// Rule 1 of #16's table (pitfalls D1, D2): game state changed inside a branch
// that only runs for the local player. Inside a local branch (see
// classify/local-branch.ts) it reports every call to a Native or a Wrapper
// member (accessor assignments included) that the allowlist does not list,
// every creation, `Filter`/`Condition`, `ForGroup`/`ForForce` and the random
// Natives and `Math.random`. Calls to project functions and pure computation
// (the `pure` entries of the allowlist: converters, math and string Natives)
// are not reported; the rule does not follow calls.
import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

import { createAllowlist } from "../classify/allowlist.js";
import {
  classifyCreation,
  filterOrConditionNatives,
  mayBeCreation,
} from "../classify/creation.js";
import { createLocalBranchClassifier } from "../classify/local-branch.js";
import { calleeName, resolveNative } from "../classify/native.js";
import { randomMemberCall, randomNatives } from "../classify/random.js";
import { resolveWrapperMember } from "../classify/wrapper-member.js";
import { createRule } from "../create-rule.js";
import type { PluginData } from "../data/index.js";
import { defineRuleEntry } from "../rule-entry.js";

export const name = "no-game-state-in-local-branch";

type Options = [{ allow?: string[] }];
type MessageIds = "gameState" | "creation" | "callback" | "random";

/** The Natives and Wrapper members that run a callback or build a boolexpr. */
const callbackNames: ReadonlySet<string> = new Set([
  ...filterOrConditionNatives,
  "ForGroup",
  "ForForce",
  "Group#for",
  "Force#for",
]);

/** Whether a call's callee is a name or a non-computed member: the syntactic pre-match. */
function hasNamedCallee(call: TSESTree.CallExpression): boolean {
  const { callee } = call;
  return (
    callee.type === AST_NODE_TYPES.Identifier ||
    (callee.type === AST_NODE_TYPES.MemberExpression &&
      !callee.computed &&
      callee.property.type === AST_NODE_TYPES.Identifier)
  );
}

function createNoGameStateInLocalBranch(data: PluginData) {
  const creationNatives = new Set(
    data.creationNatives.map((entry) => entry.name),
  );
  return createRule<Options, MessageIds>({
    name,
    meta: {
      type: "problem",
      docs: {
        description:
          "Disallow game-state changes, creations and random numbers inside a branch that runs for the local player only",
      },
      messages: {
        gameState:
          "{{callee}} is called inside a local-player branch, which runs on one client only, and it is not on the list of calls that only change what the local player sees or hears. If it changes game state, the other players desync. Game state must change for every player: move the call out of the branch and keep only visuals (frames, camera, sound, vertex colours) inside it.",
        creation:
          "{{callee}} creates a {{type}} inside a local-player branch: the Handle exists on one client only and the other players desync. Game state must change for every player: create it outside the branch, for everyone, and change only how it looks inside it.",
        callback:
          "{{callee}} inside a local-player branch allocates a boolexpr or runs an enumeration on one client only, and the other players desync. Game state must change for every player: move it out of the branch.",
        random:
          "{{callee}} inside a local-player branch draws from the random stream every client shares, so the next random number differs between clients and the game desyncs. Game state, the random stream included, must change for every player: draw the number outside the branch.",
      },
      schema: [
        {
          type: "object",
          properties: {
            allow: {
              type: "array",
              items: { type: "string" },
              uniqueItems: true,
              description:
                "Extra names treated as visual: a Native, `Class#member` or `Class.member`.",
            },
          },
          additionalProperties: false,
        },
      ],
      defaultOptions: [{ allow: [] }],
    },
    create(context, [{ allow = [] }]) {
      const services = ESLintUtils.getParserServices(context);
      const branches = createLocalBranchClassifier(context);
      const allowlist = createAllowlist(data.localSafe, allow);

      function report(
        node: TSESTree.Node,
        messageId: MessageIds,
        callee: string,
        type?: string,
      ): void {
        context.report({
          node,
          messageId,
          data: type === undefined ? { callee } : { callee, type },
        });
      }

      return {
        CallExpression(node) {
          if (!hasNamedCallee(node) || !branches.isInLocalBranch(node)) {
            return;
          }
          if (
            branches.isLocalPlayerCall(node) ||
            branches.isRunLocalCall(node)
          ) {
            return;
          }
          // Listed as visual, text or pure, or allowed by the option.
          if (allowlist.kindOf(services, node) !== undefined) {
            return;
          }
          const creation = mayBeCreation(node, creationNatives)
            ? classifyCreation(services, node, creationNatives)
            : undefined;
          if (creation !== undefined) {
            report(node, "creation", creation.callee, creation.type);
            return;
          }
          const random = randomMemberCall(services, node);
          if (random !== undefined) {
            report(node, "random", random);
            return;
          }
          if (calleeName(node) !== undefined) {
            const native = resolveNative(services, node);
            if (native === undefined) {
              return;
            }
            report(
              node,
              randomNatives.has(native.name)
                ? "random"
                : callbackNames.has(native.name)
                  ? "callback"
                  : "gameState",
              native.name,
            );
            return;
          }
          const member = resolveWrapperMember(services, node);
          if (member !== undefined) {
            report(
              node,
              callbackNames.has(member.name) ? "callback" : "gameState",
              member.name,
            );
          }
        },
        AssignmentExpression(node) {
          if (
            node.left.type !== AST_NODE_TYPES.MemberExpression ||
            node.left.computed ||
            !branches.isInLocalBranch(node) ||
            allowlist.kindOf(services, node) !== undefined
          ) {
            return;
          }
          const member = resolveWrapperMember(services, node);
          if (member !== undefined) {
            report(node, "gameState", member.name);
          }
        },
      };
    },
  });
}

export default defineRuleEntry({
  name,
  severity: "error",
  create: createNoGameStateInLocalBranch,
});
