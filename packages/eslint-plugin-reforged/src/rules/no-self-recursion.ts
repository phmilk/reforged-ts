// Rule 12 of #16's table (pitfall C6): a function that calls itself by name
// in its own body, where the game's Lua stack limits are unverified. A
// syntactic rule with scope analysis: the callee must resolve to the
// function's own binding, and a call inside a nested function belongs to that
// nested function, not to the enclosing one.
import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";
import { defineRuleEntry } from "../rule-entry.js";

export const name = "no-self-recursion";

type Options = [];
type MessageIds = "selfRecursion";

type FunctionNode =
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression;

/** How a function names itself: the calls that count as calling itself. */
type SelfName =
  /** Its binding: `function f`, `const f = () => ...`, a named function expression. */
  | {
      readonly kind: "binding";
      readonly name: string;
      /** The identifier that declares the binding. */
      readonly id: TSESTree.Identifier;
    }
  /** A method: `this.m()`, and `C.m()` in a static method of class `C`. */
  | {
      readonly kind: "method";
      readonly name: string;
      readonly isPrivate: boolean;
      readonly staticOf: TSESTree.Identifier | undefined;
    };

function keyName(
  key: TSESTree.Expression | TSESTree.PrivateIdentifier,
  computed: boolean,
): { name: string; isPrivate: boolean } | undefined {
  if (key.type === AST_NODE_TYPES.PrivateIdentifier) {
    return { name: key.name, isPrivate: true };
  }
  if (!computed && key.type === AST_NODE_TYPES.Identifier) {
    return { name: key.name, isPrivate: false };
  }
  if (key.type === AST_NODE_TYPES.Literal && typeof key.value === "string") {
    return { name: key.value, isPrivate: false };
  }
  return undefined;
}

/** The name a function calls itself by, when the rule covers its form. */
function selfNameOf(fn: FunctionNode): SelfName | undefined {
  const { parent } = fn;
  if (fn.type !== AST_NODE_TYPES.ArrowFunctionExpression && fn.id) {
    return { kind: "binding", name: fn.id.name, id: fn.id };
  }
  if (
    parent.type === AST_NODE_TYPES.VariableDeclarator &&
    parent.init === fn &&
    parent.id.type === AST_NODE_TYPES.Identifier &&
    parent.parent.kind === "const"
  ) {
    return { kind: "binding", name: parent.id.name, id: parent.id };
  }
  if (fn.type !== AST_NODE_TYPES.FunctionExpression) {
    return undefined;
  }
  if (
    parent.type === AST_NODE_TYPES.MethodDefinition &&
    parent.kind === "method"
  ) {
    const key = keyName(parent.key, parent.computed);
    const classNode = parent.parent.parent;
    return (
      key && {
        kind: "method",
        ...key,
        staticOf: parent.static ? (classNode.id ?? undefined) : undefined,
      }
    );
  }
  if (
    parent.type === AST_NODE_TYPES.Property &&
    parent.value === fn &&
    parent.kind === "init"
  ) {
    const key = keyName(parent.key, parent.computed);
    return key && { kind: "method", ...key, staticOf: undefined };
  }
  return undefined;
}

const rule = createRule<Options, MessageIds>({
  name,
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow a function calling itself by name, where the game's Lua stack limits are unverified",
    },
    messages: {
      selfRecursion:
        "{{name}} calls itself: deep recursion overflows the Lua stack and kills the thread, and the stock Lua 5.3 limits (200 nested C calls, 1,000,000 stack slots) are unverified for the game's build. Rewrite it as a loop over an explicit stack, or bound the depth.",
    },
    schema: [],
    defaultOptions: [],
  },
  create(context) {
    // Asked first, so a configuration without type information fails at the
    // first file, like every rule of the plugin.
    ESLintUtils.getParserServices(context);
    const { sourceCode } = context;
    /** The functions entered, innermost last; undefined for an unnamed one. */
    const stack: (SelfName | undefined)[] = [];

    function enter(fn: FunctionNode): void {
      stack.push(selfNameOf(fn));
    }
    function exit(): void {
      stack.pop();
    }

    function resolvesTo(
      identifier: TSESTree.Identifier,
      definedBy: (def: TSESLint.Scope.Definition) => boolean,
    ): boolean {
      let scope: TSESLint.Scope.Scope | null = sourceCode.getScope(identifier);
      while (scope) {
        const variable = scope.set.get(identifier.name);
        if (variable) {
          return variable.defs.some(definedBy);
        }
        scope = scope.upper;
      }
      return false;
    }

    function callsItself(self: SelfName, callee: TSESTree.Node): boolean {
      if (self.kind === "binding") {
        return (
          callee.type === AST_NODE_TYPES.Identifier &&
          callee.name === self.name &&
          resolvesTo(callee, (def) => def.name === self.id)
        );
      }
      if (callee.type !== AST_NODE_TYPES.MemberExpression) {
        return false;
      }
      const key = keyName(callee.property, callee.computed);
      if (key?.name !== self.name || key.isPrivate !== self.isPrivate) {
        return false;
      }
      if (callee.object.type === AST_NODE_TYPES.ThisExpression) {
        return true;
      }
      const { staticOf } = self;
      return (
        staticOf !== undefined &&
        callee.object.type === AST_NODE_TYPES.Identifier &&
        callee.object.name === staticOf.name &&
        resolvesTo(callee.object, (def) => def.name === staticOf)
      );
    }

    return {
      FunctionDeclaration: enter,
      FunctionExpression: enter,
      ArrowFunctionExpression: enter,
      "FunctionDeclaration:exit": exit,
      "FunctionExpression:exit": exit,
      "ArrowFunctionExpression:exit": exit,
      CallExpression(node) {
        const self = stack.at(-1);
        if (self !== undefined && callsItself(self, node.callee)) {
          context.report({
            node,
            messageId: "selfRecursion",
            data: { name: self.name },
          });
        }
      },
    };
  },
});

export default defineRuleEntry({
  name,
  severity: "warn",
  create: () => rule,
});
