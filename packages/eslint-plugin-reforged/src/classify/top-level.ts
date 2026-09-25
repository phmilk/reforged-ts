// The module-top-level classification: code that runs when the module is
// loaded, which in a TSTL bundle is the Lua root. It covers the statements of
// the module body, top-level variable initialisers, class static
// initialisers and static blocks, immediately invoked functions, and object
// literal values evaluated at load. It excludes the bodies of functions,
// methods, accessors, arrow functions and callbacks, and instance property
// initialisers (they run in the constructor).
import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

import { type FunctionNode, isFunction } from "./function.js";

/** Whether a function is invoked where it is written: `(() => ...)()`, `(function () {...})()`. */
export function isImmediatelyInvoked(fn: FunctionNode): boolean {
  const { parent } = fn;
  return parent.type === AST_NODE_TYPES.CallExpression && parent.callee === fn;
}

/**
 * Whether a node runs at module top level (in the Lua root): walking up to
 * the Program, it crosses no function boundary other than an immediately
 * invoked function, and no instance property initialiser. Syntactic: no
 * checker.
 */
export function isAtModuleTopLevel(node: TSESTree.Node): boolean {
  let child: TSESTree.Node = node;
  // The Program's parent is null at runtime, although the types omit it.
  let parent = node.parent as TSESTree.Node | null | undefined;
  while (parent != null) {
    if (isFunction(parent)) {
      if (!isImmediatelyInvoked(parent)) {
        // A parameter default or the body: both run when it is called.
        return false;
      }
    } else if (
      (parent.type === AST_NODE_TYPES.PropertyDefinition ||
        parent.type === AST_NODE_TYPES.AccessorProperty) &&
      !parent.static &&
      parent.value === child
    ) {
      return false;
    }
    child = parent;
    parent = parent.parent;
  }
  return child.type === AST_NODE_TYPES.Program;
}
