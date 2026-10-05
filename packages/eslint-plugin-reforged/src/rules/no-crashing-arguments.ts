// Spec #373 (ticket #450), pitfall C5 (invalid or wrong-kind frames): a call
// with arguments that crashed the game in a Crashing case of the Nullability
// sweep, such as `BlzCreateFrameByType` (or `Frame.createType`) with type
// SIMPLEMESSAGEFRAME or CONTROL and `inherits: ""`. Data-driven: each entry
// of data/crashing-arguments.json names a callee and the literal arguments,
// by parameter name, that crashed. Syntactic match on the callee's name and
// the literals first, then the checker resolves the callee and its
// parameter names.
import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

import { resolveNamedCallee, syntacticCalleeName } from "../classify/callee.js";
import { createRule } from "../create-rule.js";
import type { ArgumentValue, CrashingArguments } from "../data/index.js";
import { defineRuleEntry } from "../rule-entry.js";

export const name = "no-crashing-arguments";

type MessageIds = "crashingArguments";

/** The value of a literal argument (`"CONTROL"`, `` `` ``, `-1`, `true`), or undefined. */
function literalValue(
  node: TSESTree.CallExpressionArgument,
): ArgumentValue | undefined {
  if (node.type === AST_NODE_TYPES.Literal) {
    const { value } = node;
    return typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
      ? value
      : undefined;
  }
  if (node.type === AST_NODE_TYPES.TemplateLiteral) {
    return node.expressions.length === 0
      ? (node.quasis[0]?.value.cooked ?? undefined)
      : undefined;
  }
  if (
    node.type === AST_NODE_TYPES.UnaryExpression &&
    node.operator === "-" &&
    node.argument.type === AST_NODE_TYPES.Literal &&
    typeof node.argument.value === "number"
  ) {
    return -node.argument.value;
  }
  return undefined;
}

/** The matched arguments as the message names them: `typeName "CONTROL" and inherits ""`. */
function describeArguments(
  entry: CrashingArguments,
  values: readonly ArgumentValue[],
): string {
  const parts = [...entry.arguments.keys()].map(
    (parameter, index) => `${parameter} ${JSON.stringify(values[index])}`,
  );
  const last = parts.pop() ?? "";
  return parts.length === 0 ? last : `${parts.join(", ")} and ${last}`;
}

/**
 * The literal values a call passes for the entry's parameters, in the
 * entry's order, when each is a literal among the listed ones; undefined
 * otherwise (a parameter the callee lacks, a spread before it, a
 * non-literal).
 */
function matchedValues(
  entry: CrashingArguments,
  call: TSESTree.CallExpression,
  parameters: readonly (string | undefined)[],
): ArgumentValue[] | undefined {
  const values: ArgumentValue[] = [];
  for (const [parameter, listed] of entry.arguments) {
    const index = parameters.indexOf(parameter);
    if (
      index === -1 ||
      call.arguments
        .slice(0, index + 1)
        .some((each) => each.type === AST_NODE_TYPES.SpreadElement)
    ) {
      return undefined;
    }
    const argument = call.arguments.at(index);
    const value = argument === undefined ? undefined : literalValue(argument);
    if (value === undefined || !listed.includes(value)) {
      return undefined;
    }
    values.push(value);
  }
  return values;
}

export function createNoCrashingArguments(
  entries: readonly CrashingArguments[],
) {
  return createRule<[], MessageIds>({
    name,
    meta: {
      type: "problem",
      docs: {
        description:
          "Disallow the literal arguments that crashed the game in a Crashing case of the Nullability sweep",
      },
      messages: {
        crashingArguments:
          "{{callee}} with {{arguments}} {{reason}} A Crashing case on {{build}}: {{case}}. {{replacement}}",
      },
      schema: [],
      defaultOptions: [],
    },
    create(context) {
      // Asked first, so a configuration without type information fails at
      // the first file with typescript-eslint's own error.
      const services = ESLintUtils.getParserServices(context);
      // Every callee an entry covers, by its data-file name.
      const byCallee = new Map<string, CrashingArguments[]>();
      for (const entry of entries) {
        for (const callee of [entry.name, ...entry.members]) {
          byCallee.set(callee, [...(byCallee.get(callee) ?? []), entry]);
        }
      }
      // The last segment of every callee name, for the syntactic pre-match.
      const shortNames = new Set(
        [...byCallee.keys()].map((each) => each.split(/[#.]/).pop() ?? each),
      );
      if (shortNames.size === 0) {
        return {};
      }
      return {
        CallExpression(node) {
          const short = syntacticCalleeName(node);
          if (
            short === undefined ||
            !shortNames.has(short) ||
            !node.arguments.some((each) => literalValue(each) !== undefined)
          ) {
            return;
          }
          const callee = resolveNamedCallee(services, node);
          if (callee === undefined) {
            return;
          }
          for (const entry of byCallee.get(callee.name) ?? []) {
            const values = matchedValues(entry, node, callee.parameters);
            if (values === undefined) {
              continue;
            }
            context.report({
              node,
              messageId: "crashingArguments",
              data: {
                callee: callee.name,
                arguments: describeArguments(entry, values),
                case: entry.case,
                build: entry.build,
                reason: entry.reason,
                replacement: entry.replacement,
              },
            });
            return;
          }
        },
      };
    },
  });
}

export default defineRuleEntry({
  name,
  severity: "error",
  create: (data) => createNoCrashingArguments(data.crashingArguments),
});
