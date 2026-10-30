// The Rawcode literal under the cursor, in the forms the lint rule
// no-unknown-rawcodes checks (#582): the single string or template literal
// argument of the global FourCC, and a number literal cast to a Rawcode type
// of the Typings. Only the node at the position and its parents are read.

import type * as ts from "typescript";

/** The name of the property key the Typings brand a Rawcode type with (`rawcode.d.ts`). */
const RAWCODE_BRAND = "__reforgedRawcodeKind";

/** A Rawcode literal: its node, and the text the lookup is asked for. */
export type RawcodeLiteral = StringRawcodeLiteral | NumberRawcodeLiteral;

/** The argument of `FourCC("hfoo")` or `` FourCC(`hfoo`) ``. */
export interface StringRawcodeLiteral {
  readonly form: "string";
  readonly node: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral;
  /** The literal's value, which the lookup is asked for. */
  readonly rawcode: string;
  /** The call's callee, the global `FourCC`. */
  readonly callee: ts.Identifier;
}

/** The number of `1751543663 as Rawcode<"unit">` or `<Rawcode>0x68666f6f`. */
export interface NumberRawcodeLiteral {
  readonly form: "number";
  readonly node: ts.NumericLiteral;
  /** The number's value. */
  readonly value: number;
  /**
   * Its four bytes, big-endian, as characters: what `FourCC` would have
   * encoded it from; undefined when the value does not fit in four bytes.
   */
  readonly rawcode: string | undefined;
}

/**
 * The Rawcode literal at `position` of `sourceFile`, undefined when the
 * position is on none.
 */
export function rawcodeLiteralAt(
  typescript: typeof ts,
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
  position: number,
): RawcodeLiteral | undefined {
  const node = nodeAt(sourceFile, position);
  if (node === undefined) return undefined;
  const { parent } = node;
  if (
    typescript.isStringLiteral(node) ||
    typescript.isNoSubstitutionTemplateLiteral(node)
  ) {
    if (
      typescript.isCallExpression(parent) &&
      parent.arguments.length === 1 &&
      parent.arguments[0] === node &&
      typescript.isIdentifier(parent.expression) &&
      isGlobalFourCC(typescript, checker, parent.expression)
    ) {
      return {
        form: "string",
        node,
        rawcode: node.text,
        callee: parent.expression,
      };
    }
    return undefined;
  }
  if (
    typescript.isNumericLiteral(node) &&
    (typescript.isAsExpression(parent) ||
      typescript.isTypeAssertionExpression(parent)) &&
    parent.expression === node &&
    isRawcodeType(typescript, checker.getTypeFromTypeNode(parent.type))
  ) {
    const value = Number(node.text);
    if (value === 0) return undefined;
    return { form: "number", node, value, rawcode: decodeRawcode(value) };
  }
  return undefined;
}

/**
 * The four bytes of a number, big-endian, as characters, the inverse of
 * `FourCC`; undefined when it is not an integer from 0 to 2^32 - 1.
 */
export function decodeRawcode(value: number): string | undefined {
  if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) {
    return undefined;
  }
  return String.fromCharCode(
    value >>> 24,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  );
}

/** The innermost node whose text spans `position`. */
export function nodeAt(
  sourceFile: ts.SourceFile,
  position: number,
): ts.Node | undefined {
  if (position < 0 || position > sourceFile.end) return undefined;
  let node: ts.Node = sourceFile;
  for (;;) {
    const child: ts.Node | undefined = node.forEachChild((candidate) =>
      candidate.getStart(sourceFile) <= position && position < candidate.end
        ? candidate
        : undefined,
    );
    if (child === undefined) return node === sourceFile ? undefined : node;
    node = child;
  }
}

/**
 * Whether `callee` names the global `FourCC`: every declaration of its
 * symbol is a function declared in a declaration file at global scope, as
 * reforged-types declares it and as the overloads of reforged-builtins and of
 * the map merge into it. A local or imported function named `FourCC` is not.
 */
function isGlobalFourCC(
  typescript: typeof ts,
  checker: ts.TypeChecker,
  callee: ts.Identifier,
): boolean {
  if (callee.text !== "FourCC") return false;
  const symbol = checker.getSymbolAtLocation(callee);
  const declarations = symbol?.declarations ?? [];
  return (
    declarations.length > 0 &&
    declarations.every((declaration) =>
      isGlobalFourCCDeclaration(typescript, declaration),
    )
  );
}

/** Whether a declaration is a `declare function FourCC` of a global declaration file. */
export function isGlobalFourCCDeclaration(
  typescript: typeof ts,
  declaration: ts.Node,
): declaration is ts.FunctionDeclaration {
  const sourceFile = declaration.getSourceFile();
  return (
    typescript.isFunctionDeclaration(declaration) &&
    declaration.name?.text === "FourCC" &&
    sourceFile.isDeclarationFile &&
    declaration.parent === sourceFile &&
    !typescript.isExternalModule(sourceFile)
  );
}

/**
 * Whether a type is a Rawcode type of the Typings (`Rawcode<K>`, `Rawcode`,
 * `UnknownRawcode`): it has the property keyed by their brand, declared in a
 * declaration file. A type merely named `Rawcode` is not.
 */
function isRawcodeType(typescript: typeof ts, type: ts.Type): boolean {
  return type
    .getProperties()
    .some((property) =>
      (property.declarations ?? []).some(
        (declaration) =>
          typescript.isPropertySignature(declaration) &&
          typescript.isComputedPropertyName(declaration.name) &&
          typescript.isIdentifier(declaration.name.expression) &&
          declaration.name.expression.text === RAWCODE_BRAND &&
          declaration.getSourceFile().isDeclarationFile,
      ),
    );
}
