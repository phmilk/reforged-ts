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
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";
import * as ts from "typescript";

import type { Allowlist, Invocation } from "./allowlist.js";
import { packageNameOf } from "./package.js";

/** The sink an expression reaches. */
export interface TextSinkHit {
  /** The sink's call or accessor assignment. */
  readonly sink: Invocation;
  /** Its allowlist name (`DisplayTextToPlayer`, `print`, `Frame#text`, ...). */
  readonly name: string;
}

/** What the walk needs from a rule's context. */
export type SinkRuleContext = Readonly<
  TSESLint.RuleContext<string, readonly unknown[]>
>;

function isStringTyped(
  services: ParserServicesWithTypeInformation,
  node: TSESTree.Node,
): boolean {
  const type = services.getTypeAtLocation(node);
  return (type.flags & ts.TypeFlags.StringLike) !== 0;
}

/** `String(x)` with the global of the default library, or lua-types' `tostring(x)`. */
function isStringConversion(
  services: ParserServicesWithTypeInformation,
  call: TSESTree.CallExpression,
): boolean {
  const { callee } = call;
  if (
    callee.type !== AST_NODE_TYPES.Identifier ||
    (callee.name !== "String" && callee.name !== "tostring")
  ) {
    return false;
  }
  const declarations =
    services.program
      .getTypeChecker()
      .getSymbolAtLocation(services.esTreeNodeToTSNodeMap.get(callee))
      ?.declarations ?? [];
  return declarations.some((declaration) => {
    const file = declaration.getSourceFile();
    return callee.name === "String"
      ? services.program.isSourceFileDefaultLibrary(file)
      : packageNameOf(file.fileName) === "lua-types";
  });
}

function walk(
  context: SinkRuleContext,
  services: ParserServicesWithTypeInformation,
  allowlist: Allowlist,
  start: TSESTree.Node,
  constHops: number,
): TextSinkHit | undefined {
  let current = start;
  for (;;) {
    const parent = current.parent;
    if (parent === undefined) {
      return undefined;
    }
    switch (parent.type) {
      case AST_NODE_TYPES.TSAsExpression:
      case AST_NODE_TYPES.TSSatisfiesExpression:
      case AST_NODE_TYPES.TSNonNullExpression:
      case AST_NODE_TYPES.TSTypeAssertion:
      case AST_NODE_TYPES.TemplateLiteral:
        current = parent;
        continue;
      case AST_NODE_TYPES.BinaryExpression:
        if (parent.operator !== "+" || !isStringTyped(services, parent)) {
          return undefined;
        }
        current = parent;
        continue;
      case AST_NODE_TYPES.CallExpression: {
        if (
          !parent.arguments.includes(current as TSESTree.CallExpressionArgument)
        ) {
          return undefined;
        }
        if (isStringConversion(services, parent)) {
          current = parent;
          continue;
        }
        const entry = allowlist.entryOf(services, parent);
        return entry?.kind === "text"
          ? { sink: parent, name: entry.name }
          : undefined;
      }
      case AST_NODE_TYPES.AssignmentExpression: {
        if (parent.right !== current) {
          return undefined;
        }
        const entry = allowlist.entryOf(services, parent);
        return entry?.kind === "text"
          ? { sink: parent, name: entry.name }
          : undefined;
      }
      case AST_NODE_TYPES.VariableDeclarator:
        return parent.init === current &&
          constHops > 0 &&
          parent.id.type === AST_NODE_TYPES.Identifier &&
          parent.parent.kind === "const"
          ? throughConst(context, services, allowlist, parent, constHops - 1)
          : undefined;
      default:
        return undefined;
    }
  }
}

function throughConst(
  context: SinkRuleContext,
  services: ParserServicesWithTypeInformation,
  allowlist: Allowlist,
  declarator: TSESTree.VariableDeclarator,
  constHops: number,
): TextSinkHit | undefined {
  for (const variable of context.sourceCode.getDeclaredVariables(declarator)) {
    for (const reference of variable.references) {
      if (!reference.isRead() || reference.init === true) {
        continue;
      }
      const hit = walk(
        context,
        services,
        allowlist,
        reference.identifier,
        constHops,
      );
      if (hit !== undefined) {
        return hit;
      }
    }
  }
  return undefined;
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
  return walk(context, services, allowlist, expression, 1);
}

/** Whether `expression` reaches a text sink. */
export function reachesTextSink(
  context: SinkRuleContext,
  allowlist: Allowlist,
  expression: TSESTree.Node,
): boolean {
  return reachedTextSink(context, allowlist, expression) !== undefined;
}
