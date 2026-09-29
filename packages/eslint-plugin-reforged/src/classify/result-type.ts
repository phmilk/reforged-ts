// What the checker says about a value where it stands: whether it fits the
// type expected there (a parameter, an annotated variable), whether its type
// lets it be missing, and whether a truthiness test of it can only be a
// missing-value check (its type is an object, so it is falsy only when
// missing; a number or a string is also falsy at 0 or "").
import type {
  ParserServicesWithTypeInformation,
  TSESTree,
} from "@typescript-eslint/utils";
import * as ts from "typescript";

function constituents(type: ts.Type): readonly ts.Type[] {
  return type.isUnion() ? type.types : [type];
}

/**
 * Whether `node` does not fit the type the checker expects where it stands
 * (its contextual type: the parameter it is passed to, the annotation of the
 * variable it initialises). False where nothing is expected.
 */
export function misfitsContext(
  services: ParserServicesWithTypeInformation,
  node: TSESTree.Node,
): boolean {
  const tsNode = services.esTreeNodeToTSNodeMap.get(node);
  if (!ts.isExpression(tsNode)) {
    return false;
  }
  const checker = services.program.getTypeChecker();
  const expected = checker.getContextualType(tsNode);
  return (
    expected !== undefined &&
    !checker.isTypeAssignableTo(checker.getTypeAtLocation(tsNode), expected)
  );
}

/** Whether the type of `node` holds undefined, null or void, or is not checked at all (any, unknown). */
export function mayBeMissing(
  services: ParserServicesWithTypeInformation,
  node: TSESTree.Node,
): boolean {
  const loose =
    ts.TypeFlags.Undefined |
    ts.TypeFlags.Null |
    ts.TypeFlags.Void |
    ts.TypeFlags.Any |
    ts.TypeFlags.Unknown;
  return constituents(services.getTypeAtLocation(node)).some(
    (each) => (each.flags & loose) !== 0,
  );
}

/**
 * Whether every part of the type of `node` is an object (a class instance, a
 * function, `object`), so a truthiness test of it (`!x`, `if (x)`, `x || y`)
 * tests for a missing value only.
 */
export function isObjectTyped(
  services: ParserServicesWithTypeInformation,
  node: TSESTree.Node,
): boolean {
  const object = ts.TypeFlags.Object | ts.TypeFlags.NonPrimitive;
  return constituents(services.getTypeAtLocation(node)).every(
    (each) => (each.flags & object) !== 0,
  );
}
