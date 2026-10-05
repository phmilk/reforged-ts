// The callee of a call as a data file names it, with its parameter names: a
// Native by its name, or a method of a class declared in reforged-ts as
// `Class.member` (static) or `Class#member`. Resolved through the type
// checker, so a project function or method that shares the name is neither.
import {
  AST_NODE_TYPES,
  type ParserServicesWithTypeInformation,
  type TSESTree,
} from "@typescript-eslint/utils";
import * as ts from "typescript";

import { memberName } from "./member.js";
import { propertyName, resolvedDeclarations } from "./member-access.js";
import { isDeclaredIn } from "./package.js";
import { resolveNative } from "./native.js";

/** A call's callee: its data-file name and its parameter names, in order. */
export interface NamedCallee {
  /** `BlzCreateFrameByType`, `Frame.createType`, `Unit#damageTarget`. */
  readonly name: string;
  /** The declared parameter names; a destructured parameter is `undefined`. */
  readonly parameters: readonly (string | undefined)[];
}

/** The name the callee has in the code: `Foo(...)` or `x.foo(...)`, without the checker. */
export function syntacticCalleeName(
  call: TSESTree.CallExpression,
): string | undefined {
  const { callee } = call;
  if (callee.type === AST_NODE_TYPES.Identifier) {
    return callee.name;
  }
  return callee.type === AST_NODE_TYPES.MemberExpression
    ? propertyName(callee)
    : undefined;
}

function parameterNames(
  declaration: ts.SignatureDeclaration,
): (string | undefined)[] {
  return declaration.parameters.map((parameter) =>
    ts.isIdentifier(parameter.name) ? parameter.name.text : undefined,
  );
}

/**
 * The Native or library method a call invokes, named as the data files name
 * it, or undefined for anything else (a project function, a computed
 * member). Asks the checker: match `syntacticCalleeName` first.
 */
export function resolveNamedCallee(
  services: ParserServicesWithTypeInformation,
  call: TSESTree.CallExpression,
): NamedCallee | undefined {
  const { callee } = call;
  if (callee.type === AST_NODE_TYPES.Identifier) {
    const native = resolveNative(services, call);
    return native === undefined
      ? undefined
      : {
          name: native.name,
          parameters: parameterNames(native.declaration),
        };
  }
  if (callee.type !== AST_NODE_TYPES.MemberExpression) {
    return undefined;
  }
  const short = propertyName(callee);
  if (short === undefined) {
    return undefined;
  }
  const methods = resolvedDeclarations(services, callee.property).filter(
    (each): each is ts.MethodDeclaration | ts.MethodSignature =>
      ts.isMethodDeclaration(each) || ts.isMethodSignature(each),
  );
  for (const declaration of methods) {
    const name = isDeclaredIn(declaration, "reforged-ts")
      ? memberName(declaration, short)
      : undefined;
    if (name !== undefined) {
      return { name, parameters: parameterNames(declaration) };
    }
  }
  return undefined;
}
