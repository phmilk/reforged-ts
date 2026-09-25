// Function boundaries: the nodes whose body runs when the function is called,
// not where it is written.
import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

/** A function with a body: a declaration, a function expression or an arrow function. */
export type FunctionNode =
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression;

/** Whether a node is a function with a body. Syntactic. */
export function isFunction(node: TSESTree.Node): node is FunctionNode {
  return (
    node.type === AST_NODE_TYPES.FunctionDeclaration ||
    node.type === AST_NODE_TYPES.FunctionExpression ||
    node.type === AST_NODE_TYPES.ArrowFunctionExpression
  );
}
