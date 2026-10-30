// The Rawcode constant under the cursor (#833): a member of a constants
// object, `CustomUnits.Captain_h000` of a generated constants module or
// `Units.Footman_hfoo` of reforged-builtins, whose name ends in `_` and the
// four characters of its Rawcode, as both name their constants. The lookup
// then says whether the member is the constant of an object of that
// Rawcode. Only the node at the position and its symbol are read.

import type * as ts from "typescript";
import { nodeAt } from "./literal.js";

/** A reference to a member that may be a Rawcode constant: its name, its object and the Rawcode its name ends in. */
export interface RawcodeConstantReference {
  /** The member's name at the position. */
  readonly node: ts.Identifier;
  /** The exported constants object that declares it (`CustomUnits`). */
  readonly object: string;
  /** The member (`Captain_h000`). */
  readonly member: string;
  /** The Rawcode its name ends in (`h000`). */
  readonly rawcode: string;
  /** The file that declares it. */
  readonly fileName: string;
}

/**
 * The member of a constants object at `position` of `sourceFile`, whose
 * name ends in `_` and four characters; undefined when the position is on
 * none.
 */
export function rawcodeConstantAt(
  typescript: typeof ts,
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
  position: number,
): RawcodeConstantReference | undefined {
  const node = nodeAt(sourceFile, position);
  if (node === undefined || !typescript.isIdentifier(node)) return undefined;
  const member = node.text;
  if (member.length < 6 || member.charAt(member.length - 5) !== "_") {
    return undefined;
  }
  const symbol = checker.getSymbolAtLocation(node);
  for (const declaration of symbol?.declarations ?? []) {
    if (
      !typescript.isPropertySignature(declaration) &&
      !typescript.isPropertyAssignment(declaration)
    ) {
      continue;
    }
    const object = constantsObject(typescript, declaration.parent);
    if (object !== undefined) {
      return {
        node,
        object,
        member,
        rawcode: member.slice(-4),
        fileName: declaration.getSourceFile().fileName,
      };
    }
  }
  return undefined;
}

/**
 * The name of the constant a member's container declares: the type of
 * `export declare const Units: { … }`, or the object literal of
 * `export const CustomUnits = { … } as const`.
 */
function constantsObject(
  typescript: typeof ts,
  container: ts.Node,
): string | undefined {
  if (typescript.isTypeLiteralNode(container)) {
    const declaration = container.parent;
    return typescript.isVariableDeclaration(declaration) &&
      declaration.type === container &&
      typescript.isIdentifier(declaration.name)
      ? declaration.name.text
      : undefined;
  }
  if (!typescript.isObjectLiteralExpression(container)) return undefined;
  let expression: ts.Node = container;
  let parent = container.parent;
  while (
    (typescript.isAsExpression(parent) ||
      typescript.isSatisfiesExpression(parent) ||
      typescript.isParenthesizedExpression(parent)) &&
    parent.expression === expression
  ) {
    expression = parent;
    parent = parent.parent;
  }
  return typescript.isVariableDeclaration(parent) &&
    parent.initializer === expression &&
    typescript.isIdentifier(parent.name)
    ? parent.name.text
    : undefined;
}
