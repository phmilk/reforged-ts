// The Handle-type classification: a type that, with `undefined` removed,
// derives transitively from the Typings' root `handle` interface. The
// Typings brand every engine type as `interface X extends Parent`, one parent
// each, down to `handle`; a project interface of the same name is not one.
import * as ts from "typescript";

import { isDeclaredIn } from "./package.js";

/** The Typings' registration types: handle types that are never creations. */
export const registrationTypes: ReadonlySet<string> = new Set([
  "event",
  "triggeraction",
  "triggercondition",
]);

function isTypingsInterface(symbol: ts.Symbol): boolean {
  return (
    symbol.declarations?.some(
      (each) =>
        ts.isInterfaceDeclaration(each) && isDeclaredIn(each, "reforged-types"),
    ) ?? false
  );
}

function derivesFromHandle(
  checker: ts.TypeChecker,
  type: ts.Type,
  seen: Set<ts.Type>,
): boolean {
  const symbol = type.getSymbol();
  if (symbol === undefined || !isTypingsInterface(symbol) || seen.has(type)) {
    return false;
  }
  if (symbol.name === "handle") {
    return true;
  }
  seen.add(type);
  const bases = type.isClassOrInterface() ? checker.getBaseTypes(type) : [];
  return bases.some((base) => derivesFromHandle(checker, base, seen));
}

/**
 * The name of the Typings' Handle type a type denotes (`unit` for
 * `unit | undefined`), or undefined when the type, with `undefined` and
 * `null` removed, is not a single interface deriving from `handle`.
 */
export function handleTypeName(
  checker: ts.TypeChecker,
  type: ts.Type,
): string | undefined {
  const nonNullable = checker.getNonNullableType(type);
  if (nonNullable.isUnion()) {
    return undefined;
  }
  return derivesFromHandle(checker, nonNullable, new Set())
    ? nonNullable.getSymbol()?.name
    : undefined;
}

/**
 * The Handle type a function declaration returns (Handle-returning), or
 * undefined. Reads the declared signature, so it works on a Native's
 * declaration without a call site.
 */
export function returnedHandleType(
  checker: ts.TypeChecker,
  declaration: ts.SignatureDeclaration,
): string | undefined {
  const signature = checker.getSignatureFromDeclaration(declaration);
  return signature === undefined
    ? undefined
    : handleTypeName(checker, checker.getReturnTypeOfSignature(signature));
}

/** Whether a Handle type name is a registration type (`event`, `triggeraction`, `triggercondition`). */
export function isRegistrationType(name: string): boolean {
  return registrationTypes.has(name);
}
