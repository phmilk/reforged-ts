// The text-sink classification. A text sink is a call to a Native or library
// member listed with kind `text` in data/local-safe.json, or an assignment to
// a listed `text` accessor (`frame.text = ...`). An expression reaches a sink
// when it is an argument of the call (the assigned value) or feeds it through:
// - template literals (`${value}`);
// - string concatenation (a `+` whose type is a string);
// - `String(value)` (the global) or `tostring(value)` (lua-types);
// - one `const` (`const message = value;` then `message` feeds the sink),
//   followed once: a const initialised from another const is not followed.
// Type assertions and non-null assertions are transparent. Calls to project
// functions are not followed.
import {
  AST_NODE_TYPES,
  ESLintUtils,
  type ParserServicesWithTypeInformation,
  type TSESTree,
} from "@typescript-eslint/utils";
import * as ts from "typescript";

import type { Allowlist, Invocation } from "./allowlist.js";
import {
  type FlowStep,
  isStringConversion,
  type SinkRuleContext,
  through,
  walkValueFlow,
} from "./value-flow.js";

/** The sink an expression reaches. */
export interface TextSinkHit {
  /** The sink's call or accessor assignment. */
  readonly sink: Invocation;
  /** Its allowlist name (`DisplayTextToPlayer`, `print`, `Frame#text`, ...). */
  readonly name: string;
}

function isStringTyped(
  services: ParserServicesWithTypeInformation,
  node: TSESTree.Node,
): boolean {
  const type = services.getTypeAtLocation(node);
  return (type.flags & ts.TypeFlags.StringLike) !== 0;
}

/** The text sink an invocation is, when the allowlist lists it as `text`. */
function textSink(
  services: ParserServicesWithTypeInformation,
  allowlist: Allowlist,
  sink: Invocation,
): TextSinkHit | undefined {
  const entry = allowlist.entryOf(services, sink);
  return entry?.kind === "text" ? { sink, name: entry.name } : undefined;
}

function step(
  services: ParserServicesWithTypeInformation,
  allowlist: Allowlist,
  parent: TSESTree.Node,
  child: TSESTree.Node,
): FlowStep<TextSinkHit> {
  switch (parent.type) {
    case AST_NODE_TYPES.TSAsExpression:
    case AST_NODE_TYPES.TSSatisfiesExpression:
    case AST_NODE_TYPES.TSNonNullExpression:
    case AST_NODE_TYPES.TSTypeAssertion:
    case AST_NODE_TYPES.TemplateLiteral:
      return through;
    case AST_NODE_TYPES.BinaryExpression:
      return parent.operator === "+" && isStringTyped(services, parent)
        ? through
        : undefined;
    case AST_NODE_TYPES.CallExpression:
      if (
        !parent.arguments.includes(child as TSESTree.CallExpressionArgument)
      ) {
        return undefined;
      }
      return isStringConversion(services, parent)
        ? through
        : textSink(services, allowlist, parent);
    case AST_NODE_TYPES.AssignmentExpression:
      return parent.right === child
        ? textSink(services, allowlist, parent)
        : undefined;
    default:
      return undefined;
  }
}

/**
 * The text sink `expression` reaches (see the rules above), or undefined.
 * When it reaches several (through a const read twice), the first read in
 * source order wins. Needs type information: asks the checker for
 * concatenations, conversions and the sink's callee only.
 */
export function reachedTextSink(
  context: SinkRuleContext,
  allowlist: Allowlist,
  expression: TSESTree.Node,
): TextSinkHit | undefined {
  const services = ESLintUtils.getParserServices(context);
  return walkValueFlow(
    {
      context,
      services,
      step: (parent, child) => step(services, allowlist, parent, child),
    },
    expression,
  );
}

/** Whether `expression` reaches a text sink. */
export function reachesTextSink(
  context: SinkRuleContext,
  allowlist: Allowlist,
  expression: TSESTree.Node,
): boolean {
  return reachedTextSink(context, allowlist, expression) !== undefined;
}
