// Unordered iteration: the constructs typescript-to-lua 1.37.1 lowers to Lua's
// `pairs`, whose order differs between clients. `for...in` is syntax alone;
// the others need the checker: the global `Object` of the default library,
// `pairs`/`next` declared by lua-types, and a `for...of` over a type carrying
// the language extensions' pairs brand (LuaTable, LuaMap, LuaSet and their
// read-only forms). `Map` and `Set` keep insertion order in the runtime
// library and carry no brand, so they are never unordered.
import {
  AST_NODE_TYPES,
  type ParserServicesWithTypeInformation,
  type TSESTree,
} from "@typescript-eslint/utils";
import * as ts from "typescript";

import { packageNameOf } from "./package.js";

/** The `Object` statics whose lualib helpers iterate with `pairs`. */
export const objectIterationMethods: ReadonlySet<string> = new Set([
  "keys",
  "values",
  "entries",
]);

/** The Lua globals of lua-types that iterate a table in unspecified order. */
export const luaIterationFunctions: ReadonlySet<string> = new Set([
  "pairs",
  "next",
]);

function symbolAt(
  services: ParserServicesWithTypeInformation,
  node: TSESTree.Node,
): ts.Symbol | undefined {
  const checker = services.program.getTypeChecker();
  const symbol = checker.getSymbolAtLocation(
    services.esTreeNodeToTSNodeMap.get(node),
  );
  return symbol !== undefined && symbol.flags & ts.SymbolFlags.Alias
    ? checker.getAliasedSymbol(symbol)
    : symbol;
}

/** The name of a non-computed or string-keyed member (`a.b`, `a["b"]`). */
function memberName(member: TSESTree.MemberExpression): string | undefined {
  if (!member.computed && member.property.type === AST_NODE_TYPES.Identifier) {
    return member.property.name;
  }
  if (
    member.computed &&
    member.property.type === AST_NODE_TYPES.Literal &&
    typeof member.property.value === "string"
  ) {
    return member.property.value;
  }
  return undefined;
}

/**
 * `Object.keys`, `Object.values` or `Object.entries` when the call's callee
 * is that static of the global `Object` (declared in TypeScript's default
 * library, not a project binding named `Object`): the method's name, else
 * undefined.
 */
export function objectIterationMethod(
  services: ParserServicesWithTypeInformation,
  call: TSESTree.CallExpression,
): string | undefined {
  const { callee } = call;
  if (
    callee.type !== AST_NODE_TYPES.MemberExpression ||
    callee.object.type !== AST_NODE_TYPES.Identifier ||
    callee.object.name !== "Object"
  ) {
    return undefined;
  }
  const method = memberName(callee);
  if (method === undefined || !objectIterationMethods.has(method)) {
    return undefined;
  }
  const declarations = symbolAt(services, callee.object)?.declarations ?? [];
  const global = declarations.some((each) =>
    services.program.isSourceFileDefaultLibrary(each.getSourceFile()),
  );
  return global ? method : undefined;
}

/**
 * `pairs` or `next` when the call's callee is that global of lua-types (not a
 * project function of the same name): its name, else undefined.
 */
export function luaIterationFunction(
  services: ParserServicesWithTypeInformation,
  call: TSESTree.CallExpression,
): string | undefined {
  const { callee } = call;
  if (
    callee.type !== AST_NODE_TYPES.Identifier ||
    !luaIterationFunctions.has(callee.name)
  ) {
    return undefined;
  }
  const declarations = symbolAt(services, callee)?.declarations ?? [];
  const fromLuaTypes = declarations.some(
    (each) => packageNameOf(each.getSourceFile().fileName) === "lua-types",
  );
  return fromLuaTypes ? callee.name : undefined;
}

/** The brands of language-extensions types a `for...of` lowers to `pairs`. */
const pairsBrands = new Set(["Pairs", "PairsKey"]);

function hasPairsBrand(checker: ts.TypeChecker, type: ts.Type): boolean {
  const brand = checker.getPropertyOfType(type, "__tstlIterable");
  if (brand === undefined) {
    return false;
  }
  const brandType = checker.getTypeOfSymbol(brand);
  return (brandType.isUnion() ? brandType.types : [brandType]).some(
    (each) => each.isStringLiteral() && pairsBrands.has(each.value),
  );
}

/**
 * Whether a `for...of` iterates a LuaTable, LuaMap, LuaSet or another type
 * carrying the language extensions' `Pairs`/`PairsKey` brand, which
 * typescript-to-lua compiles to a `pairs` loop. A union counts when one of
 * its members does. `pairs(t)` itself returns the `Iterable` brand, reported
 * at the call instead.
 */
export function iteratesWithPairs(
  services: ParserServicesWithTypeInformation,
  loop: TSESTree.ForOfStatement,
): boolean {
  const checker = services.program.getTypeChecker();
  const type = checker.getApparentType(services.getTypeAtLocation(loop.right));
  return (type.isUnion() ? type.types : [type]).some((each) =>
    hasPairsBrand(checker, checker.getApparentType(each)),
  );
}
