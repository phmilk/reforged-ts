// Member accesses and calls as the classification helpers see them: the
// syntactic name a call or a member read names, whether a member expression
// is read, the shared pre-match on a name set, and the declarations the
// checker resolves a name to.
import {
  AST_NODE_TYPES,
  type ParserServicesWithTypeInformation,
  type TSESTree,
} from "@typescript-eslint/utils";
import * as ts from "typescript";

/** A set of names, or anything that answers `has` (a map keyed by name). */
export type NameSet = Pick<ReadonlySet<string>, "has">;

/** A node that can invoke a listed function: a call, or a member read (a getter). */
export type InvocationCandidate =
  TSESTree.CallExpression | TSESTree.MemberExpression;

/** The name of a non-computed member access (`a.b`: `b`), or undefined. */
export function propertyName(
  member: TSESTree.MemberExpression,
): string | undefined {
  return !member.computed && member.property.type === AST_NODE_TYPES.Identifier
    ? member.property.name
    : undefined;
}

/**
 * Whether a member expression is read as a value: not the callee of a call,
 * not an assignment target, not the operand of `++` or `--`.
 */
export function isRead(member: TSESTree.MemberExpression): boolean {
  const { parent } = member;
  if (
    parent.type === AST_NODE_TYPES.CallExpression &&
    parent.callee === member
  ) {
    return false;
  }
  if (parent.type === AST_NODE_TYPES.UpdateExpression) {
    return false;
  }
  return !(
    parent.type === AST_NODE_TYPES.AssignmentExpression &&
    parent.left === member
  );
}

/**
 * Whether a call or member read may invoke a listed function, without the
 * checker: a plain call to a name of `natives`, or a call to (or a read of)
 * a non-computed member whose name is in `members`; `"any"` lets every
 * member name through.
 */
export function mayInvokeListed(
  node: InvocationCandidate,
  natives: NameSet,
  members: NameSet | "any",
): boolean {
  const memberMatches = (member: TSESTree.MemberExpression) => {
    const name = propertyName(member);
    return name !== undefined && (members === "any" || members.has(name));
  };
  if (node.type === AST_NODE_TYPES.MemberExpression) {
    return isRead(node) && memberMatches(node);
  }
  const { callee } = node;
  if (callee.type === AST_NODE_TYPES.Identifier) {
    return natives.has(callee.name);
  }
  return (
    callee.type === AST_NODE_TYPES.MemberExpression && memberMatches(callee)
  );
}

/**
 * The declarations the checker resolves a name to, through an import alias.
 * Asks the checker: match syntactically first.
 */
export function resolvedDeclarations(
  services: ParserServicesWithTypeInformation,
  node: TSESTree.Node,
): readonly ts.Declaration[] {
  const checker = services.program.getTypeChecker();
  let symbol = checker.getSymbolAtLocation(
    services.esTreeNodeToTSNodeMap.get(node),
  );
  if (symbol !== undefined && symbol.flags & ts.SymbolFlags.Alias) {
    symbol = checker.getAliasedSymbol(symbol);
  }
  return symbol?.declarations ?? [];
}
