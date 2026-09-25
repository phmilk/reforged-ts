// The library classes an expression stands for: the class itself (`Unit`,
// `this` in a static method) or an instance of it (`unit`), and the classes
// it extends, kept when they are declared in one of the given packages
// (reforged-ts, or w3ts for a project that still has it). A project class of
// the same name is not a library class.
import type {
  ParserServicesWithTypeInformation,
  TSESTree,
} from "@typescript-eslint/utils";
import * as ts from "typescript";

import { packageNameOf } from "./package.js";

function declaredIn(symbol: ts.Symbol, packages: ReadonlySet<string>): boolean {
  return (symbol.declarations ?? []).some((declaration) => {
    const name = packageNameOf(declaration.getSourceFile().fileName);
    return name !== undefined && packages.has(name);
  });
}

function classChain(checker: ts.TypeChecker, symbol: ts.Symbol): ts.Symbol[] {
  const chain: ts.Symbol[] = [];
  let current: ts.Type | undefined = checker.getDeclaredTypeOfSymbol(symbol);
  while (current !== undefined) {
    const each = current.getSymbol();
    if (each === undefined || chain.includes(each)) {
      break;
    }
    chain.push(each);
    // A generic base (`Handle<unit>`) is a reference to its class type.
    const isReference =
      (current.flags & ts.TypeFlags.Object) !== 0 &&
      ((current as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference) !== 0;
    const declared: ts.Type = isReference
      ? (current as ts.TypeReference).target
      : current;
    current = checker.getBaseTypes(declared as ts.InterfaceType).at(0);
  }
  return chain;
}

function chainOf(
  services: ParserServicesWithTypeInformation,
  node: TSESTree.Node,
): ts.Symbol[] {
  const checker = services.program.getTypeChecker();
  const type = checker.getNonNullableType(services.getTypeAtLocation(node));
  const symbol = type.getSymbol();
  if (symbol === undefined || (symbol.flags & ts.SymbolFlags.Class) === 0) {
    return [];
  }
  return classChain(checker, symbol);
}

/**
 * The names of the library classes `node` stands for, most derived first:
 * `[Unit, Widget, Handle]` for a Unit or for `Unit` itself; a project class
 * that extends Unit gives `[Unit, Widget, Handle]` too. Empty when its type
 * is not a class. Asks the checker: match syntactically first.
 */
export function libraryClassesOf(
  services: ParserServicesWithTypeInformation,
  node: TSESTree.Node,
  packages: ReadonlySet<string>,
): string[] {
  return chainOf(services, node)
    .filter((each) => declaredIn(each, packages))
    .map((each) => each.getName());
}

/**
 * The name of the class `node` stands for (`Unit` for `Unit` or a Unit),
 * when that class itself is declared in `packages`; a project subclass gives
 * undefined.
 */
export function libraryClassOf(
  services: ParserServicesWithTypeInformation,
  node: TSESTree.Node,
  packages: ReadonlySet<string>,
): string | undefined {
  const first = chainOf(services, node).at(0);
  return first !== undefined && declaredIn(first, packages)
    ? first.getName()
    : undefined;
}
