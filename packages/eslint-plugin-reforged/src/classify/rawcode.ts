// Rawcode literals, for no-unknown-rawcodes (#582): the call of the global
// `FourCC` that reforged-types declares, and the Rawcode types of the
// Typings (`Rawcode<K>`, `Rawcode`, `UnknownRawcode`), recognized by the
// brand rawcode.d.ts declares, never by name alone. The overloads of
// reforged-builtins and of the map's generated code merge into the same
// global function, so a literal with an overload is still a `FourCC` call.
import * as ts from "typescript";

import { isDeclaredIn } from "./package.js";

/** The name of the property key the Typings brand a Rawcode type with (`rawcode.d.ts`). */
const RAWCODE_BRAND = "__reforgedRawcodeKind";

/** A string is a Rawcode when it is exactly four printable ASCII characters (U+0020 to U+007E). */
export function isRawcodeShape(text: string): boolean {
  return /^[\x20-\x7e]{4}$/.test(text);
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

/** The integer `FourCC` gives for a four-character Rawcode: its bytes, big-endian. */
export function encodeRawcode(rawcode: string): number {
  let value = 0;
  for (let index = 0; index < 4; index++) {
    value = value * 256 + rawcode.charCodeAt(index);
  }
  return value;
}

/**
 * Whether a callee names the global `FourCC` of the Typings: one of its
 * declarations is in reforged-types, and each is a function declared at the
 * top of a global declaration file (reforged-types, reforged-builtins, the
 * map's generated declarations). A local or imported function named
 * `FourCC` is not.
 */
export function isGlobalFourCC(
  checker: ts.TypeChecker,
  callee: ts.Identifier,
): boolean {
  const declarations = checker.getSymbolAtLocation(callee)?.declarations ?? [];
  return (
    declarations.some((declaration) =>
      isDeclaredIn(declaration, "reforged-types"),
    ) &&
    declarations.every((declaration) => {
      const sourceFile = declaration.getSourceFile();
      return (
        ts.isFunctionDeclaration(declaration) &&
        declaration.name?.text === "FourCC" &&
        sourceFile.isDeclarationFile &&
        declaration.parent === sourceFile &&
        !ts.isExternalModule(sourceFile)
      );
    })
  );
}

/**
 * Whether a type is a Rawcode type of the Typings: it has the property keyed
 * by their brand, declared in reforged-types. A type merely named `Rawcode`
 * is not.
 */
export function isRawcodeType(type: ts.Type): boolean {
  return type
    .getProperties()
    .some((property) =>
      (property.declarations ?? []).some(
        (declaration) =>
          ts.isPropertySignature(declaration) &&
          ts.isComputedPropertyName(declaration.name) &&
          ts.isIdentifier(declaration.name.expression) &&
          declaration.name.expression.text === RAWCODE_BRAND &&
          isDeclaredIn(declaration, "reforged-types"),
      ),
    );
}
