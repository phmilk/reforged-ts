// The Native classification: a call whose callee resolves, through the type
// checker, to a function declared inside the reforged-types package. A
// project function that shadows a Native's name is not a Native.
import {
  AST_NODE_TYPES,
  type ParserServicesWithTypeInformation,
  type TSESTree,
} from "@typescript-eslint/utils";
import * as ts from "typescript";

import { isDeclaredIn } from "./package.js";

/** A call the checker resolved to a Native of the Typings. */
export interface NativeCall {
  /** The Native's name, from its declaration. */
  readonly name: string;
  /** The declaration in the Typings: Jass-derived parameters and return type. */
  readonly declaration: ts.FunctionDeclaration;
}

/**
 * The Native a call expression calls, or undefined when its callee does not
 * resolve to a function declared in reforged-types. Match syntactically first
 * (for instance on the callee's name) and call this for the matched node
 * only: it asks the checker.
 */
export function resolveNative(
  services: ParserServicesWithTypeInformation,
  call: TSESTree.CallExpression,
): NativeCall | undefined {
  const checker = services.program.getTypeChecker();
  let symbol = checker.getSymbolAtLocation(
    services.esTreeNodeToTSNodeMap.get(call.callee),
  );
  if (symbol !== undefined && symbol.flags & ts.SymbolFlags.Alias) {
    symbol = checker.getAliasedSymbol(symbol);
  }
  const declaration = symbol?.declarations?.find(
    (each): each is ts.FunctionDeclaration =>
      ts.isFunctionDeclaration(each) &&
      each.name !== undefined &&
      isDeclaredIn(each, "reforged-types"),
  );
  if (declaration?.name === undefined) {
    return undefined;
  }
  return { name: declaration.name.text, declaration };
}

/** The callee's name when it is a plain identifier (`Foo(...)`), for the syntactic pre-match. */
export function calleeName(call: TSESTree.CallExpression): string | undefined {
  return call.callee.type === AST_NODE_TYPES.Identifier
    ? call.callee.name
    : undefined;
}
