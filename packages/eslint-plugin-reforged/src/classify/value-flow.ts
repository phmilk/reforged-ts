// The value-flow walk that text-sink.ts and state-sink.ts share: from an
// expression, up through the nodes its value flows into, until a sink, or a
// node the value does not flow through. The caller decides, per parent node,
// whether the value flows through it, stops, or has reached a sink. The walk
// itself handles a variable initialised with the value: it follows the
// reads of one `const` (a const initialised from another const is not
// followed), first read in source order first.
import {
  AST_NODE_TYPES,
  type ParserServicesWithTypeInformation,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";

import { packageNameOf } from "./package.js";

/** What the walk needs from a rule's context. */
export type SinkRuleContext = Readonly<
  TSESLint.RuleContext<string, readonly unknown[]>
>;

/** The value flows into the parent node: the walk goes on from it. */
export const through: unique symbol = Symbol("through");

/** What a parent node does with the value: `through`, a sink hit, or undefined (the walk stops). */
export type FlowStep<Hit> = typeof through | Hit | undefined;

/** A variable declarator whose initialiser the value is. */
export type ValueDeclarator = TSESTree.VariableDeclarator & {
  readonly id: TSESTree.Identifier;
};

/** One walk: the rule's context and the caller's decisions. */
export interface ValueFlow<Hit> {
  readonly context: SinkRuleContext;
  readonly services: ParserServicesWithTypeInformation;
  /**
   * What `parent` does with the value of its child `child`. Not asked for a
   * variable declarator: the walk handles those.
   */
  step(parent: TSESTree.Node, child: TSESTree.Node): FlowStep<Hit>;
  /**
   * A variable initialised with the value, before its reads are followed:
   * a hit ends the walk there. Undefined (or no hook) follows the reads when
   * the variable is a const.
   */
  declared?(
    declarator: ValueDeclarator,
    variable: TSESLint.Scope.Variable,
  ): Hit | undefined;
}

/** The `const` hops a walk follows. */
const constHops = 1;

function walk<Hit>(
  flow: ValueFlow<Hit>,
  start: TSESTree.Node,
  hops: number,
): Hit | undefined {
  let current = start;
  for (;;) {
    const parent = current.parent;
    if (parent === undefined) {
      return undefined;
    }
    if (parent.type === AST_NODE_TYPES.VariableDeclarator) {
      return parent.init === current &&
        parent.id.type === AST_NODE_TYPES.Identifier
        ? throughDeclarator(flow, parent as ValueDeclarator, hops)
        : undefined;
    }
    const step = flow.step(parent, current);
    if (step !== through) {
      return step;
    }
    current = parent;
  }
}

function throughDeclarator<Hit>(
  flow: ValueFlow<Hit>,
  declarator: ValueDeclarator,
  hops: number,
): Hit | undefined {
  for (const variable of flow.context.sourceCode.getDeclaredVariables(
    declarator,
  )) {
    const hit = flow.declared?.(declarator, variable);
    if (hit !== undefined) {
      return hit;
    }
    if (declarator.parent.kind !== "const" || hops === 0) {
      return undefined;
    }
    for (const reference of variable.references) {
      if (!reference.isRead() || reference.init === true) {
        continue;
      }
      const found = walk(flow, reference.identifier, hops - 1);
      if (found !== undefined) {
        return found;
      }
    }
  }
  return undefined;
}

/**
 * Walks the value of `expression` (see the rules above) and returns the
 * first sink hit, or undefined.
 */
export function walkValueFlow<Hit>(
  flow: ValueFlow<Hit>,
  expression: TSESTree.Node,
): Hit | undefined {
  return walk(flow, expression, constHops);
}

/** `String(x)` with the global of the default library, or lua-types' `tostring(x)`. */
export function isStringConversion(
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
