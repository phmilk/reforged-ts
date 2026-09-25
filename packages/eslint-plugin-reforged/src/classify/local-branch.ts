// The local-player expression and the local branch (spec #50, ticket #116).
//
// A local-player expression is:
// - a call to the `GetLocalPlayer` Native;
// - a call to the player Wrapper's static `fromLocal` or instance `isLocal`;
// - an equality or inequality between a player-typed expression and one of
//   those;
// - an identifier bound by `const` to one of those, in the same function or
//   module scope (one hop: a `const` bound to such an identifier is not one).
//
// A local branch is code that runs for the local player only:
// - the consequent of an `if`, a conditional expression, or the right operand
//   of a logical `&&`/`||`, whose test contains a local-player expression;
// - the alternate of such an `if` or conditional when the test is negated
//   (`!test`, `!=`/`!==`, or a one-hop `const` bound to one of those);
// - a function passed to the library's `MapPlayer.runLocal(player, fn)`;
// - anything inside a local branch, functions defined there included.
//
// Syntax first, then the checker for calls and identifiers inside a test
// only. Results are cached per node for the lifetime of the classifier (one
// file).
import {
  AST_NODE_TYPES,
  ESLintUtils,
  TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";

import { isFunction } from "./function.js";
import { handleTypeName } from "./handle.js";
import { calleeName, resolveNative } from "./native.js";
import { resolveWrapperMember } from "./wrapper-member.js";
import { calleeMemberName, wrapperClassOf } from "./wrapper.js";

/** Any rule context: the classifier only reads the parser services and scopes. */
export type LocalBranchRuleContext = Readonly<
  TSESLint.RuleContext<string, readonly unknown[]>
>;

/** The library's player Wrapper. */
const playerWrapper = "MapPlayer";

/** The player Wrapper's members that read the local player. */
const localPlayerMembers: ReadonlySet<string> = new Set([
  `${playerWrapper}.fromLocal`,
  `${playerWrapper}#isLocal`,
]);

/** The player Wrapper's member that runs a function for one player only. */
const runLocalMember = `${playerWrapper}.runLocal`;

const equalityOperators = new Set(["==", "===", "!=", "!=="]);
const inequalityOperators = new Set(["!=", "!=="]);

/** Removes the TypeScript-only wrappers (`as`, `satisfies`, `!`, `<T>`). */
function unwrap(node: TSESTree.Node): TSESTree.Node {
  let current = node;
  while (
    current.type === AST_NODE_TYPES.TSAsExpression ||
    current.type === AST_NODE_TYPES.TSSatisfiesExpression ||
    current.type === AST_NODE_TYPES.TSNonNullExpression ||
    current.type === AST_NODE_TYPES.TSTypeAssertion
  ) {
    current = current.expression;
  }
  return current;
}

function isNode(value: unknown): value is TSESTree.Node {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof value.type === "string"
  );
}

/** What the classifier answers for one file. */
export interface LocalBranchClassifier {
  /** Whether a node runs inside a local branch. */
  isInLocalBranch(node: TSESTree.Node): boolean;
  /** Whether a call is a local-player call (`GetLocalPlayer()`, `MapPlayer.fromLocal()`, `p.isLocal()`). */
  isLocalPlayerCall(call: TSESTree.CallExpression): boolean;
  /** Whether a call is `MapPlayer.runLocal(...)`. */
  isRunLocalCall(call: TSESTree.CallExpression): boolean;
  /** Whether an expression is a local-player expression (see the header). */
  isLocalPlayerExpression(node: TSESTree.Node): boolean;
}

/** Creates the classifier of one file; call it once in a rule's `create`. */
export function createLocalBranchClassifier(
  context: LocalBranchRuleContext,
): LocalBranchClassifier {
  const services = ESLintUtils.getParserServices(context);
  const checker = services.program.getTypeChecker();
  const { sourceCode } = context;
  const inLocalBranch = new WeakMap<TSESTree.Node, boolean>();
  const testContains = new WeakMap<TSESTree.Node, boolean>();

  function isLocalPlayerCall(call: TSESTree.CallExpression): boolean {
    const name = calleeName(call);
    if (name !== undefined) {
      return (
        name === "GetLocalPlayer" &&
        resolveNative(services, call)?.name === "GetLocalPlayer"
      );
    }
    const member = calleeMemberName(call);
    if (member !== "fromLocal" && member !== "isLocal") {
      return false;
    }
    const resolved = resolveWrapperMember(services, call);
    return resolved !== undefined && localPlayerMembers.has(resolved.name);
  }

  function isRunLocalCall(call: TSESTree.CallExpression): boolean {
    return (
      calleeMemberName(call) === "runLocal" &&
      resolveWrapperMember(services, call)?.name === runLocalMember
    );
  }

  function isPlayerTyped(node: TSESTree.Node): boolean {
    const type = services.getTypeAtLocation(node);
    return (
      handleTypeName(checker, type) === "player" ||
      wrapperClassOf(checker, type) === playerWrapper
    );
  }

  /** A local-player call, or an equality between one and a player-typed expression. */
  function isDirectLocalPlayerExpression(node: TSESTree.Node): boolean {
    const expression = unwrap(node);
    if (expression.type === AST_NODE_TYPES.CallExpression) {
      return isLocalPlayerCall(expression);
    }
    if (
      expression.type !== AST_NODE_TYPES.BinaryExpression ||
      !equalityOperators.has(expression.operator)
    ) {
      return false;
    }
    const sides = [unwrap(expression.left), unwrap(expression.right)];
    return sides.some(
      (side, index) =>
        side.type === AST_NODE_TYPES.CallExpression &&
        isLocalPlayerCall(side) &&
        isPlayerTyped(sides[1 - index]),
    );
  }

  /**
   * The initialiser of the `const` an identifier is bound to, when that
   * `const` is declared in the identifier's function scope or at module
   * level; undefined otherwise.
   */
  function constInitOf(
    identifier: TSESTree.Identifier,
  ): TSESTree.Expression | undefined {
    const scope = sourceCode.getScope(identifier);
    const reference = scope.references.find(
      (each) => each.identifier === identifier,
    );
    const variable = reference?.resolved;
    if (variable?.defs.length !== 1) {
      return undefined;
    }
    const definition = variable.defs[0];
    if (
      definition.type !== TSESLint.Scope.DefinitionType.Variable ||
      definition.parent.kind !== "const" ||
      definition.node.id.type !== AST_NODE_TYPES.Identifier ||
      definition.node.init === null
    ) {
      return undefined;
    }
    const declaredIn = variable.scope.variableScope;
    const sameScope =
      declaredIn === scope.variableScope ||
      declaredIn.type === TSESLint.Scope.ScopeType.module ||
      declaredIn.type === TSESLint.Scope.ScopeType.global;
    return sameScope ? definition.node.init : undefined;
  }

  function isLocalPlayerExpression(node: TSESTree.Node): boolean {
    const expression = unwrap(node);
    if (expression.type === AST_NODE_TYPES.Identifier) {
      const init = constInitOf(expression);
      return init !== undefined && isDirectLocalPlayerExpression(init);
    }
    return isDirectLocalPlayerExpression(expression);
  }

  /** Whether a test contains a local-player expression (nested functions excluded). */
  function containsLocalPlayerExpression(test: TSESTree.Node): boolean {
    const cached = testContains.get(test);
    if (cached !== undefined) {
      return cached;
    }
    let found = false;
    const visit = (node: TSESTree.Node): void => {
      if (found || isFunction(node)) {
        return;
      }
      if (
        (node.type === AST_NODE_TYPES.CallExpression ||
          node.type === AST_NODE_TYPES.Identifier) &&
        isLocalPlayerExpression(node)
      ) {
        found = true;
        return;
      }
      for (const key of sourceCode.visitorKeys[node.type] ?? []) {
        const child = (node as unknown as Record<string, unknown>)[key];
        const children: unknown[] = Array.isArray(child) ? child : [child];
        for (const each of children) {
          if (isNode(each)) {
            visit(each);
          }
        }
      }
    };
    visit(test);
    testContains.set(test, found);
    return found;
  }

  /** Whether a test is negated: `!x`, an inequality, or a one-hop `const` bound to one of those. */
  function isNegated(test: TSESTree.Node): boolean {
    const isNegation = (node: TSESTree.Node): boolean => {
      const expression = unwrap(node);
      return (
        (expression.type === AST_NODE_TYPES.UnaryExpression &&
          expression.operator === "!") ||
        (expression.type === AST_NODE_TYPES.BinaryExpression &&
          inequalityOperators.has(expression.operator))
      );
    };
    const expression = unwrap(test);
    if (expression.type === AST_NODE_TYPES.Identifier) {
      const init = constInitOf(expression);
      return init !== undefined && isNegation(init);
    }
    return isNegation(expression);
  }

  /** Whether `child` is a local branch of its parent. */
  function opensLocalBranch(
    parent: TSESTree.Node,
    child: TSESTree.Node,
  ): boolean {
    switch (parent.type) {
      case AST_NODE_TYPES.IfStatement:
      case AST_NODE_TYPES.ConditionalExpression:
        if (child === parent.consequent) {
          return containsLocalPlayerExpression(parent.test);
        }
        return (
          child === parent.alternate &&
          containsLocalPlayerExpression(parent.test) &&
          isNegated(parent.test)
        );
      case AST_NODE_TYPES.LogicalExpression:
        return (
          (parent.operator === "&&" || parent.operator === "||") &&
          child === parent.right &&
          containsLocalPlayerExpression(parent.left)
        );
      case AST_NODE_TYPES.CallExpression:
        return (
          isFunction(child) &&
          parent.arguments.includes(child as TSESTree.CallExpressionArgument) &&
          isRunLocalCall(parent)
        );
      default:
        return false;
    }
  }

  function isInLocalBranch(node: TSESTree.Node): boolean {
    const cached = inLocalBranch.get(node);
    if (cached !== undefined) {
      return cached;
    }
    // The Program's parent is null at runtime, though typed as undefined.
    const parent = node.parent as TSESTree.Node | null | undefined;
    const result =
      parent !== undefined &&
      parent !== null &&
      (opensLocalBranch(parent, node) || isInLocalBranch(parent));
    inLocalBranch.set(node, result);
    return result;
  }

  return {
    isInLocalBranch,
    isLocalPlayerCall,
    isRunLocalCall,
    isLocalPlayerExpression,
  };
}
