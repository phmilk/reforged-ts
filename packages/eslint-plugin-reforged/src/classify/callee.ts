// What a call invokes, or the setter an accessor assignment calls, by the
// name the data files and the messages give it: a global function by its
// name (a Native of reforged-types, a Lua global of lua-types, a function
// of reforged-ts such as `on`), or a member declared in reforged-ts as
// `Class.member` (static) or `Class#member`. Resolved through the type
// checker, so a project function or method that shares the name is none of
// them.
import {
  AST_NODE_TYPES,
  type ParserServicesWithTypeInformation,
  type TSESTree,
} from "@typescript-eslint/utils";
import * as ts from "typescript";

import { memberName } from "./member.js";
import { propertyName, resolvedDeclarations } from "./member-access.js";
import { isDeclaredIn, packageNameOf } from "./package.js";

/** What can invoke a named function: a call, or an assignment to an accessor. */
export type Invocation =
  TSESTree.CallExpression | TSESTree.AssignmentExpression;

/** What an invocation resolves to: its name and its declaration. */
export interface ResolvedCallee {
  /** `BlzCreateFrameByType`, `on`, `Frame.createType`, `Unit#life`. */
  readonly name: string;
  /** The function, method or setter declared. */
  readonly declaration: ts.SignatureDeclaration;
}

/**
 * The name an invocation names in the code, without the checker: `Foo` of
 * `Foo(...)`, `foo` of `x.foo(...)` and of `x.foo = value`. For the
 * syntactic pre-match on the last segment of a resolved name.
 */
export function syntacticName(node: Invocation): string | undefined {
  const target =
    node.type === AST_NODE_TYPES.CallExpression ? node.callee : node.left;
  if (target.type === AST_NODE_TYPES.Identifier) {
    return node.type === AST_NODE_TYPES.CallExpression
      ? target.name
      : undefined;
  }
  return target.type === AST_NODE_TYPES.MemberExpression
    ? propertyName(target)
    : undefined;
}

/**
 * The function or library member an invocation invokes, or undefined for
 * anything else (a project function, a computed member, a plain property
 * write). A plain call resolves to a function declared in one of
 * `functionPackages`; a member call to a method, and an assignment to a
 * setter, declared in reforged-ts. Asks the checker: match `syntacticName`
 * first.
 */
export function resolveCallee(
  services: ParserServicesWithTypeInformation,
  node: Invocation,
  functionPackages: ReadonlySet<string>,
): ResolvedCallee | undefined {
  const isCall = node.type === AST_NODE_TYPES.CallExpression;
  const target = isCall ? node.callee : node.left;
  if (target.type === AST_NODE_TYPES.Identifier) {
    const declaration = isCall
      ? resolvedDeclarations(services, target).find(
          (each): each is ts.FunctionDeclaration =>
            ts.isFunctionDeclaration(each) &&
            functionPackages.has(
              packageNameOf(each.getSourceFile().fileName) ?? "",
            ),
        )
      : undefined;
    return declaration?.name === undefined
      ? undefined
      : { name: declaration.name.text, declaration };
  }
  if (target.type !== AST_NODE_TYPES.MemberExpression) {
    return undefined;
  }
  const member = propertyName(target);
  if (member === undefined) {
    return undefined;
  }
  for (const each of resolvedDeclarations(services, target.property)) {
    const declaration = isCall ? asMethod(each) : asSetter(each);
    const name =
      declaration !== undefined && isDeclaredIn(declaration, "reforged-ts")
        ? memberName(declaration, member)
        : undefined;
    if (declaration !== undefined && name !== undefined) {
      return { name, declaration };
    }
  }
  return undefined;
}

function asMethod(
  declaration: ts.Declaration,
): ts.MethodDeclaration | ts.MethodSignature | undefined {
  return ts.isMethodDeclaration(declaration) ||
    ts.isMethodSignature(declaration)
    ? declaration
    : undefined;
}

function asSetter(
  declaration: ts.Declaration,
): ts.SetAccessorDeclaration | undefined {
  return ts.isSetAccessorDeclaration(declaration) ? declaration : undefined;
}

/** A callee's declared parameter names, in order; a destructured one is `undefined`. */
export function parameterNames(
  declaration: ts.SignatureDeclaration,
): (string | undefined)[] {
  return declaration.parameters.map((parameter) =>
    ts.isIdentifier(parameter.name) ? parameter.name.text : undefined,
  );
}
